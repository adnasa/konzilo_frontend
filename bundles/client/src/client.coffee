angular.module("konzilo.client", ["konzilo.config", "konzilo.translations"])

.config(["$routeProvider", ($routeProvider) ->
  clientAdmin =
    controller: "ClientAdminController"
    templateUrl: "bundles/client/client-admin.html"
    resolve:
      access: (userAccess) ->
        userAccess("administer system")

  $routeProvider.when('/settings/clients', clientAdmin)
  $routeProvider.when('/settings/clients/:client', clientAdmin)

])
.run(["konziloMenu", (konziloMenu) ->
  konziloMenu("settingsMenu").addItem "#/settings/clients", "CLIENT.TITLE",
    (userAccess) ->
      userAccess("administer system")
])
.controller("ClientAdminController",
["$scope", "KonziloConfig", "$http", "$translate", "$routeParams", "$location",
"InputAutoSave",
($scope, KonziloConfig, $http, $translate, $routeParams, $location, InputAutoSave) ->
  bin = KonziloConfig.get("clients")

  fetchClients = ->
    $scope.clients = bin.listAll().then (result) -> _.toArray(result)

  removeClient = (client) ->
    bin.remove(client.name).then(fetchClients)

  fetchClients()

  if $routeParams.client
    bin.get($routeParams.client).then (client) ->
      $scope.client = client
      $scope.autosave = InputAutoSave.createInstance $scope.client, ->
        bin.set($scope.client.name, $scope.client)
      , -> $scope.editClientForm.$valid

  $scope.newClient = { settings: {} }
  $scope.addClient = ->
    if $scope.addClientForm.$valid
      bin.set($scope.newClient.name, $scope.newClient).then ->
        fetchClients()
        $scope.newClient = { settings: {} }
  return
])
