(function() {
  angular.module("konzilo.step", ["konzilo.config", "konzilo.translations"]).config([
    "$routeProvider", "entityInfoProvider", function($routeProvider, entityInfoProvider) {
      var stepAdmin;
      entityInfoProvider.addProvider("Step", {
        storageController: "StepStorage",
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
            label: "Remove",
            action: function(step) {
              return step.remove();
            }
          }
        }
      });
      stepAdmin = {
        controller: "StepAdminController",
        templateUrl: "bundles/step/step-admin.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("administer system");
          }
        }
      };
      $routeProvider.when('/settings/steps', stepAdmin);
      return $routeProvider.when('/settings/steps/:step', stepAdmin);
    }
  ]).run([
    "konziloMenu", "$translate", function(konziloMenu, $translate) {
      return konziloMenu("settingsMenu").addItem("#/settings/steps", $translate("STEP.TITLE"), function(userAccess) {
        return userAccess("administer system");
      });
    }
  ]).factory("StepStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage("/step/:_id", "Step");
    }
  ]).controller("StepAdminController", [
    "$scope", "$http", "$routeParams", "InputAutoSave", "StepStorage", "KonziloConfig", "$translate", "$location", function($scope, $http, $routeParams, InputAutoSave, StepStorage, KonziloConfig, $translate, $location) {
      $scope.query = {
        q: {},
        sort: {
          weight: "asc"
        }
      };
      $scope.properties = {
        name: $translate("GLOBAL.NAME"),
        operations: {
          label: $translate("GLOBAL.OPERATIONS"),
          value: function(item) {
            return {
              label: $translate("GLOBAL.EDIT"),
              link: "#/settings/steps/" + item._id
            };
          }
        }
      };
      if ($routeParams.step) {
        StepStorage.get($routeParams.step).then(function(step) {
          var save, valid;
          $scope.step = step.toObject();
          valid = function() {
            return $scope.editStepForm.$valid;
          };
          save = function() {
            return StepStorage.save($scope.step);
          };
          return $scope.autosave = InputAutoSave.createInstance($scope.step, save, valid);
        });
      }
      $scope.mainClass = function() {
        if ($scope.step) {
          return "span6";
        } else {
          return "span12";
        }
      };
      $scope.newStep = {};
      $scope.addStep = function() {
        if ($scope.addStepForm.$valid) {
          return StepStorage.save($scope.newStep).then(function() {
            return $scope.newStep = {};
          });
        }
      };
      $scope.removeStep = function(step) {
        if (confirm($translate("STEP.CONFIRMREMOVE"))) {
          return StepStorage.remove(step._id).then(function() {
            return $location.url('/settings/steps');
          });
        }
      };
    }
  ]);

}).call(this);
