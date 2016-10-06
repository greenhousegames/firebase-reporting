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

describe('count', () => {
  it('should retrieve metric with default filter', (done) => {
    reporting.addMetric('value', ['multi']);
    const data = [{value: 50},{value: 2},{value: 5}];

    reporting.saveMetrics(data).then(() => {
      expect(rsvp.all([
        expect(reporting.where().multi('value').count()).to.become(1)
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
        expect(reporting.where('custom').multi('value').count()).to.become(3)
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
        expect(reporting.where().multi('value').lesser(500)).to.become(1),
        expect(reporting.where().multi('value').lesser(50)).to.become(0),
        expect(reporting.where().multi('value').lesser(1)).to.become(0)
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
        expect(reporting.where('custom').multi('value').lesser(500)).to.become(2),
        expect(reporting.where('custom').multi('value').lesser(50)).to.become(1),
        expect(reporting.where('custom').multi('value').lesser(2)).to.become(1)
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
        expect(reporting.where().multi('value').greater(2)).to.become(1),
        expect(reporting.where().multi('value').greater(50)).to.become(1),
        expect(reporting.where().multi('value').greater(500)).to.become(1),
        expect(reporting.where().multi('value').greater(501)).to.become(0)
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
        expect(reporting.where('custom').multi('value').greater(500)).to.become(0),
        expect(reporting.where('custom').multi('value').greater(0)).to.become(2),
        expect(reporting.where('custom').multi('value').greater(5)).to.become(1)
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
        expect(reporting.where().multi('value').equal(2)).to.become(0),
        expect(reporting.where().multi('value').equal(5)).to.become(0),
        expect(reporting.where().multi('value').equal(50)).to.become(0),
        expect(reporting.where().multi('value').equal(500)).to.become(1)
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
        expect(reporting.where('custom').multi('value').equal(500)).to.become(0),
        expect(reporting.where('custom').multi('value').equal(250)).to.become(1),
        expect(reporting.where('custom').multi('value').equal(2)).to.become(1),
        expect(reporting.where('custom').multi('value').equal(5)).to.become(0)
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
        expect(reporting.where().multi('value').between(0, 5)).to.become(0),
        expect(reporting.where().multi('value').between(10, 50)).to.become(0),
        expect(reporting.where().multi('value').between(100, 500)).to.become(1)
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
        expect(reporting.where('custom').multi('value').between(10, 50)).to.become(0),
        expect(reporting.where('custom').multi('value').between(0, 50)).to.become(1),
        expect(reporting.where('custom').multi('value').between(1, 5)).to.become(1),
        expect(reporting.where('custom').multi('value').between(1, 2)).to.become(1),
        expect(reporting.where('custom').multi('value').between(1, 250)).to.become(2),
        expect(reporting.where('custom').multi('value').between(400, 500)).to.become(0)
      ])).notify(done);
    }).catch((err) => {
      done(new Error(err));
    });
  });
});
