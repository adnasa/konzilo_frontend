angular.module("konzilo.entity", ["ngResource"])
.provider("entityInfo", ->
  @entities = {}
  addProvider: (name, info) =>
    @entities[name] = info
  $get: =>
    (name) => @entities[name]
)
.factory("processDate", ->
  (value) -> return new Date(value)
)

.factory("entityStorage",
["entityInfo", "$injector", (entityInfo, $injector) ->
  (name) ->
    controllerName = entityInfo(name)?.storageController
    $injector.get(controllerName) if controllerName
])

.factory("KonziloEntity",
["entityInfo", "$injector", "$controller", "$compile", "loadTemplate",
(entityInfo, $injector, $controller, $compile, loadTemplate)->
  class KonziloEntity
    constructor: (@name, @data) ->
      @info = entityInfo(@name)
      @storage = $injector.get(@info.storageController)
      @data = data
      for prop, info of @info.properties when info.processor and (info.processEmpty or @data[prop])
        if not _.isFunction(info.processor)
          processor = $injector.get(info.processor)
        else
          processor = info.processor
        @data[prop] = processor(@data[prop], @) if processor
      @dirty = false

    save: (callback, errorCallback) ->
      @storage.save @, callback, errorCallback

    remove: (callback, errorCallback) ->
      @storage.remove @, callback, errorCallback

    toObject: -> @data

    setData: (@data) ->

    get: (name) -> @data[name]

    uri: -> @data.links?.self?.href

    set: (name, data) ->
      if _.isPlainObject(_.clone(name))
        @data[prop] = value for prop, value of name
      else
        @data[name] = data
      @dirty = true
      return @

    id: -> @data[@info.idProperty]

    idProperty: -> @info.idProperty

    label: -> @data[@info.labelProperty]

    labelProperty: -> @info.labelProperty

    view: (options) ->
      if options.mode
        mode = @info.viewModes[options.mode]
      else if @info.defaultViewMode
        mode = @info.viewModes[@info.defaultViewMode]
      else
        mode = _.first(_.toArray(@info.viewModes))
      if mode
        loadTemplate(mode).then (template) ->
          options.element.html(template)
          if mode.controller
            $controller mode.controller,
            { $scope: options.scope, entity: options.entity }
          $compile(options.element.contents())(options.scope)
])

.factory("KonziloCollection",
["entityInfo", "entityStorage", "KonziloEntity",
(entityInfo, entityStorage, KonziloEntity) ->
  class KonziloCollection
    constructor: (@name, result, @query=null, @entityClass=KonziloEntity) ->
      @count = 0
      @limit = 0
      @storage = entityStorage(@name)
      name = @name.toLowerCase()
      # This is in HAL format and contains many embedded entities.
      if _.isPlainObject(result) and result._embedded[name]
        data = result._embedded[name]
        @count = result.count
        @skip = result.skip
        @limit = result.limit
      else
        data = result
      # Make sure all items are wrapped in entity classes.
      @data = for item in data
        if not item.toObject
          new @entityClass(@name, item)
        else
          item

    toArray: -> item.toObject() for item in @data

    add: (item) ->
      if not item.toObject
        item = new @entityClass(@name, item)
      @data.push(item)

    get: (item) ->
      if not _.isPlainObject(item) and not item.toObject
        return _.find @data, (value) -> value.id() is item

      if not item.toObject
        item = new @entityClass(@name, @data)

      _.find @data, (value) ->
        value.id() is item.id()

    remove: (item) ->
      if _.isPlainObject(item)
        item = item._id
      if item.toObject
        item = item.id()
      _.remove(@data, (value) -> value.id() == item)

    hasItem: (item) ->
      if @get(item) then true else false

    getPage: (page) ->
      query = _.clone(@query)
      query.skip = @limit * page
      @storage.query(query)

    page: -> @skip/@limit

    next: ->

    pages: ->
      return 0 if @limit > @count
      return (@count - (@count%@limit))/@limit
])

