(function() {
  angular.module("konzilo.channel", ["konzilo.config", 'konzilo.translations']).config([
    "$routeProvider", "entityInfoProvider", "$translateProvider", function($routeProvider, entityInfoProvider, $translateProvider) {
      var channelAdmin;
      entityInfoProvider.addProvider("Channel", {
        storageController: "ChannelStorage",
        labelProperty: "name",
        idProperty: "_id",
        properties: {
          _id: {
            label: "ID",
            type: String
          },
          name: {
            label: "Name",
            type: String
          },
          description: {
            label: "Description",
            type: String
          },
          endpoint: String
        },
        operations: {
          "delete": {
            label: "Remove channel",
            action: function(channel) {
              return channel.remove();
            }
          }
        }
      });
      channelAdmin = {
        controller: "ChannelAdminController",
        templateUrl: "bundles/channel/channel-admin.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("administer system");
          }
        }
      };
      $routeProvider.when('/settings/channels', channelAdmin);
      return $routeProvider.when('/settings/channels/:channel', channelAdmin);
    }
  ]).run([
    "konziloMenu", function(konziloMenu) {
      return konziloMenu("settingsMenu").addItem("#/settings/channels", "Kanaler", function(userAccess) {
        return userAccess("administer system");
      });
    }
  ]).factory("ChannelStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage("/channel/:_id", "Channel");
    }
  ]).controller("ChannelAdminController", [
    "$scope", "KonziloConfig", "$http", "$routeParams", "InputAutoSave", "ChannelStorage", "$translate", function($scope, KonziloConfig, $http, $routeParams, InputAutoSave, ChannelStorage, $translate) {
      var bin;
      bin = KonziloConfig.get("endpoints");
      $scope.endpoints = bin.listAll();
      $scope.query = {};
      $scope.properties = {
        name: $translate("GLOBAL.NAME"),
        endpoint: $translate("GLOBAL.ENDPOINT"),
        operations: {
          label: $translate("GLOBAL.OPERATIONS"),
          value: function(item) {
            return {
              label: $translate("GLOBAL.EDIT"),
              link: "#/settings/channels/" + item._id
            };
          }
        }
      };
      if ($routeParams.channel) {
        ChannelStorage.get($routeParams.channel).then(function(channel) {
          var save, valid;
          $scope.channel = channel.toObject();
          valid = function() {
            return $scope.editChannelForm.$valid;
          };
          save = function() {
            return ChannelStorage.save($scope.channel);
          };
          return $scope.autosave = new InputAutoSave($scope.channel, save, valid);
        });
      }
      $scope.mainClass = function() {
        if ($scope.channel) {
          return "span6";
        } else {
          return "span12";
        }
      };
      $scope.newChannel = {};
      $scope.addChannel = function() {
        if ($scope.addChannelForm.$valid) {
          return ChannelStorage.save($scope.newChannel).then(function() {
            return fetchChannels();
          });
        }
      };
    }
  ]);

}).call(this);
