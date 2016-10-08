'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rsvp = require('rsvp');

var _rsvp2 = _interopRequireDefault(_rsvp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RetainerQuery = function () {
  function RetainerQuery(reporting) {
    _classCallCheck(this, RetainerQuery);

    this.reporting = reporting;
    this.filterRef = null;
    this.filterChildRef = null;
    this.metricKey = null;
    this.filterKey = null;
    this.retainer = null;
    this.retainerStart = null;
    this.retainerEnd = null;
  }

  _createClass(RetainerQuery, [{
    key: 'setRetainer',
    value: function setRetainer(type, start, end) {
      this.retainer = type;
      this.retainerStart = start;
      this.retainerEnd = end;
    }
  }, {
    key: 'values',
    value: function values() {
      var _this = this;

      var promise = new _rsvp2.default.Promise(function (resolve, reject) {
        var startBucket = _this.reporting.getRetainerBucketKey(_this.retainer, _this.retainerStart);
        var endBucket = _this.reporting.getRetainerBucketKey(_this.retainer, _this.retainerEnd);
        var query = _this.filterRef.child('retainers').child(_this.filterKey).child(_this.retainer).orderByKey().startAt(startBucket).endAt(endBucket);
        query.once('value').then(function (snapshot) {
          var buckets = {};
          snapshot.forEach(function (snap) {
            var val = snap.child(_this.metricKey).val();
            if (typeof val !== 'undefined') {
              buckets[snap.key] = val;
            }
          });

          // fill buckets
          var currBucket = startBucket;
          while (currBucket <= endBucket) {
            if (!buckets[currBucket]) {
              buckets[currBucket] = 0;
            }
            currBucket++;
          }
          resolve(buckets);
        }).catch(reject);
      });
      return promise;
    }
  }, {
    key: 'valuesAsArray',
    value: function valuesAsArray() {
      var _this2 = this;

      var promise = new _rsvp2.default.Promise(function (resolve, reject) {
        _this2.values().then(function (values) {
          var keys = Object.keys(values).sort();
          var data = [];
          var duration = _this2.reporting.retainers[_this2.retainer].duration;
          keys.forEach(function (key) {
            data.push({
              bucket: key,
              timestamp: +key * duration,
              value: values[key]
            });
          });
          resolve(data);
        }).catch(reject);
      });
      return promise;
    }
  }]);

  return RetainerQuery;
}();

module.exports = RetainerQuery;