(function() {
  angular.module("kntnt.map", ["ui.bootstrap", "cmf.input", "konzilo.config", "konzilo.translations"]).config([
    "$routeProvider", "entityInfoProvider", function($routeProvider, entityInfoProvider) {
      var map;
      entityInfoProvider.addProvider("Target", {
        storageController: "TargetStorage",
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
          steps: []
        },
        operations: {
          "delete": {
            label: "Remove term",
            action: function(term) {
              return term.remove();
            }
          }
        }
      });
      map = {
        controller: 'MapController',
        templateUrl: 'bundles/map/map.html',
        resolve: {
          access: function(userAccess) {
            return userAccess("administer system");
          }
        }
      };
      return $routeProvider.when('/settings/targets', map).when('/settings/targets/:target', map);
    }
  ]).run([
    "konziloMenu", "$translate", function(konziloMenu, $translate) {
      return konziloMenu("settingsMenu").addItem("#/settings/targets", $translate("TARGET.TITLE"), function(userAccess) {
        return userAccess("administer system");
      });
    }
  ]).factory("TargetStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage("/target/:_id", "Target");
    }
  ]).factory("MapMoods", function() {
    return {
      thinking: "TARGET.THINKING",
      infoabout: "TARGET.INFOABOUT",
      influences: "TARGET.INFLUENCES",
      doing: "TARGET.DOING",
      influenced: "TARGET.INFLUENCED",
      experience: "TARGET.EXPERIENCE"
    };
  }).factory("kzAnalysisDialog", [
    "MapMoods", "$modal", function(MapMoods, $modal) {
      return function(target) {
        return $modal.open({
          templateUrl: 'bundles/map/target-analysis.html',
          controller: function($scope, target, $modalInstance) {
            $scope.target = target;
            $scope.moods = MapMoods;
            return $scope.close = function() {
              return $modalInstance.close();
            };
          },
          resolve: {
            target: function() {
              return target;
            }
          }
        }).result;
      };
    }
  ]).controller("MapController", [
    "$scope", "TargetStorage", "$routeParams", "StepStorage", "InputAutoSave", "MapMoods", "$translate", "$location", function($scope, TargetStorage, $routeParams, StepStorage, InputAutoSave, MapMoods, $translate, $location) {
      var newTarget, setActive, target;
      $scope.newTopics = {};
      $scope.$parent.title = $translate("TARGET.TITLE");
      $scope.moods = MapMoods;
      $scope.steps = StepStorage.query({
        sort: {
          weight: "asc"
        }
      }).then(function(result) {
        return result.toArray();
      });
      newTarget = function() {
        return $scope.target = {
          strategies: [],
          descriptions: [],
          reasons: [],
          keywords: [],
          weight: 0
        };
      };
      $scope.removeTarget = function(target) {
        if (!target._id) {
          return;
        }
        if (confirm($translate('TARGET.CONFIRMREMOVE'))) {
          return TargetStorage.remove(target._id).then(function(result) {
            return $scope.targets = TargetStorage.query().then(function(result) {
              result.toArray();
              return $location.url("/settings/targets");
            });
          });
        }
      };
      $scope.newTarget = function() {
        var target;
        target = newTarget();
        target.name = $scope.targetName;
        $scope.targetName = "";
        return TargetStorage.save(target).then(function(result) {
          return $location.url("/settings/targets/" + result._id);
        });
      };
      $scope.targets = TargetStorage.query().then(function(result) {
        return result.toArray();
      });
      $scope.$watch("target", $scope.saveTarget);
      setActive = function(target) {
        target = target.toObject();
        target.steps = target.steps || {};
        target.analysis = target.analysis || {
          thinking: [],
          infoabout: [],
          influences: [],
          doing: [],
          influenced: [],
          experience: []
        };
        $scope.steps.then(function(steps) {
          var step, _i, _len, _results;
          _results = [];
          for (_i = 0, _len = steps.length; _i < _len; _i++) {
            step = steps[_i];
            target.steps[step._id] = target.steps[step._id] || {};
            target.steps[step._id].topics = target.steps[step._id].topics || [];
            _results.push($scope.newTopics[step._id] = {});
          }
          return _results;
        });
        $scope.target = _.clone(target);
        $scope.autosave = InputAutoSave.createInstance($scope.target, $scope.saveTarget, function() {
          return $scope.mapForm.$valid;
        });
        return $scope.title = $scope.target.name;
      };
      $scope.addTopic = function(step, stepId) {
        step.topics.push({
          name: $scope.newTopics[stepId].name,
          description: $scope.newTopics[stepId].description
        });
        return $scope.newTopics[stepId] = {};
      };
      $scope.saveTarget = function() {
        var target;
        if (!angular.equals($scope.target, target)) {
          target = _.clone($scope.target);
          TargetStorage.save($scope.target);
          $scope.targets = TargetStorage.query().then(function(result) {
            return result.toArray();
          });
          if (!$scope.target._id) {
            return $scope.target = {};
          }
        }
      };
      if ($routeParams.target) {
        return target = TargetStorage.get($routeParams.target).then(setActive);
      }
    }
  ]);

}).call(this);
