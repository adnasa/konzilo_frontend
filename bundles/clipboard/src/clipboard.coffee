angular.module("kntnt.clipboard", [])
# Stores articles and provides methods for retrieving them.
.factory("ClipboardStorage",
["ArticleStorage", "UserState", "$q", (ArticleStorage, UserState, $q) ->
  info = UserState.getInfo()

  query: (options = {}) -> @get(options)

  add: (id) ->
    if not _.isString(id)
      id = id._id

    info.getSetting 'clipboard', (ids) =>
      ids.push(id) if id not in ids
      @save(ids)
    , =>
      @save([id])

  save: (ids) ->
    info.saveSetting 'clipboard', ids, =>
      if @changedCallbacks
        callback(ids) for callback in @changedCallbacks

  getIds: ->
    deferred = $q.defer()
    info.getSetting 'clipboard', (ids) =>
      deferred.resolve(ids)
    , (err) ->
      deferred.resolve([])
    return deferred.promise

  get: (options = {}) ->
    deferred = $q.defer()
    info.getSetting 'clipboard', (ids) ->
      options = _.defaults(options, q: _id: $in: ids)
      ArticleStorage.query(options)
      .then (result) ->
        deferred.resolve(result)
      , (err) ->
        deferred.resolve([])
    , (err) ->
      deferred.resolve([])
    return deferred.promise

  remove: (id) ->
    if not _.isString(id)
      id = id._id
    deferred = $q.defer()
    info.getSetting 'clipboard', (ids) =>
      ids = _.without(ids, id)
      info.saveSetting 'clipboard', ids, =>
        if @changedCallbacks
          callback(ids) for callback in @changedCallbacks
        deferred.resolve(ids)
      , (err) ->
        deferred.resolve([])
    return deferred.promise

  truncate: ->
    deferred = $q.defer()
    info.deleteSetting 'clipboard', (result) =>
      if @changedCallbacks
        callback(result) for callback in @changedCallbacks
      deferred.resolve(result)
    , (err) ->
      deferred.resolve([])
    return deferred.promise

  changed: (callback) ->
    @changedCallbacks = @changedCallbacks or []
    @changedCallbacks.push(callback)
])
