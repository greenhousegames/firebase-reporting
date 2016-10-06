import rsvp from 'rsvp';

class FirebaseReporting {
  constructor(config) {
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

    this.addEvaluator('max', (newVal, oldVal) => newVal > oldVal ? newVal : null);
    this.addEvaluator('min', (newVal, oldVal) => newVal < oldVal ? newVal : null);
    this.addEvaluator('first', () => null);
    this.addEvaluator('last', (newVal) => newVal);
    this.addEvaluator('sum', (newVal, oldVal) => oldVal + newVal);
    this.addEvaluator('diff', (newVal, oldVal) => oldVal - newVal);
    this.addEvaluator('multi', (newVal, oldVal) => oldVal * newVal);
    this.addEvaluator('div', (newVal, oldVal) => oldVal / newVal);
  }

  addEvaluator(name, method) {
    if (!name) {
      throw 'evaluator name is required';
    }
    if (typeof method !== 'function') {
      throw 'method must be a function which takes in 2 arguments and outputs the new metric value';
    }

    this.evaluators[name] = method;
  }

  addFilter(name, props) {
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

  addMetric(prop, metrics) {
    if (!prop) {
      throw 'property name is required';
    }
    if (!Array.isArray(metrics)) {
      throw 'metrics must be an array of evaluator names';
    }
    metrics.forEach((m) => {
      if (!this.evaluators[m]) {
        throw 'metrics contains one or more invalid evaluators';
      }
    });

    this.metrics[prop] = metrics;
  }

  saveMetrics(data) {
    const promises = [];
    for (var prop in data) {
      if (!this.metrics[prop]) continue;

      // need to store metrics for data
      this.metrics[prop].forEach((metric) => {
        // run for default filter
        promises.push(this._updateMetricValue('default', prop, data, metric));

        // run metric for each filter
        for (var fname in this.filters) {
          promises.push(this._updateMetricValue(fname, prop, data, metric));
        }
      });
    }

    if (promises.length > 0) {
      return rsvp.all(promises);
    } else {
      return new rsvp.Promise((resolve) => resolve());
    }
  }

  getMetricValues(filterName, prop, evaluatorName, limit, order) {
    limit = limit || 1;
    order = order || 'desc';
    const filterRef = this.firebaseRef.child(filterName);
    const metricKey = this._getMetricKey(prop, evaluatorName);
    let query = filterRef.orderByChild(metricKey);
    const values = [];
    if (order === 'desc') {
      query = query.limitToLast(limit);
    } else if (order === 'asc') {
      query = query.limitToFirst(limit);
    }
    const promise = new rsvp.Promise((resolve) => {
      query.on('child_added', (snapshot) => {
        values.push(snapshot.child(metricKey).val());
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

  getMetricTotals(filterName, prop, evaluatorName, comparision, value, otherValue) {
    const filterRef = this.firebaseRef.child(filterName);
    const metricKey = this._getMetricKey(prop, evaluatorName);
    const promise = new rsvp.Promise((resolve) => {
      let query = filterRef.orderByChild(metricKey);
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
      query.once('value', (snapshot) => {
        resolve(snapshot.numChildren());
      });
    });
    return promise;
  }

  _getMetricValue(filterName, prop, data, evaluatorName) {
    const filterRef = this.firebaseRef.child(filterName).child(this._getFilterKey(filterName, data));
    const metricRef = filterRef.child(this._getMetricKey(prop, evaluatorName));
    const promise = new rsvp.Promise((resolve) => {
      metricRef.once('value', (snapshot) => {
        const val = snapshot.val();
        resolve(val);
      });
    });
    return promise;
  }

  _updateMetricValue(filterName, prop, data, evaluatorName) {
    const filterRef = this.firebaseRef.child(filterName).child(this._getFilterKey(filterName, data));
    const metricRef = filterRef.child(this._getMetricKey(prop, evaluatorName));
    const evaluator = this.evaluators[evaluatorName];
    const newVal = data[prop];
    const getUpdatedValue = (oldVal) => {
      if (typeof oldVal === 'undefined' || oldVal === null) {
        return newVal;
      } else {
        const evalVal = evaluator(newVal, oldVal);
        if (typeof evalVal === 'undefined' || evalVal === null) {
          return oldVal;
        } else {
          return evalVal;
        }
      }
    };

    return metricRef.transaction(getUpdatedValue);
  }

  _getMetricKey(prop, evalName) {
    return prop + this.separator + evalName;
  }

  _getFilterKey(filterName, data) {
    if (filterName === 'default') {
      return 'default';
    }

    if (!this.filters[filterName]) {
      throw 'Filter name does not exist';
    }

    let key = '';
    this.filters[filterName].forEach((prop) => {
      key += prop + this.separator;
      key += data[prop] + this.separator;
    });
    return key;
  }
}

module.exports = FirebaseReporting;
