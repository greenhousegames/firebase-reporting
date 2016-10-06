'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

var _countquery = require('./countquery');

var _countquery2 = _interopRequireDefault(_countquery);

var _retainerquery = require('./retainerquery');

var _retainerquery2 = _interopRequireDefault(_retainerquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MetricQuery = function () {
  function MetricQuery(reporting) {
    _classCallCheck(this, MetricQuery);

    this.reporting = reporting;
    this.filterRef = null;
    this.filterChildRef = null;
    this.metricKey = null;
    this.filterKey = null;
  }

  _createClass(MetricQuery, [{
    key: 'setMetric',
    value: function setMetric(prop, evaluator) {
      this.metricKey = this.reporting.getMetricKey(prop, evaluator);
    }
  }, {
    key: 'value',
    value: function value() {
      if (!this.filterKey) {
        throw 'Filter key not set';
      }
      if (!this.metricKey) {
        throw 'Metric key not set';
      }
      var query = this.filterRef.child('metrics').child(this.filterKey).child(this.metricKey);
      var promise = new _rsvp2.default.Promise(function (resolve, reject) {
        query.once('value').then(function (snapshot) {
          resolve(snapshot.val());
        }).catch(reject);
      });
      return promise;
    }
  }, {
    key: 'select',
    value: function select(limit, order) {
      var _this = this;

      limit = limit || 1;
      order = order || 'desc';

      var query = this.filterRef.child('metrics').orderByChild(this.metricKey);
      if (order === 'desc') {
        query = query.limitToLast(limit);
      } else if (order === 'asc') {
        query = query.limitToFirst(limit);
      }

      var promise = new _rsvp2.default.Promise(function (resolve) {
        var values = [];
        query.on('child_added', function (snapshot) {
          values.push(snapshot.child(_this.metricKey).val());
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
    key: 'lesser',
    value: function lesser(value) {
      var query = new _countquery2.default();
      query.filterRef = this.filterRef;
      query.filterKey = this.filterKey;
      query.metricKey = this.metricKey;
      query.setComparision('lesser', value, null);
      return query;
    }
  }, {
    key: 'greater',
    value: function greater(value) {
      var query = new _countquery2.default();
      query.filterRef = this.filterRef;
      query.filterKey = this.filterKey;
      query.metricKey = this.metricKey;
      query.setComparision('greater', value, null);
      return query;
    }
  }, {
    key: 'between',
    value: function between(value, value2) {
      var query = new _countquery2.default();
      query.filterRef = this.filterRef;
      query.filterKey = this.filterKey;
      query.metricKey = this.metricKey;
      query.setComparision('between', value, value2);
      return query;
    }
  }, {
    key: 'equal',
    value: function equal(value) {
      var query = new _countquery2.default();
      query.filterRef = this.filterRef;
      query.filterKey = this.filterKey;
      query.metricKey = this.metricKey;
      query.setComparision('between', value, value);
      return query;
    }
  }, {
    key: 'total',
    value: function total() {
      var query = new _countquery2.default();
      query.filterRef = this.filterRef;
      query.filterKey = this.filterKey;
      query.metricKey = this.metricKey;
      return query.count();
    }
  }, {
    key: 'during',
    value: function during(start, end, retainer) {
      var query = new _retainerquery2.default(this.reporting);
      query.filterRef = this.filterRef;
      query.filterKey = this.filterKey;
      query.metricKey = this.metricKey;
      query.setRetainer(retainer, start, end);
      return query;
    }
  }]);

  return MetricQuery;
}();

module.exports = MetricQuery;