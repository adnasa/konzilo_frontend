angular.module("konzilo.contenttype", ["konzilo.config",
'konzilo.translations', 'kntnt.article', 'konzilo.contenttype'])

.directive("kzPartFieldSelection", ["articleParts", ->
    restrict: "AE"
    scope:
      type: "="
      settings: "="
    templateUrl: "bundles/template/templates/field-selection.html"
])

.directive("kzContentTypeForm", ["articleParts", (articleParts) ->
  restrict: "AE"
  scope:
    contentType: "="
  controller: ["$scope", ($scope) ->
    $scope.types = articleParts.types()
    $scope.typeLabels = articleParts.labels()
    update = ->
      return if not $scope.contentType
      $scope.contentType.parts = [] if not $scope.contentType.parts

    $scope.removePart = (index) ->
      $scope.contentType.parts = (part for part, i in $scope.contentType.parts when i != index)

    $scope.addPart = ->
      type = $scope.contentType
      type.parts = type.parts or []
      type.parts.push(type: $scope.newPart, show: {}, label: $scope.types[$scope.newPart].label)

    $scope.$watch("contentType", update)
  ]
  templateUrl: "bundles/contenttype/content-type-form.html"
])
