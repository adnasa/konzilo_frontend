(function() {
  angular.module("konzilo.client", ["konzilo.config", "konzilo.translations"]).config([
    "$routeProvider", function($routeProvider) {
      var clientAdmin;
      clientAdmin = {
        controller: "ClientAdminController",
        templateUrl: "bundles/client/client-admin.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("administer system");
          }
        }
      };
      return $routeProvider.when('/settings/clients', clientAdmin);
    }
  ]).run([
    "konziloMenu", function(konziloMenu) {
      return konziloMenu("settingsMenu").addItem("#/settings/clients", "Klienter", function(userAccess) {
        return userAccess("administer system");
      });
    }
  ]).controller("ClientAdminController", [
    "$scope", "KonziloConfig", "$http", "$translate", function($scope, KonziloConfig, $http, $translate) {
      var bin, fetchClients;
      bin = KonziloConfig.get("clients");
      fetchClients = function() {
        return $scope.clients = bin.listAll().then(function(result) {
          return _.toArray(result);
        });
      };
      $scope.properties = {
        name: $translate("GLOBAL.NAME"),
        redirectURI: $translate("CLIENT.REDIRECT_URI"),
        clientId: $translate("CLIENT.CLIENT_ID"),
        clientSecret: $translate("CLIENT.SECRET")
      };
      $scope.operations = {
        "delete": {
          label: $translate("CLIENT.REMOVE"),
          action: function(client) {
            return bin.remove(client.name).then(fetchClients);
          }
        }
      };
      fetchClients();
      $scope.client = {
        settings: {}
      };
      $scope.addClient = function() {
        if ($scope.addClientForm.$valid) {
          bin.set($scope.client.name, $scope.client);
          return fetchClients();
        }
      };
    }
  ]);

}).call(this);
