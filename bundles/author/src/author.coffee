angular.module("konzilo.author", ["cmf.input", "konzilo.translations"])

.factory("AuthorStorage", ["KonziloStorage", (KonziloStorage) ->
  new KonziloStorage('/author/:_id', "Author")
])

.config(["entityInfoProvider", "$routeProvider",
(entityInfoProvider, $routeProvider) ->
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

  authorAdmin =
    controller: "AuthorAdminController"
    templateUrl: "bundles/author/author-admin.html"
    resolve:
      access: (userAccess) ->
        userAccess("administer system")
  $routeProvider.when('/settings/authors', authorAdmin)
  $routeProvider.when('/settings/authors/:author', authorAdmin)
  return
])
.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  konziloMenu("settingsMenu").addItem "#/settings/authors",
  $translate("AUTHOR.TITLE"),
  (userAccess) ->
    userAccess("administer system")
])
.directive("authorForm", ->
  restrict: 'AE'
  scope:
    author: "="
    showFields: "="
  controller: ["$scope", "$element", "$attrs", ($scope, $element, $attrs) ->
    $scope.images = []
    if $scope.author?.image
      $scope.images.push($scope.author.image)
    $scope.getImage = ->
      if $scope.images.length > 0
        $scope.author.image = $scope.images[0]
  ]
  templateUrl: "bundles/author/author-form.html"
)
.directive("authorPicker",
["UserStorage", "$modal", "UserState", "$translate",
(UserStorage, $modal, UserState, $translate) ->
  restrict: 'AE'
  scope:
    author: "="
    showFields: "="
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
.controller("AuthorAdminController", ["$scope", "$routeParams", "InputAutoSave",
"AuthorStorage", "$translate", "UserStorage",
($scope, $routeParams, InputAutoSave, AuthorStorage, $translate, UserStorage) ->
  getAuthors = ->
    $scope.authors = AuthorStorage.query({}).then (result) -> result.toArray()
  getAuthors()

  $scope.addAuthor = ->
    AuthorStorage.save(name: $scope.name ).then(getAuthors)

  $scope.saveAuthor = ->
    AuthorStorage.save($scope.author).then (getAuthors)

  $scope.removeAuthor = (author) ->
    if confirm("AUTHOR.CONFIRMREMOVE")
      AuthorStorage.remove(author).then(getAuthors)

  $scope.$watch 'user', ->
    console.log $scope.user

  if $routeParams.author
    AuthorStorage.get($routeParams.author).then (result) ->
      $scope.author = result.toObject()
      $scope.autosave = InputAutoSave.createInstance $scope.author,
        $scope.saveAuthor, -> $scope.authorForm.$valid
      $scope.user = UserStorage.query(author: $scope.author._id)
      .then (result) -> result.toArray()?[0]
])
