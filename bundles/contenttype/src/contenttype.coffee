angular.module("konzilo.contenttype", ["konzilo.config",
'konzilo.translations', 'kntnt.article', 'konzilo.contenttype'])

# Generate article parts according to a template if necessary.
.run(["ArticleStorage", "ChannelStorage", "$q",
(ArticleStorage, ChannelStorage, $q, UserState) ->
  ArticleStorage.preSave (article) ->
    return $q.when(article) if not article.get("channel")
    return ChannelStorage.get(article.get("channel")).then (channel) ->
      parts = article.get("parts") or []
      partTypes = channel.get("contentType")?.parts
      if partTypes
        for part in partTypes
          existingParts = _.filter(parts, typeName: part.name)
          while existingParts.length < part.min
            articlePart =
              title: article.get("title") + " [#{part.label}]"
              state: "notstarted"
              type: part.type
              typeName: part.name
              provider: article.get("provider")?._id
              submitter: article.get("responsible")?._id
            parts.push(articlePart)
            existingParts.push(articlePart)
      article.set("parts", parts)
      return article
])

.factory("kzPartSettings", [
  "ChannelStorage", "$q", "KonziloEntity", "ArticleStorage",
  (ChannelStorage, $q, KonziloEntity, ArticleStorage) ->
    (part) ->
      if not part.toObject
        part = new KonziloEntity('ArticlePart', part)
      deferred = $q.defer()
      getChannel = (article) ->
        channel = article.channel
        return deferred.resolve(false) if not channel
        ChannelStorage.get(channel).then (result) ->
          parts = result.get("contentType")?.parts
          if parts
            return deferred.resolve(_.find(parts, name: part.get("typeName")))
          else
            return deferred.resolve(false)

      article = part.get("article")
      if not _.isPlainObject(article)
        ArticleStorage.get(article).then (article) ->
          getChannel(article.toObject())
      else
        getChannel(article)

      return deferred.promise
])

.factory("kzArticleSettings", [
  "ChannelStorage", "$q", "KonziloEntity"
  (ChannelStorage, $q, KonziloEntity) ->
    (article) ->
      if not article.toObject
        part = new KonziloEntity('Article', article)
      deferred = $q.defer()
      channel = article.channel
      return $q.when(false) if not channel
      ChannelStorage.get(channel).then (result) ->
        return deferred.resolve(result.get("contentType"))
      return deferred.promise
])

.directive("kzContentTypeArticleForm", [
  "kzArticleSettings", "InputAutoSave", "ArticlePartStorage", "articleParts",
  (kzArticleSettings, InputAutoSave, ArticlePartStorage, articleParts) ->
    restrict: "AE"
    scope:
      article: "="
    controller: ["$scope", ($scope) ->
      article = undefined
      $scope.useSave = false
      update = ->
        return if not $scope.article?.channel
        article = $scope.article._id
        kzArticleSettings($scope.article).then (settings) ->
          parts = []
          if settings?.parts?.length > 0
            for part in settings.parts
              results = _.filter($scope.article.parts, typeName: part.name)
              parts.push(partInfo: part, parts: results)
          else
            for part in $scope.article.parts
              parts.push(partInfo: { label: part.title }, parts: [part])

          $scope.parts = parts
        $scope.active = {}
        for part in $scope.article.parts
          $scope.active[part._id] = false

      $scope.$watch("article", update)
      $scope.$watch("article.parts", update)
    ]
    templateUrl: "bundles/contenttype/content-type-article-form.html"
])

.directive("kzContentTypeForm", ["articleParts", "$http", (articleParts, $http) ->
  restrict: "AE"
  scope:
    contentType: "="
    endpointType: "="
  controller: ["$scope", ($scope) ->
    endpointTypes = {}
    $scope.types = articleParts.types()
    $scope.typeLabels = articleParts.labels()
    $scope.newPart = { show: {}, min: 1, max: 1 }
    getMaxLimit = (minLimit) ->
      minLimit = 1 if not minLimit or parseInt(minLimit) < 1
      minLimit = parseInt(minLimit)
      limit = for i in [minLimit..10]
        label: i, value: i
      limit.unshift(label: "GLOBAL.UNLIMITED", value: 0)
      return limit

    getMinLimit = (maxLimit=10) ->
      return [0..maxLimit]

    $scope.newPartMinLimit = (index, maxLimit) ->
      $scope.partMinLimit[index] = getMinLimit(maxLimit)

    $scope.newPartMaxLimit = (index, minLimit) ->
      $scope.partMaxLimit[index] = getMaxLimit(minLimit)

    $scope.newMinLimit = -> $scope.minLimit = getMinLimit($scope.newPart.max)
    $scope.newMaxLimit = -> $scope.maxLimit = getMaxLimit($scope.newPart.min)
    $scope.newMaxLimit()
    $scope.newMinLimit()

    $scope.valid = (candidate) ->
      not _.find($scope.contentType.parts, name: candidate)

    $scope.changeCardinality = (part) ->
      part.min = parseInt(part.min)
      part.max = parseInt(part.max)

    update = ->
      return if not $scope.contentType
      $scope.components = []
      $scope.contentType.parts = [] if not $scope.contentType.parts

      if not $scope.contentType.endpointSettings
        $scope.contentType.endpointSettings = {}

      $scope.partMaxLimit = {}
      $scope.partMinLimit = {}
      for part, index in $scope.contentType.parts
        $scope.newPartMaxLimit(index, part.min)
        $scope.newPartMinLimit(index, part.max)
        for field in $scope.types[part.type].fields
          if part.show[field.name]
            $scope.components.push
              name: "#{part.name}.#{field.name}"
              part: part.label
              field: field.label

    $scope.removePart = (index) ->
      $scope.contentType.parts = (part for part, i in $scope.contentType.parts when i != index)

    $scope.addPart = ->
      if $scope.addPartType.$valid
        type = $scope.contentType
        type.parts = type.parts or []
        type.parts.push($scope.newPart)
        $scope.newPartMaxLimit(type.parts.length-1)
        $scope.newPartMinLimit(type.parts.length-1)
        $scope.newPart = { show: {}, min: 1, max: 1 }


    $scope.$watch("contentType", update)

    updateEndpointType = ->
      if $scope.endpointType
        $scope.typeSettings = endpointTypes[$scope.endpointType]?.typeSettings

    $http.get('/endpointtype').then (result) ->
      endpointTypes = result.data
      updateEndpointType()
      $scope.$watch("endpointType", updateEndpointType)
  ]
  templateUrl: "bundles/contenttype/content-type-form.html"
])
