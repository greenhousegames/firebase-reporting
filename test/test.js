var rsvp = require('rsvp');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var helpers = require('./helpers');

describe('Firebase Reporting', () => {
  var firebaseServer;

  afterEach(() => {
    if (firebaseServer) {
      firebaseServer.close();
      firebaseServer = null;
    }
  });

  describe('Testing Setup', () => {
    it('client should connect to server', (done) => {
      firebaseServer = helpers.newFirebaseServer();
      const client = helpers.newFirebaseClient();
  		client.once('value').then((snap) => {
        expect(snap.val()).to.be.null;
  			done();
  		});
  	});

    it('client should read data from server', (done) => {
      firebaseServer = helpers.newFirebaseServer();
      const client = helpers.newFirebaseClient();
      client.set('hello').then(() => {
        client.once('value').then((snap) => {
          expect(snap.val()).to.equal('hello');
    			done();
    		});
      });
  	});

    it('client should read data from server written by other client', (done) => {
      firebaseServer = helpers.newFirebaseServer();
      const client1 = helpers.newFirebaseClient();
      const client2 = helpers.newFirebaseClient();
      client1.set('hello').then(() => {
        client2.once('value').then((snap) => {
          expect(snap.val()).to.equal('hello');
    			done();
    		});
      });
  	});
  });

  describe('Constructor', () => {
    it('should throw with no config', () => {
      const create = () => new helpers.FirebaseReporting();
      expect(create).to.throw('Must initialize with config');
  	});

    it('should throw with no config.firebase', () => {
      const create = () => new helpers.FirebaseReporting({});
      expect(create).to.throw('Must initialize with firebase reference');
  	});

    it('should initialize with firebase', () => {
      const create = () => new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(create).to.not.throw;
  	});

    it('should initialize with default separator', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(reporting.separator).to.equal('~~');
  	});

    it('should initialize with custom separator', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient(),
        separator: '``'
      });
      expect(reporting.separator).to.equal('``');
  	});

    it('should initialize with no filters', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(Object.keys(reporting.filters).length).to.equal(0);
  	});

    it('should initialize with no properties', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(Object.keys(reporting.properties).length).to.equal(0);
  	});

    it('should initialize with default retainers', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(Object.keys(reporting.retainers).length).to.equal(5);
      expect(reporting.retainers['second'].duration).to.be.equal(1000);
      expect(reporting.retainers['minute'].duration).to.be.equal(1000 * 60);
      expect(reporting.retainers['hour'].duration).to.be.equal(1000 * 60 * 60);
      expect(reporting.retainers['day'].duration).to.be.equal(1000 * 60 * 60 * 24);
      expect(reporting.retainers['week'].duration).to.be.equal(1000 * 60 * 60 * 24 * 7);
  	});

    it('should initialize with default evaluators', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });

      expect(Object.keys(reporting.evaluators).length).to.equal(8);
      expect(reporting.evaluators['min']).to.be.a('function');
      expect(reporting.evaluators['max']).to.be.a('function');
      expect(reporting.evaluators['first']).to.be.a('function');
      expect(reporting.evaluators['last']).to.be.a('function');
      expect(reporting.evaluators['sum']).to.be.a('function');
      expect(reporting.evaluators['diff']).to.be.a('function');
      expect(reporting.evaluators['multi']).to.be.a('function');
      expect(reporting.evaluators['div']).to.be.a('function');
  	});
  });

  describe('addEvaluator', () => {
    let reporting;

    beforeEach(() => {
      reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
    });

    it('should throw when name not provided', () => {
      expect(() => reporting.addEvaluator(''))
        .to.throw('evaluator name is required');
  	});

    it('should throw when function not provided', () => {
      expect(() => reporting.addEvaluator('name', 'name'))
        .to.throw('method must be a function which takes in 2 arguments and outputs the new metric value');
  	});

    it('should add to evalutor list', () => {
      const method = () => true;
      expect(() => reporting.addEvaluator('name', method)).to.not.throw();

      expect(Object.keys(reporting.evaluators).length).to.equal(9);
      expect(reporting.evaluators['name']).to.be.equal(method);
  	});
  });

  describe('addFilter', () => {
    let reporting;

    beforeEach(() => {
      reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
    });

    it('should throw when name not provided', () => {
      expect(() => reporting.addFilter(''))
        .to.throw('filter name is required');
  	});

    it('should throw when name is default', () => {
      expect(() => reporting.addFilter('default'))
        .to.throw('cannot override default filter');
  	});

    it('should throw when array not provided', () => {
      expect(() => reporting.addFilter('name', 'name'))
        .to.throw('props should be an array of property name which exist on the raw data being stored');
  	});

    it('should add to filter list', () => {
      const fitler = ['name'];
      expect(() => reporting.addFilter('name', fitler)).to.not.throw();

      expect(Object.keys(reporting.filters).length).to.equal(1);
      expect(reporting.filters['name']).to.be.equal(fitler);
  	});
  });

  describe('addMetric', () => {
    let reporting;

    beforeEach(() => {
      reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
    });

    it('should throw when name not provided', () => {
      expect(() => reporting.addMetric(''))
        .to.throw('property name is required');
  	});

    it('should throw when array not provided', () => {
      expect(() => reporting.addMetric('name', 'name'))
        .to.throw('metrics must be an array of evaluator names');
  	});

    it('should throw when array does not contain valid evaluators', () => {
      expect(() => reporting.addMetric('name', ['name']))
        .to.throw('metrics contains one or more invalid evaluators');
  	});

    it('should add to metrics list', () => {
      const metrics = ['sum'];
      expect(() => reporting.addMetric('name', metrics)).to.not.throw();

      expect(Object.keys(reporting.properties).length).to.equal(1);
      expect(reporting.properties['name'].metrics).to.deep.equal(['sum']);
  	});
  });

  describe('addRetainer', () => {
    let reporting;

    beforeEach(() => {
      reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
    });

    it('should throw when name not provided', () => {
      expect(() => reporting.addRetainer(''))
        .to.throw('retainer name is required');
  	});

    it('should throw when invalid duration', () => {
      expect(() => reporting.addRetainer('name', 'name'))
        .to.throw('duration is invalid');
  	});

    it('should add to retainer list', () => {
      const duration = 1000;
      expect(() => reporting.addRetainer('name', duration)).to.not.throw();

      expect(Object.keys(reporting.retainers).length).to.equal(6);
      expect(reporting.retainers['name'].duration).to.be.equal(duration);
  	});
  });

  describe('getRetainer', () => {
    let reporting;

    beforeEach(() => {
      reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
    });

    it('should throw when name not provided', () => {
      expect(() => reporting.getRetainer('')).to.throw;
  	});

    it('should retrieve existing retainer', () => {
      expect(reporting.getRetainer('second').duration).to.equal(1000);
      expect(reporting.getRetainer('minute').duration).to.equal(1000*60);
      expect(reporting.getRetainer('hour').duration).to.equal(1000*60*60);
  	});

    it('should retrieve multiple of retainer', () => {
      expect(reporting.getRetainer('30second').duration).to.equal(30000);
      expect(reporting.getRetainer('2minute').duration).to.equal(1000*60*2);
      expect(reporting.getRetainer('4hour').duration).to.equal(1000*60*60*4);
  	});
  });

  describe('enableRetainer', () => {
    let reporting;

    beforeEach(() => {
      reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
    });

    it('should throw when no retainer', () => {
      expect(() => reporting.enableRetainer()).to.throw;
  	});

    it('should throw when invalid retainer', () => {
      expect(() => reporting.enableRetainer('retainer')).to.throw;
  	});

    it('should throw when no property', () => {
      expect(() => reporting.enableRetainer('hour')).to.throw;
  	});

    it('should throw when invalid metrics', () => {
      expect(() => reporting.enableRetainer('hour', 'name', ['a'])).to.throw('metrics contains one or more invalid evaluators');
  	});

    it('should work with valid arguments', () => {
      expect(() => reporting.enableRetainer('hour', 'name', ['sum'])).to.not.throw;
  	});
  });

  describe('getMetricKey', () => {
    it('should work with default separator', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(reporting.getMetricKey('name1', 'name2')).to.equal('name1~~name2');
  	});

    it('should work with custom separator', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient(),
        separator: '``'
      });
      expect(reporting.getMetricKey('name2', 'name1')).to.equal('name2``name1');
  	});
  });

  describe('getFilterKey', () => {
    it('should work with no arguments', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(reporting.getFilterKey()).to.equal('default');
  	});

    it('should work with default argument', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(reporting.getFilterKey('default')).to.equal('default');
  	});

    it('should throw if invalid filter', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(() => reporting.getFilterKey('default2')).to.throw('Filter name does not exist');
  	});

    it('should work with valid filter', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      reporting.addFilter('name', ['value']);

      expect(reporting.getFilterKey('name', { value: 1 })).to.equal('value~~1~~');
      expect(reporting.getFilterKey('name', { value: '12345' })).to.equal('value~~12345~~');
  	});
  });

  describe('getRetainerBucketKey', () => {
    it('should throw if invalid retainer', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(() => reporting.getRetainerBucketKey()).to.throw;
  	});

    it('should work if valid retainer', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(reporting.getRetainerBucketKey('second')).to.be.equal(Math.floor(new Date().getTime() / 1000).toString());
      expect(reporting.getRetainerBucketKey('hour')).to.be.equal(Math.floor(new Date().getTime() / (1000 * 60 * 60)).toString());
  	});
  });

  describe('saveMetrics', () => {
    let reporting, client;

    beforeEach(() => {
      firebaseServer = helpers.newFirebaseServer();
      client = helpers.newFirebaseClient();
      reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
    });

    it('should store no metrics if no filters configured', (done) => {
      const data = {value: 1};

      reporting.saveMetrics(data).then(() => {
        client.once('value').then((snap) => {
          expect(snap.val()).to.be.null;
          done();
        });
      });
  	});

    it('should store no retained metrics if no retainers configured', (done) => {
      reporting.addMetric('value', ['min']);
      const data = {value: 1};

      reporting.saveMetrics(data).then(() => {
        client.once('value').then((snap) => {
          expect(snap.val()).to.not.be.null;
          done();
        });
      });
  	});

    it('should store metrics at correct path using default filter', (done) => {
      reporting.addMetric('value', ['min']);
      const data = {value: 1};

      reporting.saveMetrics(data).then(() => {
        client.child('default')
          .child('metrics')
          .child(reporting.getFilterKey())
          .child(reporting.getMetricKey('value', 'min'))
          .once('value')
          .then((snap) => {
          expect(snap.val()).to.be.equal(1);
          done();
        }).catch((err) => {
          done(new Error(err));
        });
      });
  	});

    it('should store retained metrics at correct path using default filter', (done) => {
      reporting.addMetric('value', ['min']);
      reporting.enableRetainer('hour', 'value', ['min'])
      const data = {value: 1};
      const bucket = reporting.getRetainerBucketKey('hour');

      reporting.saveMetrics(data).then(() => {
        client.child('default')
          .child('retainers')
          .child(reporting.getFilterKey())
          .child('hour')
          .child(bucket)
          .child(reporting.getMetricKey('value', 'min'))
          .once('value')
          .then((snap) => {
          expect(snap.val()).to.be.equal(1);
          done();
        }).catch((err) => {
          done(new Error(err));
        });
      });
  	});

    it('should store metrics at correct path using custom filter', (done) => {
      reporting.addFilter('custom', ['mode']);
      reporting.addMetric('value', ['min']);
      const data = [{value: 1, mode: 1}, {value: 2, mode: 2}];

      reporting.saveMetrics(data).then(() => {
        client.child('custom')
          .child('metrics')
          .child(reporting.getFilterKey('custom', { mode: 1 }))
          .child(reporting.getMetricKey('value', 'min'))
          .once('value')
          .then((snap) => {
          expect(snap.val()).to.be.equal(1);
          done();
        }).catch((err) => {
          done(new Error(err));
        });
      });
  	});

    it('should store retained metrics at correct path using custom filter', (done) => {
      reporting.addFilter('custom', ['mode']);
      reporting.addMetric('value', ['min']);
      reporting.enableRetainer('minute', 'value', ['min'])
      const data = [{value: 1, mode: 1}, {value: 2, mode: 2}];
      const bucket = reporting.getRetainerBucketKey('minute');

      reporting.saveMetrics(data).then(() => {
        client.child('custom')
          .child('retainers')
          .child(reporting.getFilterKey('custom', { mode: 1 }))
          .child('minute')
          .child(bucket)
          .child(reporting.getMetricKey('value', 'min'))
          .once('value')
          .then((snap) => {
          expect(snap.val()).to.be.equal(1);
          done();
        }).catch((err) => {
          done(new Error(err));
        });
      });
  	});
  });

  describe('where.xxx.during', () => {
    let reporting;

    beforeEach(() => {
      firebaseServer = helpers.newFirebaseServer();
      reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
    });

    it('should retrieve metrics as object', (done) => {
      reporting.addMetric('value', ['sum']);
      reporting.enableRetainer('second', 'value', ['sum']);
      const data = [{value: 50},{value: 2},{value: 5}];
      const start = new Date().getTime() - 1000;
      const end = new Date().getTime() + 1000;

      reporting.saveMetrics(data).then(() => {
        expect(rsvp.all([
          expect(reporting.where().sum('value').during('second').valuesAsObject()).to.eventually.be.an('object')
        ])).notify(done);
      }).catch((err) => {
        done(new Error(err));
      });
    });

    it('should retrieve metrics as array', (done) => {
      reporting.addMetric('value', ['sum']);
      reporting.enableRetainer('second', 'value', ['sum']);
      const data = [{value: 50},{value: 2},{value: 5}];
      const start = new Date().getTime() - 1000;
      const end = new Date().getTime() + 1000;

      reporting.saveMetrics(data).then(() => {
        expect(rsvp.all([
          expect(reporting.where().sum('value').during('second').values()).to.eventually.be.an('array')
        ])).notify(done);
      }).catch((err) => {
        done(new Error(err));
      });
    });
  });

  ['min', 'max', 'first', 'last', 'sum', 'diff', 'multi', 'div'].forEach((x) => {
    describe('where.' + x, () => {
      require('./evaluators/' + x);
    });
  });
});
