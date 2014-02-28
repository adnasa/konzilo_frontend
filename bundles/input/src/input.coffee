# The input module) provides convenient widgets for inputting
# different kinds of input.
angular.module("cmf.input", [])

# Input an array of basic data types
# like strings and numbers.
.directive("cmfInputList", ->
  restrict: "E"
  replace: true
  transclude: true
  require: 'ngModel'
  templateUrl: 'bundles/input/input-list.html'
  scope: { ngModel: '=', ngChange: '=', placeholder: "@" }
  controller: ["$scope", "$parse", "$attrs", ($scope, $parse, $attrs) ->
    # We need to clone the array to avoid losing focus
    # when updates occur.
    $scope.$watch "ngModel", ->
      $scope.list = _.clone($scope.ngModel)
      $scope.list = [] if not $scope.ngModel

    # Change the model.
    $scope.changeValue = (key) ->
      $scope.ngModel[key] = $scope.data[key]
      return

    # Add element to a list and make sure it's still unique.
    $scope.addElement = =>
      if not _.isEmpty($scope.element)
        $scope.ngModel.push $scope.element
        $scope.ngModel = _.unique($scope.ngModel)
        $scope.element = ""
        $scope.list = _.clone($scope.ngModel)

    $scope.removeElement = (item) ->
      $scope.ngModel = _.without($scope.ngModel, item)
  ]
)
.directive("ngEnter", ->
  (scope, element, attrs) ->
    element.bind "keydown keypress", (event) ->
      if event.which == 13
        scope.$apply ->
          scope.$eval attrs.ngEnter, {'event': event}
        event.preventDefault()
)
# Checkboxes are a pain to handle. This makes the input of them easier.
# Usage:
#   <cmf-checkboxes list="your-data-list" choices="your-list-of-choices" />
# This directive will produce a list with all items that are selected, and store
# that in the variable in the list attribute.
.directive("cmfCheckboxes", ->
  restrict: "E"
  replace: true
  transclude: true,
  template: "<div class=\"checkboxes\">
    <label class=\"checkbox\" ng-repeat=\"(index, choice) in choices\">
      <input type=\"checkbox\" ng-change=\"change()\"
    ng-model=\"model[choice]\"> {{choice}}
    </label>
  </div>"
  scope: { "list": "=list", choices: "=choices" }
  controller: ["$scope", ($scope) ->
    # Populate the model
    $scope.model = {}
    if $scope.choices and $scope.choices and $scope.list
      for choice in $scope.choices
        $scope.model[choice] = choice in $scope.list

    $scope.labels = $scope.list if not $scope.labels

    $scope.change = ->
      $scope.list = (value for value, selected of $scope.model when selected)
  ]
)

.factory("InlinePreview", ->
  class InlinePreview
    constructor: (@model) ->

    hideInput: ->
      # If we use display: none, the browser will
      # skip the element when tabbing. We use zero
      # height to avoid this problem.
      $(@input).height(0)
      $(@input).css('overflow', 'hidden')

    showInput: ->
      $(@input).height("auto")

    setPreviewElement: (previewElement) =>
      @preview = previewElement
      if not @model or @model.length == 0
        $(@preview).hide()

      $(@preview).click =>
        $(@preview).hide()
        $("*", @input).focus()
        @showInput()

    setInputElement: (inputElement, focusElement) =>
      @input = inputElement
      if @model and @model.length > 0
        @hideInput()
      @input.focus =>
        $(@preview).hide()
        @showInput()
      @input.find("input, textarea").focus =>
        @focused = true
        $(@preview).hide()
        @showInput()
        # Set focus to the proper element.

      @input.find("input, textarea").blur =>
        @focused = false
        if @model and @model.length > 0
          @hideInput()
          $(@preview).show()
        else
          $(@preview).hide()

    updateModel: (@model) ->
      if not @model or @model.length == 0
        $(@preview).hide()
        @showInput()
      else if not @focused
        $(@preview).show()
        @hideInput()

)

