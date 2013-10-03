# The plan module provides the functionality to
# plan in kntnt management system.
angular.module("kntnt.plan",
[
  "kntnt.article"
  "ui.bootstrap"
  "kntnt.clipboard"
  "kntnt.map"
  "ui.scrollfix"
  "konzilo.comment"
  "konzilo.query"
  "konzilo.step"
  "konzilo.translations"
])

.config(["$routeProvider", ($routeProvider) ->
  plan =
    controller: "PlanController"
    templateUrl: "bundles/plan/plan.html"
    resolve:
      access: (userAccess) ->
        userAccess("create articles")

  $routeProvider.when('/plan', plan)
    .when("/plan/:id", plan)
])

.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  menu = konziloMenu("mainMenu")
  item = menu.addItem
    path: "/#/plan"
    label: $translate("PLAN.TITLE")
    icon: "icon-calendar"
  , (userAccess) ->
    userAccess("create articles")
])

.controller("PlanController",
["$scope", "ArticleStorage", "$routeParams", "$translate",
($scope, ArticleStorage, $routeParams, $translate) ->
  $scope.$parent.title = $translate("PLAN.TITLE")
  # Options for sortable.
  $scope.options =
    stop: ->
      TargetStorage.sort $scope.articlesSorted, "weight"
    placeholder: "ui-placeholder box pad"

  if $routeParams.id
    ArticleStorage.get $routeParams.id, (article) ->
      $scope.article = article.toObject()
])
