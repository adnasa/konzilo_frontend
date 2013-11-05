angular.module('konzilo.translations', ['pascalprecht.translate'])
.config(["$translateProvider", ($translateProvider) ->
  $translateProvider.useLoader("kzLanguageLoader")
  $translateProvider.fallbackLanguage('default')
  $translateProvider.preferredLanguage('default')
])
.directive("languageSwitcher", ->
  restrict: 'AE'
  scope: defaults: "="
  replace: true
  controller: ["$scope", "$element", "$attrs", "$translate",
  "KonziloConfig", "UserState",
  ($scope, $element, $attrs, $translate, KonziloConfig, UserState) ->
    getLangs = ->
      UserState.loggedIn(true).then ->
        $scope.showLangs = true
        bin = KonziloConfig.get("languages")
        info = UserState.getInfo()
        # Determine the current language.
        if info and info.info.language
          $scope.currentLanguage = info.info.language
        else
          KonziloConfig.get("languages").listAll().then (languages) ->
            language = _.find(language, default: true)
            $scope.currentLanguage = language?.langcode

        bin.listAll().then (languages) ->
          $scope.languages = languages
        $scope.changeLanguage = (langCode) ->
          $translate.uses(langCode)
          $scope.currentLanguage = langCode
    getLangs()
    UserState.infoSaved(getLangs)
  ]
  templateUrl: "bundles/translations/language-switcher.html"
)

.factory('kzLanguageLoader', ["$http", ($http) ->
  (options) ->
    if options.key == "default"
      $http.get("/language").then (result)->
        result.data
    else
      $http.get("locale/#{options.key}.json").then (result) -> result.data
])
