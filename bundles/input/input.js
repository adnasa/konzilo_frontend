(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  angular.module("cmf.input", []).directive("cmfInputList", function() {
    return {
      restrict: "E",
      replace: true,
      transclude: true,
      require: 'ngModel',
      templateUrl: 'bundles/input/input-list.html',
      scope: {
        ngModel: '=',
        ngChange: '=',
        placeholder: "@"
      },
      controller: [
        "$scope", "$parse", "$attrs", function($scope, $parse, $attrs) {
          var _this = this;
          $scope.$watch("ngModel", function() {
            $scope.list = _.clone($scope.ngModel);
            if (!$scope.ngModel) {
              return $scope.list = [];
            }
          });
          $scope.changeValue = function(key) {
            $scope.ngModel[key] = $scope.data[key];
          };
          $scope.addElement = function() {
            if (!_.isEmpty($scope.element)) {
              $scope.ngModel.push($scope.element);
              $scope.ngModel = _.unique($scope.ngModel);
              $scope.element = "";
              return $scope.list = _.clone($scope.ngModel);
            }
          };
          return $scope.removeElement = function(item) {
            return $scope.ngModel = _.without($scope.ngModel, item);
          };
        }
      ]
    };
  }).directive("cmfCheckboxes", function() {
    return {
      restrict: "E",
      replace: true,
      transclude: true,
      template: "<div class=\"checkboxes\">    <label class=\"checkbox\" ng-repeat=\"(index, choice) in choices\">      <input type=\"checkbox\" ng-change=\"change()\"    ng-model=\"model[choice]\"> {{choice}}    </label>  </div>",
      scope: {
        "list": "=list",
        choices: "=choices"
      },
      controller: [
        "$scope", function($scope) {
          var choice, _i, _len, _ref;
          $scope.model = {};
          if ($scope.choices && $scope.choices && $scope.list) {
            _ref = $scope.choices;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              choice = _ref[_i];
              $scope.model[choice] = __indexOf.call($scope.list, choice) >= 0;
            }
          }
          if (!$scope.labels) {
            $scope.labels = $scope.list;
          }
          return $scope.change = function() {
            var selected, value;
            return $scope.list = (function() {
              var _ref1, _results;
              _ref1 = $scope.model;
              _results = [];
              for (value in _ref1) {
                selected = _ref1[value];
                if (selected) {
                  _results.push(value);
                }
              }
              return _results;
            })();
          };
        }
      ]
    };
  }).factory("InlinePreview", function() {
    var InlinePreview;
    return InlinePreview = (function() {
      function InlinePreview(model) {
        this.model = model;
        this.setInputElement = __bind(this.setInputElement, this);
        this.setPreviewElement = __bind(this.setPreviewElement, this);
      }

      InlinePreview.prototype.hideInput = function() {
        $(this.input).height(0);
        return $(this.input).css('overflow', 'hidden');
      };

      InlinePreview.prototype.showInput = function() {
        return $(this.input).height("auto");
      };

      InlinePreview.prototype.setPreviewElement = function(previewElement) {
        var _this = this;
        this.preview = previewElement;
        if (!this.model || this.model.length === 0) {
          $(this.preview).hide();
        }
        return $(this.preview).click(function() {
          $(_this.preview).hide();
          $("*", _this.input).focus();
          return _this.showInput();
        });
      };

      InlinePreview.prototype.setInputElement = function(inputElement, focusElement) {
        var _this = this;
        this.input = inputElement;
        if (this.model && this.model.length > 0) {
          this.hideInput();
        }
        this.input.focus(function() {
          $(_this.preview).hide();
          return _this.showInput();
        });
        this.input.find("input, textarea").focus(function() {
          _this.focused = true;
          $(_this.preview).hide();
          return _this.showInput();
        });
        return this.input.find("input, textarea").blur(function() {
          _this.focused = false;
          if (_this.model && _this.model.length > 0) {
            _this.hideInput();
            return $(_this.preview).show();
          } else {
            return $(_this.preview).hide();
          }
        });
      };

      InlinePreview.prototype.updateModel = function(model) {
        this.model = model;
        if (!this.model || this.model.length === 0) {
          $(this.preview).hide();
          return this.showInput();
        } else if (!this.focused) {
          $(this.preview).show();
          return this.hideInput();
        }
      };

      return InlinePreview;

    })();
  }).directive("cmfInline", [
    "InlinePreview", function(InlinePreview) {
      return {
        restrict: "E",
        transclude: true,
        replace: true,
        template: "<div class=\"inline\" ng-transclude></div>",
        scope: {
          ngModel: "="
        },
        controller: [
          "$scope", function($scope) {
            var _this = this;
            this.preview = new InlinePreview($scope.ngModel);
            $scope.$watch("ngModel", function() {
              return _this.preview.updateModel($scope.ngModel);
            });
            return this;
          }
        ]
      };
    }
  ]).directive("cmfInlineInput", function() {
    return {
      restrict: "E",
      require: "^cmfInline",
      transclude: true,
      replace: true,
      link: function(scope, element, attrs, CmfInlineCtrl) {
        return CmfInlineCtrl.preview.setInputElement(element, attrs.child);
      },
      template: "<div class=\"input\" ng-transclude></div>"
    };
  }).directive("cmfInlinePreview", function() {
    return {
      restrict: "E",
      require: "^cmfInline",
      transclude: true,
      replace: true,
      template: "<div class=\"input-preview\">  <div class=\"content\" ng-transclude></div></div>",
      link: function(scope, element, attrs, CmfInlineCtrl) {
        return CmfInlineCtrl.preview.setPreviewElement(element);
      }
    };
  }).directive("contentTable", [
    "$filter", "entityInfo", "entityStorage", "KonziloEntity", "$parse", function($filter, entityInfo, entityStorage, KonziloEntity, $parse) {
      return {
        restrict: "AE",
        transclude: true,
        templateUrl: "bundles/input/content-table.html",
        scope: {
          query: "=",
          itemsSelected: "=",
          properties: "="
        },
        controller: [
          "$scope", "$attrs", function($scope, $attrs) {
            var entityType, info, storage, update;
            $scope.operation = "";
            $scope.selected = {};
            if ($attrs.items) {
              $scope.$parent.$watch($parse($attrs.items), function(value) {
                return $scope.items = value;
              });
            }
            if ($attrs.operations) {
              $scope.$parent.$watch($parse($attrs.operations), function(value) {
                return $scope.operations = value;
              });
            }
            entityType = $scope.$eval($attrs.entityType) || $attrs.entityType;
            update = function() {
              if ($scope.query && storage) {
                return storage.query({
                  q: $scope.query
                }).then(function(result) {
                  $scope.items = result.toArray();
                  return $scope.selected = {};
                });
              }
            };
            if (entityType) {
              info = entityInfo(entityType);
              storage = entityStorage(entityType);
              storage.on("changed", update);
            }
            if (!$scope.operations && (info != null ? info.operations : void 0)) {
              $scope.operations = info.operations;
            }
            $scope.$watch("query", function() {
              return update();
            });
            $scope.$watch("properties", function() {
              var key, value;
              if (!$scope.properties && (info != null ? info.properties : void 0)) {
                $scope.props = _.keys(info.properties);
                $scope.headers = _.pluck(info.properties, "label");
              } else if ($scope.properties) {
                $scope.headers = (function() {
                  var _ref, _results;
                  _ref = $scope.properties;
                  _results = [];
                  for (key in _ref) {
                    value = _ref[key];
                    if (_.isString(value)) {
                      _results.push(value);
                    } else {
                      _results.push(value.label);
                    }
                  }
                  return _results;
                })();
                $scope.props = _.keys($scope.properties);
              }
            });
            $scope.performActions = function() {
              var item, key, _i, _len, _ref;
              if (!$scope.operation || _.size($scope.selected) === 0) {
                return;
              }
              _ref = $scope.items;
              for (key = _i = 0, _len = _ref.length; _i < _len; key = ++_i) {
                item = _ref[key];
                if ($scope.selected[key]) {
                  if (info) {
                    item = new KonziloEntity(entityType, item);
                  }
                  $scope.operation.action(item);
                }
              }
              return $scope.selected = {};
            };
            return $scope.toggleSelect = function() {
              var item, items, key, _i, _len, _results;
              items = $filter('filter')($scope.items, $scope.search);
              $scope.printVal = function(val) {
                if (_.isObject(val)) {
                  return val.label;
                }
                return val;
              };
              _results = [];
              for (key = _i = 0, _len = items.length; _i < _len; key = ++_i) {
                item = items[key];
                _results.push($scope.selected[key] = $scope.selectall);
              }
              return _results;
            };
          }
        ]
      };
    }
  ]).directive("draggableContentTable", [
    "$filter", "entityInfo", "entityStorage", "KonziloEntity", "$parse", function($filter, entityInfo, entityStorage, KonziloEntity, $parse) {
      return {
        restrict: "AE",
        transclude: true,
        templateUrl: "bundles/input/draggable-content-table.html",
        scope: {
          query: "=",
          itemsSelected: "=",
          properties: "="
        },
        controller: [
          "$scope", "$attrs", function($scope, $attrs) {
            var entityType, info, storage, update;
            storage = null;
            $scope.operation = "";
            $scope.selected = {};
            $scope.weight = $attrs.weight;
            if ($attrs.items) {
              $scope.$parent.$watch($parse($attrs.items), function(value) {
                return $scope.items = value;
              });
            }
            if ($attrs.operations) {
              $scope.$parent.$watch($parse($attrs.operations), function(value) {
                return $scope.operations = value;
              });
            }
            entityType = $scope.$eval($attrs.entityType) || $attrs.entityType;
            $scope.sortableOptions = {
              stop: function(event, ui) {
                var index, item, _i, _len, _ref, _results;
                if ($scope.weight && $scope.items && storage) {
                  _ref = $scope.items;
                  _results = [];
                  for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                    item = _ref[index];
                    item[$scope.weight] = index;
                    _results.push(storage.save(item));
                  }
                  return _results;
                }
              }
            };
            update = function() {
              if ($scope.query && storage) {
                if (!$scope.query.q) {
                  $scope.query = {
                    q: $scope.query
                  };
                }
                return storage.query($scope.query).then(function(result) {
                  $scope.items = result.toArray();
                  return $scope.selected = {};
                });
              }
            };
            if (entityType) {
              info = entityInfo(entityType);
              storage = entityStorage(entityType);
              storage.on("changed", update);
            }
            if (!$scope.operations && (info != null ? info.operations : void 0)) {
              $scope.operations = info.operations;
            }
            $scope.$watch("query", function() {
              return update();
            });
            $scope.$watch("properties", function() {
              var key, value;
              if (!$scope.properties && (info != null ? info.properties : void 0)) {
                $scope.props = _.keys(info.properties);
                $scope.headers = _.pluck(info.properties, "label");
              } else if ($scope.properties) {
                $scope.headers = (function() {
                  var _ref, _results;
                  _ref = $scope.properties;
                  _results = [];
                  for (key in _ref) {
                    value = _ref[key];
                    if (_.isString(value)) {
                      _results.push(value);
                    } else {
                      _results.push(value.label);
                    }
                  }
                  return _results;
                })();
                $scope.props = _.keys($scope.properties);
              }
            });
            $scope.performActions = function() {
              var item, key, _i, _len, _ref;
              if (!$scope.operation || _.size($scope.selected) === 0) {
                return;
              }
              _ref = $scope.items;
              for (key = _i = 0, _len = _ref.length; _i < _len; key = ++_i) {
                item = _ref[key];
                if ($scope.selected[key]) {
                  if (info) {
                    item = new KonziloEntity(entityType, item);
                  }
                  $scope.operation.action(item);
                }
              }
              return $scope.selected = {};
            };
            return $scope.toggleSelect = function() {
              var item, items, key, _i, _len, _results;
              items = $filter('filter')($scope.items, $scope.search);
              $scope.printVal = function(val) {
                if (_.isObject(val)) {
                  return val.label;
                }
                return val;
              };
              _results = [];
              for (key = _i = 0, _len = items.length; _i < _len; key = ++_i) {
                item = items[key];
                _results.push($scope.selected[key] = $scope.selectall);
              }
              return _results;
            };
          }
        ]
      };
    }
  ]).filter('placeholder', function() {
    return function(input, placeholder) {
      if (input && input !== "undefined") {
        return input;
      } else {
        return placeholder;
      }
    };
  }).directive('contentValue', [
    "$compile", function($compile) {
      return {
        restrict: "AE",
        scope: {
          item: "=",
          property: "=",
          options: "="
        },
        replace: true,
        link: function(scope, element, attrs) {
          var update;
          update = function() {
            var _ref, _ref1, _ref2;
            if (!scope.item || !scope.property) {
              return;
            }
            if (_.isPlainObject(scope.options) && scope.options.value) {
              scope.output = scope.options.value(scope.item);
            } else if (scope.item[scope.property]) {
              if (scope.item[scope.property].label == null) {
                scope.output = {
                  label: scope.item[scope.property]
                };
              } else {
                scope.output = _.clone(scope.item[scope.property]);
              }
            }
            if ((_ref = scope.output) != null ? _ref.html : void 0) {
              element.html(scope.output.html);
            } else if (((_ref1 = scope.output) != null ? _ref1.link : void 0) && ((_ref2 = scope.output) != null ? _ref2.label : void 0)) {
              element.html("<a href=\"{{output.link}}\">{{output.label}}</a>");
            } else {
              element.html("{{output.label}}");
            }
            return $compile(element.contents())(scope);
          };
          update();
          return scope.$watch('value', update);
        }
      };
    }
  ]).factory("InputAutoSave", [
    "$timeout", function($timeout) {
      var InputAutoSave;
      InputAutoSave = (function() {
        function InputAutoSave(obj, saveCallback, validCallback, timeout) {
          var _this = this;
          this.obj = obj;
          this.saveCallback = saveCallback;
          this.validCallback = validCallback;
          this.timeout = timeout != null ? timeout : 1500;
          this.originalObj = _.cloneDeep(this.obj);
          this.saveCallbacks = [];
          this.errorCallbacks = [];
          this.callback = function() {
            var callback, result, _i, _len, _ref;
            if (_this.dirty() && _this.validCallback(_this.obj) && !_this.stopSaving) {
              result = _this.saveCallback(_this.obj);
              if (result != null ? result.then : void 0) {
                result.then(function() {
                  var callback, _i, _len, _ref;
                  _ref = _this.saveCallbacks;
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    callback = _ref[_i];
                    callback(_this.obj);
                  }
                  delete _this.originalObj;
                  return _this.originalObj = _.cloneDeep(_this.obj);
                }, function(err) {
                  var callback, _i, _len, _ref, _results;
                  _this.originalObj = _.cloneDeep(_this.obj);
                  _ref = _this.errorCallbacks;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    callback = _ref[_i];
                    _results.push(callback(err));
                  }
                  return _results;
                });
              } else {
                _this.originalObj = _.cloneDeep(_this.obj);
                _ref = _this.saveCallbacks;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  callback = _ref[_i];
                  callback(_this.obj);
                }
              }
            }
            if (!_this.stopSaving) {
              $timeout(_this.callback, _this.timeout);
            }
          };
          this.callback();
        }

        InputAutoSave.prototype.dirty = function() {
          return !_.isEqual(this.originalObj, _.cloneDeep(this.obj));
        };

        InputAutoSave.prototype.stop = function() {
          return this.stopSaving = true;
        };

        InputAutoSave.prototype.start = function() {
          this.startSaving = false;
          return this.callback();
        };

        InputAutoSave.prototype.onSave = function(callback) {
          return this.saveCallbacks.push(callback);
        };

        InputAutoSave.prototype.onError = function(callback) {
          return this.errorCallbacks.push(callback);
        };

        return InputAutoSave;

      })();
      return {
        createInstance: function(obj, saveCallback, validCallback, timeout) {
          this.obj = obj;
          this.saveCallback = saveCallback;
          this.validCallback = validCallback;
          this.timeout = timeout;
          if (this.instance) {
            this.instance.stop();
          }
          this.instance = new InputAutoSave(this.obj, this.saveCallback, this.validCallback, this.timeout);
          return this.instance;
        }
      };
    }
  ]).directive("contenteditable", function() {
    return {
      restrict: "A",
      require: "ngModel",
      link: function(scope, elm, attrs, ctrl) {
        elm.keyup(function() {
          return ctrl.$setViewValue(elm.html());
        });
        return ctrl.$render = function() {
          return elm.html(this.$viewValue);
        };
      }
    };
  }).directive("cmfAutosaveStatus", [
    "$timeout", function($timeout) {
      return {
        restrict: "E",
        transclude: true,
        replace: true,
        scope: {
          status: "="
        },
        controller: [
          "$scope", function($scope) {
            var getDateString, oldStatus, pad, reset, updateStatus;
            pad = function(number) {
              var r;
              r = String(number);
              if (r.length === 1) {
                r = '0' + r;
              }
              return r;
            };
            getDateString = function() {
              var date;
              date = new Date();
              return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
            };
            reset = function() {
              return $scope.statusMessage = null;
            };
            oldStatus = null;
            updateStatus = function() {
              var status;
              status = $scope.status;
              if (status && (!oldStatus || status === !oldStatus)) {
                oldStatus = status;
                status.onSave(function() {
                  var currentDate;
                  currentDate = new Date();
                  $scope.statusMessage = "GLOBAL.SAVED";
                  $scope.translations = {
                    date: getDateString()
                  };
                  $timeout(reset, 2000);
                  $scope.error = false;
                });
                return status.onError(function(err) {
                  $scope.error = true;
                  return $scope.statusMessage = err.data.message;
                });
              }
            };
            updateStatus();
            return $scope.$watch('status', updateStatus);
          }
        ],
        template: "<div class=\"save-status\" ng-class=\"{error: error}\"    ng-show=\"statusMessage\">{{statusMessage | translate: translations}}</div>"
      };
    }
  ]);

}).call(this);
