(function() {
  angular.module("kntnt.deliver", ["kntnt.article", "ui.bootstrap", "konzilo.entity", "kntnt.clipboard", "konzilo.translations"]).config([
    "$routeProvider", function($routeProvider) {
      var deliver;
      deliver = {
        controller: "DeliverController",
        templateUrl: "bundles/deliver/deliver.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("update article part content");
          }
        }
      };
      return $routeProvider.when('/deliver', deliver).when("/deliver/:id", deliver);
    }
  ]).run([
    "konziloMenu", "$translate", function(konziloMenu, $translate) {
      var item, menu;
      menu = konziloMenu("mainMenu");
      return item = menu.addItem({
        path: "/#/deliver",
        label: $translate("DELIVER.TITLE"),
        icon: "icon-truck"
      }, function(userAccess) {
        return userAccess("update article part content");
      });
    }
  ]).controller("DeliverInfo", [
    "$scope", "TargetStorage", "ChannelStorage", "StepStorage", "KonziloConfig", "kzAnalysisDialog", function($scope, TargetStorage, ChannelStorage, StepStorage, KonziloConfig, kzAnalysisDialog) {
      var update;
      $scope.showAnalysis = function(target) {
        return kzAnalysisDialog(target);
      };
      update = function() {
        if (!$scope.part) {
          return;
        }
        $scope.translations = {};
        $scope.article = $scope.part.article;
        if ($scope.part.article.topic) {
          $scope.translations.topic = $scope.part.article.topic;
        }
        if ($scope.part.article.target) {
          TargetStorage.get($scope.part.article.target).then(function(result) {
            $scope.target = result.toObject();
            return $scope.translations.target = $scope.target.name;
          });
        }
        if ($scope.part.article.channel) {
          $scope.channel = ChannelStorage.get($scope.part.article.channel).then(function(result) {
            return result.toObject();
          });
        }
        if ($scope.part.article.step) {
          $scope.step = StepStorage.get($scope.part.article.step).then(function(result) {
            return result.toObject();
          });
        }
        if ($scope.part.language) {
          return $scope.language = KonziloConfig.get("languages").get($scope.part.language);
        }
      };
      return $scope.$watch("part", update);
    }
  ]).directive("kzDeliverInfo", function() {
    return {
      restrict: "AE",
      scope: {
        part: "="
      },
      controller: "DeliverInfo",
      templateUrl: 'bundles/deliver/deliver-info.html'
    };
  }).controller("DeliverController", [
    "$scope", "ArticlePartStorage", "$routeParams", "$translate", "UserState", function($scope, ArticlePartStorage, $routeParams, $translate, UserState) {
      var userId;
      $scope.states = ["notstarted", "started", "needsreview"];
      $scope.useSave = true;
      $scope.translations = {};
      userId = UserState.getInfo().info._id;
      $scope.isLocked = function(part) {
        return (part != null ? part.locked : void 0) !== userId;
      };
      $scope.unlockPart = function(part) {
        return part.locked = userId;
      };
      $scope.$parent.title = $translate("DELIVER.TITLE");
      if ($routeParams.id) {
        return ArticlePartStorage.get($routeParams.id, function(articlePart) {
          $scope.articlePart = articlePart;
          return $scope.part = articlePart.toObject();
        });
      }
    }
  ]);

}).call(this);
