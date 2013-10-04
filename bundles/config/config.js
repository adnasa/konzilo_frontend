(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  angular.module("konzilo.config", []).provider("defaultConfig", function() {
    var _this = this;
    this.defaults = {};
    return {
      setDefaults: function(bin, name, value) {
        if (!_this.defaults[bin]) {
          _this.defaults[bin] = {};
        }
        if (typeof name === "string") {
          if (!_this.defaults[bin][name]) {
            _this.defaults[bin][name] = {};
          }
          return _this.defaults[bin][value] = value;
        } else {
          return _this.defaults[bin] = name;
        }
      },
      getDefaults: function(bin) {
        return _this.defaults[bin];
      },
      $get: function() {
        return function(bin, name) {
          if (!name) {
            return _this.defaults[bin];
          }
          return _this.defaults[bin][name];
        };
      }
    };
  }).factory("KonziloConfig", [
    "KonziloConfigDefaultStorage", "defaultConfig", "$q", function(KonziloConfigDefaultStorage, defaultConfig, $q) {
      var KonziloConfig,
        _this = this;
      this.defaultStorage = KonziloConfigDefaultStorage;
      this.bins = {};
      KonziloConfig = (function() {
        function KonziloConfig(storage) {
          this.storage = storage;
          this.config = {};
        }

        KonziloConfig.prototype.get = function(name, value) {
          var _this = this;
          if (value == null) {
            value = void 0;
          }
          if (this.config[name]) {
            return $q.when(this.config[name]);
          }
          return this.storage.read(name).then(function(result) {
            _this.config[name] = result;
            return _.clone(_this.config[name]);
          });
        };

        KonziloConfig.prototype.set = function(name, value) {
          if (!this.config[name] || !_.isEqual(this.config[name], value)) {
            this.config[name] = _.cloneDeep(value);
          }
          return this.storage.write(name, value);
        };

        KonziloConfig.prototype.remove = function(name) {
          var _this = this;
          return this.get(name).then(function(value) {
            delete _this.config[name];
            return _this.storage.remove(name);
          });
        };

        KonziloConfig.prototype.listAll = function() {
          return this.storage.listAll();
        };

        KonziloConfig.prototype.removeAll = function() {
          return this.storage.removeAll();
        };

        return KonziloConfig;

      })();
      return {
        setDefaultStorage: function(storage) {
          return this.defaultStorage = storage;
        },
        get: function(name, storage) {
          var defaults, instance, value;
          if (storage == null) {
            storage = null;
          }
          if (_this.bins[name]) {
            return _this.bins[name];
          } else {
            if (!storage) {
              storage = new _this.defaultStorage(name);
            }
            instance = new KonziloConfig(storage);
            defaults = defaultConfig(name);
            for (name in defaults) {
              value = defaults[name];
              if (defaults) {
                instance.set(name, value);
              }
            }
            _this.bins[name] = instance;
            return instance;
          }
        },
        createBin: function() {
          return this.get(name, storage);
        }
      };
    }
  ]).factory("KonziloConfigDefaultStorage", [
    "$http", "$q", "$cacheFactory", function($http, $q, $cacheFactory) {
      var KonziloConfigDefaultStorage;
      return KonziloConfigDefaultStorage = (function() {
        function KonziloConfigDefaultStorage(bin) {
          this.bin = bin;
          this.removeAll = __bind(this.removeAll, this);
          this.listAll = __bind(this.listAll, this);
          this.remove = __bind(this.remove, this);
          this.write = __bind(this.write, this);
          this.read = __bind(this.read, this);
          this.exists = __bind(this.exists, this);
          this.cache = $cacheFactory("config_" + this.bin);
        }

        KonziloConfigDefaultStorage.prototype.exists = function(name) {
          return this.storage.exists(name);
        };

        KonziloConfigDefaultStorage.prototype.read = function(name, callback, errorCallback) {
          return $http.get("/config/" + this.bin + "/" + name, {
            cache: true
          }).then(function(result) {
            if (callback) {
              callback(result.data.data);
            }
            return result.data.data;
          }, function(error) {
            if (error) {
              errorCallback(error);
            }
            return error;
          });
        };

        KonziloConfigDefaultStorage.prototype.write = function(name, data, callback, errorCallback) {
          var obj;
          this.cache.removeAll();
          obj = {
            name: name,
            data: data
          };
          return $http.put("/config/" + this.bin + "/" + name, obj).then(function(result) {
            if (callback) {
              callback(result.data);
            }
            return result.data;
          }, function(error) {
            if (errorCallback) {
              errorCallback(error);
            }
            return error;
          });
        };

        KonziloConfigDefaultStorage.prototype.remove = function(name) {
          this.cache.removeAll();
          return $http["delete"]("config/" + this.bin + "/" + name).then(function(result) {
            return result.data;
          });
        };

        KonziloConfigDefaultStorage.prototype.listAll = function(callback, errorCallback) {
          var deferred;
          deferred = $q.defer();
          return $http.get("config/" + this.bin, {
            cache: this.cache
          }).then(function(result) {
            var item, items, _i, _len, _ref;
            items = {};
            _ref = result.data;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              item = _ref[_i];
              items[item.name] = item.data;
            }
            if (callback) {
              callback(items);
            }
            return items;
          }, function(error) {
            if (errorCallback) {
              errorCallback(error);
            }
            return error;
          });
        };

        KonziloConfigDefaultStorage.prototype.removeAll = function() {
          return this.storage.truncate();
        };

        return KonziloConfigDefaultStorage;

      })();
    }
  ]);

}).call(this);
