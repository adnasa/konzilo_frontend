(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  angular.module("kntnt.user", ["ui.bootstrap", "ngResource", "ngCookies", "konzilo.entity", "cmf.input", "konzilo.translations"]).factory("UserStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage('/user/:_id', "User");
    }
  ]).factory("LoginStorage", [
    "$resource", function($resource) {
      return $resource('/login/:id', {}, {
        update: {
          method: "PUT"
        }
      });
    }
  ]).factory("GroupStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage('/group/:_id', "Group");
    }
  ]).factory("ProviderStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage('/provider/:_id', "Provider");
    }
  ]).run([
    "UserState", "$translate", "KonziloConfig", function(UserState, $translate, KonziloConfig) {
      UserState.setTokenHeader();
      return UserState.loggedIn(true).then(function() {
        var info;
        info = UserState.getInfo();
        if (info && info.info.language) {
          return $translate.uses(info.info.language);
        } else {
          return KonziloConfig.get("languages").listAll().then(function(languages) {
            var language;
            language = _.find(language, {
              "default": true
            });
            if (language) {
              return $tranlate.uses(language.langcode);
            }
          });
        }
      });
    }
  ]).factory("User", [
    "$resource", "$http", "$cacheFactory", function($resource, $http, $cacheFactory) {
      var User;
      return User = (function() {
        function User(info) {
          this.info = info;
          this.items = {};
          this.url = "/user/" + this.info._id + "/settings";
          this.cache = $cacheFactory(this.url);
        }

        User.prototype.getSettings = function(callback) {
          return $http.get(this.url, this.cache).then(function(result) {
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
            errorCallback(error);
            return error;
          });
        };

        User.prototype.getSetting = function(name, callback, errorCallback) {
          return $http.get("" + this.url + "/" + name, {
            cache: this.cache
          }).then(function(result) {
            if (callback) {
              callback(result.data.data);
            }
            return result.data.data;
          }, function(err) {
            if (errorCallback) {
              errorCallback(err);
            }
            return err;
          });
        };

        User.prototype.saveSetting = function(name, value, callback) {
          this.cache.removeAll();
          return $http.put("" + this.url + "/" + name, {
            name: name,
            data: value
          }).then(function(result) {
            if (callback) {
              callback(result.data.data);
            }
            return result.data.data;
          });
        };

        User.prototype.deleteSetting = function(name, callback, errorCallback) {
          this.cache.removeAll();
          return $http["delete"]("" + this.url + "/" + name).then(function(result) {
            if (callback) {
              callback(result.data);
            }
            return result.data;
          }, function(err) {
            if (errorCallback) {
              errorCallback(err);
            }
            return err;
          });
        };

        User.prototype.getToken = function() {
          return this.info.token;
        };

        return User;

      })();
    }
  ]).factory("userAccess", [
    "$http", "$q", function($http, $q) {
      return function(permission) {
        var deferred;
        deferred = $q.defer();
        $http.get("/user/access", {
          params: {
            session: true
          },
          cache: true
        }).then(function(permissions) {
          if (__indexOf.call(permissions.data, permission) < 0) {
            return deferred.reject();
          } else {
            return deferred.resolve();
          }
        });
        return deferred.promise;
      };
    }
  ]).run([
    "konziloMenu", "$translate", function(konziloMenu, $translate) {
      var menu;
      menu = konziloMenu("settingsMenu");
      menu.addItem("#/settings/users", $translate("USER.TITLE"), function(userAccess) {
        return userAccess("administer system");
      });
      return menu.addItem("#/settings/groups", $translate("GROUP.TITLE"), function(userAccess) {
        return userAccess("administer system");
      });
    }
  ]).factory("userPermissions", [
    "$http", "$q", function($http, $q) {
      return function(permission) {
        return $http.get("/user/access", {
          params: {
            session: true
          }
        }).then(function(permissions) {
          return permissions.data;
        });
      };
    }
  ]).factory("UserState", [
    "$cookieStore", "UserStorage", "$http", "User", "$q", function($cookieStore, UserStorage, $http, User, $q) {
      return {
        saveInfo: function(info) {
          var fn, _i, _len, _ref;
          $cookieStore.put('user_info', info);
          _ref = this.infoSavedCallbacks;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            fn = _ref[_i];
            fn(info);
          }
          return this.setTokenHeader();
        },
        logOut: function() {
          return $cookieStore["delete"]('user_info');
        },
        loggedIn: function(check) {
          if (check == null) {
            check = false;
          }
          if (!this.getInfo()) {
            return $q.reject();
          }
          if (!check) {
            return $q.when();
          }
          return $http.get('/loggedin');
        },
        hasPermission: function(permission) {
          var info;
          info = this.getInfo;
          if (!info) {
            return false;
          }
          return __indexOf.call(info.info.permissions, permission) >= 0;
        },
        getInfo: function() {
          var info;
          if (!this.info) {
            info = $cookieStore.get('user_info');
            if (info) {
              this.info = new User(info);
            }
          }
          return this.info;
        },
        getTokenHeader: function() {
          if (this.getInfo()) {
            return "bearer " + this.info.getToken();
          }
        },
        setTokenHeader: function() {
          if (this.getInfo()) {
            $http.defaults.headers.common["Authorization"] = "bearer " + this.info.getToken();
            return true;
          }
          return false;
        },
        infoSaved: function(fn) {
          this.infoSavedCallbacks = this.infoSavedCallbacks || [];
          return this.infoSavedCallbacks.push(fn);
        }
      };
    }
  ]).config([
    "$routeProvider", "entityInfoProvider", function($routeProvider, entityInfoProvider) {
      var dashboard, groupMgmt, login, profile, userMgmt;
      login = {
        controller: "LoginController",
        templateUrl: "bundles/user/login.html"
      };
      dashboard = {
        controller: "DashboardController",
        templateUrl: "bundles/user/dashboard.html",
        resolve: {
          loggedIn: function(UserState) {
            return UserState.loggedIn(true);
          }
        }
      };
      profile = {
        controller: "UserProfileController",
        templateUrl: "bundles/user/profile.html",
        resolve: {
          loggedIn: function(UserState) {
            return UserState.loggedIn(true);
          }
        }
      };
      userMgmt = {
        controller: "UserMgmtController",
        templateUrl: "bundles/user/usermgmt.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("administer system");
          }
        }
      };
      groupMgmt = {
        controller: "GroupMgmtController",
        templateUrl: "bundles/user/groupmgmt.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("administer system");
          }
        }
      };
      $routeProvider.when('/login', login);
      $routeProvider.when('/profile', profile);
      $routeProvider.when('/profile/:user', profile);
      $routeProvider.when('/dashboard', dashboard);
      $routeProvider.when('/', dashboard);
      $routeProvider.when('/settings/users', userMgmt);
      $routeProvider.when('/settings/users/:user', userMgmt);
      $routeProvider.when('/settings/groups', groupMgmt);
      $routeProvider.when('/settings/groups/:group', groupMgmt);
      $routeProvider.otherwise(login);
      entityInfoProvider.addProvider("User", {
        storageController: "UserStorage",
        labelProperty: "username",
        idProperty: "_id",
        properties: {
          username: {
            label: "Username",
            type: String
          },
          email: {
            label: "Email",
            type: String
          },
          active: {
            label: "Active",
            type: Boolean
          }
        },
        operations: {
          "delete": {
            label: "Remove user",
            action: function(user) {
              return user.$delete();
            }
          },
          activate: {
            label: "Activate user",
            action: function(user) {
              user.active = true;
              return user.$update();
            }
          },
          deactivate: {
            label: "Deactivate user",
            action: function(user) {
              user.active = false;
              return user.$update();
            }
          }
        }
      });
      entityInfoProvider.addProvider("Group", {
        storageController: "GroupStorage",
        labelProperty: "name",
        idProperty: "_id",
        properties: {
          name: {
            label: "Name",
            type: String
          },
          members: {
            label: "Members",
            type: []
          },
          active: {
            label: "Active",
            type: Boolean
          }
        },
        operations: {
          "delete": {
            label: "Remove group",
            action: function(group) {
              return group.remove();
            }
          }
        }
      });
      return entityInfoProvider.addProvider("Provider", {
        storageController: "ProviderStorage",
        labelProperty: "label",
        idProperty: "_id",
        properties: {
          label: {
            label: "Name",
            type: String
          },
          type: {
            label: "Type",
            type: String
          },
          _id: {
            label: "ID",
            type: String
          }
        }
      });
    }
  ]).controller("UserProfileController", [
    "$scope", "UserState", "$routeParams", "UserStorage", function($scope, UserState, $routeParams, UserStorage) {
      var info;
      info = UserState.getInfo();
      return $scope.user = UserStorage.get(info.info._id).then(function(result) {
        return result.toObject();
      });
    }
  ]).factory("GetParameters", function() {
    var item, param, paramList, params, search, _i, _len;
    search = window.location.search;
    if (search.length === 0) {
      return {};
    }
    paramList = search.substr(1).split("&");
    params = {};
    for (_i = 0, _len = paramList.length; _i < _len; _i++) {
      param = paramList[_i];
      item = param.split("=");
      params[item[0]] = decodeURIComponent(item[1]);
    }
    return params;
  }).controller("DashboardController", [
    "$scope", "UserStorage", "UserState", function($scope, UserStorage, UserState) {
      var info;
      info = UserState.getInfo().info();
      return $scope.translations = {
        name: info.username
      };
    }
  ]).controller("LoginController", [
    "$scope", "LoginStorage", "UserState", "$location", "GetParameters", "$http", function($scope, LoginStorage, UserState, $location, GetParameters, $http) {
      UserState.loggedIn(true).then(function() {
        return $location.url("/");
      });
      $scope.loginUser = function() {
        $scope.message = false;
        return LoginStorage.save({
          username: $scope.username,
          password: $scope.password
        }, function(result, err) {
          UserState.saveInfo(result);
          if (GetParameters["destination"]) {
            return window.location = GetParameters["destination"];
          } else {
            return window.location = "/";
          }
        }, function(result) {
          return $scope.message = "Felaktigt användarnamn eller lösenord";
        });
      };
      return $scope.sendPassword = function() {
        return $http.post("/password/" + $scope.forgot).then(function() {
          return $scope.message = "LOGIN.PASSWORDSENT";
        }, function(err) {
          return $scope.message = "LOGIN.PASSWORDERROR";
        });
      };
    }
  ]).controller("DashboardController", [
    "$scope", "LoginStorage", "UserState", function($scope, LoginStorage, UserState) {
      return $scope.user = UserState.getInfo();
    }
  ]).directive("userEditForm", [
    "InputAutoSave", "UserStorage", "KonziloConfig", "userAccess", function(InputAutoSave, UserStorage, KonziloConfig, userAccess) {
      return {
        restrict: "AE",
        templateUrl: "bundles/user/user-edit.html",
        scope: {
          user: "="
        },
        controller: [
          "$scope", function($scope) {
            var activeUser, update;
            activeUser = $scope.user;
            $scope.languages = KonziloConfig.get("languages").listAll();
            KonziloConfig.get("roles").listAll().then(function(roles) {
              return $scope.roles = roles;
            });
            $scope.hasRole = function(role) {
              var _ref;
              if (!((_ref = $scope.user) != null ? _ref.roles : void 0)) {
                return;
              }
              return __indexOf.call($scope.user.roles, role) >= 0;
            };
            $scope.saveUser = function() {
              var _ref;
              if (((_ref = $scope.userForm) != null ? _ref.$valid : void 0) && _.isEqual($scope.user.password, $scope.password2)) {
                return UserStorage.save(user);
              }
            };
            userAccess("administer system").then(function() {
              return $scope.showAdminFields = true;
            });
            update = function() {
              if (!$scope.user) {
                return;
              }
              if ($scope.user.toObject) {
                $scope.user = $scope.user.toObject();
              }
              $scope.user.roles = $scope.user.roles || [];
              if (!activeUser || $scope.user._id === !activeUser._id) {
                return $scope.autosave = InputAutoSave.createInstance($scope.user, function() {
                  return UserStorage.save($scope.user);
                }, function() {
                  var _ref;
                  return ((_ref = $scope.userForm) != null ? _ref.$valid : void 0) && _.isEqual($scope.user.password, $scope.password2);
                });
              }
            };
            return $scope.$watch('user', update);
          }
        ]
      };
    }
  ]).directive("userAddForm", [
    "UserStorage", function(UserStorage) {
      return {
        restrict: "AE",
        templateUrl: "bundles/user/user-add.html",
        scope: {},
        controller: [
          "$scope", function($scope) {
            $scope.saveUser = function() {
              var _ref;
              if (((_ref = $scope.userForm) != null ? _ref.$valid : void 0) && _.isEqual($scope.user.password, $scope.password2)) {
                return UserStorage.save($scope.user, function(result) {
                  return $scope.user = {};
                });
              }
            };
            return $scope.user = {};
          }
        ]
      };
    }
  ]).directive("userInfo", [
    "UserStorage", "UserState", "$translate", function(UserStorage, UserState, $translate) {
      return {
        restrict: "AE",
        replace: true,
        template: "<a ng-href=\"{{user.link}}\"><i class=\"icon-user\"></i><span>{{user.username | translate}}</span></a>",
        scope: {},
        controller: [
          "$scope", function($scope) {
            var getUser;
            getUser = function() {
              return UserState.loggedIn(true).then(function() {
                var info;
                info = UserState.getInfo();
                $scope.user = info.info;
                return $scope.user.link = "#/profile";
              }, function() {
                return $scope.user = {
                  username: "LOGIN.LOGIN",
                  link: "#/login"
                };
              });
            };
            getUser();
            return UserState.infoSaved(function() {
              return getUser();
            });
          }
        ]
      };
    }
  ]).controller("UserMgmtController", [
    "$scope", "UserStorage", "entityInfo", "$routeParams", "$translate", function($scope, UserStorage, entityInfo, $routeParams, $translate) {
      UserStorage.query({
        group: false
      }, function(result) {
        var updateUsers;
        updateUsers = function() {
          var user;
          return $scope.users = (function() {
            var _i, _len, _ref, _results;
            _ref = result.toArray();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              user = _ref[_i];
              user.userlink = {
                label: user.username,
                link: "#/settings/users/" + user._id
              };
              if (user.active) {
                user.activeText = $translate("USER.ACTIVE");
              } else {
                user.activeText = $translate("USER.INACTIVE");
              }
              _results.push(user);
            }
            return _results;
          })();
        };
        updateUsers();
        return UserStorage.itemSaved(function(item) {
          var oldItem;
          oldItem = result.get(item);
          if (!oldItem) {
            result.add(item);
          } else {
            oldItem.setData(item.toObject());
          }
          return updateUsers();
        });
      });
      $scope.userGrid = function() {
        if ($scope.user) {
          return "span6";
        } else {
          return "span12";
        }
      };
      $scope.entity = entityInfo("User");
      $scope.properties = {
        userlink: $translate("GLOBAL.USERNAME"),
        email: $translate("GLOBAL.EMAIL"),
        activeText: $translate("USER.ACTIVE")
      };
      if ($routeParams.user) {
        return UserStorage.get($routeParams.user, function(user) {
          return $scope.user = user;
        });
      }
    }
  ]).controller("GroupMgmtController", [
    "$scope", "KonziloConfig", "$http", "$routeParams", "InputAutoSave", "GroupStorage", "$translate", function($scope, KonziloConfig, $http, $routeParams, InputAutoSave, GroupStorage, $translate) {
      $scope.query = {};
      $scope.properties = {
        name: $translate("GLOBAL.NAME"),
        operations: {
          label: $translate("GLOBAL.OPERATIONS"),
          value: function(item) {
            return {
              label: $translate("GLOBAL.EDIT"),
              link: "#/settings/groups/" + item._id
            };
          }
        }
      };
      if ($routeParams.group) {
        GroupStorage.get($routeParams.group).then(function(group) {
          var save, valid;
          $scope.group = group.toObject();
          $scope.group.members = $scope.group.members || [];
          valid = function() {
            return $scope.editGroupForm.$valid;
          };
          save = function() {
            return GroupStorage.save($scope.group);
          };
          return $scope.autosave = InputAutoSave.createInstance($scope.group, save, valid);
        });
      }
      $scope.mainClass = function() {
        if ($scope.group) {
          return "span6";
        } else {
          return "span12";
        }
      };
      $scope.newGroup = {};
      $scope.addUser = function() {
        $scope.group.members.push($scope.newUser);
        $scope.group.members = _.unique($scope.group.members);
        return $scope.newUser = void 0;
      };
      $scope.removeUser = function(user) {
        return $scope.group.members = _.without($scope.group.members, user);
      };
      $scope.addGroup = function() {
        if ($scope.addGroupForm.$valid) {
          GroupStorage.save($scope.newGroup);
          return $scope.newGroup = void 0;
        }
      };
    }
  ]).directive("kzUserAccess", [
    "userAccess", "UserState", function(userAccess, UserState) {
      return {
        restrict: "A",
        transclude: true,
        link: function(scope, element, attrs) {
          var access, checkAccess;
          access = attrs.kzUserAccess;
          checkAccess = function() {
            return userAccess(access).then(function() {
              return scope.access = true;
            });
          };
          UserState.infoSaved(function() {
            return checkAccess();
          });
          return checkAccess();
        },
        template: '<div ng-show="access"><div ng-transclude></div></div>'
      };
    }
  ]).directive("kzLogout", [
    "UserState", function(UserState) {
      return {
        restrict: "AE",
        replace: true,
        controller: function($scope) {
          var loggedIn;
          loggedIn = function() {
            return $scope.loggedIn = UserState.loggedIn(true);
          };
          loggedIn();
          return UserState.infoSaved(function() {
            return loggedIn();
          });
        },
        template: "<a href=\"/logout\" ng-show=\"loggedIn\">    <i class=\"icon-signout\"></i>    <span>{{'GLOBAL.LOGOUT' | translate}}</span></a>"
      };
    }
  ]);

}).call(this);
