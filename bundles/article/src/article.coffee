# The article module provides everything related to
# articles and the metadata they represent in the application.
angular.module("kntnt.article",
  [
    "ui.bootstrap"
    "cmf.input"
    "ui.jq"
    "ui.bootstrap"
    "konzilo.query"
    "konzilo.entity"
    "konzilo.markdown"
    "konzilo.author"
    "konzilo.translations"
  ]
)

.value('uiJqConfig',
  draggable:
    revert: "invalid"
)

.provider("articleParts", ->
  providers:
    text: ["$translate", ($translate) ->
      label: $translate("TEXTPART.LABEL")
      controller: ["$scope", "articlePart",
      "InputAutoSave", "useAutoSave",
      ($scope, articlePart, InputAutoSave, useAutoSave) ->
        $scope.part = articlePart.toObject()
        $scope.part.content = $scope.part.content or {}
        $scope.content = $scope.part.content
        savePart = ->
          articlePart.set("byline", $scope.part.byline)
          articlePart.set("content", $scope.content)
          articlePart.save()
        clean = -> $scope.partForm.$valid
        if useAutoSave
          $scope.autosave = new InputAutoSave($scope.part, savePart, clean)
      ]
      templateUrl: "bundles/article/articlepart-text.html"
    ]
    media: ["$translate", ($translate) ->
      label: $translate("MEDIAPART.LABEL")
      controller: ["$scope", "articlePart",
      "InputAutoSave", "useAutoSave", "$http",
      ($scope, articlePart, InputAutoSave, useAutoSave, $http) ->
        $scope.part = articlePart.toObject()
        $scope.part.content = $scope.part.content or {}
        $scope.content = $scope.part.content
        savePart = ->
          articlePart.set("byline", $scope.part.byline)
          articlePart.set("content", $scope.content)
          articlePart.save()
          return

        clean = -> $scope.partForm.$valid
        $scope.showMedia = ->
          if $scope.content.media
            request = $http.get "/oembed",
              params: { url: $scope.content.media }
            request.then (result) ->
              $scope.video = undefined
              $scope.photo = undefined
              $scope.preview = true
              if result.data.type is "video"
                $scope.video = result.data.html
              if result.data.type is "photo"
                $scope.photo = result.data.url
              if not $scope.content.title and result.data.title
                $scope.content.title = result.data.title
              if not $scope.content.creator and result.data.author_name
                $scope.content.creator = result.data.author_name
            , ->
              $scope.preview = false
        $scope.showMedia()
        if useAutoSave
          $scope.autosave = new InputAutoSave($scope.part, savePart, clean)
      ]
      templateUrl: "bundles/article/articlepart-media.html"
    ]
    image: ["$translate", ($translate) ->
      label: $translate("IMAGEPART.LABEL")
      controller: ["$scope", "articlePart",
      "InputAutoSave", "UserStorage", "$q", "useAutoSave"
      ($scope, articlePart,
        InputAutoSave, UserStorage, $q, useAutoSave) ->
        $scope.part = articlePart.toObject()
        $scope.part.content = $scope.part.content or {}
        $scope.content = $scope.part.content
        $scope.content.images = [] if not $scope.content.images
        savePart = ->
          articlePart.set("byline", $scope.part.byline)
          articlePart.set("content", $scope.content)
          articlePart.save()
          return

        clean = -> $scope.partForm.$valid
        if useAutoSave
          $scope.autosave = new InputAutoSave($scope.part, savePart, clean)
      ]
      templateUrl: "bundles/article/articlepart-image.html"
    ]
  $get: ($injector) ->
    fn = (name) => @providers[name]
    fn.getProviders = => @providers
    # Get all labels
    fn.labels = =>
      labels = {}
      for name, definition of @providers
        if _.isPlainObject(definition)
          labels[name] = definition.label
        else
          labels[name] = $injector.invoke(definition).label
      return labels
    return fn

  getProviders: -> @providers
)


# Stores articles and provides methods for retrieving them.
.factory("ArticleStorage", ["KonziloStorage", (KonziloStorage) ->
  new KonziloStorage('/article/:_id', "Article")
])
.factory("ArticlePartStorage", ["KonziloStorage", (KonziloStorage) ->
  new KonziloStorage('/articlepart/:_id', "ArticlePart")
])

