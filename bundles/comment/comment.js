(function() {
  var getDateString, pad;

  pad = function(number) {
    var r;
    r = String(number);
    if (r.length === 1) {
      r = '0' + r;
    }
    return r;
  };

  getDateString = function(date) {
    if (typeof date === "string") {
      date = new Date(date);
    }
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  };

  angular.module("konzilo.comment", ["kntnt.user"]).directive("konziloComments", [
    "UserState", function(UserState) {
      return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
          "ngModel": "=",
          "ngChange": "="
        },
        controller: [
          "$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            var info;
            info = UserState.getInfo().info;
            $scope.getDateString = getDateString;
            return $scope.newComment = function() {
              var comment;
              if (!$scope.ngModel) {
                $scope.ngModel = [];
              }
              comment = {
                comment: $scope.comment,
                created: new Date(),
                username: info.username
              };
              $scope.ngModel.push(comment);
              return $scope.comment = '';
            };
          }
        ],
        templateUrl: "bundles/comment/comments.html"
      };
    }
  ]);

}).call(this);
