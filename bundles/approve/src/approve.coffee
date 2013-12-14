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
  '$scope', 'ArticleStorage', "ArticlePartStorage",
  '$routeParams','$translate', "$location",
  ($scope, ArticleStorage, ArticlePartStorage,
  $routeParams, $translate, $location) ->
    $scope.failState = "started"
    $scope.approveState = "approved"
    $scope.$parent.title = $translate("REVIEW.TITLE")
    getPart = (reset=true) ->
      ArticleStorage.clearCache() if reset
      ArticlePartStorage.get $routeParams.id, (part) ->
        $scope.article = part.get('article')
        $scope.part = part

    getPart() if $routeParams.id
])

.directive("kzApproveQueue", [
  "ArticlePartStorage", "UserState",
  (ArticlePartStorage, UserState) ->
    restrict: "AE",
    scope: { selected: "=", linkPattern: "@", part: "=" }
    controller: ($scope) ->
      user = UserState.getInfo().info._id
      query = { state: "needsreview", submitter:  user}
      getArticles = ->
        ArticlePartStorage.query({ q: query, limit: 500 }).then (result) ->
          $scope.articles = {}
          for articlePart in result.toArray()
            article = articlePart.article
            if not $scope.articles[article._id]
              $scope.articles[article._id] = article
              $scope.articles[article._id].parts = []

            articlePart.link = $scope.linkPattern
            .replace(":part", articlePart._id)

            $scope.articles[article._id].parts.push(articlePart)
          $scope.size = _.size($scope.articles)

        $scope.toggleArticle = (article) ->
          if $scope.selectedArticle == article._id
            $scope.selectedArticle = null
          else
            $scope.selectedArticle = article._id

        $scope.$watch "selected", ->
          $scope.selectedArticle = $scope.selected?.get("article")._id
          $scope.selectedId = $scope.selected?.get('_id')

      getArticles()
      ArticlePartStorage.changed(getArticles)
    templateUrl: "bundles/approve/approve-queue.html"
])
