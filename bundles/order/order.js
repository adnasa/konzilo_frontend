(function() {
  angular.module("konzilo.order", ["konzilo.menu"]).config([
    "$routeProvider", "konziloMenuProvider", "$translateProvider", function($routeProvider, konziloMenuProvider, $translateProvider) {
      var menu, order;
      order = {
        controller: 'OrderController',
        templateUrl: 'bundles/order/order.html',
        resolve: {
          access: function(userAccess) {
            return userAccess("create article parts");
          }
        }
      };
      $routeProvider.when('/order', order).when('/order/:article', order).when('/order/:article/:part', order);
      menu = konziloMenuProvider.addMenu("mainMenu");
      konziloMenuProvider.addMenu("settingsMenu");
      return menu.setOrder(["/#/plan", "/#/order", "/#/deliver", "/#/approve", "/#/manage"]);
    }
  ]).run([
    "konziloMenu", "$translate", function(konziloMenu, $translate) {
      return konziloMenu("mainMenu").addItem({
        path: "/#/order",
        label: $translate("ORDER.TITLE"),
        icon: "icon-location-arrow"
      }, function(userAccess) {
        return userAccess("create article parts");
      });
    }
  ]).controller("OrderController", [
    "$scope", "ArticleStorage", "$routeParams", "UserStorage", "$q", "articleParts", "KonziloConfig", "TargetStorage", "InputAutoSave", "StepStorage", "ArticlePartStorage", "ChannelStorage", "$filter", "kzAnalysisDialog", "$location", function($scope, ArticleStorage, $routeParams, UserStorage, $q, articleParts, KonziloConfig, TargetStorage, InputAutoSave, StepStorage, ArticlePartStorage, ChannelStorage, $filter, kzAnalysisDialog, $location) {
      $scope.savePart = function() {
        ArticlePartStorage.save($scope.part);
      };
      $scope.today = new Date();
      $scope.translations = {};
      if ($routeParams.article) {
        ArticleStorage.get($routeParams.article, function(article) {
          $scope.article = article.toObject();
          $scope.translations["topic"] = $scope.article.topic;
          if ($scope.article.target) {
            TargetStorage.get($scope.article.target).then(function(result) {
              $scope.target = result.toObject();
              return $scope.translations["target"] = $scope.target.name;
            });
          }
          if ($scope.article.channel) {
            $scope.channel = ChannelStorage.get($scope.article.channel).then(function(result) {
              return result.toObject();
            });
          }
          if ($scope.article.step) {
            StepStorage.get($scope.article.step).then(function(result) {
              $scope.step = result.toObject();
              return $scope.translations["step"] = $scope.step.name;
            });
          }
          if ($routeParams.part) {
            return ArticlePartStorage.get($routeParams.part).then(function(part) {
              $scope.part = part.toObject();
              $scope.changeDate();
              $scope.part.terms = $scope.part.terms || [];
              if ($scope.autosave) {
                $scope.autosave.stop();
              }
              return $scope.autosave = new InputAutoSave($scope.part, $scope.savePart, function() {
                var _ref;
                return (_ref = $scope.partForm) != null ? _ref.$valid : void 0;
              });
            });
          }
        });
      }
      $scope.contentSaved = function(part) {
        if (!(part != null ? part.content : void 0)) {
          return false;
        }
        return _.size(part.content) > 0;
      };
      $scope.changeDate = function() {
        var _ref;
        if ((_ref = $scope.part) != null ? _ref.deadline : void 0) {
          return $scope.deadlinetime = $filter('date')($scope.part.deadline, "HH:mm");
        }
      };
      $scope.changeTime = function(time, date) {
        var result;
        if (time.match(/[0-9]{2}:[0-9]{2}/) && date) {
          result = time.split(':');
          date.setHours(result[0]);
          return date.setMinutes(result[1]);
        }
      };
      $scope.showAnalysis = function(target) {
        return kzAnalysisDialog(target);
      };
      $scope.fetchUsers = function() {
        var deferred;
        deferred = $q.defer();
        UserStorage.query({}, function(results) {
          return deferred.resolve(results.toArray());
        });
        return deferred.promise;
      };
      $scope.partCreated = function(article, part) {
        return $location.path("order/" + article._id + "/" + part._id);
      };
      $scope.types = articleParts.labels();
      return $scope.languages = KonziloConfig.get("languages").listAll();
    }
  ]);

}).call(this);
