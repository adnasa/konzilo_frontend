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
        if (!$scope.articlePart) {
          return;
        }
        $scope.article = $scope.articlePart.get("article");
        $scope.part = $scope.articlePart.toObject();
        $scope.translations = {};
        if ($scope.article.topic) {
          $scope.translations.topic = $scope.article.topic;
        }
        if ($scope.article.target) {
          TargetStorage.get($scope.article.target).then(function(result) {
            $scope.target = result.toObject();
            return $scope.translations.target = $scope.target.name;
          });
        }
        if ($scope.article.channel) {
          $scope.channel = ChannelStorage.get($scope.article.channel).then(function(result) {
            return result.toObject();
          });
        }
        if ($scope.article.step) {
          $scope.step = StepStorage.get($scope.article.step).then(function(result) {
            return result.toObject();
          });
        }
        return $scope.language = KonziloConfig.get("languages").get($scope.part.language);
      };
      return $scope.$watch("articlePart", update);
    }
  ]).directive("kzDeliverInfo", function() {
    return {
      restrict: "AE",
      scope: {
        articlePart: "="
      },
      controller: "DeliverInfo",
      templateUrl: 'bundles/deliver/deliver-info.html'
    };
  }).controller("DeliverController", [
    "$scope", "ArticlePartStorage", "$routeParams", "$translate", "UserState", "GroupStorage", function($scope, ArticlePartStorage, $routeParams, $translate, UserState, GroupStorage, ChannelStorage, kzShowFields) {
      var getPart, userId;
      $scope.states = ["notstarted", "started", "needsreview"];
      $scope.useSave = true;
      $scope.translations = {};
      userId = UserState.getInfo().info._id;
      $scope.$parent.title = $translate("DELIVER.TITLE");
      getPart = function(id) {
        return ArticlePartStorage.get(id).then(function(part) {
          $scope.part = part;
          $scope.article = part.get("article");
          return part;
        });
      };
      if ($routeParams.id) {
        return getPart($routeParams.id);
      }
    }
  ]);

}).call(this);
