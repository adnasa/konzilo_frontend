(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  angular.module("kntnt.clipboard", []).factory("ClipboardStorage", [
    "ArticleStorage", "UserState", "$q", function(ArticleStorage, UserState, $q) {
      var info;
      info = UserState.getInfo();
      return {
        query: function(options) {
          if (options == null) {
            options = {};
          }
          return this.get(options);
        },
        add: function(id) {
          var _this = this;
          if (!_.isString(id)) {
            id = id._id;
          }
          return info.getSetting('clipboard', function(ids) {
            if (__indexOf.call(ids, id) < 0) {
              ids.push(id);
            }
            return _this.save(ids);
          }, function() {
            return _this.save([id]);
          });
        },
        save: function(ids) {
          var _this = this;
          return info.saveSetting('clipboard', ids, function() {
            var callback, _i, _len, _ref, _results;
            if (_this.changedCallbacks) {
              _ref = _this.changedCallbacks;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                callback = _ref[_i];
                _results.push(callback(ids));
              }
              return _results;
            }
          });
        },
        getIds: function() {
          var deferred,
            _this = this;
          deferred = $q.defer();
          info.getSetting('clipboard', function(ids) {
            return deferred.resolve(ids);
          }, function(err) {
            return deferred.resolve([]);
          });
          return deferred.promise;
        },
        get: function(options) {
          var deferred;
          if (options == null) {
            options = {};
          }
          deferred = $q.defer();
          info.getSetting('clipboard', function(ids) {
            options = _.defaults(options, {
              q: {
                _id: {
                  $in: ids
                }
              }
            });
            return ArticleStorage.query(options).then(function(result) {
              return deferred.resolve(result);
            }, function(err) {
              return deferred.resolve([]);
            });
          }, function(err) {
            return deferred.resolve([]);
          });
          return deferred.promise;
        },
        remove: function(id) {
          var deferred,
            _this = this;
          if (!_.isString(id)) {
            id = id._id;
          }
          deferred = $q.defer();
          info.getSetting('clipboard', function(ids) {
            ids = _.without(ids, id);
            return info.saveSetting('clipboard', ids, function() {
              var callback, _i, _len, _ref;
              if (_this.changedCallbacks) {
                _ref = _this.changedCallbacks;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  callback = _ref[_i];
                  callback(ids);
                }
              }
              return deferred.resolve(ids);
            }, function(err) {
              return deferred.resolve([]);
            });
          });
          return deferred.promise;
        },
        truncate: function() {
          var deferred,
            _this = this;
          deferred = $q.defer();
          info.deleteSetting('clipboard', function(result) {
            var callback, _i, _len, _ref;
            if (_this.changedCallbacks) {
              _ref = _this.changedCallbacks;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                callback = _ref[_i];
                callback(result);
              }
            }
            return deferred.resolve(result);
          }, function(err) {
            return deferred.resolve([]);
          });
          return deferred.promise;
        },
        changed: function(callback) {
          this.changedCallbacks = this.changedCallbacks || [];
          return this.changedCallbacks.push(callback);
        }
      };
    }
  ]);

}).call(this);
