import rsvp from 'rsvp';

class ReportQuery {
  constructor(reporting) {
    this.reporting = reporting;
    this.filterRef = null;
    this.metricKey = null;
    this.queryRef = null;
  }

  setFilter(filter) {
    this.filterRef = this.reporting.firebaseRef.child(filter);

    this.queryRef = null;
    if (this.metricKey !== null) {
      this.queryRef = this.filterRef.orderByChild(this.metricKey);
    }
  }

  setMetric(prop, evaluator) {
    this.metricKey = this.reporting._getMetricKey(prop, evaluator);

    this.queryRef = null;
    if (this.filterRef !== null) {
      this.queryRef = this.filterRef.orderByChild(this.metricKey);
    }
  }

  min(prop) {
    const query = new ReportQuery(this.reporting);
    query.filterRef = this.filterRef;
    query.setMetric(prop, 'min');
    return query;
  }

  max(prop) {
    const query = new ReportQuery(this.reporting);
    query.filterRef = this.filterRef;
    query.setMetric(prop, 'max');
    return query;
  }

  diff(prop) {
    const query = new ReportQuery(this.reporting);
    query.filterRef = this.filterRef;
    query.setMetric(prop, 'diff');
    return query;
  }

  sum(prop) {
    const query = new ReportQuery(this.reporting);
    query.filterRef = this.filterRef;
    query.setMetric(prop, 'sum');
    return query;
  }

  multi(prop) {
    const query = new ReportQuery(this.reporting);
    query.filterRef = this.filterRef;
    query.setMetric(prop, 'multi');
    return query;
  }

  div(prop) {
    const query = new ReportQuery(this.reporting);
    query.filterRef = this.filterRef;
    query.setMetric(prop, 'div');
    return query;
  }

  first(prop) {
    const query = new ReportQuery(this.reporting);
    query.filterRef = this.filterRef;
    query.setMetric(prop, 'first');
    return query;
  }

  last(prop) {
    const query = new ReportQuery(this.reporting);
    query.filterRef = this.filterRef;
    query.setMetric(prop, 'last');
    return query;
  }

  select(limit, order) {
    limit = limit || 1;
    order = order || 'desc';

    let query = this.queryRef;
    if (order === 'desc') {
      query = query.limitToLast(limit);
    } else if (order === 'asc') {
      query = query.limitToFirst(limit);
    }

    const promise = new rsvp.Promise((resolve) => {
      const values = [];
      query.on('child_added', (snapshot) => {
        values.push(snapshot.child(this.metricKey).val());
        if (values.length === limit) {
          done();
        }
      });

      const done = () => {
        clearTimeout(timeout);
        query.off('child_added');
        if (order === 'desc') {
          values.sort((a, b) => b - a);
        } else if (order === 'asc') {
          values.sort((a, b) => a - b);
        }
        resolve(values);
      };
      const timeout = setTimeout(done, 5000);
    });
    return promise;
  }

  count() {
    return this._getCount();
  }

  lesser(value) {
    return this._getCount('lesser', value);
  }

  greater(value) {
    return this._getCount('greater', value);
  }

  between(value, value2) {
    return this._getCount('between', value, value2);
  }

  equal(value) {
    return this._getCount('between', value, value);
  }

  _getCount(comparision, value, otherValue) {
    const promise = new rsvp.Promise((resolve) => {
      let query = this.queryRef;
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
      query.once('value', (snapshot) => {
        resolve(snapshot.numChildren());
      });
    });
    return promise;
  }
}

module.exports = ReportQuery;
