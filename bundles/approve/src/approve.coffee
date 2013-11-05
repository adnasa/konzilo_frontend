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
  '$scope', 'ArticlePartStorage',
  '$routeParams','$translate', "$location",
  ($scope, ArticlePartStorage, $routeParams, $translate, $location) ->
    $scope.query = { state: "needsreview" }

    $scope.failState = "started"
    $scope.approveState = "approved"
    $scope.$parent.title = $translate("REVIEW.TITLE")

    ArticlePartStorage.changed (part) ->
      if $location.path().indexOf("approve") != -1
        state = part.get("state")

        if $routeParams.id == part.id() and
        (state == $scope.failState or state == $scope.approveState)
          $location.url("/approve")

    if $routeParams.id
      ArticlePartStorage.get $routeParams.id, (articlePart) ->
        $scope.articlePart = articlePart
        $scope.part = articlePart.toObject()

])
