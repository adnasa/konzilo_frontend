angular.module("konzilo.manage", ["konzilo.config", "konzilo.translations"])

.config(["$routeProvider", ($routeProvider) ->
  manageAdmin =
    controller: "ManageController"
    templateUrl: "bundles/manage/manage.html"
    resolve:
      access: (userAccess) ->
        userAccess("create articles")

  $routeProvider.when('/manage', manageAdmin)
  $routeProvider.when('/manage/:article', manageAdmin)
  $routeProvider.when('/manage/:article/:part', manageAdmin)
  return
])
.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  menu = konziloMenu("mainMenu")
  item = menu.addItem
    path: "/#/manage",
    label: $translate("MANAGE.TITLE")
    icon: "icon-edit"
  , (userAccess) ->
    userAccess("create articles")
])

.controller("ManageController",
["$scope", "$routeParams", "ArticleStorage", "ArticlePartStorage",
"KonziloConfig", "articleParts", "$translate", "$filter",
"UserState", "$http", "ChannelStorage", "ArticlePartStates", "$location",
($scope, $routeParams, ArticleStorage, ArticlePartStorage,
KonziloConfig, articleParts, $translate, $filter,
UserState, $http, ChannelStorage, ArticlePartStates, $location) ->
  $scope.types = articleParts.labels()
  $scope.newPart = {}
  user = UserState.getInfo().info
  $scope.translations = {}
  $scope.$parent.title = $translate("MANAGE.TITLE")

  # Set date by default.
  $scope.articleDefaults =
    publishdate: new Date()
  if $routeParams.article
    ArticleStorage.get($routeParams.article).then (result) ->
      result.toObject()
    .then (article) ->
      $scope.article = article
      return if not article.channel
      ChannelStorage.get(article.channel).then (channel) ->
        endpoint = channel.get("endpoint")
        $scope.channel = channel.toObject()
        $scope.translations.channel = channel.name
        $http.get("/endpoint/#{endpoint}/jobs/#{$scope.article._id}")
        .then (result) ->
          $scope.publishInfo = result.data[0]
          $scope.publishDate = $filter('date') $scope.publishInfo.date,
            'yyyy-MM-dd HH:mm'

  $scope.remove = (part) ->
    if confirm($translate("MANAGE.CONFIRMPARTREMOVE"))
      ArticlePartStorage.remove(part._id).then ->
        ArticleStorage.get($routeParams.article).then (result) ->
          $scope.article = result.toObject()

  $scope.removeArticle = (article) ->
    if confirm($translate("MANAGE.CONFIRMARTICLEREMOVE"))
      ArticleStorage.remove(article._id).then ->
        $location.path('/manage')

  $scope.states = ArticlePartStates

  $scope.saveNewPart = ->
    if $scope.newPartForm.$valid
      KonziloConfig.get("languages").listAll().then (languages) ->
        defaultLang = _.find(languages, default: true)
        articlePart =
          article: $scope.article._id
          title: $scope.newPart.name
          type: $scope.newPart.type
          submitter: user._id
          # @todo should not be hard-coded.
          state: "approved"

        articlePart.language = defaultLang.langcode if defaultLang
        ArticlePartStorage.save(articlePart).then (result) ->
          ArticleStorage.get($routeParams.article).then (result) ->
            $scope.article = result.toObject()
  return
])
