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
    return if not $scope.part
    $scope.translations = {}

    $scope.article = $scope.part.article
    if $scope.part.article.topic
      $scope.translations.topic = $scope.part.article.topic

    if $scope.part.article.target
      TargetStorage.get($scope.part.article.target).then (result) ->
        $scope.target = result.toObject()
        $scope.translations.target = $scope.target.name

    if $scope.part.article.channel
      $scope.channel = ChannelStorage.get($scope.part.article.channel)
      .then (result) -> result.toObject()

    if $scope.part.article.step
      $scope.step = StepStorage.get($scope.part.article.step)
      .then (result) -> result.toObject()

    if $scope.part.language
      $scope.language = KonziloConfig.get("languages")
      .get($scope.part.language)
  $scope.$watch("part", update)
])

.directive("kzDeliverInfo", ->
  restrict: "AE"
  scope: part: "="
  controller: "DeliverInfo"
  templateUrl: 'bundles/deliver/deliver-info.html'
)

.controller("DeliverController",
["$scope", "ArticlePartStorage", "$routeParams", "$translate", "UserState"
($scope, ArticlePartStorage, $routeParams, $translate, UserState) ->
  $scope.states = [ "notstarted", "started", "needsreview" ]
  $scope.useSave = true
  $scope.translations = {}
  userId = UserState.getInfo().info._id

  $scope.isLocked = (part) -> part?.locked != userId

  $scope.unlockPart = (part) ->
    part.locked = userId

  $scope.$parent.title = $translate("DELIVER.TITLE")
  if $routeParams.id
    ArticlePartStorage.get $routeParams.id, (articlePart) ->
      $scope.articlePart = articlePart
      $scope.part = articlePart.toObject()

])