.config(["entityInfoProvider", (entityInfoProvider) ->
  entityInfoProvider.addProvider "Article",
    storageController: "ArticleStorage"
    labelProperty: "title"
    idProperty: "_id"
    properties:
      _id:
        label: "Identifier"
        type: String
      title:
        label: "Title"
        type: String
      responsible:
        label: "Responsible"
        type: String
      publishdate:
        label: "Publish date"
        processor: "processDate"
        type: Date
      unpublishdate:
        label: "Unpublish date"
        processor: "processDate"
        type: String
      channel:
        label: "Channel"
        type: String
      step:
        label: "Step"
        type: String
      keyword:
        label: "Topic"
        type: String
      comments:
        label: "Comments"
        type: []
      keywords:
        label: "Keywords"
        type: []
      description:
        label: "Task"
        type: String
      ready:
        label: "Ready"
        type: Boolean

    operations: {}
  entityInfoProvider.addProvider "ArticlePart",
    storageController: "ArticlePartStorage"
    labelProperty: "title"
    idProperty: "_id"
    properties:
      _id:
        label: "Identifier"
        type: String
      title:
        label: "Title"
        type: String
      partId:
        label: "part id"
        type: String
      article:
        label: "Article"
        type: {}
      submitter:
        label: "Submitter"
        type: String
      state:
        label: "Status"
        type: String
      provider:
        label: "Provider"
        type: String
      type:
        label: "Type"
        type: String
      language:
        label: "Language"
        type: String
      terms:
        label: "Terms"
        type: []
      assignment:
        label: "Task"
        type: String
      deadline:
        label: "Deadline"
        processor: "processDate"
        type: Date
      comments:
        label: "Comments"
        type: []
      content:
        label: "Content"
        type: {}
      byline:
        label: "Byline"
        type: {}
])

.directive("kntntAddArticle",
["ClipboardStorage", "ArticleStorage", (ClipboardStorage, ArticleStorage) ->
  restrict: 'AE'
  scope: defaults: "=", articleCreated: "="
  controller: ["$scope", "$element", "$attrs", "UserState",
  ($scope, $element, $attrs, UserState) ->
    defaults = $scope.defaults or {}
    info = UserState.getInfo().info

    # Put focus on this element by default.
    $element.find("input").focus()

    $scope.addArticle = ->
      if $scope.articleTitle
        article =
          title: $scope.articleTitle
          keywords: []
          responsible: info._id
        article = _.defaults(article, defaults)
        ArticleStorage.save article, (result) ->
          if $scope.articleCreated
            $scope.articleCreated(result)
          ClipboardStorage.add(result._id)
          $scope.articleTitle = ''
  ]
  templateUrl: "bundles/article/add-article.html"
])

.directive("kntntAddArticlePart",
["ArticleStorage", "UserState", "KonziloConfig",
(ArticleStorage, UserState, KonziloConfig) ->
  restrict: 'AE'
  scope: { article: "=", partCreated: "=" }
  controller: ["$scope", "$element", "$attrs", ($scope, $element, $attrs) ->
    $scope.addArticlePart = ->
      article = $scope.article
      user = UserState.getInfo().info
      $scope.addArticlePart = ->
        if $scope.addArticlePartForm.$valid
          KonziloConfig.get("languages").listAll().then (languages) ->
            defaultLang = _.find(languages, default: true)
            articlePart =
              title: $scope.articlePartTitle
              state: "notstarted"
              submitter: user._id
            articlePart.language = defaultLang.langcode if defaultLang
            article.parts = article.parts or []
            article.parts.push(articlePart)
            ArticleStorage.save article, (result) ->
              if $scope.partCreated
                $scope.partCreated(result, result.parts[result.parts.length-1])
              $scope.articlePartTitle = ""
  ]
  templateUrl: "bundles/article/add-article-part.html"
])

.directive("kntntClipboardArticleList",
["ArticleStorage", "ClipboardStorage",
(ArticleStorage, ClipboardStorage) ->
  restrict: "AE",
  scope: { selected: "=" }
  controller: ["$scope", "$attrs", ($scope, $attrs) ->
    linkPattern = $attrs.linkPattern
    getArticles = ->
      $scope.size = 0
      ClipboardStorage.query().then (articles) ->
        $scope.articles = for article in articles.toArray()
          article.link = linkPattern.replace(":article", article._id)
          article
        $scope.size = article.length
        return
    getArticles()

    ArticleStorage.changed(getArticles)
    ClipboardStorage.changed(getArticles)
  ]
  templateUrl: "bundles/article/article-list.html"
])