# Creates an "inline" experience by showing the data, and make it
# editable when hovering.
# @todo This is not very angularian. It could probably be fixed
# with more knowledge about how the $digest loop works.
.directive("cmfInline", ["InlinePreview", (InlinePreview) ->
  restrict: "E"
  transclude: true
  replace: true
  template: "<div class=\"inline\" ng-transclude></div>"
  scope: ngModel: "="
  controller: ["$scope", ($scope) ->
    @preview = new InlinePreview($scope.ngModel)
    $scope.$watch "ngModel", => @preview.updateModel($scope.ngModel)
    return this
  ]
])

# The inline input attribute specifies that this element
# is a form element that should be toggled.
.directive("cmfInlineInput", ->
  restrict: "E"
  require: "^cmfInline"
  transclude: true
  replace: true
  link: (scope, element, attrs, CmfInlineCtrl) ->
    CmfInlineCtrl.preview.setInputElement element, attrs.child
  template: "<div class=\"input\" ng-transclude></div>"
)

# The inline preview attribute indicates that the encapsulated
# content is the preview of the inline data.
.directive("cmfInlinePreview", ->
  restrict: "E"
  require: "^cmfInline"
  transclude: true
  replace: true
  template: "<div class=\"input-preview\">
  <div class=\"content\" ng-transclude></div></div>"
  link: (scope, element, attrs, CmfInlineCtrl) ->
    CmfInlineCtrl.preview.setPreviewElement element
)

.directive("contentTable",
["$filter", "entityInfo", "entityStorage", "KonziloEntity", "$parse",
($filter, entityInfo, entityStorage, KonziloEntity, $parse) ->
  restrict: "AE",
  transclude: true
  templateUrl: "bundles/input/content-table.html"
  scope:
    query: "="
    itemsSelected: "="
    properties: "="
  controller: ["$scope", "$attrs", ($scope, $attrs) ->
    $scope.operation = ""
    $scope.selected = {}

    if $attrs.items
      $scope.$parent.$watch $parse($attrs.items), (value) ->
        $scope.items = value

    if $attrs.operations
      $scope.$parent.$watch $parse($attrs.operations), (value) ->
        $scope.operations = value

    entityType = $scope.$eval($attrs.entityType) or $attrs.entityType

    update = ->
      if $scope.query and storage
        storage.query({ q: $scope.query }).then (result) ->
          $scope.items = result.toArray()
          $scope.selected = {}

    if entityType
      info = entityInfo(entityType)
      storage = entityStorage(entityType)
      storage.on "changed", update

    if not $scope.operations and info?.operations
      $scope.operations = info.operations

    $scope.$watch "query", ->
      update()

    $scope.$watch "properties", ->
      if not $scope.properties and info?.properties
        $scope.props = _.keys(info.properties)
        $scope.headers = _.pluck(info.properties, "label")
      else if $scope.properties
        $scope.headers = for key, value of $scope.properties
          if _.isString(value) then value else value.label
        $scope.props = _.keys($scope.properties)
      return

    $scope.performActions = ->
      if not $scope.operation or _.size($scope.selected) is 0
        return
      for item, key in $scope.items
        if $scope.selected[key]
          if info
            item = new KonziloEntity(entityType, item)
          $scope.operation.action(item)
      $scope.selected = {}

    $scope.toggleSelect = ->
      items = $filter('filter')($scope.items, $scope.search)

      $scope.printVal = (val) ->
        return val.label if _.isObject(val)
        val

      for item, key in items
        $scope.selected[key] = $scope.selectall
  ]
])

