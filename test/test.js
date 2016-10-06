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

    it('should initialize with no metrics', () => {
      const reporting = new helpers.FirebaseReporting({
        firebase: helpers.newFirebaseClient()
      });
      expect(Object.keys(reporting.metrics).length).to.equal(0);
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

      expect(Object.keys(reporting.metrics).length).to.equal(1);
      expect(reporting.metrics['name']).to.be.equal(metrics);
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

    describe('no metrics configured', () => {
      it('should store no metrics ', (done) => {
        const data = {a: 1};

        reporting.saveMetrics(data).then(() => {
          client.once('value').then((snap) => {
            expect(snap.val()).to.be.null;
            done();
          });
        });
    	});
    });

    describe('default filter', () => {
      it('should store metrics', (done) => {
        reporting.addMetric('value', ['min']);
        const data = {value: 1};

        reporting.saveMetrics(data).then(() => {
          client.child('default').child('default').child('value~~min').once('value').then((snap) => {
            expect(snap.val()).to.be.equal(1);
            done();
          }).catch((err) => {
            done(new Error(err));
          });
        });
    	});
    });
  });

  describe('evaluators', () => {
    ['min', 'max', 'first', 'last', 'sum', 'diff', 'multi', 'div'].forEach((e) => {
      describe(e, () => {
        require('./evaluators/' + e);
      });
    });
  });
});
