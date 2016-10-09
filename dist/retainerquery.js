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
    value: function setRetainer(type) {
      this.retainer = type;
    }
  }, {
    key: 'range',
    value: function range(start, end) {
      this.retainerStart = start;
      this.retainerEnd = end;
      return this;
    }
  }, {
    key: 'valuesAsObject',
    value: function valuesAsObject(fill) {
      var _this = this;

      var promise = new _rsvp2.default.Promise(function (resolve, reject) {
        var query = _this.filterRef.child('retainers').child(_this.filterKey).child(_this.retainer).orderByKey();
        if (_this.retainerStart) {
          var startBucket = _this.reporting.getRetainerBucketKey(_this.retainer, _this.retainerStart);
          query = query.startAt(startBucket);
        }
        if (_this.retainerEnd) {
          var endBucket = _this.reporting.getRetainerBucketKey(_this.retainer, _this.retainerEnd);
          query = query.endAt(endBucket);
        }
        query.once('value').then(function (snapshot) {
          var buckets = {};
          if (fill && _this.retainerStart && _this.retainerEnd) {
            buckets = _this.reporting.getEmptyBuckets(_this.retainer, _this.retainerStart, _this.retainerEnd);
          }
          snapshot.forEach(function (snap) {
            var val = snap.child(_this.metricKey).val();
            if (typeof val !== 'undefined') {
              buckets[snap.key] = val;
            }
          });
          resolve(buckets);
        }).catch(reject);
      });
      return promise;
    }
  }, {
    key: 'values',
    value: function values(fill) {
      var _this2 = this;

      var promise = new _rsvp2.default.Promise(function (resolve, reject) {
        _this2.valuesAsObject(fill).then(function (values) {
          var keys = Object.keys(values).sort();
          var data = [];
          var duration = _this2.reporting.getRetainer(_this2.retainer).duration;
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