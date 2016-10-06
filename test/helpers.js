var originalWebsocket = require('faye-websocket');
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
var FirebaseReporting = require('../src');

const mod = {
  port: 45000,
  sequentialConnectionId: 0,
  firebase: firebase,
  newFirebaseApp: () => {
		var name = 'test-firebase-client-' + mod.sequentialConnectionId;
		var url = 'ws://dummy' + (mod.sequentialConnectionId++) + '.firebaseio.test:' + mod.port;
		var config = {
			databaseURL: url
		};
		return mod.firebase.initializeApp(config, name);
	},
  newFirebaseClient: () => {
		return mod.newFirebaseApp().database().ref();
	},
  newFirebaseServer: (data) => {
    return new FirebaseServer(mod.port, 'localhost:' + mod.port, data);
  },
  FirebaseReporting: FirebaseReporting
}

module.exports = mod;
