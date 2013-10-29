angular.module("konzilo.channel", ["konzilo.config", 'konzilo.translations'])
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
"InputAutoSave", "ChannelStorage", "$translate",
($scope, KonziloConfig, $http, $routeParams,
InputAutoSave, ChannelStorage, $translate) ->
  bin = KonziloConfig.get("endpoints")
  $scope.endpoints = bin.listAll()
  $scope.query = {}

  $scope.properties =
    name: $translate("GLOBAL.NAME")
    endpoint: $translate("GLOBAL.ENDPOINT")
    operations:
      label: $translate("GLOBAL.OPERATIONS")
      value: (item) ->
        label: $translate("GLOBAL.EDIT")
        link: "#/settings/channels/#{item._id}"

  if $routeParams.channel
    ChannelStorage.get($routeParams.channel).then (channel) ->
      $scope.channel = channel.toObject()
      valid = -> $scope.editChannelForm.$valid
      save = -> ChannelStorage.save($scope.channel)
      $scope.autosave = InputAutoSave.createInstance($scope.channel,
        save, valid)

  $scope.mainClass = ->
    if $scope.channel then "span6" else "span12"

  $scope.newChannel = {}
  $scope.addChannel = ->
    if $scope.addChannelForm.$valid
      ChannelStorage.save($scope.newChannel).then -> fetchChannels()
  return
])
