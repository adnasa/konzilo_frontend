angular.module("konzilo.config", [])

# Allow modules to add default configuration to any
# bin.
.provider("defaultConfig", ->
  @defaults = {}
  setDefaults: (bin, name, value) =>
    @defaults[bin] = {} unless @defaults[bin]
    if typeof name is "string"
      @defaults[bin][name] = {} unless @defaults[bin][name]
      @defaults[bin][value] = value
    else
      @defaults[bin] = name

  getDefaults: (bin) => @defaults[bin]

  $get: =>
    (bin, name) =>
      if not name
        return @defaults[bin]
      return @defaults[bin][name]
)
.factory("KonziloConfig",
["KonziloConfigDefaultStorage", "defaultConfig", "$q",
(KonziloConfigDefaultStorage, defaultConfig, $q)->
  # The default storage engine.
  @defaultStorage = KonziloConfigDefaultStorage
  @bins = {}

  # The Konzilo Config class encapsulates and
  # caches for the actual storage engine.
  class KonziloConfig
    constructor: (@storage) ->
      @config = {}

    get: (name, value=undefined) ->
      if @config[name] then return $q.when(@config[name])
      @storage.read(name).then (result) =>
        @config[name] = result
        return _.clone @config[name]

    set: (name, value) ->
      if not @config[name] or not _.isEqual(@config[name], value)
        @config[name] = _.cloneDeep value
      @storage.write(name, value)

    remove: (name) ->
      @get(name).then (value) =>
        delete @config[name]
        @storage.remove name

    listAll: -> @storage.listAll()
    removeAll: -> @storage.removeAll()

  setDefaultStorage: (storage) ->
    @defaultStorage = storage

  get: (name, storage=null) =>
    if @bins[name]
      return @bins[name]
    else
      storage = new @defaultStorage(name) if not storage
      instance = new KonziloConfig(storage)
      defaults = defaultConfig(name)
      for name, value of defaults when defaults
        instance.set(name, value)
      @bins[name] = instance
      return instance

  createBin: -> @get(name, storage)
])
# Default storage mechanism.
.factory("KonziloConfigDefaultStorage",
["$http", "$q", "$cacheFactory", ($http, $q, $cacheFactory) ->
  class KonziloConfigDefaultStorage
    constructor: (@bin) ->
      @cache = $cacheFactory("config_#{@bin}")
    exists: (name) => @storage.exists(name)
    read: (name, callback, errorCallback) =>
      $http.get("/config/#{@bin}/#{name}", cache: true).then (result) ->
        callback(result.data.data) if callback
        return result.data.data
      , (error) ->
        errorCallback(error) if error
        return error

    write: (name, data, callback, errorCallback) =>
      @cache.removeAll()
      obj =
        name: name
        data: data
      $http.put("/config/#{@bin}/#{name}", obj).then (result) ->
        callback(result.data) if callback
        return result.data
      , (error) ->
        errorCallback(error) if errorCallback
        return  error

    remove: (name) =>
      @cache.removeAll()
      $http.delete("config/#{@bin}/#{name}").then (result) ->
        result.data

    listAll: (callback, errorCallback) =>
      deferred = $q.defer()
      $http.get("config/#{@bin}", cache: @cache). then (result) ->
        items = {}
        for item in result.data
          items[item.name] = item.data
        callback(items) if callback
        return items
      , (error) ->
        errorCallback(error) if errorCallback
        return error

    removeAll: => @storage.truncate()
])
