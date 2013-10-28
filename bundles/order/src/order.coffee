angular.module("konzilo.order", ["konzilo.menu"])
.config(["$routeProvider", "konziloMenuProvider", "$translateProvider",
($routeProvider, konziloMenuProvider, $translateProvider) ->
  order =
    controller: 'OrderController'
    templateUrl: 'bundles/order/order.html'
    resolve:
      access: (userAccess) ->
        userAccess("create article parts")

  $routeProvider.when('/order', order)
    .when('/order/:article', order)
    .when('/order/:article/:part', order)

  menu = konziloMenuProvider.addMenu("mainMenu")
  konziloMenuProvider.addMenu("settingsMenu")

  # @todo Move this to configuration.
  menu.setOrder(["/#/plan", "/#/order",
    "/#/deliver", "/#/approve", "/#/manage"])
])
.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  konziloMenu("mainMenu").addItem
    path: "/#/order"
    label: $translate("ORDER.TITLE")
    icon: "icon-location-arrow"
  , (userAccess) ->
    userAccess("create article parts")
])
.controller("OrderController",
["$scope", "ArticleStorage", "$routeParams",
"UserStorage", "$q", "articleParts", "KonziloConfig",
"TargetStorage", "InputAutoSave", "StepStorage",
"ArticlePartStorage", "ChannelStorage", "$filter",
"kzAnalysisDialog", "$location",
($scope, ArticleStorage, $routeParams,
UserStorage, $q, articleParts, KonziloConfig,
TargetStorage, InputAutoSave, StepStorage,
ArticlePartStorage, ChannelStorage, $filter, kzAnalysisDialog, $location) ->
  $scope.savePart = ->
    ArticlePartStorage.save $scope.part

  $scope.today = new Date()
  $scope.translations = {}

  getPart = (part) ->
    ArticlePartStorage.get($routeParams.part).then (part) ->
      $scope.part = part.toObject()
      $scope.changeDate()
      $scope.part.terms = $scope.part.terms or []
      if $scope.autosave
        $scope.autosave.stop()
      $scope.autosave = new InputAutoSave $scope.part, $scope.savePart, ->
        $scope.partForm?.$valid

  if $routeParams.article
    ArticleStorage.get $routeParams.article, (article) ->
      $scope.article = article.toObject()
      $scope.translations["topic"] = $scope.article.topic
      if $scope.article.target
        TargetStorage.get($scope.article.target)
        .then (result) ->
          $scope.target = result.toObject()
          $scope.translations["target"] = $scope.target.name

      if $scope.article.channel
        $scope.channel = ChannelStorage.get($scope.article.channel)
        .then (result) -> result.toObject()

      if $scope.article.step
        StepStorage.get($scope.article.step)
        .then (result) ->
          $scope.step = result.toObject()
          $scope.translations["step"] = $scope.step.name

      if $routeParams.part
        getPart($routeParams.part)

  $scope.contentSaved = (part) ->
    return false if not part?.content
    return _.size(part.content) > 0

  $scope.changeDate = ->
    if $scope.part?.deadline
      $scope.deadlinetime = $filter('date')($scope.part.deadline, "HH:mm")

  $scope.changeTime = (time, date) ->
    if time.match(/[0-9]{2}:[0-9]{2}/) and date
      result = time.split(':')
      date.setHours(result[0])
      date.setMinutes(result[1])

  $scope.showAnalysis = (target) ->
    kzAnalysisDialog(target)

  $scope.fetchUsers = ->
    deferred = $q.defer()
    UserStorage.query {}, (results) ->
      deferred.resolve results.toArray()
    deferred.promise

  $scope.partCreated = (article, part) ->
    $location.path("order/#{article._id}/#{part._id}")

  ArticlePartStorage.itemRemoved ->
    delete $scope.part
    getPart($routeParams.part) if $routeParams.part

  $scope.types = articleParts.labels()
  $scope.languages = KonziloConfig.get("languages").listAll()
])
