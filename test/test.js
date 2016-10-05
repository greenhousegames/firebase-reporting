var PORT = 45000;
var originalWebsocket = require('faye-websocket');
var expect = require('chai').expect;
var proxyquire = require('proxyquire');

// Firebase has strict requirements about the hostname format. So we provide a dummy
// hostname and then change the URL to localhost inside the faye-websocket's Client
// constructor.
var firebase = proxyquire('firebase', {
  'faye-websocket': {
    Client: (url) => {
      url = url.replace(/dummy\d+\.firebaseio\.test/i, 'localhost');
      return new originalWebsocket.Client(url);
    },
    '@global': true
  }
});
var FirebaseServer = require('firebase-server');
var FirebaseReporting = require('../dist');

describe('Firebase Reporting', () => {
  var firebaseServer;
	var sequentialConnectionId = 0;
  var helpers = {
    newServerUrl: () => {
  		return 'ws://dummy' + (sequentialConnectionId++) + '.firebaseio.test:' + PORT;
  	},
    createServer: () => {
      return new FirebaseServer(PORT, 'localhost:' + PORT);
    }
  };

  beforeEach(() => {
  });

  afterEach(() => {
    if (firebaseServer) {
      firebaseServer.close();
      firebaseServer = null;
    }
  });

  function newFirebaseApp() {
		var name = 'test-firebase-client-' + sequentialConnectionId;
		var url = 'ws://dummy' + (sequentialConnectionId++) + '.firebaseio.test:' + PORT;
		var config = {
			databaseURL: url
		};
		return firebase.initializeApp(config, name);
	}

  function newFirebaseClient() {
		return newFirebaseApp().database().ref();
	}

  function newFirebaseServer(data) {
    return new FirebaseServer(PORT, 'localhost:' + PORT, data);
  }

  describe('Testing Setup', () => {
    it('client should connect to server', (done) => {
      firebaseServer = newFirebaseServer();
      const client = newFirebaseClient();
  		client.once('value').then((snap) => {
        expect(snap.val()).to.be.null;
  			done();
  		});
  	});

    it('client should read data from server', (done) => {
      firebaseServer = newFirebaseServer();
      const client = newFirebaseClient();
      client.set('hello').then(() => {
        client.once('value').then((snap) => {
          expect(snap.val()).to.equal('hello');
    			done();
    		});
      });
  	});

    it('client should read data from server written by other client', (done) => {
      firebaseServer = newFirebaseServer();
      const client1 = newFirebaseClient();
      const client2 = newFirebaseClient();
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
      const create = () => new FirebaseReporting();
      expect(create).to.throw('Must initialize with config');
  	});

    it('should throw with no config.firebase', () => {
      const create = () => new FirebaseReporting({});
      expect(create).to.throw('Must initialize with firebase application');
  	});

    it('should initialize with firebase', () => {
      const create = () => new FirebaseReporting({
        firebase: newFirebaseApp()
      });
      expect(create).to.not.throw;
  	});

    it('should initialize with default paths', () => {
      const reporting = new FirebaseReporting({
        firebase: newFirebaseApp()
      });
      expect(reporting.paths.data).to.equal('data');
      expect(reporting.paths.reporting).to.equal('reporting');
  	});

    it('should initialize with custom paths', () => {
      const reporting = new FirebaseReporting({
        firebase: newFirebaseApp(),
        dataPath: 'dataPath',
        reportingPath: 'reportingPath'
      });
      expect(reporting.paths.data).to.equal('dataPath');
      expect(reporting.paths.reporting).to.equal('reportingPath');
  	});

    it('should initialize with default filters', () => {
      const reporting = new FirebaseReporting({
        firebase: newFirebaseApp()
      });
      expect(reporting.filters).to.deep.equal([]);
  	});

    it('should initialize with custom filters', () => {
      const reporting = new FirebaseReporting({
        firebase: newFirebaseApp(),
        filters: [['uid']]
      });
      expect(reporting.filters.length).to.equal(1);
      expect(reporting.filters[0]).to.deep.equal(['uid']);
  	});

    it('should initialize with default evaluators', () => {
      const reporting = new FirebaseReporting({
        firebase: newFirebaseApp()
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
});
