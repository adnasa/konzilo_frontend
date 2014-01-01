angular.module("konzilo.client", ["konzilo.config", "konzilo.translations"])

.config(["$routeProvider", ($routeProvider) ->
  clientAdmin =
    controller: "ClientAdminController"
    templateUrl: "bundles/client/client-admin.html"
    resolve:
      access: (userAccess) ->
        userAccess("administer system")

  $routeProvider.when('/settings/clients', clientAdmin)
])
.run(["konziloMenu", (konziloMenu) ->
  konziloMenu("settingsMenu").addItem "#/settings/clients", "CLIENT.TITLE",
    (userAccess) ->
      userAccess("administer system")
])
.controller("ClientAdminController",
["$scope", "KonziloConfig", "$http", "$translate",
($scope, KonziloConfig, $http, $translate) ->
  bin = KonziloConfig.get("clients")

  fetchClients = ->
    $scope.clients = bin.listAll().then (result) -> _.toArray(result)

  $scope.properties =
    name: $translate("GLOBAL.NAME")
    redirectURI: $translate("CLIENT.REDIRECT_URI")
    clientId: $translate("CLIENT.CLIENT_ID")
    clientSecret: $translate("CLIENT.SECRET")

  $scope.operations =
    delete:
      label: $translate("CLIENT.REMOVE")
      action: (client) ->
        bin.remove(client.name).then(fetchClients)

  fetchClients()

  $scope.client = { settings: {} }
  $scope.addClient = ->
    if $scope.addClientForm.$valid
      bin.set($scope.client.name, $scope.client)
      fetchClients()
  return
])
