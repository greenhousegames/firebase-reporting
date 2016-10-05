'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FirebaseReporting = function () {
  function FirebaseReporting(config) {
    _classCallCheck(this, FirebaseReporting);

    this.firebase = config.firebase;
    this.paths = {
      data: config.dataPath || 'data',
      reporting: config.reportingPath || 'reporting'
    };
    this.filters = config.filters || [];
    this.queryFilter = [];
    this.queryData = {};
    this.rules = {};
    this.evaluators = {};

    this.initializeRules(config.metrics);
  }

  _createClass(FirebaseReporting, [{
    key: 'addEvaluator',
    value: function addEvaluator(name, method) {
      this.evaluators[name] = method;
    }
  }, {
    key: 'initializeRules',
    value: function initializeRules(rules) {
      this.rules = rules;
      this.evaluators = {};
      this.addEvaluator('max', function (newVal, oldVal) {
        return newVal > oldVal ? newVal : null;
      });
      this.addEvaluator('min', function (newVal, oldVal) {
        return newVal < oldVal ? newVal : null;
      });
      this.addEvaluator('first', function () {
        return null;
      });
      this.addEvaluator('last', function (newVal) {
        return newVal;
      });
      this.addEvaluator('sum', function (newVal, oldVal) {
        return oldVal + newVal;
      });
      this.addEvaluator('diff', function (newVal, oldVal) {
        return oldVal - newVal;
      });
      this.addEvaluator('multi', function (newVal, oldVal) {
        return oldVal * newVal;
      });
      this.addEvaluator('div', function (newVal, oldVal) {
        return oldVal / newVal;
      });
    }
  }, {
    key: 'setQueryFilter',
    value: function setQueryFilter(filter, data) {
      this.queryFilter = filter;
      this.queryData = data;
    }
  }, {
    key: 'saveMetrics',
    value: function saveMetrics(data) {
      var _this = this;

      var promises = [];
      for (var key in data) {
        if (this.rules[key]) {
          // need to store metrics for data
          this.rules[key].forEach(function (metric) {
            if (_this.evaluators[metric]) {
              // run metric for each filter
              _this.filters.forEach(function (filter) {
                promises.push(_this._calculateMetricValue(key, data[key], metric, _this.evaluators[metric], filter, data));
              });
            }
          });
        }
      }
      return _rsvp2.default.all(promises);
    }
  }, {
    key: 'getMetrics',
    value: function getMetrics() {
      var _this2 = this;

      var promise = new _rsvp2.default.Promise(function (resolve, reject) {
        var promises = [];
        var metrics = {};
        for (var key in _this2.rules) {
          metrics[key] = {};
          _this2.rules[key].forEach(function (metric) {
            if (_this2.evaluators[metric]) {
              promises.push(_this2._captureMetricValue(key, metric, metrics));
            } else {
              metrics[key][metric] = null;
            }
          });
        }
        return _rsvp2.default.all(promises).then(function () {
          resolve(metrics);
        }).catch(reject);
      });
      return promise;
    }
  }, {
    key: 'getTopMetrics',
    value: function getTopMetrics(stat, evalName, total) {
      return this._getGlobalMetrics(stat, evalName, 'last', total);
    }
  }, {
    key: 'getBottomMetrics',
    value: function getBottomMetrics(stat, evalName, total) {
      return this._getGlobalMetrics(stat, evalName, 'first', total);
    }
  }, {
    key: 'getAllMetrics',
    value: function getAllMetrics(stat, evalName) {
      return this._getGlobalMetrics(stat, evalName, 'all');
    }
  }, {
    key: 'getTotal',
    value: function getTotal(prop, comparision, value, otherValue) {
      var _this3 = this;

      var promise = new _rsvp2.default.Promise(function (resolve) {
        var query = _this3.refData();
        if (prop) {
          query = query.orderByChild(prop);
          switch (comparision) {
            case 'lesser':
              query = query.endAt(value);
              break;
            case 'greater':
              query = query.startAt(value);
              break;
            case 'between':
              query = query.startAt(value).endAt(otherValue);
              break;
            case 'equal':
              query = query.startAt(value).endAt(value);
              break;
          }
        }
        query.once('value', function (snapshot) {
          resolve(snapshot.numChildren());
        });
      });
      return promise;
    }
  }, {
    key: 'getTotalUsers',
    value: function getTotalUsers(stat, evalName, comparision, value, otherValue) {
      var _this4 = this;

      var promise = new _rsvp2.default.Promise(function (resolve) {
        var query = _this4.refUserReporting();
        if (stat) {
          var key = _this4._getStatKey(stat, evalName);
          query = query.orderByChild(key);
          switch (comparision) {
            case 'lesser':
              query = query.endAt(value);
              break;
            case 'greater':
              query = query.startAt(value);
              break;
            case 'between':
              query = query.startAt(value).endAt(otherValue);
              break;
            case 'equal':
              query = query.startAt(value).endAt(value);
              break;
          }
        }
        query.once('value', function (snapshot) {
          resolve(snapshot.numChildren());
        });
      });
      return promise;
    }
  }, {
    key: '_getGlobalMetrics',
    value: function _getGlobalMetrics(stat, evalName, type, total) {
      total = total || 1;
      var key = this._getStatKey(stat, evalName);
      var values = [];
      var query = void 0;
      if (type === 'last') {
        query = this.refUserReporting().orderByChild(key).limitToLast(total);
      } else if (type === 'first') {
        query = this.refUserReporting().orderByChild(key).limitToFirst(total);
      } else {
        query = this.refUserReporting().orderByChild(key);
      }
      var promise = new _rsvp2.default.Promise(function (resolve) {
        query.on('child_added', function (snapshot) {
          values.push(snapshot.child(key).val());
          if (values.length === total) {
            done();
          }
        });

        var done = function done() {
          clearTimeout(timeout);
          query.off('child_added');
          values.sort(function (a, b) {
            return b - a;
          });
          resolve(values);
        };
        var timeout = setTimeout(done, 5000);
      });
      return promise;
    }
  }, {
    key: '_captureMetricValue',
    value: function _captureMetricValue(stat, evaluatorName, metrics) {
      var key = this._getStatKey(stat, evaluatorName);
      var ref = this.refCurrentUserReporting().child(key);
      var promise = new _rsvp2.default.Promise(function (resolve) {
        ref.once('value', function (snapshot) {
          var val = snapshot.val();
          if (metrics) {
            metrics[stat][evaluatorName] = val;
          }
          resolve(val);
        });
      });
      return promise;
    }
  }, {
    key: '_calculateMetricValue',
    value: function _calculateMetricValue(stat, newVal, evaluatorName, evaluator, filter, filterData) {
      var key = this._getStatKey(stat, evaluatorName, filter, filterData);
      var ref = this.refCurrentUserReporting().child(key);
      return ref.transaction(function (oldVal) {
        if (typeof oldVal === 'undefined') {
          return newVal;
        } else {
          var evalVal = evaluator(newVal, oldVal);
          if (typeof evalVal !== 'undefined' && evalVal !== null) {
            return evalVal;
          } else {
            return oldVal;
          }
        }
      });
    }
  }, {
    key: '_getStatKey',
    value: function _getStatKey(stat, evalName, filter, filterData) {
      var _this5 = this;

      var prefix = '';
      (filter || this.queryFilter).forEach(function (key) {
        if (filterData) {
          prefix += filterData[key] + '~~';
        } else {
          prefix += _this5.queryData[key] + '~~';
        }
      });
      return prefix + stat + '~~' + evalName;
    }
  }, {
    key: 'refData',
    value: function refData() {
      return this.firebase.database.ref(this.paths.data);
    }
  }, {
    key: 'refUserReporting',
    value: function refUserReporting() {
      return this.firebase.database.ref(this.paths.reporting).child('users');
    }
  }, {
    key: 'refCurrentUserReporting',
    value: function refCurrentUserReporting() {
      var currentUser = this.firebase.auth().currentUser;
      if (currentUser) {
        return this.refUserReporting().child(currentUser.uid);
      } else {
        return this.refUserReporting().child('unknown');
      }
    }
  }]);

  return FirebaseReporting;
}();

module.exports = FirebaseReporting;