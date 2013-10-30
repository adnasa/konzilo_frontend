(function() {
  angular.module("konzilo.vocabulary", ["ui.bootstrap", "cmf.input", "konzilo.config", "konzilo.entity", "konzilo.translations"]).config([
    "$routeProvider", "entityInfoProvider", function($routeProvider, entityInfoProvider) {
      var vocabulary;
      entityInfoProvider.addProvider("Term", {
        storageController: "TermStorage",
        labelProperty: "name",
        idProperty: "_id",
        properties: {
          _id: {
            label: "ID",
            type: String
          },
          vocabulary: {
            label: "Vokabulary",
            type: String
          },
          name: {
            label: "Name",
            type: String
          },
          description: {
            label: "Description",
            type: String
          }
        },
        operations: {
          "delete": {
            label: "Remove term",
            action: function(term) {
              return term.remove();
            }
          }
        }
      });
      vocabulary = {
        controller: 'VocabularyController',
        templateUrl: 'bundles/vocabulary/vocabulary.html',
        resolve: {
          access: function(userAccess) {
            return userAccess("administer system");
          }
        }
      };
      $routeProvider.when('/settings/vocabularies', vocabulary).when('/settings/vocabularies/:vocabulary', vocabulary).when('/settings/vocabularies/:vocabulary/:term', vocabulary);
    }
  ]).run([
    "konziloMenu", "$translate", function(konziloMenu, $translate) {
      return konziloMenu("settingsMenu").addItem("#/settings/vocabularies", $translate("VOCABULARY.TITLE"), function(userAccess) {
        return userAccess("administer system");
      });
    }
  ]).factory("TermStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage('/term/:_id', "Term");
    }
  ]).controller("VocabularyController", [
    "$scope", "KonziloConfig", "$routeParams", "TermStorage", "InputAutoSave", "$translate", function($scope, KonziloConfig, $routeParams, TermStorage, InputAutoSave, $translate) {
      var config;
      config = KonziloConfig.get("vocabularies");
      $scope.removeVocabulary = function(vocabulary) {
        if (confirm($translate("VOCABULARY.REMOVEMSG"))) {
          return config.remove(vocabulary.name);
        }
      };
      $scope.vocabularies = config.listAll().then(function(vocabularies) {
        $scope.vocabularies = vocabularies;
        $scope.operations = {};
        if ($routeParams.vocabulary) {
          config.get($routeParams.vocabulary).then(function(vocabulary) {
            $scope.vocabulary = vocabulary;
            $scope.properties = {
              name: {
                label: $translate("GLOBAL.NAME"),
                value: function(item) {
                  return {
                    label: item.name,
                    link: "/#/settings/vocabularies/" + vocabulary.name + "/" + item._id
                  };
                }
              },
              vocabulary: $translate("VOCABULARY.TITLE")
            };
            $scope.query = {
              vocabulary: vocabulary.name
            };
            if ($routeParams.term) {
              return TermStorage.get($routeParams.term).then(function(result) {
                $scope.term = result.toObject();
                return $scope.autosave = InputAutoSave.createInstance($scope.term, $scope.saveTerm, function() {
                  return $scope.termForm.$valid;
                });
              });
            }
          });
        }
        $scope.newVocabulary = function() {
          var vocabulary;
          vocabulary = {
            name: $scope.vocabularyName,
            title: $scope.vocabularyName
          };
          return config.set(vocabulary.name, vocabulary);
        };
        $scope.saveVocabulary = function(vocabulary) {
          return config.set($scope.vocabulary.name, $scope.vocabulary);
        };
        $scope.saveTerm = function() {
          TermStorage.save($scope.term);
          return $scope.terms = TermStorage.query({
            vocabulary: $scope.vocabulary.name
          });
        };
        return $scope.newTerm = function() {
          var term;
          if (!$scope.vocabulary) {
            return;
          }
          term = {
            name: $scope.termName,
            vocabulary: $scope.vocabulary.name
          };
          TermStorage.save(term);
          $scope.termName = "";
          return $scope.terms = TermStorage.query({
            vocabulary: $scope.vocabulary.name
          });
        };
      });
    }
  ]).directive("kzVocabularyInput", function() {
    return {
      restrict: 'AE',
      scope: {
        ngModel: "="
      },
      controller: [
        "$scope", "$element", "$attrs", "KonziloConfig", "TermStorage", "$q", function($scope, $element, $attrs, KonziloConfig, TermStorage, $q) {
          var update;
          update = function() {
            var config;
            if (!$scope.ngModel) {
              return;
            }
            $scope.vocabularies = {};
            config = KonziloConfig.get("vocabularies");
            $scope.terms = {};
            return config.listAll().then(function(vocabularies) {
              var vocabulary, _results;
              $scope.vocabularies = vocabularies;
              _results = [];
              for (vocabulary in vocabularies) {
                _results.push($scope.terms[vocabulary] = TermStorage.query({
                  q: {
                    vocabulary: vocabulary
                  }
                }).then(function(result) {
                  return result.toArray();
                }));
              }
              return _results;
            });
          };
          update();
          return $scope.$watch("ngModel", update);
        }
      ],
      templateUrl: "bundles/vocabulary/vocabulary-input.html"
    };
  });

}).call(this);