.directive("kntntClipboardArticleParts",
["ClipboardStorage", "ArticleStorage", "ArticlePartStorage", "$translate",
(ClipboardStorage, ArticleStorage, ArticlePartStorage, $translate) ->
  restrict: "AE",
  scope: { selected: "=", linkPattern: "@", partCreated: "=" }
  controller: ["$scope", "$attrs", ($scope, $attrs) ->
    articleMap = {}
    linkPattern = $attrs.linkPattern
    getClipboard = ->
      $scope.size = 0
      ClipboardStorage.query().then (articles) ->
        articleMap = {}
        $scope.articles = for article in articles.toArray() when article.publishdate
          articleMap[article._id] = article
          if article.parts
            for part in article.parts
              part.link = linkPattern.replace(":article", article._id)
                .replace(":part", part._id)
          article
        $scope.size = $scope.articles.length
      return
    getClipboard()

    $scope.options =
      stop: (event, ui) ->
        id = ui.item.attr("data-id")
        ArticleStorage.save(articleMap[id]) if articleMap[id]

    $scope.removeArticlePart = (article, part) ->
      if confirm($translate("MANAGE.CONFIRMPARTREMOVE"))
        article.parts = _.without(article.parts, part)
        # Save the change directly.
        ClipboardStorage.add(article._id)
        ArticlePartStorage.remove(part._id).then ->
          ArticleStorage.get(article._id).then (loadedArticle) ->
            ClipboardStorage.add(loadedArticle._id)

    ArticleStorage.changed(getClipboard)
    ClipboardStorage.changed(getClipboard)

    setSelected = ->
      if $scope.selected
        $scope.openArticle = $scope.selected

    setSelected()
    $scope.$watch("selected", setSelected)

    # @todo generalize this code into a common directive.
    $scope.toggleArticle = (article) ->
      if $scope.openArticle?._id == article._id
        $scope.openArticle = null
      else
        $scope.openArticle = article

    $scope.toggleIcon = (article) ->
      if $scope.openArticle?._id != article._id
        "icon-chevron-right"
      else
        "icon-chevron-down"

    $scope.activeItem = (article) ->
      if $scope.openArticle?._id == article._id
        "active"
      else
        ""
    $scope.active = (article) -> $scope.openArticle?._id == article._id
  ]
  templateUrl: "bundles/article/clipboard-articleparts.html"
])

.directive("kntntArticleParts", ["ArticlePartStorage", (ArticlePartStorage) ->
  restrict: "AE",
  scope: { selected: "=", query: "=", linkPattern: "@", part: "=" }
  controller: ["$scope", ($scope) ->
    articlesToggled = {}
    getArticles = ->
      ArticlePartStorage.query({ q: $scope.query }).then (result) ->
        $scope.articles = {}
        for articlePart in result.toArray()
          article = articlePart.article

          if $scope.part and $scope.part.id() is articlePart._id and

          article._id is $scope.part.get("article")._id
            articlesToggled[article._id] = true

          articlePart.article = article._id
          if not $scope.articles[article._id]
            $scope.articles[article._id] = article
            $scope.articles[article._id].parts = []

          articlePart.link = $scope.linkPattern
          .replace(":part", articlePart._id)

          $scope.articles[article._id].parts.push(articlePart)
        $scope.size = _.size($scope.articles)
    getArticles()
    ArticlePartStorage.changed(getArticles)

    setSelected = ->
      if $scope.selected
        $scope.openArticle = $scope.selected

    setSelected()
    $scope.$watch("selected", setSelected)

    $scope.toggleArticle = (article) ->
      if $scope.openArticle == article
        $scope.openArticle = null
      else
        $scope.openArticle = article

    $scope.toggleIcon = (article) ->
      if $scope.openArticle != article
        "icon-chevron-right"
      else
        "icon-chevron-down"

    $scope.activeItem = (article) ->
      if $scope.openArticle == article
        "active"
      else
        ""
    $scope.active = (article) -> $scope.openArticle == article
  ]
  templateUrl: "bundles/article/clipboard-articleparts.html"
])

.factory("ArticleStates", ["$translate", ($translate) ->
  idea: $translate("ARTICLE.IDEA")
  planned: $translate("ARTICLE.PLANNED")
  ready: $translate("ARTICLE.READY")
])

