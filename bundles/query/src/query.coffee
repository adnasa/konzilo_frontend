# The konzilo query module provides utilities
# for creating advanced queries backed by user
# interfaces.
angular.module("konzilo.query", [])

.constant("queryOperators",
  or: "$or"
  and: "$and"
  eq: "="
  regex: "$regex"
)

.provider("queryFilter", ->
  class BaseFilter
    name: "BaseFilter"
    constructor: (@name, @label, @description) ->
    query: (val) ->
      result = {}
      result[@name] = val

    templateUrl: "bundles/query/components/filter-input.html"
    settings: ->
      name: @name,
      label: @label
      description: @description

  class MatchFilter extends BaseFilter
    name: "MatchFilter"
    query: (val) ->
      result = {}
      result[@name] = {}
      result[@name][queryOperators.regex] = val
      result

  class OptionsFilter extends BaseFilter
    name: "OptionsFilter"

    constructor: (@name, @label, @description, @optionValues) ->

    options: -> @optionValues

    labelCallback: (item, callback) ->
      callback(@optionValues[item])

    query: (val) ->
      result = {}
      result[@name] = {}
      result[@name][queryOperators.regex] = val
      result

  class ReferenceFilter extends BaseFilter
    name: "ReferenceFilter"
    constructor: (@name, @label, @description,
    @storage, @labelProperty="title", @idProperty="id") ->
      @filter = {}

    setFilter: (@filter) ->

    options: ->
      @storage.query({ q: @filter }).then (result) =>
        options = {}
        for item in result.toArray()
          options[item[@idProperty]] = item[@labelProperty]
        return options

    labelCallback: (item, callback) ->
      if not _.isObject(item)
        item = @storage.get item, (item) =>
          callback(item.label())
      else
        callback(item.label())

    query: (val) ->
      result = {}
      result[@name] = val
      result

    settings: ->
      base = super
      _.extend base,
        storage: typeof @storage
        labelProperty: @labelProperty
        idProperty: @idProperty

  provider =
    filter: (name, definition) ->
      @filters = @filters or {}
      @filters[name] = definition

    getFilters: -> @filters

    $get: ->
      (name) => @filters?[name]

  provider.filter("BaseFilter", BaseFilter)
  provider.filter("MatchFilter", MatchFilter)
  provider.filter("ReferenceFilter", ReferenceFilter)
  provider.filter("OptionsFilter", OptionsFilter)
  return provider
)

.factory("QueryBuilderStorage",
["KonziloConfigDefaultStorage", (KonziloConfigDefaultStorage) ->
  storage = _.clone KonziloDefaultStorage

  storage.serialize = (obj) ->
    serialized = {}
])

.factory("QueryBuilder",
["queryOperators", (queryOperators) ->
  class QueryGroup
    constructor: (@name, @operator, @outerOperator=queryOperators.and) ->
      @filters = []

    addFilter: (filter, value, callback) ->
      definition =
        filter: filter
        value: value
        label: value

      if filter.labelCallback
        filter.labelCallback value, (label) =>
          definition.label = label
          @filters.push definition
          callback(definition) if callback
      else
        @filters.push definition
        callback(definition) if callback

    serialize: ->
      group =
        name: @name
        operator: @operator
        outerOperator: @outerOperator

      group.filters = for filter in @filters
        filterInstance: filter.filter.name
        value: filter.value
      group

  class QueryBuilder
    constructor: (@resource, filterInstances) ->
      @groupNames = {}
      @groups = []
      @listeners = []
      @resource.changed =>
        @execute()
      @filterInstances = {}
      for instance in filterInstances
        @filterInstances[instance.name] = instance

    serialize: ->
      groups: group.serialize() for group in @groups

    unserialize: (data, callback) ->
      addGroups = (groups) =>
        return callback() if groups.length is 0 and callback
        group = groups.shift()
        @addGroup group, null, null, ->
          addGroups(groups)
      addGroups(data.groups)

    # Add a logical group to the query.
    addGroup: (name, operator=queryOperators.or, outerOperator=queryOperators.and, callback) ->
      if _.isObject(name)
        group = new QueryGroup(name.name, name.operator, name.outerOperator)
        addFilters = (filters) =>
          return callback(group) if filters.length is 0 and callback
          filter = filters.shift()
          group.addFilter @filterInstances[filter.filterInstance], filter.value, ->
            addFilters(filters)
        addFilters(name.filters)
      else
        group = new QueryGroup(name, operator, outerOperator)

      @groups.push group
      @groupNames[name] = group
      callback(group) if callback
      group

    # Add a filter to the query
    addFilter: (filter, value, group="default", callback) ->
      @groupNames[group].addFilter(filter, value, callback)

    queryExecuted: (callback) ->
      @listeners.push(callback)

    execute: (callback, errorCallback) ->
      resultQuery = {}
      for group in @groups
        groupQuery = {}
        groupQuery[group.operator] = []
        if not resultQuery[group.outerOperator]
          resultQuery[group.outerOperator] = []

        for filter in group.filters
          groupQuery[group.operator].push(filter.filter.query(filter.value))

        resultQuery[group.outerOperator].push(groupQuery)
      # { $and: { $or: { property1: 2, property2: 1 }, {property3 = 4}}
      # ((property1 = 2 or property2 = 3) and (property3 = 4))
      if _.size(resultQuery) == 1 and _.size(_.toArray(resultQuery)[0]) == 1
        resultQuery = _.first(_.toArray(resultQuery)[0])
      @resource.query { q: resultQuery, limit: 10 }, (result) =>
        eventCallback(result) for eventCallback in @listeners
        callback(result) if callback
])

