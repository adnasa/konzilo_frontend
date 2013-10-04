(function() {
  angular.module("konzilo.author", ["cmf.input", "konzilo.translations"]).factory("AuthorStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage('/author/:_id', "Author");
    }
  ]).config([
    "entityInfoProvider", function(entityInfoProvider) {
      entityInfoProvider.addProvider("Author", {
        storageController: "AuthorStorage",
        labelProperty: "name",
        idProperty: "_id",
        properties: {
          _id: {
            label: "ID",
            type: String
          },
          name: {
            label: "Name",
            type: String
          },
          email: {
            label: "Email",
            type: String
          },
          about: {
            label: "About the author",
            type: String
          },
          image: {}
        }
      });
    }
  ]).directive("authorForm", function() {
    return {
      restrict: 'AE',
      scope: {
        author: "="
      },
      controller: [
        "$scope", "$element", "$attrs", function($scope, $element, $attrs) {
          $scope.images = [];
          if ($scope.author.image) {
            $scope.images.push($scope.author.image);
          }
          return $scope.getImage = function() {
            if ($scope.images.length > 0) {
              return $scope.author.image = $scope.images[0];
            }
          };
        }
      ],
      templateUrl: "bundles/author/author-form.html"
    };
  }).directive("authorPicker", [
    "AuthorStorage", "UserStorage", "$modal", "UserState", "$translate", function(AuthorStorage, UserStorage, $modal, UserState, $translate) {
      return {
        restrict: 'AE',
        scope: {
          author: "="
        },
        controller: [
          "$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            var authorDialog, info, user;
            info = UserState.getInfo().info;
            user = null;
            UserStorage.get(info._id).then(function(result) {
              return user = result.toObject();
            });
            authorDialog = function(author, title) {
              return $modal.open({
                templateUrl: 'bundles/author/author-dialog.html',
                controller: function($scope, author, title, $modalInstance) {
                  $scope.author = author || {};
                  $scope.title = title;
                  $scope.returnAuthor = function() {
                    return $modalInstance.close($scope.author);
                  };
                  return $scope.close = function() {
                    return $modalInstance.close();
                  };
                },
                resolve: {
                  author: function() {
                    return _.clone(author);
                  },
                  title: function() {
                    return title;
                  }
                }
              });
            };
            $scope.$watch('author', function() {
              if (!$scope.author && user && user.author) {
                $scope.author = user.author;
              }
              if ($scope.author) {
                return $scope.authorName = $scope.author.name;
              }
            });
            $scope.$on('entityReferenceChanged', function(scope, value) {
              return $scope.author = value;
            });
            $scope.editAuthor = function() {
              return authorDialog($scope.author, $translate("AUTHOR.EDIT")).result.then(function(author) {
                if (author) {
                  return $scope.author = author;
                }
              });
            };
            return $scope.newAuthor = function() {
              return authorDialog({}, $translate("AUTHOR.NEW")).result.then(function(author) {
                if (author) {
                  return $scope.author = author;
                }
              });
            };
          }
        ],
        templateUrl: "bundles/author/author-picker.html"
      };
    }
  ]);

}).call(this);