.factory("ArticlePartStates", ["$translate", ($translate) ->
  [
    { name: "notstarted", label: $translate("ARTICLE.NOTSTARTED") }
    { name: "started", label: $translate("ARTICLE.STARTED") }
    { name: "needsreview", label: $translate("ARTICLE.NEEDSREVIEW") }
    { name: "approved", label: $translate("ARTICLE.APPROVED") }
  ]
])

.directive("kntntArticleDeliver",
["ClipboardStorage", "ArticlePartStorage",
"UserState", "ArticlePartStates", "GroupStorage",
(ClipboardStorage, ArticlePartStorage,
UserState, ArticlePartStates, GroupStorage) ->
  restrict: "AE",
  scope: { selected: "=", states: "=", linkPattern: "@", part: "=" }
  controller: ["$scope", ($scope) ->
    info = UserState.getInfo().info
    articlesToggled = {}
    states = ArticlePartStates
    if $scope.states
      $scope.states = for state in ArticlePartStates when state.name in $scope.states
        state
    availableParts = {}

    $scope.droppableOptions =
      hoverClass: "droppable-hover"
      activeClass: "droppable-active"
      containment: ".group"
      axis: "y"
      accept: (item) ->
        id = item.attr('data-id')
        if availableParts[id] then true else false
      drop: (event, ui) ->
        id = $(ui.draggable).attr('data-id')
        state = $(@).attr('data-state')
        currentPart = availableParts[id]
        currentPart.state = state
        ArticlePartStorage.get(id).then (part) ->
          part.set("state", state)
          part.set("provider", info._id)
          ArticlePartStorage.save part, ->
            groupParts(_.toArray(availableParts))

    groupParts = (parts) ->
      groupedResults = {}
      for articlePart in parts
        articlePart.link = $scope.linkPattern.replace(":part", articlePart._id)
        availableParts[articlePart._id] = articlePart
        if not groupedResults[articlePart.state]
          groupedResults[articlePart.state] = {}
        article = articlePart.article
        if not groupedResults[articlePart.state][article._id]
          groupedResults[articlePart.state][article._id] =
            _id: article._id
            publishdate: article.publishdate
            title: article.title
            items: []
        if $scope.part and articlePart._id is $scope.part.id() and
        article._id is $scope.part.get("article")._id
          articlesToggled[article._id] = true

        groupedResults[articlePart.state][article._id].items.push(articlePart)

      $scope.articles = groupedResults

    ids = [ info._id ]
    GroupStorage.query
      q:
        members: { $all: [ info._id ] }
    .then (result) ->
      ids.concat(group._id for group in result.toArray())
    .then (providers) ->
      ArticlePartStorage.query
        q:
          provider: { $in: providers }
          state: { $ne: "approved" }
          type: { $exists: true }
    .then (result) -> groupParts(result.toArray())

    if $scope.selected
      articlesToggled[$scope.selected._id] = true

    $scope.toggleArticle = (article) ->
      if not articlesToggled[article._id]?
        articlesToggled[article._id] = true
      else
        articlesToggled[article._id] = !articlesToggled[article._id]

    $scope.toggleIcon = (article) ->
      if not articlesToggled[article._id]
        "icon-chevron-right"
      else
        "icon-chevron-down"

    $scope.activeItem = (article) ->
      if articlesToggled[article._id]
        "active"
      else
        ""

    $scope.collapsed = (article) -> articlesToggled[article._id]
  ]
  templateUrl: "bundles/article/article-deliver.html"
])

