angular.module("konzilo.menu", ["konzilo.translations"])

.provider("konziloMenu", ->
  menus = {}
  class KonziloMenu
    constructor: (@name, @parent) ->
      @items = []

    setInjector: (injector) ->
      @injector = injector

    setQ: (q) ->
      @q = q

    checkItem: (item) ->
      if not item.access
        promise = @q.when(item)
      else
        promise = @injector.invoke(item.access)

      return promise.then =>
        return item

    setOrder: (@order) ->

    addItem: (path, label,accessFn) ->
      if _.isPlainObject(path)
        options = path
        path = options.path
        accessFn = label
        label = options.label

      newItem = (path, label, accessFn) ->
        path: path
        label: label
        icon: options?.icon
        access: accessFn
        items: []
        addItem: (path, label, accessFn) ->
          item = newItem(path, label, accessFn)
          @items.push(item)

      item = newItem(path, label, accessFn)
      @items.push(item)
      return item

    children: (index) ->
      if @items[index]
        @checkItem(child) for child  in @items[index].items

    getItems: ->
      if @order
        items = _.sortBy @items, (item) =>
          @order.indexOf(item.path)
      else
        items = @items
      @checkItem(item) for item in items

  addMenu: (name) ->
    menus[name] = new KonziloMenu(name)
    return menus[name]

  $get: ($injector, $q) ->
    (name) ->
      menus[name].setInjector($injector)
      menus[name].setQ($q)
      menus[name]
)
.directive("konziloMenu",
["konziloMenu", "loadTemplate", "$compile", "$q", "UserState", "$location",
(konziloMenu, loadTemplate, $compile, $q, UserState, $location) ->
  restrict: "AE"
  replace: true
  templateUrl: "bundles/menu/menu.html"
  scope: { parent: "=" }
  link: (scope, element, attrs) ->
    menu = null
    if scope.parent
      items = scope.parent.items
    else if attrs.menu
      menu = konziloMenu(attrs.menu)
      items = menu?.getItems()
    else
      return

    scope.active = (item) ->
      return "" if not item?.path

      path = if item.path[0] == "#"
        item.path.substring(1, item.path.length - 1)
      else
        item.path

      if $location.absUrl().indexOf(path) >= 0
        return "active"
      return ""

    UserState.infoSaved ->
      scope.items = menu?.getItems()

    scope.menu = menu
    scope.items = items

  controller: ($scope, $attrs) ->
])
