'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _metricquery = require('./metricquery');

var _metricquery2 = _interopRequireDefault(_metricquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReportQuery = function () {
  function ReportQuery(reporting) {
    _classCallCheck(this, ReportQuery);

    this.reporting = reporting;
    this.filterRef = null;
    this.filterChildRef = null;
    this.filterKey = null;
  }

  _createClass(ReportQuery, [{
    key: 'setFilter',
    value: function setFilter(filter, value) {
      this.filterKey = null;
      this.filterRef = this.reporting.getFilterRef(filter);

      if (value) {
        this.filterKey = value;
      }
    }
  }, {
    key: 'min',
    value: function min(prop) {
      return this.createMetricQuery(prop, 'min');
    }
  }, {
    key: 'max',
    value: function max(prop) {
      return this.createMetricQuery(prop, 'max');
    }
  }, {
    key: 'diff',
    value: function diff(prop) {
      return this.createMetricQuery(prop, 'diff');
    }
  }, {
    key: 'sum',
    value: function sum(prop) {
      return this.createMetricQuery(prop, 'sum');
    }
  }, {
    key: 'multi',
    value: function multi(prop) {
      return this.createMetricQuery(prop, 'multi');
    }
  }, {
    key: 'div',
    value: function div(prop) {
      return this.createMetricQuery(prop, 'div');
    }
  }, {
    key: 'first',
    value: function first(prop) {
      return this.createMetricQuery(prop, 'first');
    }
  }, {
    key: 'last',
    value: function last(prop) {
      return this.createMetricQuery(prop, 'last');
    }
  }, {
    key: 'createMetricQuery',
    value: function createMetricQuery(prop, type) {
      var query = new _metricquery2.default(this.reporting);
      query.filterRef = this.filterRef;
      query.filterKey = this.filterKey;
      query.setMetric(prop, type);
      return query;
    }
  }]);

  return ReportQuery;
}();

module.exports = ReportQuery;