# View the articles on the clipboard.
.directive("kntntClipboardArticles",
["ClipboardStorage", "ArticleStorage", "$routeParams", "formatDate",
(ClipboardStorage, ArticleStorage, $routeParams, formatDate) ->
  restrict: 'A',
  scope: firstArticle: "=", articleCreated: "="
  controller:  ["$scope", "$element", "$attrs", ($scope, $element, $attrs) ->
    transformLink = (pattern, article) ->
      link = pattern
      for key, value of article
        link = link.replace(":" + key, value)
      link

    pattern = $attrs.linkPattern

    # Stores the previously fetched articles.
    fetchedArticles = []
    articleMap = {}

    # Set the height of the element.
    height = $(window).height()
    $element.find(".scheduled > .inner").css("max-height", height - 300)
    $(window).resize ->
      height = $(window).height()
      $element.find(".scheduled > .inner").css("max-height", height - 300)

    $scope.activeArticle = (article) ->
      if article._id == $routeParams.id then "active"

    $scope.link = (article) -> transformLink pattern, article
    $scope.name = (article) ->
      link = transformLink pattern, article
      link[1..]
    originalDates = []

    drawClipboard = (articles) ->
      clipboard = {}
      $scope.unscheduled = []
      for article in articles
        if not article.publishdate
          $scope.unscheduled.push(article)
        else
          dateString = formatDate(article.publishdate)
          clipboard[dateString] = [] if not clipboard[dateString]
          clipboard[dateString].push(article)

      $scope.unscheduled = $scope.unscheduled.reverse()
      # Set the first article variable if we have more than one
      # unscheduled article.
      if $scope.unscheduled.length > 0
        $scope.firstArticle = $scope.unscheduled[0]

      $scope.clipboard = clipboard
      $scope.dates = _.keys($scope.clipboard).sort()

    # Get the clipboard.
    getClipboard = =>
      ClipboardStorage.query().then (articles) =>
        articleMap = {}
        if articles?.toArray
          articles = articles.toArray()
        # Generate a map of articles that can be fetched without
        # another request.
        for article in articles
          articleMap[article._id] = article

        fetchedArticles = articles

        drawClipboard(articles)
        calculatePrevDate()
        # Store the original dates for comparison.
        originalDates = $scope.dates[..]

    getClipboard()
    calculatePrevDate = ->
      currentDate = new Date()
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        currentDate.getHours(),
        currentDate.getMinutes()
      )
      if $scope.dates.length > 0
        firstDate = new Date($scope.dates[0])
        lastDate = new Date(_.last($scope.dates))
        prevDate = new Date(
          firstDate.getFullYear(),
          firstDate.getMonth(),
          firstDate.getDate() - 1,
          firstDate.getHours(),
          firstDate.getMinutes()
        )
        if prevDate >= currentDate
          $scope.prevDate = formatDate(prevDate)
        else
          $scope.prevDate = null
        $scope.nextDate = formatDate(
          new Date(
            lastDate.getFullYear(),
            lastDate.getMonth(),
            lastDate.getDate() + 1,
            lastDate.getHours(),
            lastDate.getMinutes()
          )
        )
      else
        $scope.prevDate = formatDate(currentDate)
        $scope.nextDDate = formatDate(
          new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() + 1,
            currentDate.getHours(),
            currentDate.getMinutes()
          )
        )

    # Calculate a new date after a group of articles has been moved.
    calculateNewDate = (originalDate, index) ->
      if index > 0
        prevDate = new Date($scope.dates[index-1])
      if index < $scope.dates.length - 1
        nextDate = new Date($scope.dates[index+1])
      if prevDate and nextDate
        tempDate = new Date(nextDate - (nextDate - prevDate))
        if tempDate == new Date(
          nextDate.getFullYear(),
          nextDate.getMonth(),
          nextDate.getDate() - 1,
          nextDate.getHours(),
          nextDate.getMinutes()
        ) and tempDate != prevDate
          newDate = new Date(nextDate - (nextDate - prevDate))
      else if nextDate
        newDate = new Date(
          nextDate.getFullYear(),
          nextDate.getMonth(),
          nextDate.getDate() - 1,
          nextDate.getHours(),
          nextDate.getMinutes()

        )
      else if prevDate and prevDate > originalDate
        newDate = new Date(
          prevDate.getFullYear(),
          prevDate.getMonth(),
          prevDate.getDate() + 1,
          prevDate.getHours(),
          prevDate.getMinutes()
        )
      newDate

    # Switch date for a group of articles.
    switchDate = (oldDate, newDate) ->
      for article in $scope.clipboard[oldDate]
        article.publishdate = newDate
        ArticleStorage.save article
      calculatePrevDate()

    # Handle date pickers.
    datePickers = {}
    $scope.datePickerValues = {}
    $scope.today = new Date()
    # This function handles setting a new date from the
    # value of a date picker.
    $scope.newDate = (index) ->
      currentDate = $scope.dates[index]
      switchDate(currentDate, $scope.datePickerValues[index])
      datePickers = {}
    # Toggle a date picker on or off.
    $scope.toggleDatePicker = (date) ->
      datePickers[date] = if datePickers[date] then !datePickers[date] else true

    # Determine if a date picker should be shown.
    $scope.datePickerShown = (date) ->
      datePickers[date]

    # Options for sortable.
    $scope.options =
      stop: (event, ui) ->
        date = originalDates[ui.item.sortable.index]
        index = _.indexOf($scope.dates, date)
        originalDate = new Date(date)
        newDate = calculateNewDate originalDate, index
        if newDate
          newDateString = formatDate(newDate)
          switchDate(date, newDateString)
          originalDates = $scope.dates[..]
          calculatePrevDate()
        else
          getClipboard()
      placeholder: "ui-placeholder box pad"

    # Options for draggable and droppable
    $scope.droppableOptions =
      hoverClass: "droppable-hover"
      activeClass: "droppable-active"
      containment: ".scheduled"
      axis: "y"
      accept: (item) ->
        id = item.attr('data-id')
        article = ClipboardStorage.get(id)
        article and article.publishdate != $(this).attr('data-date')
      drop: (event, ui) ->
        id = $(ui.draggable).attr('data-id')
        article = articleMap[id]
        article.publishDate = $(@).attr('data-date')
        drawClipboard(fetchedArticles)
        ArticleStorage.get id, (article) =>
          article = article.toObject()
          article.publishdate = $(@).attr('data-date')
          ArticleStorage.save article, (result) ->
            calculatePrevDate()

    $scope.draggableOptions = {}

    ArticleStorage.changed(getClipboard)
    ClipboardStorage.changed(getClipboard)

    # Group articles by date
    # Remove an article from the clipboard.
    $scope.removeFromClipboard = (article) ->
      ClipboardStorage.remove article._id
  ]
  templateUrl: "bundles/article/clipboard-articles.html"
])

