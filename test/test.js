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

  function newFirebaseClient() {
		var name = 'test-firebase-client-' + sequentialConnectionId;
		var url = 'ws://dummy' + (sequentialConnectionId++) + '.firebaseio.test:' + PORT;
		var config = {
			databaseURL: url
		};
		var app = firebase.initializeApp(config, name);
		return app.database().ref();
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
  });
});
