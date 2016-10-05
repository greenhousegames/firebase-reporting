'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FirebaseReporting = function () {
  function FirebaseReporting(config) {
    _classCallCheck(this, FirebaseReporting);

    if (!config) {
      throw 'Must initialize with config';
    }

    this.firebase = config.firebase;
    this.paths = {
      data: config.dataPath || 'data',
      reporting: config.reportingPath || 'reporting'
    };
    this.filters = config.filters || [];
    this.queryFilter = [];
    this.queryData = {};
    this.rules = config.metrics;
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

  _createClass(FirebaseReporting, [{
    key: 'addEvaluator',
    value: function addEvaluator(name, method) {
      this.evaluators[name] = method;
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
      var promises = [];
      promises.push(this.saveMetricsForData(data));
      promises.push(this.saveMetricsForUser(data));
      return _rsvp2.default.all(promises);
    }
  }, {
    key: 'saveMetricsForData',
    value: function saveMetricsForData(data) {
      var _this = this;

      var promises = [];
      var ref = this.refDataReporting();
      for (var key in data) {
        if (this.rules[key]) {
          // need to store metrics for data
          this.rules[key].forEach(function (metric) {
            if (_this.evaluators[metric]) {
              // run metric for each filter
              _this.filters.forEach(function (filter) {
                promises.push(_this._calculateMetricValue(ref, key, data[key], metric, _this.evaluators[metric], filter, data));
              });
            }
          });
        }
      }
      return _rsvp2.default.all(promises);
    }
  }, {
    key: 'saveMetricsForUser',
    value: function saveMetricsForUser(data, uid) {
      var _this2 = this;

      uid = uid || this._getUserUID();
      var ref = this.refUserReporting().child(uid);
      var promises = [];
      for (var key in data) {
        if (this.rules[key]) {
          // need to store metrics for data
          this.rules[key].forEach(function (metric) {
            if (_this2.evaluators[metric]) {
              // run metric for each filter
              _this2.filters.forEach(function (filter) {
                promises.push(_this2._calculateMetricValue(ref, key, data[key], metric, _this2.evaluators[metric], filter, data));
              });
            }
          });
        }
      }
      return _rsvp2.default.all(promises);
    }
  }, {
    key: 'getMetricsForUser',
    value: function getMetricsForUser(uid) {
      var _this3 = this;

      uid = uid || this._getUserUID();
      var promise = new _rsvp2.default.Promise(function (resolve, reject) {
        var promises = [];
        var ref = _this3.refUserReporting().child(uid);
        var metrics = {};
        for (var key in _this3.rules) {
          metrics[key] = {};
          _this3.rules[key].forEach(function (metric) {
            if (_this3.evaluators[metric]) {
              promises.push(_this3._captureMetricValue(ref, key, metric, metrics));
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
    key: 'getDataMetricValues',
    value: function getDataMetricValues(stat, evalName, limit, order) {
      return this._getMetrics(this.refDataReporting(), stat, evalName, limit, order);
    }
  }, {
    key: 'getUserMetricValues',
    value: function getUserMetricValues(stat, evalName, limit, order) {
      return this._getMetrics(this.refUserReporting(), stat, evalName, limit, order);
    }
  }, {
    key: '_getMetrics',
    value: function _getMetrics(ref, stat, evalName, limit, order) {
      limit = limit || 1;
      var key = this._getStatKey(stat, evalName);
      var values = [];
      var query = ref.orderByChild(key);
      if (order === 'desc') {
        query = query.limitToLast(limit);
      } else if (order === 'asc') {
        query = query.limitToFirst(limit);
      }
      var promise = new _rsvp2.default.Promise(function (resolve) {
        query.on('child_added', function (snapshot) {
          values.push(snapshot.child(key).val());
          if (values.length === limit) {
            done();
          }
        });

        var done = function done() {
          clearTimeout(timeout);
          query.off('child_added');
          if (order === 'desc') {
            values.sort(function (a, b) {
              return b - a;
            });
          } else if (order === 'asc') {
            values.sort(function (a, b) {
              return a - b;
            });
          }
          resolve(values);
        };
        var timeout = setTimeout(done, 5000);
      });
      return promise;
    }
  }, {
    key: 'getDataMetricTotals',
    value: function getDataMetricTotals(stat, evalName, comparision, value, otherValue) {
      return this._getTotalInternal(this.refDataReporting(), stat, evalName, comparision, value, otherValue);
    }
  }, {
    key: 'getUserMetricTotals',
    value: function getUserMetricTotals(stat, evalName, comparision, value, otherValue) {
      return this._getTotalInternal(this.refUserReporting(), stat, evalName, comparision, value, otherValue);
    }
  }, {
    key: '_getTotalInternal',
    value: function _getTotalInternal(ref, stat, evalName, comparision, value, otherValue) {
      var _this4 = this;

      var promise = new _rsvp2.default.Promise(function (resolve) {
        var query = ref;
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
    key: '_captureMetricValue',
    value: function _captureMetricValue(uid, stat, evaluatorName, metrics) {
      var key = this._getStatKey(stat, evaluatorName);
      var promise = new _rsvp2.default.Promise(function (resolve) {
        ref.child(key).once('value', function (snapshot) {
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
    value: function _calculateMetricValue(ref, stat, newVal, evaluatorName, evaluator, filter, filterData) {
      var key = this._getStatKey(stat, evaluatorName, filter, filterData);
      return ref.child(key).transaction(function (oldVal) {
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
        filterData += key + '~~';
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
      return this.firebase.database().ref(this.paths.data);
    }
  }, {
    key: 'refUserReporting',
    value: function refUserReporting() {
      return this.firebase.database().ref(this.paths.reporting).child('users');
    }
  }, {
    key: 'refDataReporting',
    value: function refDataReporting() {
      return this.firebase.database().ref(this.paths.reporting).child('data');
    }
  }, {
    key: '_getUserUID',
    value: function _getUserUID() {
      var currentUser = this.firebase.auth().currentUser;
      if (currentUser) {
        return currentUser.uid;
      } else {
        return 'unknown';
      }
    }
  }]);

  return FirebaseReporting;
}();

module.exports = FirebaseReporting;