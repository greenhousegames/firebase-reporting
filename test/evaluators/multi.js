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
    reporting.addMetric('value', ['multi']);
    const data = {value: 50};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').select(1)).to.become([50])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should store correct metric for multiple data points', (done) => {
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50}, {value: 2}, {value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').select(1)).to.become([500])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('value', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['multi']);
    const data = {value: 50};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').value()).to.become(50)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['multi']);
    const data = {value: 50, mode: 1};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom', { mode: 1 }).multi('value').value()).to.become(50),
        expect(reporting.where('custom', { mode: 2 }).multi('value').value()).to.become(null)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('select', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['multi']);
    const data = {value: 50};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').select(1)).to.become([50])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['multi']);
    const data = {value: 50, mode: 1};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').multi('value').select(1)).to.become([50])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('total', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').total()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 3}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').multi('value').total()).to.become(3)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('lesser', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').lesser(500).count()).to.become(1),
        expect(reporting.where().multi('value').lesser(50).count()).to.become(0),
        expect(reporting.where().multi('value').lesser(1).count()).to.become(0)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').multi('value').lesser(500).count()).to.become(2),
        expect(reporting.where('custom').multi('value').lesser(50).count()).to.become(1),
        expect(reporting.where('custom').multi('value').lesser(2).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('greater', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').greater(2).count()).to.become(1),
        expect(reporting.where().multi('value').greater(50).count()).to.become(1),
        expect(reporting.where().multi('value').greater(500).count()).to.become(1),
        expect(reporting.where().multi('value').greater(501).count()).to.become(0)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').multi('value').greater(500).count()).to.become(0),
        expect(reporting.where('custom').multi('value').greater(0).count()).to.become(2),
        expect(reporting.where('custom').multi('value').greater(5).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('equal', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').equal(2).count()).to.become(0),
        expect(reporting.where().multi('value').equal(5).count()).to.become(0),
        expect(reporting.where().multi('value').equal(50).count()).to.become(0),
        expect(reporting.where().multi('value').equal(500).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').multi('value').equal(500).count()).to.become(0),
        expect(reporting.where('custom').multi('value').equal(250).count()).to.become(1),
        expect(reporting.where('custom').multi('value').equal(2).count()).to.become(1),
        expect(reporting.where('custom').multi('value').equal(5).count()).to.become(0)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('between', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').between(0, 5).count()).to.become(0),
        expect(reporting.where().multi('value').between(10, 50).count()).to.become(0),
        expect(reporting.where().multi('value').between(100, 500).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').multi('value').between(10, 50).count()).to.become(0),
        expect(reporting.where('custom').multi('value').between(0, 50).count()).to.become(1),
        expect(reporting.where('custom').multi('value').between(1, 5).count()).to.become(1),
        expect(reporting.where('custom').multi('value').between(1, 2).count()).to.become(1),
        expect(reporting.where('custom').multi('value').between(1, 250).count()).to.become(2),
        expect(reporting.where('custom').multi('value').between(400, 500).count()).to.become(0)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('during', () => {
  it('should retrieve metrics with default filter', (done) => {
    reporting.addMetric('value', ['multi']);
    reporting.enableRetainer('minute', 'value', ['multi']);
    reporting.enableRetainer('second', 'value', ['multi']);
    const data = [{value: 50},{value: 2},{value: 5}];
    const start = new Date().getTime() - 1000*60*60;
    const end = new Date().getTime() + 1000*60*60;
    const bucketminute = reporting.getRetainerBucketKey('minute');
    const bucketsecond = reporting.getRetainerBucketKey('second');

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').during(start, end, 'minute').values()).to.become([{bucket: bucketminute, value: 500}]),
        expect(reporting.where().multi('value').during(start, end, 'second').values()).to.become([{bucket: bucketsecond, value: 500}])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metrics with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['multi']);
    reporting.enableRetainer('minute', 'value', ['multi']);
    reporting.enableRetainer('second', 'value', ['multi']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];
    const start = new Date().getTime() - 1000*60*60;
    const end = new Date().getTime() + 1000*60*60;
    const bucketminute = reporting.getRetainerBucketKey('minute');
    const bucketsecond = reporting.getRetainerBucketKey('second');

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom', { mode: 1 }).multi('value').during(start, end, 'minute').values()).to.become([{bucket: bucketminute, value: 250}]),
        expect(reporting.where('custom', { mode: 2 }).multi('value').during(start, end, 'minute').values()).to.become([{bucket: bucketminute, value: 2}]),
        expect(reporting.where('custom', { mode: 1 }).multi('value').during(start, end, 'second').values()).to.become([{bucket: bucketsecond, value: 250}]),
        expect(reporting.where('custom', { mode: 2 }).multi('value').during(start, end, 'second').values()).to.become([{bucket: bucketsecond, value: 2}])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metrics across time gaps', (done) => {
    reporting.addMetric('value', ['multi']);
    reporting.enableRetainer('second', 'value', ['multi']);
    reporting.enableRetainer('minute', 'value', ['multi']);
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
            expect(reporting.where().multi('value').during(start, end, 'second').values()).to.become([
              { bucket: bucketsecond1, value: 100 },
              { bucket: bucketsecond2, value: 10 }
            ]),
            expect(reporting.where().multi('value').during(start, end, 'minute').values()).to.become([
              { bucket: bucketminute, value: 1000 }
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
