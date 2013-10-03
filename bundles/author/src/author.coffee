angular.module("konzilo.author", ["cmf.input", "konzilo.translations"])

.factory("AuthorStorage", ["KonziloStorage", (KonziloStorage) ->
  new KonziloStorage('/author/:_id', "Author")
])

.config(["entityInfoProvider", (entityInfoProvider) ->
  # @todo Fix this, so that translations can be provided.
  entityInfoProvider.addProvider "Author",
    storageController: "AuthorStorage"
    labelProperty: "name"
    idProperty: "_id"
    properties:
      _id:
        label: "ID"
        type: String
      name:
        label: "Name"
        type: String
      email:
        label: "Email"
        type: String
      about:
        label: "About the author"
        type: String
      image: {}
  return
])

.directive("authorForm", ->
  restrict: 'AE'
  scope:
    author: "="
  controller: ["$scope", "$element", "$attrs", ($scope, $element, $attrs) ->
    $scope.images = []
    if $scope.author.image
      $scope.images.push($scope.author.image)
    $scope.getImage = ->
      if $scope.images.length > 0
        $scope.author.image = $scope.images[0]
  ]
  templateUrl: "bundles/author/author-form.html"
)

.directive("authorPicker",
["AuthorStorage", "UserStorage", "$modal", "UserState", "$translate",
(AuthorStorage, UserStorage, $modal, UserState, $translate) ->
  restrict: 'AE'
  scope:
    author: "="
  controller: ["$scope", "$element", "$attrs", ($scope, $element, $attrs) ->
    info = UserState.getInfo().info
    user = null
    UserStorage.get(info._id).then (result) ->
      user = result.toObject()

    authorDialog = (author, title) ->
      $modal.open
        templateUrl: 'bundles/author/author-dialog.html'
        controller: ($scope, author, title, $modalInstance) ->
          $scope.author = author or {}
          $scope.title = title
          $scope.returnAuthor = ->
            $modalInstance.close($scope.author)
          $scope.close = ->
            $modalInstance.close()
        resolve:
          author: -> _.clone(author)
          title: -> title

    $scope.$watch 'author', ->
      if not $scope.author and user and user.author
        $scope.author = user.author

      $scope.authorName = $scope.author.name if $scope.author

    $scope.$on 'entityReferenceChanged', (scope, value) ->
      $scope.author = value

    $scope.editAuthor = ->
      authorDialog($scope.author, $translate("AUTHOR.EDIT"))
      .result.then (author) ->
        $scope.author = author if author

    $scope.newAuthor = ->
      authorDialog({}, $translate("AUTHOR.NEW")).result.then (author) ->
        $scope.author = author if author
  ]
  templateUrl: "bundles/author/author-picker.html"
])
