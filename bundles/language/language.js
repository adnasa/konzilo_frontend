(function() {
  angular.module("konzilo.language", ["konzilo.translations"]).value("directions", {
    rtl: "Right to left",
    ltr: "Left to right"
  }).config([
    "$routeProvider", function($routeProvider) {
      var languageAdmin;
      languageAdmin = {
        controller: "LanguageAdminController",
        templateUrl: "bundles/language/language-admin.html",
        resolve: {
          access: function(userAccess) {
            return userAccess("administer system");
          }
        }
      };
      return $routeProvider.when('/settings/languages', languageAdmin);
    }
  ]).run([
    "konziloMenu", "$translate", function(konziloMenu, $translate) {
      return konziloMenu("settingsMenu").addItem("#/settings/languages", $translate("LANGUAGE.TITLE"), function(userAccess) {
        return userAccess("administer system");
      });
    }
  ]).controller("LanguageAdminController", [
    "$scope", "KonziloConfig", "directions", "$q", "$translate", function($scope, KonziloConfig, directions, $q, $translate) {
      var bin, getLanguages;
      bin = KonziloConfig.get("languages");
      $scope.directions = directions;
      getLanguages = function() {
        return bin.listAll().then(function(result) {
          return $scope.languages = _.toArray(result);
        });
      };
      getLanguages();
      $scope.properties = {
        name: $translate("GLOBAL.NAME"),
        langcode: $translate("LANGUAGE.LANGCODE"),
        "default": $translate("LANGUAGE.STANDARDLANG"),
        direction: $translate("LANGUAGE.DIRECTION")
      };
      $scope.operations = {
        remove: {
          label: $translate("GLOBAL.REMOVE"),
          action: function(item) {
            return bin.remove(item.langcode).then(function() {
              return getLanguages();
            });
          }
        },
        setdefault: {
          label: $translate("LANGUAGE.SETDEFAULT"),
          action: function(item) {
            var lang, promises;
            promises = (function() {
              var _i, _len, _ref, _results;
              _ref = $scope.languages;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                lang = _ref[_i];
                if (!(lang.langcode !== item.langcode)) {
                  continue;
                }
                lang["default"] = false;
                _results.push(bin.set(lang.langcode, lang));
              }
              return _results;
            })();
            item["default"] = true;
            return $q.all(promises).then(function() {
              return bin.set(item.langcode, item);
            });
          }
        }
      };
      $scope.addLanguage = function() {
        if ($scope.languages.length === 0) {
          $scope.language["default"] = true;
        }
        bin.set($scope.language.langcode, $scope.language).then(function() {
          return getLanguages();
        });
        return $scope.language = {};
      };
    }
  ]);

}).call(this);
