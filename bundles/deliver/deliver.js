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
  ]).controller("DeliverController", [
    "$scope", "ClipboardStorage", "ArticlePartStorage", "$routeParams", "TargetStorage", "StepStorage", "ChannelStorage", "kzAnalysisDialog", "$translate", function($scope, ClipboardStorage, ArticlePartStorage, $routeParams, TargetStorage, StepStorage, ChannelStorage, kzAnalysisDialog, $translate) {
      $scope.states = ["notstarted", "started", "needsreview"];
      $scope.useSave = true;
      $scope.translations = {};
      $scope.$parent.title = $translate("DELIVER.TITLE");
      if ($routeParams.id) {
        ArticlePartStorage.get($routeParams.id, function(articlePart) {
          $scope.articlePart = articlePart;
          $scope.part = articlePart.toObject();
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
            return $scope.step = StepStorage.get($scope.part.article.step).then(function(result) {
              return result.toObject();
            });
          }
        });
        return $scope.showAnalysis = function(target) {
          return kzAnalysisDialog(target);
        };
      }
    }
  ]);

}).call(this);
