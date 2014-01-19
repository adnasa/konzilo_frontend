angular.module("konzilo.vocabulary",
  [
    "ui.bootstrap"
    "cmf.input"
    "konzilo.config"
    "konzilo.entity"
    "konzilo.translations"
  ]
)

.config(["$routeProvider", "entityInfoProvider", ($routeProvider, entityInfoProvider) ->
  entityInfoProvider.addProvider "Term",
    storageController: "TermStorage"
    labelProperty: "name"
    idProperty: "_id"
    properties:
      _id:
        label: "ID"
        type: String
      vocabulary:
        label: "Vokabulary"
        type: String
      name:
        label: "Name"
        type: String
      description:
        label: "Description"
        type: String
    operations:
      delete:
        label: "Remove term"
        action: (term) ->
          term.remove()
  vocabulary =
    controller: 'VocabularyController'
    templateUrl: 'bundles/vocabulary/vocabulary.html'
    resolve:
      access: (userAccess) ->
        userAccess("administer system")

  $routeProvider
    .when('/settings/vocabularies', vocabulary)
    .when('/settings/vocabularies/:vocabulary', vocabulary)
    .when('/settings/vocabularies/:vocabulary/:term', vocabulary)
  return
])

.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  konziloMenu("settingsMenu").addItem "#/settings/vocabularies",
  $translate("VOCABULARY.TITLE"),
    (userAccess) ->
      userAccess("administer system")
])

.factory("TermStorage", ["KonziloStorage", (KonziloStorage) ->
  new KonziloStorage('/term/:_id', "Term")
])

# Manage vocabularies and terms.
.controller("VocabularyController",
["$scope", "KonziloConfig", "$routeParams",
"TermStorage", "InputAutoSave", "$translate",
($scope, KonziloConfig, $routeParams,
TermStorage, InputAutoSave, $translate) ->
  config = KonziloConfig.get("vocabularies")

  # Remove vocabularies.
  $scope.removeVocabulary = (vocabulary) ->
    if confirm($translate("VOCABULARY.REMOVEMSG"))
      config.remove(vocabulary.name)

  getTerms = (vocabulary) ->
    TermStorage.query({vocabulary: vocabulary.name}).then (terms) ->
      terms.toArray()

  $scope.vocabularies = config.listAll().then (vocabularies) ->
    $scope.vocabularies = vocabularies
    $scope.operations = {}

    if $routeParams.vocabulary
      config.get($routeParams.vocabulary).then (vocabulary) ->
        $scope.vocabulary = vocabulary
        $scope.terms = getTerms(vocabulary)
        if $routeParams.term
          TermStorage.get($routeParams.term).then (result) ->
            $scope.term = result.toObject()
            $scope.autosave = InputAutoSave.createInstance $scope.term, $scope.saveTerm, ->
              $scope.termForm.$valid

    $scope.newVocabulary = ->
      vocabulary =
        name: $scope.vocabularyName
        title: $scope.vocabularyName
      config.set(vocabulary.name, vocabulary)

    $scope.saveVocabulary = (vocabulary) ->
      config.set $scope.vocabulary.name, $scope.vocabulary

    $scope.saveTerm = ->
      TermStorage.save $scope.term
      $scope.terms = getTerms($scope.vocabulary)

    $scope.newTerm = ->
      return if not $scope.vocabulary
      term = { name: $scope.termName, vocabulary: $scope.vocabulary.name }
      TermStorage.save term
      $scope.termName = ""
      $scope.terms = getTerms($scope.vocabulary)

  return
])

.directive("kzVocabularyInput", ->
  restrict: 'AE'
  scope: ngModel: "="
  controller: ["$scope", "$element", "$attrs",
  "KonziloConfig", "TermStorage", "$q",
  ($scope, $element, $attrs, KonziloConfig, TermStorage, $q) ->
    update = ->
      return if not $scope.ngModel
      $scope.vocabularies = {}
      config = KonziloConfig.get("vocabularies")
      $scope.terms = {}
      config.listAll().then (vocabularies) ->
        $scope.vocabularies = vocabularies
        for vocabulary of vocabularies
          $scope.terms[vocabulary] = TermStorage.query
            q: vocabulary: vocabulary
          .then (result) -> result.toArray()

    update()
    $scope.$watch("ngModel", update)
  ]
  templateUrl: "bundles/vocabulary/vocabulary-input.html"
)
