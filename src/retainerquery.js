class RetainerQuery {
  constructor(reporting) {
    this.reporting = reporting;
    this.filterRef = null;
    this.filterChildRef = null;
    this.metricKey = null;
    this.filterKey = null;
    this.retainer = null;
    this.retainerStart = null;
    this.retainerEnd = null;
  }

  setRetainer(type) {
    this.retainer = type;
  }

  range(start, end) {
    this.retainerStart = start;
    this.retainerEnd = end;
    return this;
  }

  valuesAsObject(fill) {
    const promise = new Promise((resolve, reject) => {
      let query = this.filterRef.child('retainers').child(this.filterKey).child(this.retainer).orderByKey();
      if (this.retainerStart) {
        const startBucket = this.reporting.getRetainerBucketKey(this.retainer, this.retainerStart);
        query = query.startAt(startBucket);
      }
      if (this.retainerEnd) {
        const endBucket = this.reporting.getRetainerBucketKey(this.retainer, this.retainerEnd);
        query = query.endAt(endBucket);
      }
      query.once('value').then((snapshot) => {
        let buckets = {};
        if (fill && this.retainerStart && this.retainerEnd) {
          buckets = this.reporting.getEmptyBuckets(this.retainer, this.retainerStart, this.retainerEnd);
        }
        snapshot.forEach((snap) => {
          const val = snap.child(this.metricKey).val();
          if (typeof val !== 'undefined') {
            buckets[snap.key] = val;
          }
        });
        resolve(buckets);
      }).catch(reject);
    });
    return promise;
  }

  values(fill) {
    const promise = new Promise((resolve, reject) => {
      this.valuesAsObject(fill).then((values) => {
        const keys = Object.keys(values).sort();
        const data = [];
        const duration = this.reporting.getRetainer(this.retainer).duration;
        keys.forEach((key) => {
          data.push({
            bucket: key,
            timestamp: (+key) * duration,
            value: values[key]
          });
        });
        resolve(data);
      }).catch(reject);
    });
    return promise;
  }
}

module.exports = RetainerQuery;
