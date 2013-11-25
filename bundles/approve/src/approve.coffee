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
    getArticle = (reset=true) ->
      ArticleStorage.clearCache() if reset
      ArticleStorage.get $routeParams.id, (article) ->
        article = article.toObject()
        article.parts = _.filter(article.parts, state: "needsreview")
        if not article.parts.length > 0
          $location.path("/approve")
        $scope.article = article

    getArticle() if $routeParams.id

    $scope.$on "stateChanged", (event, part) ->
      getArticle()
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
            if $scope.part and $scope.part.id() is articlePart._id and

            article._id is $scope.part.get("article")._id
              articlesToggled[article._id] = true

            articlePart.article = article._id
            if not $scope.articles[article._id]
              $scope.articles[article._id] = article
              $scope.articles[article._id].parts = []

            article.link = $scope.linkPattern
            .replace(":article", article._id)

            $scope.articles[article._id].parts.push(articlePart)
          $scope.size = _.size($scope.articles)
      getArticles()
      ArticlePartStorage.changed(getArticles)
    templateUrl: "bundles/approve/approve-queue.html"
])
