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
    '$scope', 'ArticleStorage', "ArticlePartStorage", '$routeParams', '$translate', "$location", function($scope, ArticleStorage, ArticlePartStorage, $routeParams, $translate, $location) {
      var getPart;
      $scope.failState = "started";
      $scope.approveState = "approved";
      $scope.$parent.title = $translate("REVIEW.TITLE");
      getPart = function(reset) {
        if (reset == null) {
          reset = true;
        }
        if (reset) {
          ArticleStorage.clearCache();
        }
        return ArticlePartStorage.get($routeParams.id, function(part) {
          $scope.article = part.get('article');
          return $scope.part = part;
        });
      };
      if ($routeParams.id) {
        return getPart();
      }
    }
  ]).directive("kzApproveQueue", [
    "ArticlePartStorage", "UserState", function(ArticlePartStorage, UserState) {
      return {
        restrict: "AE",
        scope: {
          selected: "=",
          linkPattern: "@",
          part: "="
        },
        controller: function($scope) {
          var getArticles, query, user;
          user = UserState.getInfo().info._id;
          query = {
            state: "needsreview",
            submitter: user
          };
          getArticles = function() {
            ArticlePartStorage.query({
              q: query,
              limit: 500
            }).then(function(result) {
              var article, articlePart, _i, _len, _ref;
              $scope.articles = {};
              _ref = result.toArray();
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                articlePart = _ref[_i];
                article = articlePart.article;
                if (!$scope.articles[article._id]) {
                  $scope.articles[article._id] = article;
                  $scope.articles[article._id].parts = [];
                }
                articlePart.link = $scope.linkPattern.replace(":part", articlePart._id);
                $scope.articles[article._id].parts.push(articlePart);
              }
              return $scope.size = _.size($scope.articles);
            });
            $scope.toggleArticle = function(article) {
              if ($scope.selectedArticle === article._id) {
                return $scope.selectedArticle = null;
              } else {
                return $scope.selectedArticle = article._id;
              }
            };
            return $scope.$watch("selected", function() {
              var _ref, _ref1;
              $scope.selectedArticle = (_ref = $scope.selected) != null ? _ref.get("article")._id : void 0;
              return $scope.selectedId = (_ref1 = $scope.selected) != null ? _ref1.get('_id') : void 0;
            });
          };
          getArticles();
          return ArticlePartStorage.changed(getArticles);
        },
        templateUrl: "bundles/approve/approve-queue.html"
      };
    }
  ]);

}).call(this);
