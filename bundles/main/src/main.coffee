angular.module("konzilo.main",
  [
    "konzilo.order"
    "kntnt.plan"
    "kntnt.map"
    "ui.sortable"
    "ui.bootstrap"
    "kntnt.article"
    "kntnt.user"
    "konzilo.language"
    "konzilo.endpoint"
    "konzilo.manage"
    "konzilo.client"
    "konzilo.file"
    "kntnt.deliver"
    "kntnt.approve"
    "konzilo.channel"
    "konzilo.timeline"
    "konzilo.menu"
    "konzilo.step"
    "konzilo.vocabulary"
    "konzilo.translations"
  ]
)
.factory("formatDate", ->
  pad = (number) ->
    r = String(number)
    r = '0' + r if r.length is 1
    r

  (date) ->
    date = new Date(date) if not _.isDate(date)
    date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' + pad(date.getDate())
)
.factory("loadTemplate",
["$templateCache", "$q", "$http", ($templateCache, $q, $http) ->
  (options) ->
    if options.template
      $q.when(options.template)
    else if options.templateUrl
      $http.get(options.templateUrl, { cache: $templateCache })
      .then (response) -> return response.data
])

.directive("kzMaxHeight", ->
  restrict: "A",
  link: (scope, elm, attrs, ctrl) ->
    diff = attrs.kzMaxHeight or 150
    height = $(window).height()
    elm.css("max-height", height - diff)
    elm.css("overflow-y", "scroll")
    elm.addClass("max-height")
    $(window).resize ->
      height = $(window).height()
      elm.css("max-height", height - diff)
)

.run(["$route", "$rootScope", ($route, $rootScope)->
  $rootScope.$on("$routeChangeSuccess", ->
    $rootScope.navbar = false
  )
])
