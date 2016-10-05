import rsvp from 'rsvp';

class FirebaseReporting {
  constructor(config) {
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
    this.evaluators[name] = method;
  }

  setQueryFilter(filter, data) {
    this.queryFilter = filter;
    this.queryData = data;
  }

  saveMetrics(data) {
    const promises = [];
    promises.push(this.saveMetricsForData(data));
    promises.push(this.saveMetricsForUser(data));
    return rsvp.all(promises);
  }

  saveMetricsForData(data) {
    const promises = [];
    const ref = this.refDataReporting();
    for (var key in data) {
      if (this.rules[key]) {
        // need to store metrics for data
        this.rules[key].forEach((metric) => {
          if (this.evaluators[metric]) {
            // run metric for each filter
            this.filters.forEach((filter) => {
              promises.push(this._calculateMetricValue(ref, key, data[key], metric, this.evaluators[metric], filter, data));
            });
          }
        });
      }
    }
    return rsvp.all(promises);
  }

  saveMetricsForUser(data, uid) {
    uid = uid || this._getUserUID();
    const ref = this.refUserReporting().child(uid);
    const promises = [];
    for (var key in data) {
      if (this.rules[key]) {
        // need to store metrics for data
        this.rules[key].forEach((metric) => {
          if (this.evaluators[metric]) {
            // run metric for each filter
            this.filters.forEach((filter) => {
              promises.push(this._calculateMetricValue(ref, key, data[key], metric, this.evaluators[metric], filter, data));
            });
          }
        });
      }
    }
    return rsvp.all(promises);
  }

  getMetricsForUser(uid) {
    uid = uid || this._getUserUID();
    const promise = new rsvp.Promise((resolve, reject) => {
      const promises = [];
      const ref = this.refUserReporting().child(uid);
      const metrics = {};
      for (var key in this.rules) {
        metrics[key] = {};
        this.rules[key].forEach((metric) => {
          if (this.evaluators[metric]) {
            promises.push(this._captureMetricValue(ref, key, metric, metrics));
          } else {
            metrics[key][metric] = null;
          }
        });
      }
      return rsvp.all(promises).then(() => {
        resolve(metrics);
      }).catch(reject);
    });
    return promise;
  }

  getDataMetricValues(stat, evalName, limit, order) {
    return this._getMetrics(this.refDataReporting(), stat, evalName, limit, order);
  }

  getUserMetricValues(stat, evalName, limit, order) {
    return this._getMetrics(this.refUserReporting(), stat, evalName, limit, order);
  }

  _getMetrics(ref, stat, evalName, limit, order) {
    limit = limit || 1;
    const key = this._getStatKey(stat, evalName);
    const values = [];
    let query = ref.orderByChild(key);
    if (order === 'desc') {
      query = query.limitToLast(limit);
    } else if (order === 'asc') {
      query = query.limitToFirst(limit);
    }
    const promise = new rsvp.Promise((resolve) => {
      query.on('child_added', (snapshot) => {
        values.push(snapshot.child(key).val());
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

  getDataMetricTotals(stat, evalName, comparision, value, otherValue) {
    return this._getTotalInternal(this.refDataReporting(), stat, evalName, comparision, value, otherValue);
  }

  getUserMetricTotals(stat, evalName, comparision, value, otherValue) {
    return this._getTotalInternal(this.refUserReporting(), stat, evalName, comparision, value, otherValue);
  }

  _getTotalInternal(ref, stat, evalName, comparision, value, otherValue) {
    const promise = new rsvp.Promise((resolve) => {
      let query = ref;
      if (stat) {
        const key = this._getStatKey(stat, evalName);
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
      query.once('value', (snapshot) => {
        resolve(snapshot.numChildren());
      });
    });
    return promise;
  }

  _captureMetricValue(uid, stat, evaluatorName, metrics) {
    const key = this._getStatKey(stat, evaluatorName);
    const promise = new rsvp.Promise((resolve) => {
      ref.child(key).once('value', (snapshot) => {
        const val = snapshot.val();
        if (metrics) {
          metrics[stat][evaluatorName] = val;
        }
        resolve(val);
      });
    });
    return promise;
  }

  _calculateMetricValue(ref, stat, newVal, evaluatorName, evaluator, filter, filterData) {
    const key = this._getStatKey(stat, evaluatorName, filter, filterData);
    return ref.child(key).transaction((oldVal) => {
      if (typeof oldVal === 'undefined') {
        return newVal;
      } else {
        const evalVal = evaluator(newVal, oldVal);
        if (typeof evalVal !== 'undefined' && evalVal !== null) {
          return evalVal;
        } else {
          return oldVal;
        }
      }
    });
  }

  _getStatKey(stat, evalName, filter, filterData) {
    let prefix = '';
    (filter || this.queryFilter).forEach((key) => {
      filterData += key + '~~';
      if (filterData) {
        prefix += filterData[key] + '~~';
      } else {
        prefix += this.queryData[key] + '~~';
      }
    });
    return prefix + stat + '~~' + evalName;
  }

  refData() {
    return this.firebase.database().ref(this.paths.data);
  }

  refUserReporting() {
    return this.firebase.database().ref(this.paths.reporting).child('users');
  }

  refDataReporting() {
    return this.firebase.database().ref(this.paths.reporting).child('data');
  }

  _getUserUID() {
    const currentUser = this.firebase.auth().currentUser;
    if (currentUser) {
      return currentUser.uid;
    } else {
      return 'unknown';
    }
  }
}

module.exports = FirebaseReporting;
