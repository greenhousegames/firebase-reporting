import rsvp from 'rsvp';

class CountQuery {
  constructor() {
    this.filterRef = null;
    this.filterChildRef = null;
    this.metricKey = null;
    this.filterKey = null;
    this.comparision = null;
    this.comparisionValue1 = null;
    this.comparisionValue2 = null;
  }

  setComparision(type, value, value2) {
    this.comparision = type;
    this.comparisionValue1 = value;
    this.comparisionValue2 = value2;
  }

  count() {
    const promise = new rsvp.Promise((resolve, reject) => {
      let query = this.filterRef.child('metrics').orderByChild(this.metricKey);
      switch (this.comparision) {
        case 'lesser':
          query = query.endAt(this.comparisionValue1);
          break;
        case 'greater':
          query = query.startAt(this.comparisionValue1);
          break;
        case 'between':
          query = query.startAt(this.comparisionValue1).endAt(this.comparisionValue2);
          break;
      }
      query.once('value').then((snapshot) => {
        resolve(snapshot.numChildren());
      }).catch(reject);
    });
    return promise;
  }
}

module.exports = CountQuery;
