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
  $routeProvider.when('/settings/languages/:language', languageAdmin)
])
.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  konziloMenu("settingsMenu").addItem "#/settings/languages",
  $translate("LANGUAGE.TITLE"),
  (userAccess) ->
    userAccess("administer system")
])
.controller("LanguageAdminController",
["$scope", "KonziloConfig", "directions", "$q", "$translate",
"$routeParams", "InputAutoSave",
($scope, KonziloConfig, directions, $q, $translate, $routeParams, InputAutoSave) ->
  bin = KonziloConfig.get("languages")
  $scope.directions = directions

  $scope.defaultLanguages =
    "aa":"Afar"
    "ab":"Abchaziska"
    "af":"Afrikaans"
    "am":"Amhariska"
    "an":"Ambianska"
    "ar":"Arabiska"
    "as":"Assamesiska"
    "ay":"Aymara"
    "az":"Azerbajdzjanska"
    "ba":"Basjkiriska"
    "be":"Vitryska"
    "bg":"Bulgariska"
    "bh":"Bihari"
    "bi":"Bislama"
    "bn":"Bengali"
    "bo":"Tibetanska"
    "br":"Bretonska"
    "ca":"Katalanska"
    "co":"Korsikanska"
    "cs":"Tjeckiska"
    "cv":"Tjuvasjiska"
    "cy":"Kymriska"
    "da":"Danska"
    "de":"Tyska"
    "dz":"Dzongkha"
    "el":"Grekiska"
    "en":"Engelska"
    "eo":"Esperanto"
    "es":"Spanska"
    "et":"Estniska"
    "eu":"Baskiska"
    "fa":"Persiska"
    "fi":"Finska"
    "fj":"Fijianska"
    "fo":"Färöiska"
    "fr":"Franska"
    "fy":"Frisiska"
    "ga":"Iriska"
    "gd":"Gaeliska"
    "gl":"Galiciska"
    "gn":"Guarani"
    "gu":"Gujarati"
    "ha":"Hausa"
    "he":"Hebreiska"
    "hi":"Hindi"
    "hr":"Kroatiska"
    "hu":"Ungerska"
    "hy":"Armeniska"
    "ia":"Interlingua"
    "id":"Indonesiska"
    "ie":"Interlingue"
    "ik":"Iñupiaq"
    "is":"Isländska"
    "it":"Italienska"
    "iu":"Inuktitut"
    "ja":"Japanska"
    "jv":"Javanesiska"
    "ka":"Georgiska"
    "kk":"Kazakiska"
    "kl":"Grönländska"
    "km":"Kambodjanska"
    "kn":"Kannada"
    "ko":"Koreanska"
    "ks":"Kashmiri"
    "ku":"Kurdiska"
    "ky":"Kirgiziska"
    "la":"Latin"
    "ln":"Lingala"
    "lo":"Laotiska"
    "lt":"Litauiska"
    "lv":"Lettiska"
    "mg":"Madagaskiska"
    "mi":"Maori"
    "mk":"Makedonska"
    "ml":"Malayalam"
    "mn":"Mongoliska"
    "mo":"Moldaviska"
    "mr":"Marathi"
    "ms":"Malajiska"
    "mt":"Maltesiska"
    "my":"Burmesiska"
    "na":"Nauriska"
    "nb":"Norska Bokmål"
    "ne":"Nepali"
    "nl":"Nederländska"
    "nn":"Norska Nynorsk"
    "no":"Norska"
    "oc":"Occitanska"
    "om":"Afan oromo"
    "or":"Oriya"
    "pa":"Punjabi"
    "pl":"Polska"
    "ps":"Pashto"
    "pt":"Portugisiska"
    "qu":"Quechua"
    "rm":"Rumantsch"
    "rn":"Kirundi"
    "ro":"Rumänska"
    "ru":"Ryska"
    "rw":"Kinyarwanda"
    "sa":"Sanskrit"
    "sc":"Sardiska"
    "sd":"Sindhi"
    "se":"Nordsamiska"
    "sg":"Sangho"
    "sh":"Serbokroatiska"
    "si":"Singalesiska"
    "sk":"Slovakiska"
    "sl":"Slovenska"
    "sm":"Samoanska"
    "sn":"Shona"
    "so":"Somaliska"
    "sq":"Albanska"
    "sr":"Serbiska"
    "ss":"Siswati"
    "st":"Sesotho"
    "su":"Sundanesiska"
    "sv":"Svenska"
    "sw":"Swahili"
    "ta":"Tamil"
    "te":"Telugu"
    "tg":"Tadzjikiska"
    "th":"Thailändska"
    "ti":"Tigrinja"
    "tk":"Turkmenska"
    "tl":"Tagalog"
    "tn":"Setswana"
    "to":"Tonganska"
    "tr":"Turkiska"
    "ts":"Tsonga"
    "tt":"Tatariska"
    "tw":"Twi"
    "ug":"Uiguriska"
    "uk":"Ukrainska"
    "ur":"Urdu"
    "uz":"Uzbekiska"
    "vi":"Vietnamesiska"
    "vo":"Volapük"
    "wo":"Wolof"
    "xh":"Xhosa"
    "yi":"Jiddisch"
    "yo":"Yoruba"
    "za":"Zhuang"
    "zh":"Kinesiska"
    "zu":"Zulu"

  getLanguages = ->
    bin.listAll().then (result) ->
      $scope.languages = _.toArray(result)
      for key of $scope.defaultLanguages
        delete $scope.defaultLanguages[key] if result[key]
  getLanguages()

  $scope.setDefault = (language) ->
    promises = for lang in $scope.languages when lang.langcode != language.langcode
      lang.default = false
      bin.set(lang.langcode, lang)

    language.default = true
    $q.all(promises).then ->
      bin.set(language.langcode, language)

  $scope.removeLanguage = (language) ->
    if confirm($translate("LANGUAGE.CONFIRMREMOVE"))
      bin.remove(language.langcode).then(getLanguages)

  $scope.addLanguage = ->
    language = {}
    if $scope.languages.length == 0
      language.default = true
    language.name = $scope.defaultLanguages[$scope.selectedLanguage]
    language.langcode = $scope.selectedLanguage
    language.direction = "ltr"
    bin.set(language.langcode, language).then ->
      getLanguages()

  $scope.saveLanguage = ->
    bin.set($scope.language.langcode, $scope.language).then(getLanguages)

  if $routeParams.language
    bin.get($routeParams.language).then (language) ->
      $scope.language = language
      $scope.autosave = InputAutoSave.createInstance $scope.language, $scope.saveLanguage, ->
        $scope.editLanguageForm.$valid



  return
])
