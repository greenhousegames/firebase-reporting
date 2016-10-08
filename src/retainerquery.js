import rsvp from 'rsvp';

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

  setRetainer(type, start, end) {
    this.retainer = type;
    this.retainerStart = start;
    this.retainerEnd = end;
  }

  values() {
    const promise = new rsvp.Promise((resolve, reject) => {
      const startBucket = this.reporting.getRetainerBucketKey(this.retainer, this.retainerStart);
      const endBucket = this.reporting.getRetainerBucketKey(this.retainer, this.retainerEnd);
      const query = this.filterRef.child('retainers').child(this.filterKey).child(this.retainer).orderByKey().startAt(startBucket).endAt(endBucket);
      query.once('value').then((snapshot) => {
        const buckets = {};
        snapshot.forEach((snap) => {
          const val = snap.child(this.metricKey).val();
          if (typeof val !== 'undefined') {
            buckets[snap.key] = val;
          }
        });

        // fill buckets
        let currBucket = startBucket;
        while (currBucket <= endBucket) {
          if (!buckets[currBucket]) {
            buckets[currBucket] = 0;
          }
          currBucket++;
        }
        resolve(buckets);
      }).catch(reject);
    });
    return promise;
  }

  valuesAsArray() {
    const promise = new rsvp.Promise((resolve, reject) => {
      this.values().then((values) => {
        const keys = Object.keys(values).sort();
        const data = [];
        const duration = this.reporting.retainers[this.retainer].duration;
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
