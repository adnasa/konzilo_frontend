# Internal functions
pad = (number) ->
  r = String(number)
  r = '0' + r if r.length is 1
  r

getDateString = (date) ->
  if typeof date is "string"
    date = new Date(date)
  date.getFullYear() + '-' +
    pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    ' ' + pad(date.getHours()) +
    ':' + pad(date.getMinutes())


# The comment module provides everything related to
# comments and the metadata they represent in the application.
angular.module("konzilo.comment", ["kntnt.user"])

.directive("konziloComments", ["UserState", (UserState) ->
  restrict: 'E'
  require: 'ngModel',
  scope: { "ngModel": "=", "ngChange": "=" }
  controller: ["$scope", "$element", "$attrs", ($scope, $element, $attrs) ->
    info = UserState.getInfo().info
    $scope.getDateString = getDateString
    $scope.newComment = ->
      $scope.ngModel = [] if not $scope.ngModel
      comment =
        comment: $scope.comment
        created: new Date()
        username: info.username

      $scope.ngModel.push comment
      $scope.comment = ''
  ]
  templateUrl: "bundles/comment/comments.html"
])
