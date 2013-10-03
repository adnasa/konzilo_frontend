angular.module("konzilo.timeline", ["kntnt.article"])
.factory("DomCanvas", ->
  class Component
    constructor: (x, y) ->
      @element = $("<div></div>")
      @element.css
        position: "absolute"
      @options = {}
      @attr(x: x, y: y)

    attr: (options) ->
      @options = _.extend(@options, options)

      @x = @options.x
      @y = @options.y

      @element.css
        left: @options.x
        top: @options.y

      return @

    collidesWith: (component) ->
      return if not @collidesEvent
      callback.bind(this)(component) for callback in @collidesEvent

    collision: (callback) ->
      @collidesEvent = @collidesEvent or []
      @collisionCheck = true
      @collidesEvent.push(callback)
      return @

  class Rectangle extends Component
    constructor: (x, y, @width, @height) ->
      super(x, y)
      @element.css
        width: @width
        height: @height

    intersects: (x, y, width, height) ->
      (@x + @width > x and x < @x + @width) and
      (@y + @height > y and y < @height + @y)

    attr: (options) ->
      super(options)
      return @

  class Text extends Component
    constructor: (text, x, y) ->
      super(x,y)
      @element.html(text)
      @element.css("word-wrap", "break-word")
      @element.css("overflow", "hidden")
      return @

  class DomCanvas
    constructor: (@element) ->
      @components = []
      @element.css("position", "relative")

    addComponent: (component) ->
      @components.push(component)
      @element.append(component.element)

    collisions: ->
      collisionCheck = (component) ->
        component.width and component.height and
        component.collisionCheck

      collides = (component, test) ->
        test != component and
        (test.x + test.width > component.x and test.x < component.x + component.width) and
        (test.y + test.height > component.y and test.y < component.height + component.y)
      collisions = []
      for component in @components when collisionCheck(component)
        collision = (test for test in @components when collisionCheck(test) and
        collides(component, test))
        if collision.length > 0
          collisions.push(collision)

      for collision in collisions
        for component in collision
          component.collidesWith(_.without(collision, component))

      return collisions

    rectangle: (x, y, width, height) ->
      rectangle = new Rectangle(x, y, width, height)
      @addComponent(rectangle)
      return rectangle

    text: (text, x, y) ->
      text = new Text(text, x, y)
      @addComponent(text)
      return text

    remove: (component) ->
      component.element.remove()
      @components = _.without(@components, component)

    clear: ->
      @components = []
      @element.html('')
)
.factory("Timeline",
["ArticleStorage", "$location", "$filter", "DomCanvas",
(ArticleStorage, $location, $filter, DomCanvas) ->
  class Timeline
    dayDiff: (first, second) -> (second-first)/(1000*60*60*24)
    hourDiff: (first, second) -> (second-first)/(1000*60*60)

    constructor: (element, @dataRetreiveFn) ->
      @width = element.width()
      @dayOffset = Math.round(@width/15)
      @height = 200
      x = 0
      y = 0
      startX = 0
      stepX = 0
      dX = 0
      dragging = false
      sensitivity = 10
      zoom = 5
      @start = new Date()
      startDragDay = null
      @hourPaths = []
      element.css("background", "#fff")
      element.css("height", @height)
      @draw = new DomCanvas(element)

      element.mousedown (e) =>
        dragging = true
        startX = e.pageX
        startDragDay = @start
        stepX = 0
        return

      element.mousemove (e) =>
        if dragging
          dX = startX - e.pageX
          return if dX%sensitivity != 0
          step = if dX > 0 then 1 else -1
          @start = new Date(@start.getFullYear(), @start.getMonth(),
            @start.getDate() + step)
          @end = new Date(@start.getFullYear(), @start.getMonth(),
            @start.getDate() + @width/@dayOffset)
          if @dateChangedFn
            @dateChangedFn(@start, @end)

          @drawLabels()
          @clearData()
        return

      element.mouseup (e) =>
        dragging = false
        @drawData() if startDragDay != @start
        return

      element.bind "mousewheel", (e, delta) =>
        zoom = if delta > 0 then 5 else -5
        @dayOffset += zoom
        @draw.clear()
        @drawBackground()
        @drawLabels()
        @drawData()
        e.preventDefault()
        return

    drawBackground: ->
      line = @draw.rectangle(0, @height-30, @width, 1)
      line.element.addClass("separator")
      return

    drawLabels: ->
      hourOffset = @dayOffset/24
      date = @start

      @labels = @labels or []
      @draw.remove(label) for label in @labels
      @labels = []

      for x in [0..@width] by @dayOffset
        prevDate = date
        date = new Date(@start.getFullYear(), @start.getMonth(),
          @start.getDate() + x/@dayOffset)
        if prevDate.getMonth() < date.getMonth()
          label = $filter('date')(date, "MMM")
          @labels.push @draw.text(label, x-@dayOffset/2, @height-10)
        if @dayOffset > 40
          label = $filter('date')(date, "dd/M")
          @labels.push @draw.text(label, x-@dayOffset/2, @height-20)
      return @date

    render: (start) ->
      @drawBackground()
      @start = start
      @end = new Date(@start.getFullYear(), @start.getMonth(),
        @start.getDate() + @width/@dayOffset)
      @drawLabels()
      @drawData()

    clearData: ->
      @items = @items or []
      for item in @items
        @draw.remove(item)
        @draw.remove(item.line)
      @items = []
      return

    calculatePosition: (x, y, width, height, items) ->
      for item in items
        while item.intersects(x, y, width, height)
          y = item.y + height + 20
      return x: x, y: y, width: width, height: height

    dateChanged: (fn) ->
      @dateChangedFn = fn

    drawData: ->
      hourOffset = @dayOffset/24
      @dataRetreiveFn(@start, @end).then (items) =>
        @clearData()
        for item in items
          diff = Math.round(@hourDiff(@start, item.publishdate))
          startX = Math.round((diff * hourOffset) - hourOffset)
          datestring = $filter('date')(item.publishdate, 'yyyy-M-d')
          width = @dayOffset
          p = @calculatePosition(startX - (width/2), 10, width, 25, @items)
          line = @draw.rectangle(p.x + width/2, p.y, hourOffset/2,
          @height - p.y - 30)
          line.element.addClass("line")
          article = @draw.rectangle(p.x, p.y, p.width, p.height)
          article.element.html("<a href=\"#/plan/#{item._id}\">#{item.title}</a>")
          article.element.addClass("item")
          article._id = item._id
          article.line = line
          @items.push(article)

        return
])
.directive("timelineCanvas",
["ArticleStorage", "$location", "Timeline",
(ArticleStorage, $location, Timeline) ->
  restrict: "AE",
  scope: { data: "=", start: "=", end: "=" }
  link: (scope, element, attrs) ->
    timeline = new Timeline(element, scope.data)
    timeline.render(scope.start)
    changeDate = ->
      timeline.start = scope.start
      if scope.end
        timeline.end = scope.end
        timeline.dayOffset = timeline.width/timeline.dayDiff(timeline.start, timeline.end)
      timeline.drawLabels()
      timeline.clearData()
      timeline.drawData()

    timeline.dateChanged (start, end) ->
      scope.start = start
      scope.end = end

    ArticleStorage.on "changed", ->
      changeDate()

    scope.$watch("start", changeDate)
    scope.$watch("end", changeDate)
    return
])
.directive("timeline",
["ArticleStorage", "$location", "Timeline",
(ArticleStorage, $location, Timeline) ->
  restrict: "AE",
  templateUrl: "bundles/timeline/timeline.html"
  scope: { storage: "=", query: "=" }
  controller: ($scope) ->
    $scope.startdate = new Date()
    $scope.getData = (startDate, endDate) ->
      ArticleStorage.query
        q:
          $and: [
            { publishdate: $gte: startDate }
            { publishdate: $lte: endDate }
          ]
      .then (data) -> data.toArray()
    return
])