.directive("kntntArticlePicker",
["ClipboardStorage", "ArticleStorage", "$routeParams",
"QueryBuilder", "queryFilter", "TargetStorage", "StepStorage",
"ChannelStorage", "$filter", "ArticleStates", "ProviderStorage", "$translate",
(ClipboardStorage, ArticleStorage, $routeParams,
QueryBuilder, queryFilter, TargetStorage, StepStorage,
ChannelStorage, $filter, ArticleStates, ProviderStorage, $translate) ->
  restrict: 'AE',
  controller:  ["$scope", "$element", "$attrs", ($scope, $element, $attrs) ->
    $scope.isCollapsed = true
    $scope.purge = false
    collection = null

    stepFilter = new (queryFilter("ReferenceFilter"))("step",
      $translate('GLOBAL.STEP'),
      $translate("ARTICLEPICKER.STEPDESC"), StepStorage, "name", "_id")

    channelFilter = new (queryFilter("ReferenceFilter"))(
      "channel",
      $translate("GLOBAL.CHANNEL"),
      $translate("ARTICLEPICKER.PUBLISHDESC"),
      ChannelStorage, "name", "_id")

    filters = [
      new (queryFilter("ReferenceFilter"))(
        "target", $translate("GLOBAL.TARGET"),
        $translate("ARTICLEPICKER.TARGETDESC"),
        TargetStorage, "name", "_id")
      new (queryFilter("ReferenceFilter"))("responsible",
        $translate("GLOBAL.RESPONSIBLE"),
        $translate("ARTICLEPICKER.RESPONSIBLEDESC"),
        ProviderStorage, "label", "_id")
      new (queryFilter("OptionsFilter"))(
        "state",
        $translate("GLOBAL.STATUS"),
        $translate("ARTICLEPICKER.STATUSDESC"), ArticleStates)
      stepFilter
      channelFilter
      new (queryFilter("MatchFilter"))(
        "title",
        $translate("ARTICLEPICKER.MATCHES"),
        $translate("ARTICLEPICKER.MATCHESDESC")
      )
    ]
    advancedCallback = null
    $scope.builder = new QueryBuilder(ArticleStorage, filters)
    $scope.builder.queryExecuted (articles) ->
      $scope.selector = "advanced"
      if not advancedCallback
        $scope.showArticles()
      advancedCallback articles
    selectors =
      all: (callback) ->
        ArticleStorage.query {}, (result) ->
          callback(result)
      recommended: (callback) ->
        ArticleStorage.query
          q:
            $or: [{done: $exists: false}, { done: false }]
          sort: publishdate: "asc"
        .then (result) ->
          callback(result)
      advanced: (callback) ->
        $scope.showAdvanced = true
        advancedCallback = callback

    $scope.showArticles = ->
      $scope.articles = []
      return if not $scope.selector or not selectors[$scope.selector]
      selector = selectors[$scope.selector]
      selector (articles) ->
        pages = articles.pages()
        if pages > 0
          $scope.pages = [0..articles.pages()]
        else
          $scope.pages = undefined
        $scope.articles = articles.toArray()
        collection = articles
        $scope.selected = {}
        $scope.selectall = false

    $scope.getPage = (number) ->
      if collection
        collection.getPage(number).then (result) ->
          collection = result
          $scope.articles = collection.toArray()

    $scope.addArticles = ->
      save = ->
        ClipboardStorage.getIds().then (ids) ->
          for id, selected of $scope.selected when selected
            ids.push id if id not in ids
          ClipboardStorage.save(ids)

      if $scope.purge
        ClipboardStorage.truncate().then(save)
      else
        save()

    $scope.collapseClass = ->
      if $scope.isCollapsed then "collapsed" else "open"

    $scope.toggleSelect = ->
      articles = $filter('filter')($scope.articles, $scope.search)
      for article in articles
        $scope.selected[article._id] = $scope.selectall
  ]
  templateUrl: "bundles/article/article-picker.html"
])

