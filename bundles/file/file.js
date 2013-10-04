(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  angular.module("konzilo.file", ["blueimp.fileupload", "ui.bootstrap", "kntnt.user", "ngResource", "cmf.input", "konzilo.translations"]).factory("fileBrowser", [
    "$modal", function($modal) {
      return function(options) {
        return $modal.open({
          templateUrl: 'bundles/file/media-manager.html',
          controller: "MediaManager",
          resolve: {
            options: function() {
              return options;
            }
          }
        }).result;
      };
    }
  ]).factory("FileStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage('/file/:_id', "File");
    }
  ]).factory("FileBundle", [
    "$resource", function($resource) {
      return $resource("/filebundle/:name", {
        "name": "@name"
      });
    }
  ]).config([
    "entityInfoProvider", function(entityInfoProvider) {
      return entityInfoProvider.addProvider("File", {
        storageController: "FileStorage",
        labelProperty: "name",
        idProperty: "_id",
        defaultViewMode: "default",
        viewModes: {
          "default": {
            controller: function($scope, entity) {
              return $scope.file = entity.toObject();
            },
            template: "<file-view file=\"file\"></file-view>"
          }
        },
        properties: {
          _id: {
            label: "ID",
            type: String
          },
          uri: {
            label: "URI",
            type: String
          },
          name: {
            label: "Name",
            type: String
          },
          username: {
            label: "Username",
            type: Boolean
          },
          type: {
            label: "Type",
            type: String
          },
          bundle: {
            label: "Uploaded to",
            type: String
          },
          created: {
            label: "Created",
            type: Date
          }
        },
        operations: {
          "delete": {
            label: "Remove file",
            action: function(file) {
              return file.remove();
            }
          }
        }
      });
    }
  ]).provider("fileModes", function() {
    return {
      modes: {
        image: {
          types: ["image/jpeg", "image/gif", "image/png"],
          template: "<img src=\"{{file.uri}}\">",
          controller: [
            "$scope", "file", function($scope, file) {
              return $scope.file = file;
            }
          ],
          settings: {
            templateUrl: "bundles/file/image-settings.html",
            controller: [
              "$scope", "file", function($scope, file) {
                return $scope.settings = file.settings;
              }
            ]
          }
        }
      },
      $get: function() {
        var fn,
          _this = this;
        fn = function(type) {
          var mode, name, _ref;
          if (_this.modes[type]) {
            return _this.modes[type];
          }
          _ref = _this.modes;
          for (name in _ref) {
            mode = _ref[name];
            if (__indexOf.call(mode.types, type) >= 0) {
              return mode;
            }
          }
        };
        fn.getModes = function() {
          return _this.modes;
        };
        return fn;
      },
      getProviders: function() {
        return this.modes;
      }
    };
  }).controller("MediaManager", [
    "$scope", "options", "$modalInstance", "UserState", "fileModes", function($scope, options, $modalInstance, UserState, fileModes) {
      $scope.active = true;
      $scope.bundle = options.bundle;
      $scope.user = UserState.getInfo().info;
      $scope.filesUploaded = function(files) {
        return $scope.files = files;
      };
      $scope.close = function() {
        return $modalInstance.close();
      };
      $scope.fileSelected = function(file) {
        var mode;
        mode = fileModes(file.type);
        $scope.files = [file];
        if (!mode) {
          return $scope.returnFiles();
        }
      };
      return $scope.returnFiles = function() {
        return $modalInstance.close($scope.files);
      };
    }
  ]).directive("fileUploadForm", [
    "UserState", "$timeout", "FileBundle", function(UserState, $timeout, FileBundle) {
      return {
        restrict: "AE",
        templateUrl: 'bundles/file/file-upload.html',
        scope: {
          bundle: "=",
          filesUploaded: "="
        },
        controller: [
          "$scope", function($scope) {
            var files;
            files = [];
            return FileBundle.get({
              name: $scope.bundle
            }, function(bundleInfo) {
              $scope.bundleInfo = bundleInfo;
              return $scope.options = {
                headers: {
                  Authorization: UserState.getTokenHeader()
                },
                formData: {
                  bundle: $scope.bundle
                },
                maxFileSize: bundleInfo.maxFileSize,
                acceptFileTypes: new RegExp(bundleInfo.acceptFileTypes),
                done: function(e, data) {
                  var timeoutFn;
                  files.push(data.result);
                  if (files.length === $scope.queue.length) {
                    timeoutFn = function() {
                      return $scope.filesUploaded(files);
                    };
                    $timeout(timeoutFn, 100);
                  }
                }
              };
            });
          }
        ]
      };
    }
  ]).directive("fileBrowser", [
    "FileStorage", function(FileStorage) {
      return {
        restrict: "AE",
        templateUrl: 'bundles/file/file-browser.html',
        scope: {
          bundle: "=",
          username: "=",
          fileSelected: "="
        },
        controller: [
          "$scope", function($scope) {
            var key, _i, _len, _ref;
            $scope.query = {};
            $scope.selected = [];
            _ref = ["bundle", "username"];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              key = _ref[_i];
              if ($scope[key]) {
                $scope.query[key] = $scope[key];
              }
            }
            FileStorage.query({
              q: $scope.query
            }, function(result) {
              return $scope.files = result.toArray();
            });
            return $scope.selectFile = function(file) {
              if (__indexOf.call($scope.selected, file) < 0) {
                $scope.selected.push(file);
                if ($scope.fileSelected) {
                  return $scope.fileSelected(file);
                }
              }
            };
          }
        ]
      };
    }
  ]).directive("fileView", [
    "$controller", "loadTemplate", "fileModes", "$compile", function($controller, loadTemplate, fileModes, $compile) {
      return {
        restrict: "AE",
        scope: {
          file: "="
        },
        link: function(scope, element, attrs) {
          var clear, getView;
          getView = function(newVal, oldVal) {
            var definition;
            if (!scope.file) {
              return clear();
            }
            definition = fileModes(scope.file.type);
            if (!definition) {
              return clear();
            }
            return loadTemplate(definition).then(function(template) {
              if (definition.controller) {
                $controller(definition.controller, {
                  $scope: scope,
                  file: scope.file
                });
                element.html(template);
                return $compile(element.contents())(scope);
              }
            });
          };
          clear = function() {
            return element.html('');
          };
          getView();
          return scope.$watch("file", getView);
        }
      };
    }
  ]).directive("fileSettingsForm", [
    "$compile", "$controller", "$http", "$templateCache", "fileModes", function($compile, $controller, $http, $templateCache, fileModes) {
      return {
        restrict: "AE",
        scope: {
          file: "="
        },
        link: function(scope, element) {
          var getSettingsForm;
          getSettingsForm = function() {
            var definition, file, settings, templatePromise;
            file = scope.file;
            if (file) {
              definition = fileModes(file.type);
              if (!definition || !definition.settings) {
                return;
              }
              settings = definition.settings;
              if (settings.template) {
                templatePromise = $q.when(settings.template);
              } else if (definition.settings.templateUrl) {
                templatePromise = $http.get(settings.templateUrl, {
                  cache: $templateCache
                }).then(function(response) {
                  return response.data;
                });
              }
              return templatePromise.then(function(template) {
                if (settings.controller) {
                  if (!file.settings) {
                    file.settings = {};
                  }
                  $controller(settings.controller, {
                    "$scope": scope,
                    file: file
                  });
                }
                element.html(template);
                return $compile(element.contents())(scope);
              });
            }
          };
          getSettingsForm();
          return scope.$watch("file", getSettingsForm);
        }
      };
    }
  ]).directive("filePreview", [
    "$compile", function($compile) {
      return {
        restrict: "AE",
        scope: {
          file: "="
        },
        link: [
          "$scope", "element", "attrs", function(scope, element, attrs) {
            var update;
            update = function() {
              var template;
              template = "<span class=\"file-preview\">";
              if (/image/i.test(scope.file.type)) {
                template += "<img class=\"preview\" src=\"{{file.uri}}\" alt=\"{{file.name}}\"/>";
              } else {
                template += "          <i class=\"preview icon-xlarge icon-file\"></i>";
              }
              template += "<span class=\"name\">{{file.name}}</span></span>";
              element.html(template);
              return $compile(element.contents())(scope);
            };
            update();
            return scope.$watch('file', update);
          }
        ]
      };
    }
  ]).directive("filePicker", [
    "fileBrowser", function(fileBrowser) {
      return {
        restrict: "AE",
        replace: true,
        require: 'ngModel',
        templateUrl: 'bundles/file/file-picker.html',
        scope: {
          ngModel: "="
        },
        controller: [
          "$scope", "$attrs", function($scope, $attrs) {
            return $scope.pickFile = function() {
              return fileBrowser({
                bundle: $attrs.bundle
              }).then(function(files) {
                if (files != null ? files.length : void 0) {
                  return $scope.ngModel = files[0];
                }
              });
            };
          }
        ]
      };
    }
  ]).directive("fileUploadList", [
    "fileBrowser", function(fileBrowser) {
      return {
        restrict: "E",
        replace: true,
        transclude: true,
        require: 'ngModel',
        templateUrl: 'bundles/file/file-upload-list.html',
        scope: {
          ngModel: '=',
          ngChange: '='
        },
        controller: [
          "$scope", "$attrs", "$modal", function($scope, $attrs, $modal) {
            $scope.show = $attrs.bundle != null;
            if ($attrs.limit) {
              $scope.limit = parseInt($scope.$eval($attrs.limit) || $attrs.limit);
            } else {
              $scope.limit = 0;
            }
            $scope.allowUpload = function() {
              var _ref;
              if ($scope.limit === 0) {
                return true;
              }
              return ((_ref = $scope.list) != null ? _ref.length : void 0) < $scope.limit;
            };
            $scope.list = _.clone($scope.ngModel);
            $scope.$watch('ngModel', function() {
              return $scope.list = _.clone($scope.ngModel);
            });
            $scope.files = "";
            $scope.changeValue = function(key) {
              $scope.ngModel[key] = $scope.data[key];
            };
            $scope.editSettings = function(item) {
              return $modal.open({
                templateUrl: 'templates/components/file-settings-modal.html',
                controller: function($scope, $modalInstance, file) {
                  $scope.file = file;
                  return $scope.close = function() {
                    if ($scope.settingsForm.$valid) {
                      return $modalInstance.close();
                    }
                  };
                },
                resolve: {
                  file: function() {
                    return item;
                  }
                }
              });
            };
            $scope.addFile = function() {
              return fileBrowser({
                bundle: $attrs.bundle
              }).then(function(files) {
                var file, _i, _len;
                if (files) {
                  for (_i = 0, _len = files.length; _i < _len; _i++) {
                    file = files[_i];
                    $scope.ngModel.push({
                      _id: file._id,
                      name: file.name,
                      uri: file.uri,
                      type: file.type,
                      settings: file.settings
                    });
                  }
                }
                return $scope.list = _.clone($scope.ngModel);
              });
            };
            return $scope.removeElement = function(item) {
              $scope.ngModel = _.without($scope.ngModel, item);
              return $scope.list = _.clone($scope.ngModel);
            };
          }
        ]
      };
    }
  ]);

}).call(this);
