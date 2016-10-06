import MetricQuery from './metricquery';

class ReportQuery {
  constructor(reporting) {
    this.reporting = reporting;
    this.filterRef = null;
    this.filterChildRef = null;
    this.filterKey = null;
  }

  setFilter(filter, value) {
    this.filterKey = null;
    this.filterRef = this.reporting.getFilterRef(filter);

    if (value) {
      this.filterKey = value;
    }
  }

  min(prop) {
    return this.createMetricQuery(prop, 'min');
  }

  max(prop) {
    return this.createMetricQuery(prop, 'max');
  }

  diff(prop) {
    return this.createMetricQuery(prop, 'diff');
  }

  sum(prop) {
    return this.createMetricQuery(prop, 'sum');
  }

  multi(prop) {
    return this.createMetricQuery(prop, 'multi');
  }

  div(prop) {
    return this.createMetricQuery(prop, 'div');
  }

  first(prop) {
    return this.createMetricQuery(prop, 'first');
  }

  last(prop) {
    return this.createMetricQuery(prop, 'last');
  }

  createMetricQuery(prop, type) {
    const query = new MetricQuery(this.reporting);
    query.filterRef = this.filterRef;
    query.filterKey = this.filterKey;
    query.setMetric(prop, type);
    return query;
  }
}

module.exports = ReportQuery;