.directive("konziloArticlepartForm",
["articleParts", "$compile", "$controller", "$injector",
"$http", "$templateCache", "KonziloEntity",
(articleParts, $compile, $controller, $injector,
$http, $templateCache, KonziloEntity) ->
  restrict: "AE",
  scope:
    articlePart: "="
    useAutoSave: "="
  link: (scope, element, attrs) ->
    currentPart = null
    getPartForm = ->
      articlePart = scope.articlePart
      if articlePart and (not currentPart or not _.isEqual(articlePart, currentPart))
        if not articlePart.toObject
          articlePart = new KonziloEntity('ArticlePart', articlePart)
        type = articlePart.get('type')
        definition = articleParts(type)
        # This is an invalid type. Let's bail.
        return if not definition
        # Inject services into the definition if necessary.
        if not _.isPlainObject(definition)
          definition = $injector.invoke(definition)
        if definition.template
          templatePromise = $q.when(definition.template)
        else if definition.templateUrl
          templatePromise = $http.get(definition.templateUrl, { cache: $templateCache })
          .then (response) -> return response.data

        templatePromise.then (template) ->
          if definition.controller
            $controller definition.controller,
            { "$scope": scope, "articlePart": articlePart, useAutoSave: scope.useAutoSave }
          element.html(template)
          $compile(element.contents())(scope)
        currentPart = articlePart
    getPartForm()
    scope.$watch("articlePart", getPartForm)
])

.directive("konziloArticlepartApprove",
["ArticlePartStorage", "ArticlePartStates",
(ArticlePartStorage, ArticlePartStates) ->
  restrict: "AE",
  scope:
    articlePart: "="
    failState: "="
    approveState: "="
  controller: ["$scope", ($scope) ->
    $scope.approve = ->
      if $scope.approveState
        $scope.articlePart.set("state", $scope.approveState)
        $scope.articlePart.save()
    $scope.sendback = ->
      if $scope.failState
        $scope.articlePart.set("state", $scope.failState)
        $scope.articlePart.save()
  ]
  templateUrl: "bundles/article/articlepart-approve.html"
])

.directive("kntntArticleList",
["ArticleStorage", (ArticleStorage) ->
  restrict: "AE",
  scope: { selected: "=", query: "=" }
  controller: ["$scope", "$attrs", ($scope, $attrs) ->
    linkPattern = $attrs.linkPattern
    getArticles = ->
      ArticleStorage.query({ q: $scope.query }).then (result) ->
        articles = result.toArray()
        for article in articles
          article.link = linkPattern.replace(":article", article._id)
        $scope.articles = articles
        return

    getArticles()
    ArticleStorage.changed(getArticles)
    ClipboardStorage.changed(getArticles)
  ]
  templateUrl: "bundles/article/article-list.html"
])

