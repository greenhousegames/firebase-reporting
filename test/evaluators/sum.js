var rsvp = require('rsvp');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var helpers = require('../helpers');

var firebaseServer;
var client;
var reporting;

beforeEach(() => {
  firebaseServer = helpers.newFirebaseServer();
  client = helpers.newFirebaseClient();
  reporting = new helpers.FirebaseReporting({
    firebase: helpers.newFirebaseClient()
  });
});

afterEach(() => {
  if (firebaseServer) {
    firebaseServer.close();
    firebaseServer = null;
  }
});

describe('evaluator', () => {
  it('should store correct metric for single data point', (done) => {
    reporting.addMetric('value', ['sum']);
    const data = {value: 50};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().sum('value').select(1)).to.become([50])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should store correct metric for multiple data points', (done) => {
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50}, {value: 2}, {value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().sum('value').select(1)).to.become([57])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('value', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['sum']);
    const data = {value: 50};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().sum('value').value()).to.become(50)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['sum']);
    const data = {value: 50, mode: 1};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom', { mode: 1 }).sum('value').value()).to.become(50),
        expect(reporting.where('custom', { mode: 2 }).sum('value').value()).to.become(null)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('select', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['sum']);
    const data = {value: 50};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().sum('value').select(1)).to.become([50])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['sum']);
    const data = {value: 50, mode: 1};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').sum('value').select(1)).to.become([50])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('total', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().sum('value').total()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 3}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').sum('value').total()).to.become(3)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('lesser', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().sum('value').lesser(5).count()).to.become(0),
        expect(reporting.where().sum('value').lesser(60).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').sum('value').lesser(1).count()).to.become(0),
        expect(reporting.where('custom').sum('value').lesser(50).count()).to.become(1),
        expect(reporting.where('custom').sum('value').lesser(60).count()).to.become(2)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('greater', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().sum('value').greater(55).count()).to.become(1),
        expect(reporting.where().sum('value').greater(60).count()).to.become(0)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').sum('value').greater(50).count()).to.become(1),
        expect(reporting.where('custom').sum('value').greater(5).count()).to.become(1),
        expect(reporting.where('custom').sum('value').greater(0).count()).to.become(2)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('equal', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().sum('value').equal(2).count()).to.become(0),
        expect(reporting.where().sum('value').equal(5).count()).to.become(0),
        expect(reporting.where().sum('value').equal(55).count()).to.become(0),
        expect(reporting.where().sum('value').equal(57).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').sum('value').equal(50).count()).to.become(0),
        expect(reporting.where('custom').sum('value').equal(2).count()).to.become(1),
        expect(reporting.where('custom').sum('value').equal(55).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('between', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().sum('value').between(0, 5).count()).to.become(0),
        expect(reporting.where().sum('value').between(10, 60).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['sum']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').sum('value').between(10, 50).count()).to.become(0),
        expect(reporting.where('custom').sum('value').between(0, 50).count()).to.become(1),
        expect(reporting.where('custom').sum('value').between(1, 5).count()).to.become(1),
        expect(reporting.where('custom').sum('value').between(1, 2).count()).to.become(1),
        expect(reporting.where('custom').sum('value').between(10, 60).count()).to.become(1),
        expect(reporting.where('custom').sum('value').between(0, 55).count()).to.become(2)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('during', () => {
  it('should retrieve metrics with default filter', (done) => {
    reporting.addMetric('value', ['sum']);
    reporting.enableRetainer('minute', 'value', ['sum']);
    reporting.enableRetainer('second', 'value', ['sum']);
    const data = [{value: 50},{value: 2},{value: 5}];
    const start = new Date().getTime() - 1000*60*60;
    const end = new Date().getTime() + 1000*60*60;
    const bucketminute = reporting.getRetainerBucketKey('minute');
    const bucketsecond = reporting.getRetainerBucketKey('second');

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().sum('value').during(start, end, 'minute').values()).to.become([{bucket: bucketminute, value: 57}]),
        expect(reporting.where().sum('value').during(start, end, 'second').values()).to.become([{bucket: bucketsecond, value: 57}])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metrics with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['sum']);
    reporting.enableRetainer('minute', 'value', ['sum']);
    reporting.enableRetainer('second', 'value', ['sum']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];
    const start = new Date().getTime() - 1000*60*60;
    const end = new Date().getTime() + 1000*60*60;
    const bucketminute = reporting.getRetainerBucketKey('minute');
    const bucketsecond = reporting.getRetainerBucketKey('second');

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom', { mode: 1 }).sum('value').during(start, end, 'minute').values()).to.become([{bucket: bucketminute, value: 55}]),
        expect(reporting.where('custom', { mode: 2 }).sum('value').during(start, end, 'minute').values()).to.become([{bucket: bucketminute, value: 2}]),
        expect(reporting.where('custom', { mode: 1 }).sum('value').during(start, end, 'second').values()).to.become([{bucket: bucketsecond, value: 55}]),
        expect(reporting.where('custom', { mode: 2 }).sum('value').during(start, end, 'second').values()).to.become([{bucket: bucketsecond, value: 2}])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metrics across time gaps', (done) => {
    reporting.addMetric('value', ['sum']);
    reporting.enableRetainer('second', 'value', ['sum']);
    reporting.enableRetainer('minute', 'value', ['sum']);
    const data1 = [{value: 50},{value: 2}];
    const data2 = [{value: 5},{value: 2}];
    const start = new Date().getTime() - 1000*60*60;
    const end = new Date().getTime() + 1000*60*60;
    const bucketsecond1 = reporting.getRetainerBucketKey('second');
    const bucketminute = reporting.getRetainerBucketKey('minute');

    reporting.saveMetrics(data1).then(() => {
      setTimeout(() => {
        const bucketsecond2 = reporting.getRetainerBucketKey('second');

        reporting.saveMetrics(data2).then(() => {
          expect(rsvp.all([
            expect(reporting.where().sum('value').during(start, end, 'second').values()).to.become([
              { bucket: bucketsecond1, value: 52 },
              { bucket: bucketsecond2, value: 7 }
            ]),
            expect(reporting.where().sum('value').during(start, end, 'minute').values()).to.become([
              { bucket: bucketminute, value: 59 }
            ])
          ])).notify(done);
        }).catch((err) => {
          done(new Error(err));
        });
      }, 1000);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});