.directive("draggableContentTable",
["$filter", "entityInfo", "entityStorage", "KonziloEntity", "$parse",
($filter, entityInfo, entityStorage, KonziloEntity, $parse) ->
  restrict: "AE",
  transclude: true
  templateUrl: "bundles/input/draggable-content-table.html"
  scope:
    query: "="
    itemsSelected: "="
    properties: "="
  controller: ["$scope", "$attrs", ($scope, $attrs) ->
    storage = null
    $scope.operation = ""
    $scope.selected = {}
    $scope.weight = $attrs.weight
    if $attrs.items
      $scope.$parent.$watch $parse($attrs.items), (value) ->
        $scope.items = value

    if $attrs.operations
      $scope.$parent.$watch $parse($attrs.operations), (value) ->
        $scope.operations = value

    entityType = $scope.$eval($attrs.entityType) or $attrs.entityType

    $scope.sortableOptions =
      stop: (event, ui) ->
        if $scope.weight and $scope.items and storage
          for item, index in $scope.items
            item[$scope.weight] = index
            storage.save(item)

    update = ->
      if $scope.query and storage
        # @todo Remove this once all of the implementations are converted.
        if not $scope.query.q
          $scope.query = { q: $scope.query }
        storage.query($scope.query).then (result) ->
          $scope.items = result.toArray()
          $scope.selected = {}

    if entityType
      info = entityInfo(entityType)
      storage = entityStorage(entityType)
      storage.on "changed", update

    if not $scope.operations and info?.operations
      $scope.operations = info.operations

    $scope.$watch "query", ->
      update()

    $scope.$watch "properties", ->
      if not $scope.properties and info?.properties
        $scope.props = _.keys(info.properties)
        $scope.headers = _.pluck(info.properties, "label")
      else if $scope.properties
        $scope.headers = for key, value of $scope.properties
          if _.isString(value) then value else value.label
        $scope.props = _.keys($scope.properties)
      return

    $scope.performActions = ->
      if not $scope.operation or _.size($scope.selected) is 0
        return
      for item, key in $scope.items
        if $scope.selected[key]
          if info
            item = new KonziloEntity(entityType, item)
          $scope.operation.action(item)
      $scope.selected = {}

    $scope.toggleSelect = ->
      items = $filter('filter')($scope.items, $scope.search)

      $scope.printVal = (val) ->
        return val.label if _.isObject(val)
        val

      for item, key in items
        $scope.selected[key] = $scope.selectall
  ]
])

# Sometimes you want a placeholder for text that hasn't
# been entered yet. little filter facilitates that.
# Usage: {{ myvariable | placeholder: "coming son" }}
.filter('placeholder', ->
  (input, placeholder) ->
    if input and input != "undefined" then input else placeholder
)

.directive('contentValue', ["$compile", ($compile) ->
  restrict: "AE"
  scope: { item: "=", property: "=", options: "=" }
  replace: true
  link: (scope, element, attrs) ->
    update = ->
      if not scope.item or not scope.property
        return

      if _.isPlainObject(scope.options) and scope.options.value
        scope.output = scope.options.value(scope.item)
      else if scope.item[scope.property]
        if not scope.item[scope.property].label?
          scope.output = { label: scope.item[scope.property] }
        else
          scope.output = _.clone(scope.item[scope.property])

      if scope.output?.html
        element.html(scope.output.html)
      else if scope.output?.link and scope.output?.label
        element.html("<a href=\"{{output.link}}\">{{output.label}}</a>")
      else
        element.html("{{output.label}}")

      $compile(element.contents())(scope)
    update()
    scope.$watch('value', update)
])


.factory("InputAutoSave", ["$timeout", ($timeout) ->
  class InputAutoSave
    constructor: (@obj, @saveCallback, @validCallback, @dirtyCallback = null, @timeout = 1500) ->
      @originalObj = _.cloneDeep(@obj)
      @saveCallbacks = []
      @errorCallbacks = []

      if not @dirtyCallback
        @dirtyCallback = (original, newObj) ->
          not _.isEqual(original, _.cloneDeep(newObj))

      @callback = =>
        if @dirtyCallback(@originalObj, @obj) and @validCallback(@obj) and
        not @stopSaving
          result = @saveCallback(@obj)
          if result?.then
            result.then =>
              callback(@obj) for callback in @saveCallbacks
              delete @originalObj
              @originalObj = _.cloneDeep(@obj)
            , (err) =>
              @originalObj = _.cloneDeep(@obj)
              callback(err) for callback in @errorCallbacks
          else
            @originalObj = _.cloneDeep(@obj)
            callback(@obj) for callback in @saveCallbacks

        if not @stopSaving
          $timeout @callback, @timeout
        return
      @callback()

    dirty: -> @dirtyCallback(@originalObj, @obj)

    stop: ->
      @stopSaving = true

    start: ->
      @startSaving = false
      @callback()

    onSave: (callback) ->
      @saveCallbacks.push(callback)

    onError: (callback) ->
      @errorCallbacks.push(callback)

  createInstance: (@obj, @saveCallback, @validCallback, @timeout) ->
    if @instance
      @instance.stop()
    @instance = new InputAutoSave(@obj, @saveCallback, @validCallback, @timeout)
    return @instance
])

