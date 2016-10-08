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
    reporting.addMetric('value', ['last']);
    const data = {value: 50};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').select(1)).to.become([50])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should store correct metric for multiple data points', (done) => {
    reporting.addMetric('value', ['last']);
    const data = [{value: 50}, {value: 2}, {value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').select(1)).to.become([5])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('value', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['last']);
    const data = {value: 50};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').value()).to.become(50)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['last']);
    const data = {value: 50, mode: 1};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom', { mode: 1 }).last('value').value()).to.become(50),
        expect(reporting.where('custom', { mode: 2 }).last('value').value()).to.become(null)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('select', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['last']);
    const data = {value: 50};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').select(1)).to.become([50])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['last']);
    const data = {value: 50, mode: 1};

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').last('value').select(1)).to.become([50])
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('count', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['last']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['last']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 3}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').last('value').count()).to.become(3)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('lesser', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['last']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').lesser(5).count()).to.become(1),
        expect(reporting.where().last('value').lesser(2).count()).to.become(0)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['last']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').last('value').lesser(49).count()).to.become(2),
        expect(reporting.where('custom').last('value').lesser(5).count()).to.become(2),
        expect(reporting.where('custom').last('value').lesser(2).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('greater', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['last']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').greater(2).count()).to.become(1),
        expect(reporting.where().last('value').greater(5).count()).to.become(1),
        expect(reporting.where().last('value').greater(6).count()).to.become(0)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['last']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').last('value').greater(50).count()).to.become(0),
        expect(reporting.where('custom').last('value').greater(5).count()).to.become(1),
        expect(reporting.where('custom').last('value').greater(0).count()).to.become(2)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('equal', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['last']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').equal(2).count()).to.become(0),
        expect(reporting.where().last('value').equal(5).count()).to.become(1),
        expect(reporting.where().last('value').equal(50).count()).to.become(0)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['last']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').last('value').equal(50).count()).to.become(0),
        expect(reporting.where('custom').last('value').equal(2).count()).to.become(1),
        expect(reporting.where('custom').last('value').equal(5).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('between', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['last']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').between(0, 5).count()).to.become(1),
        expect(reporting.where().last('value').between(10, 50).count()).to.become(0)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metric with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['last']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom').last('value').between(10, 50).count()).to.become(0),
        expect(reporting.where('custom').last('value').between(0, 50).count()).to.become(2),
        expect(reporting.where('custom').last('value').between(1, 5).count()).to.become(2),
        expect(reporting.where('custom').last('value').between(1, 2).count()).to.become(1),
        expect(reporting.where('custom').last('value').between(4, 5).count()).to.become(1)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

describe('during', () => {
  it('should retrieve metrics as object', (done) => {
    reporting.addMetric('value', ['last']);
    reporting.enableRetainer('second', 'value', ['last']);
    const data = [{value: 50},{value: 2},{value: 5}];
    const start = new Date().getTime() - 1000;
    const end = new Date().getTime() + 1000;

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').during(start, end, 'second').values()).to.eventually.be.an('object')
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metrics as array', (done) => {
    reporting.addMetric('value', ['last']);
    reporting.enableRetainer('second', 'value', ['last']);
    const data = [{value: 50},{value: 2},{value: 5}];
    const start = new Date().getTime() - 1000;
    const end = new Date().getTime() + 1000;

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').during(start, end, 'second').valuesAsArray()).to.eventually.be.an('array')
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metrics with default filter', (done) => {
    reporting.addMetric('value', ['last']);
    reporting.enableRetainer('minute', 'value', ['last']);
    reporting.enableRetainer('second', 'value', ['last']);
    const data = [{value: 50},{value: 2},{value: 5}];
    const start = new Date().getTime() - 1000*60*60;
    const end = new Date().getTime() + 1000*60*60;
    const bucketsecond = reporting.getEmptyBuckets(start, end, 'second');
    bucketsecond[reporting.getRetainerBucketKey('second')] = 5;
    const bucketminute = reporting.getEmptyBuckets(start, end, 'minute');
    bucketminute[reporting.getRetainerBucketKey('minute')] = 5;

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().last('value').during(start, end, 'minute').values()).to.become(bucketminute),
        expect(reporting.where().last('value').during(start, end, 'second').values()).to.become(bucketsecond)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metrics with custom filter', (done) => {
    reporting.addFilter('custom', ['mode']);
    reporting.addMetric('value', ['last']);
    reporting.enableRetainer('minute', 'value', ['last']);
    reporting.enableRetainer('second', 'value', ['last']);
    const data = [{value: 50, mode: 1},{value: 2, mode: 2},{value: 5, mode: 1}];
    const start = new Date().getTime() - 1000*60*60;
    const end = new Date().getTime() + 1000*60*60;
    const bucketsecond1 = reporting.getEmptyBuckets(start, end, 'second');
    bucketsecond1[reporting.getRetainerBucketKey('second')] = 5;
    const bucketsecond2 = reporting.getEmptyBuckets(start, end, 'second');
    bucketsecond2[reporting.getRetainerBucketKey('second')] = 2;
    const bucketminute1 = reporting.getEmptyBuckets(start, end, 'minute');
    bucketminute1[reporting.getRetainerBucketKey('minute')] = 5;
    const bucketminute2 = reporting.getEmptyBuckets(start, end, 'minute');
    bucketminute2[reporting.getRetainerBucketKey('minute')] = 2;

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where('custom', { mode: 1 }).last('value').during(start, end, 'minute').values()).to.become(bucketminute1),
        expect(reporting.where('custom', { mode: 2 }).last('value').during(start, end, 'minute').values()).to.become(bucketminute2),
        expect(reporting.where('custom', { mode: 1 }).last('value').during(start, end, 'second').values()).to.become(bucketsecond1),
        expect(reporting.where('custom', { mode: 2 }).last('value').during(start, end, 'second').values()).to.become(bucketsecond2)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });

  it('should retrieve metrics across time gaps', (done) => {
    reporting.addMetric('value', ['last']);
    reporting.enableRetainer('second', 'value', ['last']);
    reporting.enableRetainer('minute', 'value', ['last']);
    const data1 = [{value: 50},{value: 2}];
    const data2 = [{value: 2},{value: 5}];
    const start = new Date().getTime() - 1000*60*60;
    const end = new Date().getTime() + 1000*60*60;
    const bucketsecond = reporting.getEmptyBuckets(start, end, 'second');
    bucketsecond[reporting.getRetainerBucketKey('second')] = 2;
    const bucketminute = reporting.getEmptyBuckets(start, end, 'minute');
    bucketminute[reporting.getRetainerBucketKey('minute')] = 5;

    reporting.saveMetrics(data1).then(() => {
      setTimeout(() => {
        bucketsecond[reporting.getRetainerBucketKey('second')] = 5;

        reporting.saveMetrics(data2).then(() => {
          expect(rsvp.all([
            expect(reporting.where().last('value').during(start, end, 'second').values()).to.become(bucketsecond),
            expect(reporting.where().last('value').during(start, end, 'minute').values()).to.become(bucketminute)
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