.factory("KonziloStorage",
["$resource", "KonziloEntity", "KonziloCollection",
"entityInfo", "$q", "$http", "$cacheFactory",
($resource, KonziloEntity, KonziloCollection,
entityInfo, $q, $http, $cacheFactory) ->
  class KonziloStorage
    constructor: (@url, @name, paramDefaults = {}, @entityClass=KonziloEntity) ->
      info = entityInfo(@name)
      params = {}
      params[info.idProperty] = "@#{info.idProperty}"
      actions =
        update:
          method: "PUT"
          params: params

      @info = info
      @cache = $cacheFactory("#{@url}:#{name}")
      # @todo replace this ugly hack by removing $resource completely.
      @indexUrl = @url.split("/:")[0]
      @resource = $resource(@url, paramDefaults, actions)
      @eventCallbacks = {}

    save: (item, callback, errorCallback) ->
      @cache.removeAll()
      deferred = $q.defer()
      if not item.toObject
        item = new KonziloEntity(@name, item)

      @triggerEvent("preSave", item).then (item) =>
        data = item.toObject()
        if data._id
          method = @resource.update
        else
          method = @resource.save
        method.bind(@resource) data, (result) =>
          if item.setData
            item.setData(result)
            newItem = item
          else
            newItem = new KonziloEntity(@name, result)
          @triggerEvent("itemSaved", newItem)
          @triggerEvent("changed", newItem)
          callback(result) if callback
          deferred.resolve result
        , (result) ->
          errorCallback(result) if errorCallback
          deferred.reject(result)

      deferred.promise

    remove: (item, callback, errorCallback) ->
      @cache.removeAll()
      deferred = $q.defer()
      query = {}
      if _.isPlainObject(item)
        item = new KonziloEntity(@name, item)
      if _.isString(item)
        query[@info.idProperty] = item
      else
        query[item.idProperty()] = item.id()
      @resource.delete query, (result) =>
        @triggerEvent("itemRemoved", item) if result
        @triggerEvent("changed", item)
        callback(result) if callback
        deferred.resolve(result)
      , (result) ->
        errorCallback(result) if errorCallback
        deferred.reject(result)
      deferred.promise

    get: (item, callback, errorCallback) ->
      if _.isPlainObject(item)
        item = item._id
      $http.get("#{@indexUrl}/#{item}", cache: @cache).then (result) =>
        entity = new @entityClass(@name, result.data)
        callback(entity) if callback
        return entity

    sorted: (order, callback, errorCallback) ->
      @storage.query { _orderby: order }, (result) =>
        callback(new KonziloCollection(@name, result, 0, 0, @entityClass))
      , errorCallback

    query: (q, callback, errorCallback) ->
      if q?.reset
        @cache.removeAll()
        delete q.reset

      @queryRequests = @queryRequests or {}
      cacheKey = ""
      deferred = $q.defer()
      for key, item of q
        q[key] = JSON.stringify(item) if _.isPlainObject(item)

      $http.get(@indexUrl, { params: q, cache: @cache }).then (result) =>
        data = result.data
        collection = new KonziloCollection(@name, data, q, @entityClass)
        callback(collection) if callback
        deferred.resolve(collection)
      , (result) ->
        errorCallback(result) if errorCallback
        deferred.reject(result)
      deferred.promise

    clearCache: -> @cache.removeAll()

    # Trigger a particular event.
    triggerEvent: (event, item) ->
      promises = []
      if @eventCallbacks[event]
        for callback in @eventCallbacks[event]
          result = callback(item)
          promises.push(result) if result?.then

      deferred = $q.defer()
      resolveCallback = (result)->
        if promises.length == 0
          deferred.resolve(result)
        else
          promises.shift().then(resolveCallback)

      if promises.length == 0
        return $q.when(item)
      promises.shift().then(resolveCallback)
      return deferred.promise

    # Item removed event.
    itemRemoved: (fn) ->
      @on "itemRemoved", fn

    # Item saved event.
    itemSaved: (fn) ->
      @on "itemSaved", fn

    preSave: (fn) ->
      @on "preSave", fn

    changed: (fn) ->
      @on "changed", fn

    on: (event, fn) ->
      if not @eventCallbacks[event]
        @eventCallbacks[event] = []
      @eventCallbacks[event].push fn
])
.directive("entityView",
["$controller", "$compile", "entityStorage", "$q",
($controller, $compile, entityStorage, $q) ->
  restrict: 'AE'
  scope: { "entity": "=" }
  link: (scope, element, attrs) ->
    entity = scope.entity
    type = entity?.type or attrs.entityType
    id = entity?.id() or attrs.entityId
    mode = attrs.mode
    if entity
      entityPromise = $q.when(entity)
    else
      deferred = $q.defer()
      entityStorage(type).get id, (result) ->
        deferred.resolve result
      entityPromise = deferred.promise

    entityPromise.then (result) ->
      result.view
        scope: scope
        type: type
        element: element
        attrs: attrs
        entity: result
        mode: attrs.mode
])
.directive("entityReference",
["entityStorage", "entityInfo", "$q", "$parse",
(entityStorage, entityInfo, $q, $parse) ->
  restrict: "E"
  scope:
    ngRequired: "="
    ngModel: "="
  controller: ($scope, $attrs, $element) ->
    entityType = $attrs.entityType
    info = entityInfo(entityType)
    if info
      storage = entityStorage(entityType)
      labelProperty = info.labelProperty
      idProperty = info.idProperty
    else
      throw new Error("No entity with the name #{entityType}")

    $scope.editable = false
    $scope.fetchMatches = (name) ->
      return [] if not info
      query = { q: {}}
      query.q[labelProperty] = { $regex: name }
      storage.query(query).then (result) ->
        for item in result.toArray()
          "#{item[labelProperty]} [#{item[idProperty]}]"

    modelChanged = ->
      if $scope.ngModel
        if _.isString($scope.ngModel)
          storage.get($scope.ngModel).then (entity) ->
            $scope.ngModel = entity.toObject()
            $scope.label = "#{$scope.ngModel[labelProperty]}"
        else
          $scope.label = "#{$scope.ngModel[labelProperty]}"
      else
        $scope.label = ""

    $scope.entityChanged = ->
      result = /\[(.*)\]/.exec($scope.label)
      if result?.length == 2
        storage.get(result[1]).then (entity) ->
          $scope.ngModel = entity.toObject()
          $scope.$emit('entityReferenceChanged', $scope.ngModel)
    $scope.$watch("label", $scope.entityChanged)
    $scope.$watch("ngModel", modelChanged)
    $scope.label = ""
    return

  template: "<ng-form name=\"referenceForm\">
    <input type=\"text\" name=\"title\" ng-model=\"label\"
    typeahead=\"entity for entity in fetchMatches($viewValue)\"
    typeahead-editable=\"editable\" autocomplete=\"off\" /></ng-form>"
])

