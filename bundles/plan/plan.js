(function() {
  angular.module("kntnt.plan", ["kntnt.article", "ui.bootstrap", "kntnt.clipboard", "kntnt.map", "ui.scrollfix", "konzilo.comment", "konzilo.query", "konzilo.step", "konzilo.translations"]).config([
    "$routeProvider", function($routeProvider) {
      var plan;
      plan = {
        controller: "PlanController",
        templateUrl: "bundles/plan/plan.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("create articles");
          }
        }
      };
      return $routeProvider.when('/plan', plan).when("/plan/:id", plan);
    }
  ]).run([
    "konziloMenu", "$translate", function(konziloMenu, $translate) {
      var item, menu;
      menu = konziloMenu("mainMenu");
      return item = menu.addItem({
        path: "/#/plan",
        label: $translate("PLAN.TITLE"),
        icon: "icon-calendar"
      }, function(userAccess) {
        return userAccess("create articles");
      });
    }
  ]).controller("PlanController", [
    "$scope", "ArticleStorage", "$routeParams", "$translate", "$location", function($scope, ArticleStorage, $routeParams, $translate, $location) {
      $scope.$parent.title = $translate("PLAN.TITLE");
      $scope.options = {
        stop: function() {
          return TargetStorage.sort($scope.articlesSorted, "weight");
        },
        placeholder: "ui-placeholder box pad"
      };
      $scope.$watch("firstArticle", function() {
        if ($scope.firstArticle && !$routeParams.id) {
          return $location.path("/plan/" + $scope.firstArticle._id);
        }
      });
      $scope.articleCreated = function(article) {
        return $location.path("/plan/" + article._id);
      };
      if ($routeParams.id) {
        return ArticleStorage.get($routeParams.id, function(article) {
          return $scope.article = article.toObject();
        });
      }
    }
  ]);

}).call(this);
