import rsvp from 'rsvp';
import CountQuery from './countquery';
import RetainerQuery from './retainerquery';

class MetricQuery {
  constructor(reporting) {
    this.reporting = reporting;
    this.filterRef = null;
    this.filterChildRef = null;
    this.metricKey = null;
    this.filterKey = null;
  }

  setMetric(prop, evaluator) {
    this.metricKey = this.reporting.getMetricKey(prop, evaluator);
  }

  value() {
    if (!this.filterKey) {
      throw 'Filter key not set';
    }
    if (!this.metricKey) {
      throw 'Metric key not set';
    }
    const query = this.filterRef.child('metrics').child(this.filterKey).child(this.metricKey);
    const promise = new rsvp.Promise((resolve, reject) => {
      query.once('value').then((snapshot) => {
        resolve(snapshot.val());
      }).catch(reject);
    });
    return promise;
  }

  select(limit, order) {
    limit = limit || 1;
    order = order || 'desc';

    let query = this.filterRef.child('metrics').orderByChild(this.metricKey);
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

  lesser(value) {
    const query = new CountQuery();
    query.filterRef = this.filterRef;
    query.filterKey = this.filterKey;
    query.metricKey = this.metricKey;
    query.setComparision('lesser', value, null);
    return query;
  }

  greater(value) {
    const query = new CountQuery();
    query.filterRef = this.filterRef;
    query.filterKey = this.filterKey;
    query.metricKey = this.metricKey;
    query.setComparision('greater', value, null);
    return query;
  }

  between(value, value2) {
    const query = new CountQuery();
    query.filterRef = this.filterRef;
    query.filterKey = this.filterKey;
    query.metricKey = this.metricKey;
    query.setComparision('between', value, value2);
    return query;
  }

  equal(value) {
    const query = new CountQuery();
    query.filterRef = this.filterRef;
    query.filterKey = this.filterKey;
    query.metricKey = this.metricKey;
    query.setComparision('between', value, value);
    return query;
  }

  count() {
    const query = new CountQuery();
    query.filterRef = this.filterRef;
    query.filterKey = this.filterKey;
    query.metricKey = this.metricKey;
    return query.count();
  }

  during(start, end, retainer) {
    const query = new RetainerQuery(this.reporting);
    query.filterRef = this.filterRef;
    query.filterKey = this.filterKey;
    query.metricKey = this.metricKey;
    query.setRetainer(retainer, start, end);
    return query;
  }
}

module.exports = MetricQuery;
