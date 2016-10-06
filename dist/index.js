'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

var _reportquery = require('./reportquery');

var _reportquery2 = _interopRequireDefault(_reportquery);

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
    this.properties = {};
    this.evaluators = {};
    this.filters = {};
    this.retainers = {};

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

    this.addRetainer('second', 1000);
    this.addRetainer('half-minute', 30000);
    this.addRetainer('minute', 60000);
    this.addRetainer('half-hour', 1800000);
    this.addRetainer('hour', 3600000);
    this.addRetainer('half-day', 43200000);
    this.addRetainer('day', 86400000);
    this.addRetainer('week', 604800000);
    this.addRetainer('2weeks', 1209600000);
    this.addRetainer('3weeks', 1814400000);
    this.addRetainer('4weeks', 2419200000);
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

      this.properties[prop] = this.properties[prop] || {
        metrics: [],
        retainers: {}
      };
      this.properties[prop].metrics = metrics;
    }
  }, {
    key: 'addRetainer',
    value: function addRetainer(name, duration) {
      if (!name) {
        throw 'retainer name is required';
      }
      if (isNaN(duration)) {
        throw 'duration is invalid';
      }

      this.retainers[name] = {
        duration: duration
      };
    }
  }, {
    key: 'enableRetainer',
    value: function enableRetainer(retainer, prop, metrics) {
      var _this2 = this;

      metrics.forEach(function (m) {
        if (!_this2.evaluators[m]) {
          throw 'metrics contains one or more invalid evaluators';
        }
      });

      this.properties[prop].retainers[retainer] = metrics;
    }
  }, {
    key: 'saveMetrics',
    value: function saveMetrics(values) {
      var _this3 = this;

      var promises = [];
      var vals = Array.isArray(values) ? values : [values];

      vals.forEach(function (data) {
        for (var prop in data) {
          if (!_this3.properties[prop]) continue;

          // store metrics for data
          _this3.properties[prop].metrics.forEach(function (metric) {
            // run for default filter
            promises.push(_this3.updateMetricValue('default', prop, data, metric));

            // run for other filter
            for (var fname in _this3.filters) {
              promises.push(_this3.updateMetricValue(fname, prop, data, metric));
            }
          });

          // store retained metrics for data
          for (var retainer in _this3.properties[prop].retainers) {
            _this3.properties[prop].retainers[retainer].forEach(function (metric) {
              // run for default filter
              promises.push(_this3.retainMetricValue('default', retainer, prop, data, metric));

              // run for other filter
              for (var fname in _this3.filters) {
                promises.push(_this3.retainMetricValue(fname, retainer, prop, data, metric));
              }
            });
          }
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
      var query = new _reportquery2.default(this);
      if (filterData) {
        query.setFilter(filterName, this.getFilterKey(filterName, filterData));
      } else if (filterName === 'default') {
        query.setFilter(filterName, 'default');
      } else {
        query.setFilter(filterName);
      }
      return query;
    }
  }, {
    key: 'updateMetricValue',
    value: function updateMetricValue(filterName, prop, data, evaluatorName) {
      var metricRef = this.getFilterMetricRef(filterName, data).child(this.getMetricKey(prop, evaluatorName));
      var evaluator = this.evaluators[evaluatorName];
      var newVal = data[prop];
      return metricRef.transaction(function (oldVal) {
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
      });
    }
  }, {
    key: 'retainMetricValue',
    value: function retainMetricValue(filterName, retainerName, prop, data, evaluatorName) {
      var metricRef = this.getRetainerBucketRef(filterName, data, retainerName).child(this.getMetricKey(prop, evaluatorName));
      var evaluator = this.evaluators[evaluatorName];
      var newVal = data[prop];
      return metricRef.transaction(function (oldVal) {
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
      });
    }
  }, {
    key: 'getMetricKey',
    value: function getMetricKey(prop, evaluatorName) {
      return prop + this.separator + evaluatorName;
    }
  }, {
    key: 'getFilterKey',
    value: function getFilterKey(filterName, data) {
      var _this4 = this;

      if (!filterName || filterName === 'default') {
        return 'default';
      }

      if (!this.filters[filterName]) {
        throw 'Filter name does not exist';
      }

      var key = '';
      this.filters[filterName].forEach(function (prop) {
        key += prop + _this4.separator;
        key += data[prop] + _this4.separator;
      });
      return key;
    }
  }, {
    key: 'getRetainerBucketKey',
    value: function getRetainerBucketKey(retainerName, time) {
      var retainer = this.retainers[retainerName];
      time = time || new Date().getTime();
      return Math.floor(time / retainer.duration).toString();
    }
  }, {
    key: 'getFilterRef',
    value: function getFilterRef(filterName) {
      return this.firebaseRef.child(filterName);
    }
  }, {
    key: 'getFilterMetricRef',
    value: function getFilterMetricRef(filterName, data) {
      return this.getFilterRef(filterName).child('metrics').child(this.getFilterKey(filterName, data));
    }
  }, {
    key: 'getFilterRetainerRef',
    value: function getFilterRetainerRef(filterName, data) {
      return this.getFilterRef(filterName).child('retainers').child(this.getFilterKey(filterName, data));
    }
  }, {
    key: 'getRetainerBucketRef',
    value: function getRetainerBucketRef(filterName, data, retainerName) {
      return this.getFilterRetainerRef(filterName, data).child(retainerName).child(this.getRetainerBucketKey(retainerName));
    }
  }]);

  return FirebaseReporting;
}();

module.exports = FirebaseReporting;