import rsvp from 'rsvp';
import ReportQuery from './reportquery';

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
    this.properties = {};
    this.evaluators = {};
    this.filters = {};
    this.retainers = {};

    this.addEvaluator('max', (newVal, oldVal) => newVal > oldVal ? newVal : null);
    this.addEvaluator('min', (newVal, oldVal) => newVal < oldVal ? newVal : null);
    this.addEvaluator('first', () => null);
    this.addEvaluator('last', (newVal) => newVal);
    this.addEvaluator('sum', (newVal, oldVal) => oldVal + newVal);
    this.addEvaluator('diff', (newVal, oldVal) => oldVal - newVal);
    this.addEvaluator('multi', (newVal, oldVal) => oldVal * newVal);
    this.addEvaluator('div', (newVal, oldVal) => oldVal / newVal);

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

    this.properties[prop] = this.properties[prop] || {
      metrics: [],
      retainers: {}
    };
    this.properties[prop].metrics = metrics;
  }

  addRetainer(name, duration) {
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

  enableRetainer(retainer, prop, metrics) {
    metrics.forEach((m) => {
      if (!this.evaluators[m]) {
        throw 'metrics contains one or more invalid evaluators';
      }
    });

    this.properties[prop].retainers[retainer] = metrics;
  }

  saveMetrics(values) {
    const promises = [];
    const vals = Array.isArray(values) ? values : [values];

    vals.forEach((data) => {
      for (var prop in data) {
        if (!this.properties[prop]) continue;

        // store metrics for data
        this.properties[prop].metrics.forEach((metric) => {
          // run for default filter
          promises.push(this.updateMetricValue('default', prop, data, metric));

          // run for other filter
          for (var fname in this.filters) {
            promises.push(this.updateMetricValue(fname, prop, data, metric));
          }
        });

        // store retained metrics for data
        for (var retainer in this.properties[prop].retainers) {
          this.properties[prop].retainers[retainer].forEach((metric) => {
            // run for default filter
            promises.push(this.retainMetricValue('default', retainer, prop, data, metric));

            // run for other filter
            for (var fname in this.filters) {
              promises.push(this.retainMetricValue(fname, retainer, prop, data, metric));
            }
          });
        }
      }
    });

    if (promises.length > 0) {
      return rsvp.all(promises);
    } else {
      return new rsvp.Promise((resolve) => resolve());
    }
  }

  where(filterName, filterData) {
    filterName = filterName || 'default';
    const query = new ReportQuery(this);
    if (filterData) {
      query.setFilter(filterName, this.getFilterKey(filterName, filterData));
    } else if (filterName === 'default') {
      query.setFilter(filterName, 'default');
    } else {
      query.setFilter(filterName);
    }
    return query;
  }

  updateMetricValue(filterName, prop, data, evaluatorName) {
    const metricRef = this.getFilterMetricRef(filterName, data).child(this.getMetricKey(prop, evaluatorName));
    const evaluator = this.evaluators[evaluatorName];
    const newVal = data[prop];
    return metricRef.transaction((oldVal) => {
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
    });
  }

  retainMetricValue(filterName, retainerName, prop, data, evaluatorName) {
    const metricRef = this.getRetainerBucketRef(filterName, data, retainerName).child(this.getMetricKey(prop, evaluatorName));
    const evaluator = this.evaluators[evaluatorName];
    const newVal = data[prop];
    return metricRef.transaction((oldVal) => {
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
    });
  }

  getMetricKey(prop, evaluatorName) {
    return prop + this.separator + evaluatorName;
  }

  getFilterKey(filterName, data) {
    if (!filterName || filterName === 'default') {
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

  getEmptyBuckets(start, end, retainerName) {
    const retainer = this.retainers[retainerName];
    const startBucket = Math.floor(start / retainer.duration);
    const endBucket = Math.floor(end / retainer.duration);
    const buckets = {};

    let currBucket = startBucket;
    while (currBucket <= endBucket) {
      buckets[currBucket.toString()] = 0;
      currBucket++;
    }

    return buckets;
  }

  getRetainerBucketKey(retainerName, time) {
    const retainer = this.retainers[retainerName];
    time = time || new Date().getTime();
    return Math.floor(time / retainer.duration).toString();
  }

  getFilterRef(filterName) {
    return this.firebaseRef.child(filterName);
  }

  getFilterMetricRef(filterName, data) {
    return this.getFilterRef(filterName).child('metrics').child(this.getFilterKey(filterName, data));
  }

  getFilterRetainerRef(filterName, data) {
    return this.getFilterRef(filterName).child('retainers').child(this.getFilterKey(filterName, data));
  }

  getRetainerBucketRef(filterName, data, retainerName) {
    return this.getFilterRetainerRef(filterName, data).child(retainerName).child(this.getRetainerBucketKey(retainerName));
  }
}

module.exports = FirebaseReporting;
