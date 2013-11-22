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
    return if not $scope.article
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

    has = (property) ->
      for part in $scope.article.parts
        return true if part[property]
      return false

    $scope.hasDeadline = has("deadline")
    $scope.hasAssignment = has("assignment")

    $scope.languages = []
    KonziloConfig.get("languages").listAll().then (languages)->
      for part in $scope.article.parts when part.language
        $scope.languages.push(languages[part.language])

  $scope.$watch("article", update)
])

.directive("kzDeliverInfo", ->
  restrict: "AE"
  scope: article: "="
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

  $scope.$on("kzActivePart", (event, part) -> $scope.part = part)

  $scope.$parent.title = $translate("DELIVER.TITLE")
  if $routeParams.id
    ids = [ userId ]
    GroupStorage.query
      q:
        members: { $all: ids }
    .then (result) ->
      ids.concat(group._id for group in result.toArray())
    .then (providers) ->
      ArticlePartStorage.query
        q:
          article: $routeParams.id
          provider: { $in: providers }
          state: { $ne: "approved" }
          type: { $exists: true }
      , (parts) ->
        parts = parts.toArray()
        article = parts[0]?.article
        for part in parts
          part.article = part.article._id
        article.parts = parts
        $scope.article = article
])
