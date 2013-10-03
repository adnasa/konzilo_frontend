angular.module("konzilo.language", ["konzilo.translations"])

.value("directions",
  rtl: "Right to left"
  ltr: "Left to right"
)
.config(["$routeProvider", ($routeProvider) ->
  languageAdmin =
    controller: "LanguageAdminController"
    templateUrl: "bundles/language/language-admin.html"
    resolve:
      access: (userAccess) ->
        userAccess("administer system")

  $routeProvider.when('/settings/languages', languageAdmin)
])
.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  konziloMenu("settingsMenu").addItem "#/settings/languages",
  $translate("LANGUAGE.TITLE"),
  (userAccess) ->
    userAccess("administer system")
])
.controller("LanguageAdminController",
["$scope", "KonziloConfig", "directions", "$q", "$translate",
($scope, KonziloConfig, directions, $q, $translate) ->
  bin = KonziloConfig.get("languages")
  $scope.directions = directions

  getLanguages = ->
    bin.listAll().then (result) ->
      $scope.languages = _.toArray(result)

  getLanguages()

  $scope.properties =
    name: $translate("GLOBAL.NAME")
    langcode: $translate("LANGUAGE.LANGCODE")
    default: $translate("LANGUAGE.STANDARDLANG")
    direction: $translate("LANGUAGE.DIRECTION")

  $scope.operations =
    remove:
      label: $translate("GLOBAL.REMOVE")
      action: (item) ->
        bin.remove(item.langcode).then ->
          getLanguages()
    setdefault:
      label: $translate("LANGUAGE.SETDEFAULT")
      action: (item) ->
        promises = for lang in $scope.languages when lang.langcode != item.langcode
          lang.default = false
          bin.set(lang.langcode, lang)

        item.default = true
        $q.all(promises).then ->
          bin.set(item.langcode, item)

  $scope.addLanguage = ->
    if $scope.languages.length == 0
      $scope.language.default = true

    bin.set($scope.language.langcode, $scope.language).then ->
      getLanguages()
    $scope.language = {}
  return
])
