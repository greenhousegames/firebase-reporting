'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FirebaseReporting = function () {
  function FirebaseReporting(config) {
    _classCallCheck(this, FirebaseReporting);

    if (!config) {
      throw 'Must initialize with config';
    }
    if (!config.firebase) {
      throw 'Must initialize with firebase reference';
    }

    this.firebaseRef = config.firebase;
    this.separator = config.separator || '~~';
    this.queryFilter = [];
    this.queryData = {};
    this.metrics = {};
    this.evaluators = {};
    this.filters = {};

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
      if (!name) {
        throw 'evaluator name is required';
      }
      if (typeof method !== 'function') {
        throw 'method must be a function which takes in 2 arguments and outputs the new metric value';
      }

      this.evaluators[name] = method;
    }
  }, {
    key: 'addFilter',
    value: function addFilter(name, props) {
      if (!name) {
        throw 'filter name is required';
      }
      if (name === 'default') {
        throw 'cannot override default filter';
      }
      if (!Array.isArray(props)) {
        throw 'props should be an array of property name which exist on the raw data being stored';
      }

      this.filters[name] = props;
    }
  }, {
    key: 'addMetric',
    value: function addMetric(prop, metrics) {
      var _this = this;

      if (!prop) {
        throw 'property name is required';
      }
      if (!Array.isArray(metrics)) {
        throw 'metrics must be an array of evaluator names';
      }
      metrics.forEach(function (m) {
        if (!_this.evaluators[m]) {
          throw 'metrics contains one or more invalid evaluators';
        }
      });

      this.metrics[prop] = metrics;
    }
  }, {
    key: 'saveMetrics',
    value: function saveMetrics(values) {
      var _this2 = this;

      var promises = [];
      var vals = Array.isArray(values) ? values : [values];

      vals.forEach(function (data) {
        for (var prop in data) {
          if (!_this2.metrics[prop]) continue;

          // need to store metrics for data
          _this2.metrics[prop].forEach(function (metric) {
            // run for default filter
            promises.push(_this2._updateMetricValue('default', prop, data, metric));

            // run metric for each filter
            for (var fname in _this2.filters) {
              promises.push(_this2._updateMetricValue(fname, prop, data, metric));
            }
          });
        }
      });

      if (promises.length > 0) {
        return _rsvp2.default.all(promises);
      } else {
        return new _rsvp2.default.Promise(function (resolve) {
          return resolve();
        });
      }
    }
  }, {
    key: 'where',
    value: function where(filterName, filterData) {
      filterName = filterName || 'default';
      var query = new _query2.default(this);
      if (filterData) {
        query.setFilter(filterName, this._getFilterKey(filterName, filterData));
      } else if (filterName === 'default') {
        query.setFilter(filterName, 'default');
      } else {
        query.setFilter(filterName);
      }
      return query;
    }
  }, {
    key: '_updateMetricValue',
    value: function _updateMetricValue(filterName, prop, data, evaluatorName) {
      var filterRef = this.firebaseRef.child(filterName).child(this._getFilterKey(filterName, data));
      var metricRef = filterRef.child(this._getMetricKey(prop, evaluatorName));
      var evaluator = this.evaluators[evaluatorName];
      var newVal = data[prop];
      var getUpdatedValue = function getUpdatedValue(oldVal) {
        if (typeof oldVal === 'undefined' || oldVal === null) {
          return newVal;
        } else {
          var evalVal = evaluator(newVal, oldVal);
          if (typeof evalVal === 'undefined' || evalVal === null) {
            return oldVal;
          } else {
            return evalVal;
          }
        }
      };

      return metricRef.transaction(getUpdatedValue);
    }
  }, {
    key: '_getMetricKey',
    value: function _getMetricKey(prop, evalName) {
      return prop + this.separator + evalName;
    }
  }, {
    key: '_getFilterKey',
    value: function _getFilterKey(filterName, data) {
      var _this3 = this;

      if (filterName === 'default') {
        return 'default';
      }

      if (!this.filters[filterName]) {
        throw 'Filter name does not exist';
      }

      var key = '';
      this.filters[filterName].forEach(function (prop) {
        key += prop + _this3.separator;
        key += data[prop] + _this3.separator;
      });
      return key;
    }
  }]);

  return FirebaseReporting;
}();

module.exports = FirebaseReporting;