angular.module "kntnt.approve",
  [
    "kntnt.article"
    "ui.bootstrap"
    "konzilo.entity"
    "kntnt.clipboard"
    "konzilo.translations"
  ]
.config(['$routeProvider', ($routeProvider) ->
  approve =
    controller: "ApproveController"
    templateUrl: "bundles/approve/approve.html"
    resolve:
      access: (userAccess) ->
        userAccess("update article parts")

  $routeProvider.when('/approve', approve)
  .when("/approve/:id", approve)
])
.run(['konziloMenu','$translate', (konziloMenu, $translate) ->
  menu = konziloMenu("mainMenu")
  item = menu.addItem
    path: "/#/approve",
    label: $translate("REVIEW.TITLE")
    icon: "icon-eye-open"
  , (userAccess) ->
    userAccess("update article parts")
])
.controller("ApproveController", [
  '$scope', 'ClipboardStorage', 'ArticlePartStorage',
  '$routeParams', 'TargetStorage', 'StepStorage',
  'kzAnalysisDialog', '$translate', "$location"
  ($scope, ClipboardStorage, ArticlePartStorage, $routeParams,
    TargetStorage, StepStorage, kzAnalysisDialog, $translate, $location) ->
    $scope.query = { state: "needsreview" }

    $scope.failState = "started"
    $scope.approveState = "approved"
    $scope.$parent.title = $translate("REVIEW.TITLE")

    ArticlePartStorage.changed (part) ->
      state = part.get("state")

      if $routeParams.id == part.id() and
      (state == $scope.failState or state == $scope.approveState)
        $location.url("/approve")

    if $routeParams.id
      ArticlePartStorage.get $routeParams.id, (articlePart) ->

        $scope.articlePart = articlePart
        $scope.part = articlePart.toObject()

        $scope.translateVars =
          topic: $scope.part.article.topic

        if $scope.part.article.target
          $scope.target = TargetStorage.get($scope.part.article.target)
          .then (result) ->
            $scope.translateVars['name'] = result.get("name")
            result.toObject()

    $scope.showAnalysis = (target) ->
      kzAnalysisDialog(target)
])
