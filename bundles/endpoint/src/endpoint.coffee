angular.module("konzilo.endpoint", ["konzilo.config", "konzilo.translations"])

.config(["$routeProvider", ($routeProvider) ->
  endpointAdmin =
    controller: "EndpointAdminController"
    templateUrl: "bundles/endpoint/endpoint-admin.html"
    resolve:
      access: (userAccess) ->
        userAccess("administer system")

  $routeProvider.when('/settings/endpoints', endpointAdmin)
  $routeProvider.when('/settings/endpoints/:endpoint', endpointAdmin)
])
.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  konziloMenu("settingsMenu").addItem "#/settings/endpoints",
  $translate("GLOBAL.ENDPOINT"),
  (userAccess) ->
    userAccess("administer system")
])
.controller("EndpointAdminController",
["$scope", "KonziloConfig", "$http",
"$routeParams", "InputAutoSave", "$translate",
($scope, KonziloConfig, $http, $routeParams, InputAutoSave, $translate) ->
  bin = KonziloConfig.get("endpoints")

  $scope.properties =
    name: $translate("GLOBAL.NAME")
    type: $translate("GLOBAL.TYPE")
    operations:
      label: $translate("GLOBAL.OPERATIONS")
      value: (item) ->
        label: $translate("GLOBAL.EDIT")
        link: "#/settings/endpoints/#{item.name}"

  $scope.operations =
    delete:
      label: $translate("ENDPOINT.REMOVE")
      action: (endpoint) ->
        bin.remove(endpoint.name).then(fetchEndpoints)

  $http.get('/endpointtype').then (result) ->
    $scope.types = result.data
    return result.data
  .then ->
    if $routeParams.endpoint
      bin.get($routeParams.endpoint).then (endpoint) ->
        console.log endpoint
        $scope.endpoint = endpoint
        $scope.autosave = new InputAutoSave $scope.endpoint,
          ->
            bin.set($scope.endpoint.name, $scope.endpoint)
          , -> $scope.editEndpointForm.$valid
        endpoint.authorized = $http.get("/endpoint/#{endpoint.name}")
        .then (result) -> result.data.authorized
      return

  fetchEndpoints = ->
    bin.listAll().then (result) ->
      $scope.endpoints = _.toArray(result)

  fetchEndpoints()

  $scope.getSettings = (type) ->
    return {} if not type
    return $scope.types[type].settings

  $scope.mainClass = ->
    if $scope.endpoint then "span6" else "span12"

  $scope.authorize = (endpoint) ->
    $http.post("/endpoint/#{endpoint.name}")

  $scope.newEndpoint = { settings: {} }
  $scope.addEndpoint = ->
    if $scope.addEndpointForm.$valid
      $scope.newEndpoint.type = $scope.type.name
      bin.set($scope.newEndpoint.name, $scope.newEndpoint)
      fetchEndpoints()
  return
])
