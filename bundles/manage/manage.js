(function() {
  angular.module("konzilo.manage", ["konzilo.config", "konzilo.translations"]).config([
    "$routeProvider", function($routeProvider) {
      var manageAdmin;
      manageAdmin = {
        controller: "ManageController",
        templateUrl: "bundles/manage/manage.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("create articles");
          }
        }
      };
      $routeProvider.when('/manage', manageAdmin);
      $routeProvider.when('/manage/:article', manageAdmin);
      $routeProvider.when('/manage/:article/:part', manageAdmin);
    }
  ]).run([
    "konziloMenu", "$translate", function(konziloMenu, $translate) {
      var item, menu;
      menu = konziloMenu("mainMenu");
      return item = menu.addItem({
        path: "/#/manage",
        label: $translate("MANAGE.TITLE"),
        icon: "icon-edit"
      }, function(userAccess) {
        return userAccess("create articles");
      });
    }
  ]).controller("ManageController", [
    "$scope", "$routeParams", "ArticleStorage", "ArticlePartStorage", "KonziloConfig", "articleParts", "$translate", "$filter", "UserState", "$http", "ChannelStorage", "ArticlePartStates", "$location", function($scope, $routeParams, ArticleStorage, ArticlePartStorage, KonziloConfig, articleParts, $translate, $filter, UserState, $http, ChannelStorage, ArticlePartStates, $location) {
      var user;
      $scope.types = articleParts.labels();
      $scope.newPart = {};
      user = UserState.getInfo().info;
      $scope.translations = {};
      $scope.$parent.title = $translate("MANAGE.TITLE");
      $scope.articleDefaults = {
        publishdate: new Date()
      };
      if ($routeParams.article) {
        ArticleStorage.get($routeParams.article).then(function(result) {
          return result.toObject();
        }).then(function(article) {
          $scope.article = article;
          if (!article.channel) {
            return;
          }
          return ChannelStorage.get(article.channel).then(function(channel) {
            var endpoint;
            endpoint = channel.get("endpoint");
            $scope.channel = channel.toObject();
            $scope.translations.channel = channel.name;
            return $http.get("/endpoint/" + endpoint + "/jobs/" + $scope.article._id).then(function(result) {
              $scope.publishInfo = result.data[0];
              return $scope.publishDate = $filter('date')($scope.publishInfo.date, 'yyyy-MM-dd HH:mm');
            });
          });
        });
      }
      $scope.remove = function(part) {
        if (confirm($translate("MANAGE.CONFIRMPARTREMOVE"))) {
          return ArticlePartStorage.remove(part._id).then(function() {
            return ArticleStorage.get($routeParams.article).then(function(result) {
              return $scope.article = result.toObject();
            });
          });
        }
      };
      $scope.removeArticle = function(article) {
        if (confirm($translate("MANAGE.CONFIRMARTICLEREMOVE"))) {
          return ArticleStorage.remove(article._id).then(function() {
            return $location.path('/manage');
          });
        }
      };
      $scope.states = ArticlePartStates;
      $scope.saveNewPart = function() {
        if ($scope.newPartForm.$valid) {
          return KonziloConfig.get("languages").listAll().then(function(languages) {
            var articlePart, defaultLang;
            defaultLang = _.find(languages, {
              "default": true
            });
            articlePart = {
              article: $scope.article._id,
              title: $scope.newPart.name,
              type: $scope.newPart.type,
              submitter: user._id,
              state: "approved"
            };
            if (defaultLang) {
              articlePart.language = defaultLang.langcode;
            }
            return ArticlePartStorage.save(articlePart).then(function(result) {
              return ArticleStorage.get($routeParams.article).then(function(result) {
                return $scope.article = result.toObject();
              });
            });
          });
        }
      };
    }
  ]);

}).call(this);
