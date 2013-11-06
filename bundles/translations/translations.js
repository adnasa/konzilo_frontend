(function() {
  angular.module('konzilo.translations', ['pascalprecht.translate']).config([
    "$translateProvider", function($translateProvider) {
      $translateProvider.useLoader("kzLanguageLoader");
      $translateProvider.fallbackLanguage('default');
      return $translateProvider.preferredLanguage('default');
    }
  ]).directive("languageSwitcher", function() {
    return {
      restrict: 'AE',
      scope: {
        defaults: "="
      },
      replace: true,
      controller: [
        "$scope", "$element", "$attrs", "$translate", "KonziloConfig", "UserState", function($scope, $element, $attrs, $translate, KonziloConfig, UserState) {
          var getLangs;
          getLangs = function() {
            return UserState.loggedIn(true).then(function() {
              var bin, info;
              $scope.showLangs = true;
              bin = KonziloConfig.get("languages");
              info = UserState.getInfo();
              if (info && info.info.language) {
                $scope.currentLanguage = info.info.language;
              } else {
                KonziloConfig.get("languages").listAll().then(function(languages) {
                  var language;
                  language = _.find(language, {
                    "default": true
                  });
                  return $scope.currentLanguage = language != null ? language.langcode : void 0;
                });
              }
              bin.listAll().then(function(languages) {
                return $scope.languages = languages;
              });
              return $scope.changeLanguage = function(langCode) {
                $translate.uses(langCode);
                return $scope.currentLanguage = langCode;
              };
            });
          };
          getLangs();
          return UserState.infoSaved(getLangs);
        }
      ],
      templateUrl: "bundles/translations/language-switcher.html"
    };
  }).factory('kzLanguageLoader', [
    "$http", function($http) {
      return function(options) {
        if (options.key === "default") {
          return $http.get("/language").then(function(result) {
            return result.data;
          });
        } else {
          return $http.get("locale/" + options.key + ".json").then(function(result) {
            return result.data;
          });
        }
      };
    }
  ]);

}).call(this);
