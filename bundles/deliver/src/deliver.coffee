# The deliver module provides the functionality to deliver content to articles
# in the system.
angular.module("kntnt.deliver",
  [
    "kntnt.article"
    "ui.bootstrap"
    "konzilo.entity"
    "kntnt.clipboard"
    "konzilo.translations"
  ]
)
.config(["$routeProvider", ($routeProvider) ->
  deliver =
    controller: "DeliverController"
    templateUrl: "bundles/deliver/deliver.html"
    resolve:
      access: (userAccess) ->
        userAccess("update article part content")
  $routeProvider.when('/deliver', deliver)
    .when("/deliver/:id", deliver)
])
.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  menu = konziloMenu("mainMenu")
  item = menu.addItem
    path: "/#/deliver"
    label: $translate("DELIVER.TITLE"),
    icon: "icon-truck"
  , (userAccess) ->
    userAccess("update article part content")
])

.controller("DeliverInfo", ["$scope", "TargetStorage",
"ChannelStorage", "StepStorage", "KonziloConfig", "kzAnalysisDialog",
($scope, TargetStorage, ChannelStorage,
StepStorage, KonziloConfig, kzAnalysisDialog) ->
  $scope.showAnalysis = (target) ->
    kzAnalysisDialog(target)

  update = ->
    return if not $scope.articlePart
    $scope.article = $scope.articlePart.get("article")
    $scope.part = $scope.articlePart.toObject()
    $scope.translations = {}
    if $scope.article.topic
      $scope.translations.topic = $scope.article.topic

    if $scope.article.target
      TargetStorage.get($scope.article.target).then (result) ->
        $scope.target = result.toObject()
        $scope.translations.target = $scope.target.name

    if $scope.article.channel
      $scope.channel = ChannelStorage.get($scope.article.channel)
      .then (result) -> result.toObject()

    if $scope.article.step
      $scope.step = StepStorage.get($scope.article.step)
      .then (result) -> result.toObject()

    $scope.language = KonziloConfig.get("languages").get($scope.part.language)

  $scope.$watch("articlePart", update)
])

.directive("kzDeliverInfo", ->
  restrict: "AE"
  scope: articlePart: "="
  controller: "DeliverInfo"
  templateUrl: 'bundles/deliver/deliver-info.html'
)

.controller("DeliverController",
["$scope", "ArticlePartStorage", "$routeParams", "$translate", "UserState",
"GroupStorage",
($scope, ArticlePartStorage, $routeParams,
$translate, UserState, GroupStorage, ChannelStorage, kzShowFields) ->
  $scope.states = [ "notstarted", "started", "needsreview" ]
  $scope.useSave = true
  $scope.translations = {}
  userId = UserState.getInfo().info._id

  $scope.$parent.title = $translate("DELIVER.TITLE")

  getPart = (id) ->
    ArticlePartStorage.get(id).then (part) ->
      $scope.part = part
      $scope.article = part.get("article")
      return part

  if $routeParams.id
    getPart($routeParams.id)
])
