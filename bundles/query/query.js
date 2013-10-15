(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  angular.module("konzilo.query", []).constant("queryOperators", {
    or: "$or",
    and: "$and",
    eq: "=",
    regex: "$regex"
  }).provider("queryFilter", function() {
    var BaseFilter, MatchFilter, OptionsFilter, ReferenceFilter, provider, _ref;
    BaseFilter = (function() {
      BaseFilter.prototype.name = "BaseFilter";

      function BaseFilter(name, label, description) {
        this.name = name;
        this.label = label;
        this.description = description;
      }

      BaseFilter.prototype.query = function(val) {
        var result;
        result = {};
        return result[this.name] = val;
      };

      BaseFilter.prototype.templateUrl = "bundles/query/components/filter-input.html";

      BaseFilter.prototype.settings = function() {
        return {
          name: this.name,
          label: this.label,
          description: this.description
        };
      };

      return BaseFilter;

    })();
    MatchFilter = (function(_super) {
      __extends(MatchFilter, _super);

      function MatchFilter() {
        _ref = MatchFilter.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      MatchFilter.prototype.name = "MatchFilter";

      MatchFilter.prototype.query = function(val) {
        var result;
        result = {};
        result[this.name] = {};
        result[this.name][queryOperators.regex] = val;
        return result;
      };

      return MatchFilter;

    })(BaseFilter);
    OptionsFilter = (function(_super) {
      __extends(OptionsFilter, _super);

      OptionsFilter.prototype.name = "OptionsFilter";

      function OptionsFilter(name, label, description, optionValues) {
        this.name = name;
        this.label = label;
        this.description = description;
        this.optionValues = optionValues;
      }

      OptionsFilter.prototype.options = function() {
        return this.optionValues;
      };

      OptionsFilter.prototype.labelCallback = function(item, callback) {
        return callback(this.optionValues[item]);
      };

      OptionsFilter.prototype.query = function(val) {
        var result;
        result = {};
        result[this.name] = {};
        result[this.name][queryOperators.regex] = val;
        return result;
      };

      return OptionsFilter;

    })(BaseFilter);
    ReferenceFilter = (function(_super) {
      __extends(ReferenceFilter, _super);

      ReferenceFilter.prototype.name = "ReferenceFilter";

      function ReferenceFilter(name, label, description, storage, labelProperty, idProperty) {
        this.name = name;
        this.label = label;
        this.description = description;
        this.storage = storage;
        this.labelProperty = labelProperty != null ? labelProperty : "title";
        this.idProperty = idProperty != null ? idProperty : "id";
        this.filter = {};
      }

      ReferenceFilter.prototype.setFilter = function(filter) {
        this.filter = filter;
      };

      ReferenceFilter.prototype.options = function() {
        var _this = this;
        return this.storage.query({
          q: this.filter
        }).then(function(result) {
          var item, options, _i, _len, _ref1;
          options = {};
          _ref1 = result.toArray();
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            item = _ref1[_i];
            options[item[_this.idProperty]] = item[_this.labelProperty];
          }
          return options;
        });
      };

      ReferenceFilter.prototype.labelCallback = function(item, callback) {
        var _this = this;
        if (!_.isObject(item)) {
          return item = this.storage.get(item, function(item) {
            return callback(item.label());
          });
        } else {
          return callback(item.label());
        }
      };

      ReferenceFilter.prototype.query = function(val) {
        var result;
        result = {};
        result[this.name] = val;
        return result;
      };

      ReferenceFilter.prototype.settings = function() {
        var base;
        base = ReferenceFilter.__super__.settings.apply(this, arguments);
        return _.extend(base, {
          storage: typeof this.storage,
          labelProperty: this.labelProperty,
          idProperty: this.idProperty
        });
      };

      return ReferenceFilter;

    })(BaseFilter);
    provider = {
      filter: function(name, definition) {
        this.filters = this.filters || {};
        return this.filters[name] = definition;
      },
      getFilters: function() {
        return this.filters;
      },
      $get: function() {
        var _this = this;
        return function(name) {
          var _ref1;
          return (_ref1 = _this.filters) != null ? _ref1[name] : void 0;
        };
      }
    };
    provider.filter("BaseFilter", BaseFilter);
    provider.filter("MatchFilter", MatchFilter);
    provider.filter("ReferenceFilter", ReferenceFilter);
    provider.filter("OptionsFilter", OptionsFilter);
    return provider;
  }).factory("QueryBuilderStorage", [
    "KonziloConfigDefaultStorage", function(KonziloConfigDefaultStorage) {
      var storage;
      storage = _.clone(KonziloDefaultStorage);
      return storage.serialize = function(obj) {
        var serialized;
        return serialized = {};
      };
    }
  ]).factory("QueryBuilder", [
    "queryOperators", function(queryOperators) {
      var QueryBuilder, QueryGroup;
      QueryGroup = (function() {
        function QueryGroup(name, operator, outerOperator) {
          this.name = name;
          this.operator = operator;
          this.outerOperator = outerOperator != null ? outerOperator : queryOperators.and;
          this.filters = [];
        }

        QueryGroup.prototype.addFilter = function(filter, value, callback) {
          var definition,
            _this = this;
          definition = {
            filter: filter,
            value: value,
            label: value
          };
          if (filter.labelCallback) {
            return filter.labelCallback(value, function(label) {
              definition.label = label;
              _this.filters.push(definition);
              if (callback) {
                return callback(definition);
              }
            });
          } else {
            this.filters.push(definition);
            if (callback) {
              return callback(definition);
            }
          }
        };

        QueryGroup.prototype.serialize = function() {
          var filter, group;
          group = {
            name: this.name,
            operator: this.operator,
            outerOperator: this.outerOperator
          };
          group.filters = (function() {
            var _i, _len, _ref, _results;
            _ref = this.filters;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              filter = _ref[_i];
              _results.push({
                filterInstance: filter.filter.name,
                value: filter.value
              });
            }
            return _results;
          }).call(this);
          return group;
        };

        return QueryGroup;

      })();
      return QueryBuilder = (function() {
        function QueryBuilder(resource, filterInstances) {
          var instance, _i, _len,
            _this = this;
          this.resource = resource;
          this.groupNames = {};
          this.groups = [];
          this.listeners = [];
          this.resource.changed(function() {
            return _this.execute();
          });
          this.filterInstances = {};
          for (_i = 0, _len = filterInstances.length; _i < _len; _i++) {
            instance = filterInstances[_i];
            this.filterInstances[instance.name] = instance;
          }
        }

        QueryBuilder.prototype.serialize = function() {
          var group;
          return {
            groups: (function() {
              var _i, _len, _ref, _results;
              _ref = this.groups;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                group = _ref[_i];
                _results.push(group.serialize());
              }
              return _results;
            }).call(this)
          };
        };

        QueryBuilder.prototype.unserialize = function(data, callback) {
          var addGroups,
            _this = this;
          addGroups = function(groups) {
            var group;
            if (groups.length === 0 && callback) {
              return callback();
            }
            group = groups.shift();
            return _this.addGroup(group, null, null, function() {
              return addGroups(groups);
            });
          };
          return addGroups(data.groups);
        };

        QueryBuilder.prototype.addGroup = function(name, operator, outerOperator, callback) {
          var addFilters, group,
            _this = this;
          if (operator == null) {
            operator = queryOperators.or;
          }
          if (outerOperator == null) {
            outerOperator = queryOperators.and;
          }
          if (_.isObject(name)) {
            group = new QueryGroup(name.name, name.operator, name.outerOperator);
            addFilters = function(filters) {
              var filter;
              if (filters.length === 0 && callback) {
                return callback(group);
              }
              filter = filters.shift();
              return group.addFilter(_this.filterInstances[filter.filterInstance], filter.value, function() {
                return addFilters(filters);
              });
            };
            addFilters(name.filters);
          } else {
            group = new QueryGroup(name, operator, outerOperator);
          }
          this.groups.push(group);
          this.groupNames[name] = group;
          if (callback) {
            callback(group);
          }
          return group;
        };

        QueryBuilder.prototype.addFilter = function(filter, value, group, callback) {
          if (group == null) {
            group = "default";
          }
          return this.groupNames[group].addFilter(filter, value, callback);
        };

        QueryBuilder.prototype.queryExecuted = function(callback) {
          return this.listeners.push(callback);
        };

        QueryBuilder.prototype.execute = function(callback, errorCallback) {
          var filter, group, groupQuery, resultQuery, _i, _j, _len, _len1, _ref, _ref1,
            _this = this;
          resultQuery = {};
          _ref = this.groups;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            group = _ref[_i];
            groupQuery = {};
            groupQuery[group.operator] = [];
            if (!resultQuery[group.outerOperator]) {
              resultQuery[group.outerOperator] = [];
            }
            _ref1 = group.filters;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              filter = _ref1[_j];
              groupQuery[group.operator].push(filter.filter.query(filter.value));
            }
            resultQuery[group.outerOperator].push(groupQuery);
          }
          if (_.size(resultQuery) === 1 && _.size(_.toArray(resultQuery)[0]) === 1) {
            resultQuery = _.first(_.toArray(resultQuery)[0]);
          }
          return this.resource.query({
            q: resultQuery,
            limit: 10
          }, function(result) {
            var eventCallback, _k, _len2, _ref2;
            _ref2 = _this.listeners;
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
              eventCallback = _ref2[_k];
              eventCallback(result);
            }
            if (callback) {
              return callback(result);
            }
          });
        };

        return QueryBuilder;

      })();
    }
  ]).controller("konziloFilterConfig", [
    "$scope", "$modalInstance", "filter", function($scope, $modalInstance, filter) {
      $scope.filter = filter;
      if (filter.options) {
        $scope.options = filter.options();
      }
      return $scope.saveValue = function() {
        return $modalInstance.close($scope.value);
      };
    }
  ]).directive("konziloQueryFilters", [
    "$modal", "queryOperators", "UserState", "queryFilter", function($modal, queryOperators, UserState, queryFilter) {
      return {
        restrict: 'AE',
        scope: {
          builder: "=",
          description: "@"
        },
        templateUrl: "bundles/query/filters.html",
        controller: [
          "$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            var filter, originalFilters, _i, _len, _ref;
            $scope.groups = $scope.builder.groups;
            originalFilters = _.toArray($scope.builder.filterInstances);
            $scope.filters = _.clone(originalFilters);
            queryFilter = null;
            _ref = $scope.filters;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              filter = _ref[_i];
              if (filter.options) {
                filter.optionValues = filter.options();
              } else {
                filter.optionValues = {};
              }
            }
            $scope.dropdownMenu = function(filter) {
              if (filter.options) {
                return "dropdown-submenu";
              } else {
                return "";
              }
            };
            $scope.filterOptions = function(filter) {
              return filter.options || {};
            };
            UserState.getInfo().getSetting("queryfilters", function(result) {
              return $scope.builder.unserialize(result, function() {
                var group, _j, _k, _len1, _len2, _ref1, _ref2;
                _ref1 = $scope.builder.groups;
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                  group = _ref1[_j];
                  if (group.filters.length > 0) {
                    group.filter = group.filters[0].filter;
                  }
                }
                _ref2 = $scope.groups;
                for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                  group = _ref2[_k];
                  $scope.filters = _.without($scope.filters, group.filter);
                }
                return $scope.builder.execute();
              });
            });
            $scope.addGroup = function(filter, item) {
              var group, name;
              name = $scope.groups.length;
              group = $scope.builder.addGroup(name, queryOperators.or);
              group.filter = filter;
              if (item) {
                return group.addFilter(filter, item, function() {
                  $scope.filters = _.without($scope.filters, filter);
                  $scope.builder.execute();
                  return UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize());
                });
              } else {
                return $modal.open({
                  templateUrl: filter.templateUrl,
                  resolve: {
                    filter: function() {
                      return filter;
                    }
                  },
                  controller: "konziloFilterConfig"
                }).result.then(function(value) {
                  if (!_.isEmpty(value)) {
                    return group.addFilter(filter, value, function() {
                      $scope.filters = _.without($scope.filters, filter);
                      $scope.builder.execute();
                      return UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize());
                    });
                  }
                });
              }
            };
            $scope.removeGroup = function(group) {
              $scope.filters.push(group.filter);
              $scope.filters = (function() {
                var _j, _len1, _results;
                _results = [];
                for (_j = 0, _len1 = originalFilters.length; _j < _len1; _j++) {
                  filter = originalFilters[_j];
                  if (__indexOf.call($scope.filters, filter) >= 0) {
                    _results.push(filter);
                  }
                }
                return _results;
              })();
              $scope.builder.groups = _.without($scope.builder.groups, group);
              $scope.groups = $scope.builder.groups;
              $scope.builder.execute();
              return UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize());
            };
            $scope.removeFilter = function(group, filter) {
              group.filters = _.without(group.filters, filter);
              $scope.builder.execute();
              return UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize());
            };
            $scope.selectOption = function(group, filter, item) {
              group.filter = filter;
              return group.addFilter(filter, item, function() {
                UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize());
                return $scope.builder.execute();
              });
            };
            $scope.filterAvailable = function(group, value) {
              var groupFilter, _j, _len1, _ref1;
              _ref1 = group.filters;
              for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                groupFilter = _ref1[_j];
                if (value === groupFilter.value) {
                  return false;
                }
              }
              return true;
            };
            return $scope.configureFilter = function(filter, group) {
              group.filter = filter;
              if (filter.optionValues) {
                return;
              }
              return $modal.open({
                templateUrl: filter.templateUrl,
                resolve: {
                  filter: function() {
                    return filter;
                  }
                },
                controller: "konziloFilterConfig"
              }).result.then(function(value) {
                if (!_.isEmpty(value)) {
                  return group.addFilter(filter, value, function() {
                    UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize());
                    return $scope.builder.execute();
                  });
                }
              });
            };
          }
        ]
      };
    }
  ]);

}).call(this);
