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

.controller("OrderInfo", ["$scope", "TargetStorage",
"ChannelStorage", "StepStorage", "KonziloConfig",
($scope, TargetStorage, ChannelStorage, StepStorage, KonziloConfig) ->
  update = ->
    return if not $scope.part
    $scope.translations = {}
    $scope.article = $scope.part.article

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
      .then (result) ->
        result.toObject()

  $scope.$watch("part", update)
])

.directive("kzOrderInfo", ->
  restrict: "AE"
  scope: part: "="
  controller: "OrderInfo"
  templateUrl: 'bundles/order/order-info.html'
)

.controller("OrderController",
["$scope", "ArticleStorage", "$routeParams",
"UserStorage", "$q", "articleParts", "KonziloConfig",
"TargetStorage", "InputAutoSave", "StepStorage",
"ArticlePartStorage", "ChannelStorage", "$filter",
"kzAnalysisDialog", "$location", "ProviderEmail", "$translate",
($scope, ArticleStorage, $routeParams,
UserStorage, $q, articleParts, KonziloConfig,
TargetStorage, InputAutoSave, StepStorage,
ArticlePartStorage, ChannelStorage, $filter,
kzAnalysisDialog, $location, ProviderEmail, $translate) ->
  $scope.today = new Date()
  $scope.translations = {}
  oldPart = {}

  $scope.savePart = ->
    ArticlePartStorage.save($scope.part).then (part) ->
      id = oldPart.provider._id or oldPart.provider
      if part.provider != id
        url = $location.protocol() + '://' + $location.host()
        port = $location.port()
        if port != 80 or port != 443
          url += ":" + port
        url += "/#/deliver/" + part._id
        ProviderEmail part.provider,
          $translate("ARTICLE.NEWPARTASSIGNEDTITLE"),
          $translate("ARTICLE.NEWPARTASSIGNEDBODY", { url: url })
      oldPart = part

  contentSaved = (part) ->
    return part.typeName or (part.content and _.size(part.content) > 0)

  getPart = (part) ->
    ArticlePartStorage.get($routeParams.part).then (part) ->
      $scope.part = oldPart = part.toObject()
      $scope.part.contentSaved = contentSaved($scope.part)
      $scope.changeDate()
      $scope.part.terms = $scope.part.terms or []
      if $scope.autosave
        $scope.autosave.stop()
      $scope.autosave = InputAutoSave.createInstance $scope.part, $scope.savePart, ->
        $scope.partForm?.$valid

  if $routeParams.article
    ArticleStorage.get $routeParams.article, (article) ->
      $scope.article = article.toObject()
      if $routeParams.part
        getPart($routeParams.part)


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