.controller("konziloFilterConfig",
["$scope", "$modalInstance", "filter", ($scope, $modalInstance, filter) ->
  $scope.filter = filter
  $scope.options = filter.options() if filter.options
  $scope.saveValue = ->
    $modalInstance.close($scope.value)
])

.directive("konziloQueryFilters",
["$modal", "queryOperators", "UserState", "queryFilter",
($modal, queryOperators, UserState, queryFilter) ->
  restrict: 'AE',
  scope: { builder: "=", description: "@" }
  templateUrl: "bundles/query/filters.html"
  controller: ["$scope", "$element", "$attrs", ($scope, $element, $attrs) ->
    $scope.groups = $scope.builder.groups
    originalFilters = _.toArray($scope.builder.filterInstances)
    $scope.filters = _.clone(originalFilters)

    queryFilter = null
    for filter in $scope.filters
      if filter.options
        filter.optionValues = filter.options()
      else
        filter.optionValues = {}

    $scope.dropdownMenu = (filter) ->
      if filter.options then "dropdown-submenu" else ""

    $scope.filterOptions = (filter) ->
      filter.options or {}

    # Get saved settings from the user settings.
    UserState.getInfo().getSetting "queryfilters", (result) ->
      $scope.builder.unserialize result, ->
        for group in  $scope.builder.groups when group.filters.length > 0
          group.filter = group.filters[0].filter
        for group in $scope.groups
          $scope.filters = _.without($scope.filters, group.filter)
        $scope.builder.execute()

    $scope.addGroup = (filter, item) ->
      name = $scope.groups.length
      group = $scope.builder.addGroup(name, queryOperators.or)
      group.filter = filter
      if item
        group.addFilter filter, item, ->
          $scope.filters = _.without($scope.filters, filter)
          $scope.builder.execute()
          UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize())
      else
        $modal.open
          templateUrl: filter.templateUrl
          resolve: { filter: -> filter }
          controller: "konziloFilterConfig"
        .result.then (value) ->
          if not _.isEmpty(value)
            group.addFilter filter, value, ->
              $scope.filters = _.without($scope.filters, filter)
              $scope.builder.execute()
              UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize())

    $scope.removeGroup = (group) ->
      $scope.filters.push(group.filter)
      # Ensure order
      $scope.filters = for filter in originalFilters when filter in $scope.filters
        filter
      $scope.builder.groups = _.without($scope.builder.groups, group)
      $scope.groups = $scope.builder.groups
      $scope.builder.execute()
      UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize())


    $scope.removeFilter = (group, filter) ->
      group.filters = _.without(group.filters, filter)
      $scope.builder.execute()
      UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize())

    $scope.selectOption = (group, filter, item) ->
      group.filter = filter
      group.addFilter filter, item, ->
        UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize())
        $scope.builder.execute()

    $scope.filterAvailable = (group, value) ->
      for groupFilter in group.filters
        if value is groupFilter.value
          return false
      true

    $scope.configureFilter = (filter, group) ->
      group.filter = filter
      return if filter.optionValues
      $modal.open
        templateUrl: filter.templateUrl
        resolve: { filter: -> filter }
        controller: "konziloFilterConfig"
      .result.then (value) ->
        if not _.isEmpty(value)
          group.addFilter filter, value, ->
            UserState.getInfo().saveSetting("queryfilters", $scope.builder.serialize())
            $scope.builder.execute()
  ]
])