.directive("kzEntityPager", ->
  restrict: "AE"
  scope:
    collection: "="
    itemsFetched: "="
  controller: ["$scope", ($scope) ->
    $scope.currentPage = 0
    $scope.pages = 0
    update = ->
      return if not $scope.collection?.pages
      $scope.pages = $scope.collection.pages()
      $scope.getPage = ->
        $scope.currentPage += 1
        $scope.collection.getPage($scope.currentPage).then($scope.itemsFetched)
    $scope.$watch("collection", update)
    return
  ]
  template: "<a class=\"pager\" ng-click=\"getPage(page)\" ng-show=\"currentPage < pages\">
    {{'GLOBAL.FETCHMORE' | translate}}</a>"
)

.directive("validEntity",
["entityStorage", "$parse", (entityStorage, $parse) ->
  restrict: "A",
  require: "ngModel"
  scope:
    entityType: "=validEntity"
  link: (scope, elm, attrs, ctrl) ->
    ctrl.$parsers.unshift (viewValue) ->
      if scope.entityType
        storage = entityStorage(scope.entityType)
        if viewValue and viewValue.length > 0
          storage.get viewValue, ->
            ctrl.$setValidity('validEntity', true)
          , ->
            ctrl.$setValidity('validEntity', false)
      viewValue
    return
])