.directive("konziloArticleForm",
["ArticleStorage", "TargetStorage", "InputAutoSave",
"ChannelStorage", "StepStorage", "$filter", "$q", "$translate",
(ArticleStorage, TargetStorage, InputAutoSave,
ChannelStorage, StepStorage, $filter, $q, $translate) ->
  restrict: "AE",
  scope: { article: "=" }
  controller: ["$scope", "$attrs", ($scope, $attrs) ->
    $scope.translations = {}
    $scope.saveArticle = (article) ->
      ArticleStorage.save article
    $scope.today = new Date()
    $scope.changeTarget = ->
      # Fetch channels and make sure the description is available.
      ChannelStorage.query().then (result) ->
        $scope.channels = result.toArray()
        $scope.channel = _.find($scope.channels, _id: $scope.article.channel)
      # We need to fetch the targets and terms first,
      # then we can populate the descriptions for the step
      # and the keyword.
      $q.all([
        TargetStorage.query().then (targets) ->
          $scope.targets = targets.toArray()
          $scope.target = _.find $scope.targets,
            (target) -> $scope.article.target is target._id
          if $scope.target
            $scope.translations.target = $scope.target.name

        StepStorage.query({ sort: weight: "asc"})
        .then (result) ->
          $scope.steps = result.toArray()
          $scope.step = _.find $scope.steps,
            (step) -> $scope.article.step is step._id
      ]).then ->
        if $scope.target and $scope.step
          $scope.topics = $scope.target.steps[$scope.step._id]?.topics
      return
    # We need to update the translation strings when the topic is updated.
    $scope.topicChanged = (topic) ->
      $scope.translations.topic = topic.toLowerCase() if topic

    # Change a particular date object.
    # @todo This is not a very good way to do it.
    $scope.changeTime = (time, date) ->
      if time.match(/[0-9]{2}:[0-9]{2}/)
        result = time.split(':')
        date.setHours(result[0])
        date.setMinutes(result[1])

    # Set the active article.
    update = ->
      return if not $scope.article
      if $scope.article.publishdate
        $scope.publishtime = $filter('date')($scope.article.publishdate, "HH:mm")
      if $scope.article.unpublishdate
        $scope.unpublishtime = $filter('date')($scope.article.unpublishdate, "HH:mm")
      $scope.article.keywords = [] if not $scope.article.keywords
      if $scope.article.topic
        $scope.translations.topic = $scope.article.topic.toLowerCase()
      $scope.autosave.stop() if $scope.autosave
      delete $scope.autosave
      $scope.autosave = new InputAutoSave $scope.article, $scope.saveArticle, ->
        $scope.articleForm?.$valid
      $scope.changeTarget()
      return

    $scope.$watch("article", update)
  ]
  templateUrl: "bundles/article/article-form.html"
])

.directive("konziloArticlePartVersions", ->
  restrict: "AE"
  scope:
    part: "="
  controller: ["$scope", "$attrs", ($scope, $attrs) ->
    linkPattern = $attrs.linkPattern

    $scope.$watch "part", ->
      $scope.query = { partId: $scope.part.partId } if $scope.part

    $scope.properties =
      title: "Titel"
      state: "Status"

    if linkPattern
      $scope.properties["link"] =
        label: "Redigera",
        value: (item) ->
          label: "redigera"
          link: linkPattern.replace(':id', item._id)
            .replace(':article_id', item.article._id)
    $scope.properties["activate"] =
      label: "Aktivera"
      value: (item) ->
        html: "<konzilo-article-part-set-active part=\"item\"></konzilo-article-part-set-active>"
  ]
  template: '<content-table query="query" entity-type="ArticlePart", properties="properties"></content-table>'
)

.directive("konziloArticlePartNewVersion",
["ArticlePartStorage", "$translate",
(ArticlePartStorage, $translate) ->
  restrict: "AE"
  scope:
    part: "="
  controller: ["$scope", ($scope) ->
    $scope.newVersion = ->
      if $scope.part
        part = _.clone($scope.part)
        delete part._id
        part.active = false
        part.state = "notstarted"
        ArticlePartStorage.save part
  ]
  template: "<button class=\"btn btn-primary\" ng-click=\"newVersion()\">#{$translate("ARTICLE.NEWVERSION")}</button>"
])

.directive("konziloArticlePartSetActive",
["ArticlePartStorage", "$translate",
(ArticlePartStorage, $translate) ->
  restrict: "AE"
  scope:
    part: "="
  controller: ["$scope", ($scope) ->
    $scope.activate = ->
      return if not $scope.part
      part = _.clone($scope.part)
      part.active = true
      ArticlePartStorage.save part
      return
  ]
  template: "<button class=\"btn btn-primary\" ng-click=\"activate()\", ng-show=\"!part.active\">#{$translate("GLOBAL.ACTIVATE")}</button>"
])
