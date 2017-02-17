'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CountQuery = function () {
  function CountQuery() {
    _classCallCheck(this, CountQuery);

    this.filterRef = null;
    this.filterChildRef = null;
    this.metricKey = null;
    this.filterKey = null;
    this.comparision = null;
    this.comparisionValue1 = null;
    this.comparisionValue2 = null;
  }

  _createClass(CountQuery, [{
    key: 'setComparision',
    value: function setComparision(type, value, value2) {
      this.comparision = type;
      this.comparisionValue1 = value;
      this.comparisionValue2 = value2;
    }
  }, {
    key: 'count',
    value: function count() {
      var _this = this;

      var promise = new Promise(function (resolve, reject) {
        var query = _this.filterRef.child('metrics').orderByChild(_this.metricKey);
        switch (_this.comparision) {
          case 'lesser':
            query = query.endAt(_this.comparisionValue1);
            break;
          case 'greater':
            query = query.startAt(_this.comparisionValue1);
            break;
          case 'between':
            query = query.startAt(_this.comparisionValue1).endAt(_this.comparisionValue2);
            break;
        }
        query.once('value').then(function (snapshot) {
          resolve(snapshot.numChildren());
        }).catch(reject);
      });
      return promise;
    }
  }]);

  return CountQuery;
}();

module.exports = CountQuery;