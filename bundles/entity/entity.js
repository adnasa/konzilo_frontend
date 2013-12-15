(function() {
  angular.module("konzilo.entity", ["ngResource"]).provider("entityInfo", function() {
    var _this = this;
    this.entities = {};
    return {
      addProvider: function(name, info) {
        return _this.entities[name] = info;
      },
      $get: function() {
        return function(name) {
          return _this.entities[name];
        };
      }
    };
  }).factory("processDate", function() {
    return function(value) {
      return new Date(value);
    };
  }).factory("entityStorage", [
    "entityInfo", "$injector", function(entityInfo, $injector) {
      return function(name) {
        var controllerName, _ref;
        controllerName = (_ref = entityInfo(name)) != null ? _ref.storageController : void 0;
        if (controllerName) {
          return $injector.get(controllerName);
        }
      };
    }
  ]).factory("KonziloEntity", [
    "entityInfo", "$injector", "$controller", "$compile", "loadTemplate", function(entityInfo, $injector, $controller, $compile, loadTemplate) {
      var KonziloEntity;
      return KonziloEntity = (function() {
        function KonziloEntity(name, data) {
          var info, processor, prop, _ref;
          this.name = name;
          this.data = data;
          this.info = entityInfo(this.name);
          this.storage = $injector.get(this.info.storageController);
          this.data = data;
          _ref = this.info.properties;
          for (prop in _ref) {
            info = _ref[prop];
            if (!(info.processor && (info.processEmpty || this.data[prop]))) {
              continue;
            }
            if (!_.isFunction(info.processor)) {
              processor = $injector.get(info.processor);
            } else {
              processor = info.processor;
            }
            if (processor) {
              this.data[prop] = processor(this.data[prop], this);
            }
          }
          this.dirty = false;
        }

        KonziloEntity.prototype.save = function(callback, errorCallback) {
          return this.storage.save(this, callback, errorCallback);
        };

        KonziloEntity.prototype.remove = function(callback, errorCallback) {
          return this.storage.remove(this, callback, errorCallback);
        };

        KonziloEntity.prototype.toObject = function() {
          return this.data;
        };

        KonziloEntity.prototype.setData = function(data) {
          this.data = data;
        };

        KonziloEntity.prototype.get = function(name) {
          return this.data[name];
        };

        KonziloEntity.prototype.uri = function() {
          var _ref, _ref1;
          return (_ref = this.data.links) != null ? (_ref1 = _ref.self) != null ? _ref1.href : void 0 : void 0;
        };

        KonziloEntity.prototype.set = function(name, data) {
          var prop, value;
          if (_.isPlainObject(_.clone(name))) {
            for (prop in name) {
              value = name[prop];
              this.data[prop] = value;
            }
          } else {
            this.data[name] = data;
          }
          this.dirty = true;
          return this;
        };

        KonziloEntity.prototype.id = function() {
          return this.data[this.info.idProperty];
        };

        KonziloEntity.prototype.idProperty = function() {
          return this.info.idProperty;
        };

        KonziloEntity.prototype.label = function() {
          return this.data[this.info.labelProperty];
        };

        KonziloEntity.prototype.labelProperty = function() {
          return this.info.labelProperty;
        };

        KonziloEntity.prototype.view = function(options) {
          var mode;
          if (options.mode) {
            mode = this.info.viewModes[options.mode];
          } else if (this.info.defaultViewMode) {
            mode = this.info.viewModes[this.info.defaultViewMode];
          } else {
            mode = _.first(_.toArray(this.info.viewModes));
          }
          if (mode) {
            return loadTemplate(mode).then(function(template) {
              options.element.html(template);
              if (mode.controller) {
                $controller(mode.controller, {
                  $scope: options.scope,
                  entity: options.entity
                });
              }
              return $compile(options.element.contents())(options.scope);
            });
          }
        };

        return KonziloEntity;

      })();
    }
  ]).factory("KonziloCollection", [
    "entityInfo", "entityStorage", "KonziloEntity", function(entityInfo, entityStorage, KonziloEntity) {
      var KonziloCollection;
      return KonziloCollection = (function() {
        function KonziloCollection(name, result, query, entityClass) {
          var data, item;
          this.name = name;
          this.query = query != null ? query : null;
          this.entityClass = entityClass != null ? entityClass : KonziloEntity;
          this.count = 0;
          this.limit = 0;
          this.storage = entityStorage(this.name);
          name = this.name.toLowerCase();
          if (_.isPlainObject(result) && result._embedded[name]) {
            data = result._embedded[name];
            this.count = result.count;
            this.skip = result.skip;
            this.limit = result.limit;
          } else {
            data = result;
          }
          this.data = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = data.length; _i < _len; _i++) {
              item = data[_i];
              if (!item.toObject) {
                _results.push(new this.entityClass(this.name, item));
              } else {
                _results.push(item);
              }
            }
            return _results;
          }).call(this);
        }

        KonziloCollection.prototype.toArray = function() {
          var item, _i, _len, _ref, _results;
          _ref = this.data;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            _results.push(item.toObject());
          }
          return _results;
        };

        KonziloCollection.prototype.add = function(item) {
          if (!item.toObject) {
            item = new this.entityClass(this.name, item);
          }
          return this.data.push(item);
        };

        KonziloCollection.prototype.get = function(item) {
          if (!_.isPlainObject(item) && !item.toObject) {
            return _.find(this.data, function(value) {
              return value.id() === item;
            });
          }
          if (!item.toObject) {
            item = new this.entityClass(this.name, this.data);
          }
          return _.find(this.data, function(value) {
            return value.id() === item.id();
          });
        };

        KonziloCollection.prototype.hasItem = function(item) {
          if (this.get(item)) {
            return true;
          } else {
            return false;
          }
        };

        KonziloCollection.prototype.getPage = function(page) {
          var query;
          query = _.clone(this.query);
          query.skip = this.limit * page;
          return this.storage.query(query);
        };

        KonziloCollection.prototype.page = function() {
          return this.skip / this.limit;
        };

        KonziloCollection.prototype.next = function() {};

        KonziloCollection.prototype.pages = function() {
          if (this.limit > this.count) {
            return 0;
          }
          return (this.count - (this.count % this.limit)) / this.limit;
        };

        return KonziloCollection;

      })();
    }
  ]).factory("KonziloStorage", [
    "$resource", "KonziloEntity", "KonziloCollection", "entityInfo", "$q", "$http", "$cacheFactory", function($resource, KonziloEntity, KonziloCollection, entityInfo, $q, $http, $cacheFactory) {
      var KonziloStorage;
      return KonziloStorage = (function() {
        function KonziloStorage(url, name, paramDefaults, entityClass) {
          var actions, info, params;
          this.url = url;
          this.name = name;
          if (paramDefaults == null) {
            paramDefaults = {};
          }
          this.entityClass = entityClass != null ? entityClass : KonziloEntity;
          info = entityInfo(this.name);
          params = {};
          params[info.idProperty] = "@" + info.idProperty;
          actions = {
            update: {
              method: "PUT",
              params: params
            }
          };
          this.info = info;
          this.cache = $cacheFactory("" + this.url + ":" + name);
          this.indexUrl = this.url.split("/:")[0];
          this.resource = $resource(this.url, paramDefaults, actions);
          this.eventCallbacks = {};
        }

        KonziloStorage.prototype.save = function(item, callback, errorCallback) {
          var deferred,
            _this = this;
          this.cache.removeAll();
          deferred = $q.defer();
          if (!item.toObject) {
            item = new KonziloEntity(this.name, item);
          }
          this.triggerEvent("preSave", item).then(function(item) {
            var data, method;
            data = item.toObject();
            if (data._id) {
              method = _this.resource.update;
            } else {
              method = _this.resource.save;
            }
            return method.bind(_this.resource)(data, function(result) {
              var newItem;
              if (item.setData) {
                item.setData(result);
                newItem = item;
              } else {
                newItem = new KonziloEntity(_this.name, result);
              }
              _this.triggerEvent("itemSaved", newItem);
              _this.triggerEvent("changed", newItem);
              if (callback) {
                callback(result);
              }
              return deferred.resolve(result);
            }, function(result) {
              if (errorCallback) {
                errorCallback(result);
              }
              return deferred.reject(result);
            });
          });
          return deferred.promise;
        };

        KonziloStorage.prototype.remove = function(item, callback, errorCallback) {
          var deferred, query,
            _this = this;
          this.cache.removeAll();
          deferred = $q.defer();
          query = {};
          if (_.isPlainObject(item)) {
            item = new KonziloEntity(this.name, item);
          }
          if (_.isString(item)) {
            query[this.info.idProperty] = item;
          } else {
            query[item.idProperty()] = item.id();
          }
          this.resource["delete"](query, function(result) {
            if (result) {
              _this.triggerEvent("itemRemoved", item);
            }
            _this.triggerEvent("changed", item);
            if (callback) {
              callback(result);
            }
            return deferred.resolve(result);
          }, function(result) {
            if (errorCallback) {
              errorCallback(result);
            }
            return deferred.reject(result);
          });
          return deferred.promise;
        };

        KonziloStorage.prototype.get = function(item, callback, errorCallback) {
          var _this = this;
          if (_.isPlainObject(item)) {
            item = item._id;
          }
          return $http.get("" + this.indexUrl + "/" + item, {
            cache: this.cache
          }).then(function(result) {
            var entity;
            entity = new _this.entityClass(_this.name, result.data);
            if (callback) {
              callback(entity);
            }
            return entity;
          });
        };

        KonziloStorage.prototype.sorted = function(order, callback, errorCallback) {
          var _this = this;
          return this.storage.query({
            _orderby: order
          }, function(result) {
            return callback(new KonziloCollection(_this.name, result, 0, 0, _this.entityClass));
          }, errorCallback);
        };

        KonziloStorage.prototype.query = function(q, callback, errorCallback) {
          var cacheKey, deferred, item, key,
            _this = this;
          if (q != null ? q.reset : void 0) {
            this.cache.removeAll();
            delete q.reset;
          }
          this.queryRequests = this.queryRequests || {};
          cacheKey = "";
          deferred = $q.defer();
          for (key in q) {
            item = q[key];
            if (_.isPlainObject(item)) {
              q[key] = JSON.stringify(item);
            }
          }
          $http.get(this.indexUrl, {
            params: q,
            cache: this.cache
          }).then(function(result) {
            var collection, data;
            data = result.data;
            collection = new KonziloCollection(_this.name, data, q, _this.entityClass);
            if (callback) {
              callback(collection);
            }
            return deferred.resolve(collection);
          }, function(result) {
            if (errorCallback) {
              errorCallback(result);
            }
            return deferred.reject(result);
          });
          return deferred.promise;
        };

        KonziloStorage.prototype.clearCache = function() {
          return this.cache.removeAll();
        };

        KonziloStorage.prototype.triggerEvent = function(event, item) {
          var callback, deferred, promises, resolveCallback, result, _i, _len, _ref;
          promises = [];
          if (this.eventCallbacks[event]) {
            _ref = this.eventCallbacks[event];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              callback = _ref[_i];
              result = callback(item);
              if (result != null ? result.then : void 0) {
                promises.push(result);
              }
            }
          }
          deferred = $q.defer();
          resolveCallback = function(result) {
            if (promises.length === 0) {
              return deferred.resolve(result);
            } else {
              return promises.shift().then(resolveCallback);
            }
          };
          if (promises.length === 0) {
            return $q.when(item);
          }
          promises.shift().then(resolveCallback);
          return deferred.promise;
        };

        KonziloStorage.prototype.itemRemoved = function(fn) {
          return this.on("itemRemoved", fn);
        };

        KonziloStorage.prototype.itemSaved = function(fn) {
          return this.on("itemSaved", fn);
        };

        KonziloStorage.prototype.preSave = function(fn) {
          return this.on("preSave", fn);
        };

        KonziloStorage.prototype.changed = function(fn) {
          return this.on("changed", fn);
        };

        KonziloStorage.prototype.on = function(event, fn) {
          if (!this.eventCallbacks[event]) {
            this.eventCallbacks[event] = [];
          }
          return this.eventCallbacks[event].push(fn);
        };

        return KonziloStorage;

      })();
    }
  ]).directive("entityView", [
    "$controller", "$compile", "entityStorage", "$q", function($controller, $compile, entityStorage, $q) {
      return {
        restrict: 'AE',
        scope: {
          "entity": "="
        },
        link: function(scope, element, attrs) {
          var deferred, entity, entityPromise, id, mode, type;
          entity = scope.entity;
          type = (entity != null ? entity.type : void 0) || attrs.entityType;
          id = (entity != null ? entity.id() : void 0) || attrs.entityId;
          mode = attrs.mode;
          if (entity) {
            entityPromise = $q.when(entity);
          } else {
            deferred = $q.defer();
            entityStorage(type).get(id, function(result) {
              return deferred.resolve(result);
            });
            entityPromise = deferred.promise;
          }
          return entityPromise.then(function(result) {
            return result.view({
              scope: scope,
              type: type,
              element: element,
              attrs: attrs,
              entity: result,
              mode: attrs.mode
            });
          });
        }
      };
    }
  ]).directive("entityReference", [
    "entityStorage", "entityInfo", "$q", "$parse", function(entityStorage, entityInfo, $q, $parse) {
      return {
        restrict: "E",
        scope: {
          ngRequired: "=",
          ngModel: "="
        },
        controller: function($scope, $attrs, $element) {
          var entityType, idProperty, info, labelProperty, modelChanged, storage;
          entityType = $attrs.entityType;
          info = entityInfo(entityType);
          if (info) {
            storage = entityStorage(entityType);
            labelProperty = info.labelProperty;
            idProperty = info.idProperty;
          } else {
            throw new Error("No entity with the name " + entityType);
          }
          $scope.editable = false;
          $scope.fetchMatches = function(name) {
            var query;
            if (!info) {
              return [];
            }
            query = {
              q: {}
            };
            query.q[labelProperty] = {
              $regex: name
            };
            return storage.query(query).then(function(result) {
              var item, _i, _len, _ref, _results;
              _ref = result.toArray();
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                item = _ref[_i];
                _results.push("" + item[labelProperty] + " [" + item[idProperty] + "]");
              }
              return _results;
            });
          };
          modelChanged = function() {
            if ($scope.ngModel) {
              if (_.isString($scope.ngModel)) {
                return storage.get($scope.ngModel).then(function(entity) {
                  $scope.ngModel = entity.toObject();
                  return $scope.label = "" + $scope.ngModel[labelProperty];
                });
              } else {
                return $scope.label = "" + $scope.ngModel[labelProperty];
              }
            } else {
              return $scope.label = "";
            }
          };
          $scope.entityChanged = function() {
            var result;
            result = /\[(.*)\]/.exec($scope.label);
            if ((result != null ? result.length : void 0) === 2) {
              return storage.get(result[1]).then(function(entity) {
                $scope.ngModel = entity.toObject();
                return $scope.$emit('entityReferenceChanged', $scope.ngModel);
              });
            }
          };
          $scope.$watch("label", $scope.entityChanged);
          $scope.$watch("ngModel", modelChanged);
          $scope.label = "";
        },
        template: "<ng-form name=\"referenceForm\">    <input type=\"text\" name=\"title\" ng-model=\"label\"    typeahead=\"entity for entity in fetchMatches($viewValue)\"    typeahead-editable=\"editable\" autocomplete=\"off\" /></ng-form>"
      };
    }
  ]).directive("kzEntityPager", function() {
    return {
      restrict: "AE",
      scope: {
        collection: "=",
        itemsFetched: "="
      },
      controller: [
        "$scope", function($scope) {
          var update;
          $scope.currentPage = 0;
          $scope.pages = 0;
          update = function() {
            var _ref;
            if (!((_ref = $scope.collection) != null ? _ref.pages : void 0)) {
              return;
            }
            $scope.pages = $scope.collection.pages();
            return $scope.getPage = function() {
              $scope.currentPage += 1;
              return $scope.collection.getPage($scope.currentPage).then($scope.itemsFetched);
            };
          };
          $scope.$watch("collection", update);
        }
      ],
      template: "<a class=\"pager\" ng-click=\"getPage(page)\" ng-show=\"currentPage < pages\">    {{'GLOBAL.FETCHMORE' | translate}}</a>"
    };
  }).directive("validEntity", [
    "entityStorage", "$parse", function(entityStorage, $parse) {
      return {
        restrict: "A",
        require: "ngModel",
        scope: {
          entityType: "=validEntity"
        },
        link: function(scope, elm, attrs, ctrl) {
          ctrl.$parsers.unshift(function(viewValue) {
            var storage;
            if (scope.entityType) {
              storage = entityStorage(scope.entityType);
              if (viewValue && viewValue.length > 0) {
                storage.get(viewValue, function() {
                  return ctrl.$setValidity('validEntity', true);
                }, function() {
                  return ctrl.$setValidity('validEntity', false);
                });
              }
            }
            return viewValue;
          });
        }
      };
    }
  ]);

}).call(this);
