angular.module("konzilo.channel", ["konzilo.config",
'konzilo.translations', 'konzilo.contenttype'])
.config(["$routeProvider", "entityInfoProvider", "$translateProvider",
($routeProvider, entityInfoProvider, $translateProvider) ->
  entityInfoProvider.addProvider "Channel",
    storageController: "ChannelStorage"
    labelProperty: "name"
    idProperty: "_id"
    properties:
      _id:
        label: "ID"
        type: String
      name:
        label: "Name"
        type: String
      description:
        label: "Description"
        type: String
      endpoint: String
    operations:
      delete:
        label: "Remove channel"
        action: (channel) ->
          channel.remove()

  channelAdmin =
    controller: "ChannelAdminController"
    templateUrl: "bundles/channel/channel-admin.html"
    resolve:
      access: (userAccess) ->
        userAccess("administer system")

  $routeProvider.when('/settings/channels', channelAdmin)
  $routeProvider.when('/settings/channels/:channel', channelAdmin)
])
.run(["konziloMenu", (konziloMenu) ->
  konziloMenu("settingsMenu").addItem "#/settings/channels", "Kanaler",
    (userAccess) ->
      userAccess("administer system")
])
.factory("ChannelStorage", ["KonziloStorage", (KonziloStorage) ->
  return new KonziloStorage "/channel/:_id", "Channel"
])
.controller("ChannelAdminController",
["$scope", "KonziloConfig", "$http", "$routeParams",
"InputAutoSave", "ChannelStorage", "$translate", "articleParts",
($scope, KonziloConfig, $http, $routeParams,
InputAutoSave, ChannelStorage, $translate, articleParts) ->
  bin = KonziloConfig.get("endpoints")

  $scope.query = {}
  $scope.types = articleParts.labels()

  $scope.properties =
    name: $translate("GLOBAL.NAME")
    endpoint: $translate("GLOBAL.ENDPOINT")
    operations:
      label: $translate("GLOBAL.OPERATIONS")
      value: (item) ->
        label: $translate("GLOBAL.EDIT")
        link: "#/settings/channels/#{item._id}"

  bin.listAll().then (endpoints) ->
    $scope.endpoints = endpoints
    if $routeParams.channel
      ChannelStorage.get($routeParams.channel).then (channel) ->
        $scope.channel = channel.toObject()
        $scope.channel.contentType = $scope.channel.contentType or {}
        $scope.endpoint = $scope.endpoints[$scope.channel.endpoint]
        valid = -> $scope.editChannelForm.$valid
        save = -> ChannelStorage.save($scope.channel)
        $scope.autosave = InputAutoSave.createInstance($scope.channel,
          save, valid)

  $scope.newChannel = {}
  $scope.addChannel = ->
    if $scope.addChannelForm.$valid
      ChannelStorage.save($scope.newChannel).then -> fetchChannels()
  return
])
