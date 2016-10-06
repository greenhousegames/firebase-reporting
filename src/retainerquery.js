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
        const data = [];
        snapshot.forEach((snap) => {
          const val = snap.child(this.metricKey).val();
          if (typeof val !== 'undefined') {
            data.push({
              bucket: snap.key,
              value: val
            });
          }
        });
        resolve(data);
      }).catch(reject);
    });
    return promise;
  }
}

module.exports = RetainerQuery;