.directive("contenteditable", ->
  restrict: "A"
  require: "ngModel"
  link: (scope, elm, attrs, ctrl) ->
    elm.keyup ->
      ctrl.$setViewValue(elm.html())

    ctrl.$render = () ->
      elm.html(@$viewValue)
)

.directive("cmfAutosaveStatus", ["$timeout", ($timeout) ->
  restrict: "E"
  transclude: true
  replace: true
  scope: { status: "=" }
  controller: ["$scope", ($scope) ->

    pad = (number) ->
      r = String(number)
      r = '0' + r if r.length is 1
      r

    getDateString = () ->
      date = new Date()
      pad(date.getHours()) + ':' + pad(date.getMinutes()) +
        ":" + pad(date.getSeconds())

    reset = ->
      $scope.statusMessage = null

    oldStatus = null
    updateStatus = ->
      status = $scope.status
      if status and (not oldStatus or status is not oldStatus)
        oldStatus = status
        status.onSave ->
          currentDate = new Date()
          $scope.statusMessage = "GLOBAL.SAVED"
          $scope.translations = date: getDateString()
          $timeout(reset, 2000)
          $scope.error = false
          return
        status.onError (err) ->
          $scope.error = true
          $scope.statusMessage = err.data.message
    updateStatus()
    $scope.$watch('status', updateStatus)
  ]
  template: "<div class=\"save-status\" ng-class=\"{error: error}\"
    ng-show=\"statusMessage\">{{statusMessage | translate: translations}}</div>"
])

.directive("kzFocus", ->
  restrict: "A"
  link: (scope, element, attrs) ->
    elementFocused = false
    element.on "focus", ->
      if not elementFocused
        scope.$eval(attrs.kzFocus)
        elementFocused = true
    element.on "blur", ->
      elementFocused = false

)
.directive("kzMachineName", ->
  restrict: "AE"
  replace: true
  template: "<ng-form>
  <div class=\"form-group\">
    <label class=\"control-label\">{{'GLOBAL.NAME' | translate}}</label>
    <input type=\"text\" ng-model=\"label\" name=\"label\" required />
    <div class=\"help-block\" ng-show=\"name\">
      {{'GLOBAL.MACHINENAME' | translate}}: {{name}}
      <a ng-click=\"customName=true\">{{'GLOBAL.CHANGE' | translate}}</a>
    </div>
  </div>
  <div class=\"form-group\"  ng-show=\"customName\">
    <label class=\"control-label\">{{'GLOBAL.MACHINENAME' | translate}}</label>
    <input type=\"text\" ng-model=\"name\" name=\"name\" required />
  </div>
  </ng-form>"
  scope: { name: "=", label: "=", valid: "=" }
  controller: ["$scope", "$q", ($scope, $q) ->
    transliterate = (source) ->
      rx = new RegExp('[^a-z0-9]+', 'g')
      return source.toLowerCase().replace(rx, "_").substr(0, 40)

    validate = (candidate) ->
      if $scope.valid
        result = $scope.valid(candidate)
      if result?.then
        result.then (promisedResult) ->
          if promisedResult
            candidate
          else
            validate(candidate + "_")
      else if result
        return $q.when(candidate)
      else
        validate(candidate + "_").then (newCandidate) ->
          return newCandidate

    $scope.$watch "label", ->
      if $scope.label
        validate(transliterate($scope.label)).then (result) ->
          $scope.name = result
  ]
)
