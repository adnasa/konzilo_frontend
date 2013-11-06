(function() {
  angular.module("konzilo.main", ["konzilo.order", "kntnt.plan", "kntnt.map", "ui.sortable", "ui.bootstrap", "kntnt.article", "kntnt.user", "konzilo.language", "konzilo.endpoint", "konzilo.manage", "konzilo.client", "konzilo.file", "kntnt.deliver", "kntnt.approve", "konzilo.channel", "konzilo.timeline", "konzilo.menu", "konzilo.step", "konzilo.vocabulary", "konzilo.translations"]).factory("formatDate", function() {
    var pad;
    pad = function(number) {
      var r;
      r = String(number);
      if (r.length === 1) {
        r = '0' + r;
      }
      return r;
    };
    return function(date) {
      if (!_.isDate(date)) {
        date = new Date(date);
      }
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    };
  }).factory("loadTemplate", [
    "$templateCache", "$q", "$http", function($templateCache, $q, $http) {
      return function(options) {
        if (options.template) {
          return $q.when(options.template);
        } else if (options.templateUrl) {
          return $http.get(options.templateUrl, {
            cache: $templateCache
          }).then(function(response) {
            return response.data;
          });
        }
      };
    }
  ]).directive("kzMaxHeight", function() {
    return {
      restrict: "A",
      link: function(scope, elm, attrs, ctrl) {
        var diff, height;
        diff = attrs.kzMaxHeight || 150;
        height = $(window).height();
        elm.css("max-height", height - diff);
        elm.css("overflow-y", "scroll");
        elm.addClass("max-height");
        return $(window).resize(function() {
          height = $(window).height();
          return elm.css("max-height", height - diff);
        });
      }
    };
  }).run([
    "$route", "$rootScope", function($route, $rootScope) {
      return $rootScope.$on("$routeChangeSuccess", function() {
        return $rootScope.navbar = false;
      });
    }
  ]);

}).call(this);
