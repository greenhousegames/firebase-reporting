'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReportQuery = function () {
  function ReportQuery(reporting) {
    _classCallCheck(this, ReportQuery);

    this.reporting = reporting;
    this.filterRef = null;
    this.metricKey = null;
    this.queryRef = null;
  }

  _createClass(ReportQuery, [{
    key: 'setFilter',
    value: function setFilter(filter) {
      this.filterRef = this.reporting.firebaseRef.child(filter);

      this.queryRef = null;
      if (this.metricKey !== null) {
        this.queryRef = this.filterRef.orderByChild(this.metricKey);
      }
    }
  }, {
    key: 'setMetric',
    value: function setMetric(prop, evaluator) {
      this.metricKey = this.reporting._getMetricKey(prop, evaluator);

      this.queryRef = null;
      if (this.filterRef !== null) {
        this.queryRef = this.filterRef.orderByChild(this.metricKey);
      }
    }
  }, {
    key: 'min',
    value: function min(prop) {
      var query = new ReportQuery(this.reporting);
      query.filterRef = this.filterRef;
      query.setMetric(prop, 'min');
      return query;
    }
  }, {
    key: 'max',
    value: function max(prop) {
      var query = new ReportQuery(this.reporting);
      query.filterRef = this.filterRef;
      query.setMetric(prop, 'max');
      return query;
    }
  }, {
    key: 'diff',
    value: function diff(prop) {
      var query = new ReportQuery(this.reporting);
      query.filterRef = this.filterRef;
      query.setMetric(prop, 'diff');
      return query;
    }
  }, {
    key: 'sum',
    value: function sum(prop) {
      var query = new ReportQuery(this.reporting);
      query.filterRef = this.filterRef;
      query.setMetric(prop, 'sum');
      return query;
    }
  }, {
    key: 'multi',
    value: function multi(prop) {
      var query = new ReportQuery(this.reporting);
      query.filterRef = this.filterRef;
      query.setMetric(prop, 'multi');
      return query;
    }
  }, {
    key: 'div',
    value: function div(prop) {
      var query = new ReportQuery(this.reporting);
      query.filterRef = this.filterRef;
      query.setMetric(prop, 'div');
      return query;
    }
  }, {
    key: 'first',
    value: function first(prop) {
      var query = new ReportQuery(this.reporting);
      query.filterRef = this.filterRef;
      query.setMetric(prop, 'first');
      return query;
    }
  }, {
    key: 'last',
    value: function last(prop) {
      var query = new ReportQuery(this.reporting);
      query.filterRef = this.filterRef;
      query.setMetric(prop, 'last');
      return query;
    }
  }, {
    key: 'select',
    value: function select(limit, order) {
      var _this = this;

      limit = limit || 1;
      order = order || 'desc';

      var query = this.queryRef;
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
    key: 'count',
    value: function count() {
      return this._getCount();
    }
  }, {
    key: 'lesser',
    value: function lesser(value) {
      return this._getCount('lesser', value);
    }
  }, {
    key: 'greater',
    value: function greater(value) {
      return this._getCount('greater', value);
    }
  }, {
    key: 'between',
    value: function between(value, value2) {
      return this._getCount('between', value, value2);
    }
  }, {
    key: 'equal',
    value: function equal(value) {
      return this._getCount('between', value, value);
    }
  }, {
    key: '_getCount',
    value: function _getCount(comparision, value, otherValue) {
      var _this2 = this;

      var promise = new _rsvp2.default.Promise(function (resolve) {
        var query = _this2.queryRef;
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
        }
        query.once('value', function (snapshot) {
          resolve(snapshot.numChildren());
        });
      });
      return promise;
    }
  }]);

  return ReportQuery;
}();

module.exports = ReportQuery;