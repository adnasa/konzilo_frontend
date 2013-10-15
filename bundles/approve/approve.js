(function() {
  angular.module("kntnt.approve", ["kntnt.article", "ui.bootstrap", "konzilo.entity", "kntnt.clipboard", "konzilo.translations"]).config([
    '$routeProvider', function($routeProvider) {
      var approve;
      approve = {
        controller: "ApproveController",
        templateUrl: "bundles/approve/approve.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("update article parts");
          }
        }
      };
      return $routeProvider.when('/approve', approve).when("/approve/:id", approve);
    }
  ]).run([
    'konziloMenu', '$translate', function(konziloMenu, $translate) {
      var item, menu;
      menu = konziloMenu("mainMenu");
      return item = menu.addItem({
        path: "/#/approve",
        label: $translate("REVIEW.TITLE"),
        icon: "icon-eye-open"
      }, function(userAccess) {
        return userAccess("update article parts");
      });
    }
  ]).controller("ApproveController", [
    '$scope', 'ClipboardStorage', 'ArticlePartStorage', '$routeParams', 'TargetStorage', 'StepStorage', 'kzAnalysisDialog', '$translate', "$location", function($scope, ClipboardStorage, ArticlePartStorage, $routeParams, TargetStorage, StepStorage, kzAnalysisDialog, $translate, $location) {
      $scope.query = {
        state: "needsreview"
      };
      $scope.failState = "started";
      $scope.approveState = "approved";
      $scope.$parent.title = $translate("REVIEW.TITLE");
      ArticlePartStorage.changed(function(part) {
        var state;
        if ($location.path().indexOf("approve")) {
          state = part.get("state");
        }
        if ($routeParams.id === part.id() && (state === $scope.failState || state === $scope.approveState)) {
          return $location.url("/approve");
        }
      });
      if ($routeParams.id) {
        ArticlePartStorage.get($routeParams.id, function(articlePart) {
          $scope.articlePart = articlePart;
          $scope.part = articlePart.toObject();
          $scope.translateVars = {
            topic: $scope.part.article.topic
          };
          if ($scope.part.article.target) {
            return $scope.target = TargetStorage.get($scope.part.article.target).then(function(result) {
              $scope.translateVars['name'] = result.get("name");
              return result.toObject();
            });
          }
        });
      }
      return $scope.showAnalysis = function(target) {
        return kzAnalysisDialog(target);
      };
    }
  ]);

}).call(this);
