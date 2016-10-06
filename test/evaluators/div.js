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

it('should store correct metric for single data point', (done) => {
  reporting.addMetric('value', ['div']);

  reporting.saveMetrics({value: 50}).then(() => {
    client.child('default').child('default').child('value~~div').once('value').then((snap) => {
      expect(snap.val()).to.be.equal(50);
      done();
    }).catch((err) => {
      done(new Error(err));
    });
  });
});

it('should store correct metric for multiple data points', (done) => {
  reporting.addMetric('value', ['div']);
  const data = [{value: 50}, {value: 2}, {value: 5}];
  let total = 0;
  const innerDone = () => {
    total++;
    if (total >= data.length) {
      client.child('default').child('default').child('value~~div').once('value').then((snap) => {
        expect(snap.val()).to.be.equal(5);
        done();
      }).catch((err) => {
        done(new Error(err));
      });
    }
  };

  data.forEach((d) => reporting.saveMetrics(d).finally(innerDone));
});
