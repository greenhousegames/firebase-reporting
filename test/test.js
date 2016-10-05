var expect = require('chai').expect;
var FirebaseReporting = require('../dist/index.js');
var proxyquire = require('proxyquire');
var originalWebsocket = require('faye-websocket');

// Firebase has strict requirements about the hostname format. So we provide a dummy
// hostname and then change the URL to localhost inside the faye-websocket's Client
// constructor.
var firebase = proxyquire('firebase', {
  'faye-websocket': {
    Client: function (url) {
      url = url.replace(/dummy\d+\.firebaseio\.test/i, 'localhost');
      return new originalWebsocket.Client(url);
    },
    '@global': true
  }
});
var FirebaseServer = require('firebase-server');

describe('Firebase Reporting', () => {
  var PORT = 45000;
  var firebaseServer;
	var sequentialConnectionId = 0;
  var helpers = {
    newServerUrl: () => {
  		return 'ws://dummy' + (sequentialConnectionId++) + '.firebaseio.test:' + PORT;
  	},
    createClient: () => {
      return firebase.initializeApp({
        databaseURL: helpers.newServerUrl(),
        serviceAccount: {
          'private_key': 'fake',
          'client_email': 'fake'
        }
      }, 'test-firebase-client-' + sequentialConnectionId);
    },
    createServer: () => {
      return new FirebaseServer(PORT, 'localhost:' + PORT);
    }
  };

  beforeEach(() => {
    firebaseServer = helpers.createServer();
  });

  afterEach(function () {
    if (firebaseServer) {
      firebaseServer.close();
      firebaseServer = null;
    }
  });

  it('firebase should be configured for testing', function (done) {
    const client = helpers.createClient();
    const ref = client.database().ref();
		ref.once('value', function (snap) {
      expect(snap.val()).to.be.null;
			done();
		});
	});
});
