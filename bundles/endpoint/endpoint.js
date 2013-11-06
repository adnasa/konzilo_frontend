(function() {
  angular.module("konzilo.endpoint", ["konzilo.config", "konzilo.translations"]).config([
    "$routeProvider", function($routeProvider) {
      var endpointAdmin;
      endpointAdmin = {
        controller: "EndpointAdminController",
        templateUrl: "bundles/endpoint/endpoint-admin.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("administer system");
          }
        }
      };
      $routeProvider.when('/settings/endpoints', endpointAdmin);
      return $routeProvider.when('/settings/endpoints/:endpoint', endpointAdmin);
    }
  ]).run([
    "konziloMenu", "$translate", function(konziloMenu, $translate) {
      return konziloMenu("settingsMenu").addItem("#/settings/endpoints", $translate("GLOBAL.ENDPOINT"), function(userAccess) {
        return userAccess("administer system");
      });
    }
  ]).controller("EndpointAdminController", [
    "$scope", "KonziloConfig", "$http", "$routeParams", "InputAutoSave", "$translate", function($scope, KonziloConfig, $http, $routeParams, InputAutoSave, $translate) {
      var bin, fetchEndpoints;
      bin = KonziloConfig.get("endpoints");
      $scope.properties = {
        name: $translate("GLOBAL.NAME"),
        type: $translate("GLOBAL.TYPE"),
        operations: {
          label: $translate("GLOBAL.OPERATIONS"),
          value: function(item) {
            return {
              label: $translate("GLOBAL.EDIT"),
              link: "#/settings/endpoints/" + item.name
            };
          }
        }
      };
      $scope.operations = {
        "delete": {
          label: $translate("ENDPOINT.REMOVE"),
          action: function(endpoint) {
            return bin.remove(endpoint.name).then(fetchEndpoints);
          }
        }
      };
      $http.get('/endpointtype').then(function(result) {
        $scope.types = result.data;
        return result.data;
      }).then(function() {
        if ($routeParams.endpoint) {
          bin.get($routeParams.endpoint).then(function(endpoint) {
            $scope.endpoint = endpoint;
            $scope.autosave = InputAutoSave.createInstance($scope.endpoint, function() {
              return bin.set($scope.endpoint.name, $scope.endpoint);
            }, function() {
              return $scope.editEndpointForm.$valid;
            });
            return endpoint.authorized = $http.get("/endpoint/" + endpoint.name).then(function(result) {
              return result.data.authorized;
            });
          });
        }
      });
      fetchEndpoints = function() {
        return bin.listAll().then(function(result) {
          return $scope.endpoints = _.toArray(result);
        });
      };
      fetchEndpoints();
      $scope.getSettings = function(type) {
        if (!type) {
          return {};
        }
        return $scope.types[type].settings;
      };
      $scope.mainClass = function() {
        if ($scope.endpoint) {
          return "span6";
        } else {
          return "span12";
        }
      };
      $scope.authorize = function(endpoint) {
        return $http.post("/endpoint/" + endpoint.name);
      };
      $scope.newEndpoint = {
        settings: {}
      };
      $scope.addEndpoint = function() {
        if ($scope.addEndpointForm.$valid) {
          $scope.newEndpoint.type = $scope.type.name;
          bin.set($scope.newEndpoint.name, $scope.newEndpoint);
          return fetchEndpoints();
        }
      };
    }
  ]);

}).call(this);
