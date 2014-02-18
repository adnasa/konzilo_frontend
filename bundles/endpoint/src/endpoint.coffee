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
"$routeParams", "InputAutoSave", "$translate", "$location",
($scope, KonziloConfig, $http, $routeParams,
InputAutoSave, $translate, $location) ->
  bin = KonziloConfig.get("endpoints")

  $http.get('/endpointtype').then (result) ->
    $scope.types = result.data
    return result.data
  .then ->
    if $routeParams.endpoint
      bin.get($routeParams.endpoint).then (endpoint) ->
        $scope.settings = $scope.types[endpoint.type]?.settings or {}
        $scope.endpoint = endpoint
        $scope.endpoint.settings = {} if not $scope.endpoint.settings
        $scope.autosave = InputAutoSave.createInstance $scope.endpoint,
          ->
            bin.set($scope.endpoint.name, $scope.endpoint)
          , -> $scope.editEndpointForm.$valid
        endpoint.authorized = $http.get("/endpoint/#{endpoint.name}")
        .then (result) -> result.data.authorized
      return
  $scope.valid = (name) ->
    if not $scope.endpoints
      fetchEndpoints()
      return false
    not _.find($scope.endpoints, name: name)

  fetchEndpoints = ->
    bin.listAll().then (result) ->
      $scope.endpoints = _.toArray(result)

  fetchEndpoints()

  $scope.deleteEndpoint = (endpoint) ->
    if confirm($translate("ENDPOINT.CONFIRMREMOVE"))
      bin.remove(endpoint.name).then ->
        $location.url("/settings/endpoints")

  $scope.mainClass = ->
    if $scope.endpoint then "span6" else "span12"

  $scope.authorize = (endpoint) ->
    $http.post("/endpoint/#{endpoint.name}")

  $scope.newEndpoint = { settings: {} }
  $scope.addEndpoint = ->
    if $scope.addEndpointForm.$valid
      $scope.newEndpoint.type = $scope.type.name
      bin.set($scope.newEndpoint.name, $scope.newEndpoint).then ->
        $location.url("/settings/endpoints/#{$scope.newEndpoint.name}")
      fetchEndpoints()
  return
])
