angular.module("kntnt.user",
  [
    "ui.bootstrap"
    "ngResource"
    "ngCookies"
    "konzilo.entity"
    "cmf.input"
    "konzilo.translations"
  ]
)

# Stores users and provides methods for retrieving them.
.factory("UserStorage", ["KonziloStorage", (KonziloStorage) ->
  return new KonziloStorage('/user/:_id', "User")
])
.factory("LoginStorage", ["$resource", ($resource) ->
  return $resource('/login/:id', {}, { update: { method: "PUT" }})
])
.factory("GroupStorage", ["KonziloStorage", (KonziloStorage) ->
  return new KonziloStorage('/group/:_id', "Group")
])
.factory("ProviderStorage", ["KonziloStorage", (KonziloStorage) ->
  return new KonziloStorage('/provider/:_id', "Provider")
])

.run(["UserState", "$translate", "KonziloConfig",
(UserState, $translate, KonziloConfig) ->
  UserState.setTokenHeader()
  UserState.loggedIn(true).then ->
    # Set the preferred language if it exists.
    info = UserState.getInfo()
    if info and info.info.language
      $translate.uses(info.info.language)
    # Use the default language if the language is not set.
    else
      KonziloConfig.get("languages").listAll().then (languages) ->
        language = _.find(language, default: true)
        $tranlate.uses(language.langcode) if language
])
.factory("User"
["$resource", "$http", "$cacheFactory",
($resource, $http, $cacheFactory) ->
  class User
    constructor: (@info) ->
      @items = {}
      @url = "/user/#{@info._id}/settings"
      @cache = $cacheFactory(@url)

    getSettings: (callback) ->
      $http.get(@url, @cache).then (result) ->
        items = {}
        for item in result.data
          items[item.name] = item.data
        callback(items) if callback
        return items
      , (error) ->
        errorCallback(error)
        return error

    getSetting: (name, callback, errorCallback) ->
      $http.get("#{@url}/#{name}", cache: @cache).then (result) ->
        callback(result.data.data) if callback
        return result.data.data
      , (err) ->
        errorCallback(err) if errorCallback
        return err

    saveSetting: (name, value, callback) ->
      @cache.removeAll()
      $http.put("#{@url}/#{name}",
      { name: name, data: value }).then (result) ->
        callback(result.data.data) if callback
        return result.data.data

    deleteSetting: (name, callback, errorCallback) ->
      @cache.removeAll()
      $http.delete("#{@url}/#{name}").then (result) ->
        callback(result.data) if callback
        return result.data
      , (err) ->
        errorCallback(err) if errorCallback
        return err
    getToken: ->
      @info.token
])
.factory("userAccess", ["$http", "$q", ($http, $q) ->
  (permission) ->
    deferred = $q.defer()
    $http.get("/user/access", params: { session: true }, cache: true)
    .then (permissions) ->
      if permission not in permissions.data
        deferred.reject()
      else
        deferred.resolve()
    deferred.promise
])
.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  menu = konziloMenu("settingsMenu")
  menu.addItem "#/settings/users", $translate("USER.TITLE"),
    (userAccess) ->
      userAccess("administer system")
  menu.addItem "#/settings/groups", $translate("GROUP.TITLE"),
    (userAccess) ->
      userAccess("administer system")
])
.factory("userPermissions", ["$http", "$q", ($http, $q) ->
  (permission) ->
    $http.get("/user/access", params: session: true).then (permissions) ->
      return permissions.data
])
# Stores the current state for the logged in user.
.factory("UserState",
["$cookieStore", "UserStorage", "$http", "User", "$q",
($cookieStore, UserStorage, $http, User, $q) ->
  saveInfo: (info) ->
    $cookieStore.put('user_info', info)
    for fn in @infoSavedCallbacks
      fn(info)
    @setTokenHeader()
  logOut: ->
    $cookieStore.delete('user_info')
  loggedIn: (check=false)->
    if not @getInfo()
      return $q.reject()
    return $q.when() if not check
    $http.get('/loggedin')

  hasPermission: (permission) ->
    info = @getInfo
    return false if not info
    return permission in info.info.permissions

  getInfo: ->
    if not @info
      info = $cookieStore.get('user_info')
      @info = new User(info) if info
    @info

  getTokenHeader: ->
    if @getInfo()
      "bearer " + @info.getToken()

  setTokenHeader: ->
    if @getInfo()
      $http.defaults.headers.common["Authorization"] =
      "bearer " + @info.getToken()
      return true
    false

  infoSaved: (fn) ->
    @infoSavedCallbacks = @infoSavedCallbacks or []
    @infoSavedCallbacks.push(fn)
])
.config(["$routeProvider", "entityInfoProvider",
($routeProvider, entityInfoProvider) ->
  login =
    controller: "LoginController"
    templateUrl: "bundles/user/login.html"

  dashboard =
    controller: "DashboardController"
    templateUrl: "bundles/user/dashboard.html"
    resolve:
      loggedIn: (UserState) ->
        UserState.loggedIn(true)

  profile =
    controller: "UserProfileController"
    templateUrl: "bundles/user/profile.html"
    resolve:
      loggedIn: (UserState) ->
        UserState.loggedIn(true)

  userMgmt =
    controller: "UserMgmtController"
    templateUrl: "bundles/user/usermgmt.html"
    resolve:
      access: (userAccess) ->
        userAccess("administer system")

  groupMgmt =
    controller: "GroupMgmtController"
    templateUrl: "bundles/user/groupmgmt.html"
    resolve:
      access: (userAccess) ->
        userAccess("administer system")

  $routeProvider.when('/login', login)
  $routeProvider.when('/profile', profile)
  $routeProvider.when('/profile/:user', profile)
  $routeProvider.when('/dashboard', dashboard)
  $routeProvider.when('/', dashboard)
  $routeProvider.when('/settings/users', userMgmt)
  $routeProvider.when('/settings/users/:user', userMgmt)
  $routeProvider.when('/settings/groups', groupMgmt)
  $routeProvider.when('/settings/groups/:group', groupMgmt)
  $routeProvider.otherwise(login)

  entityInfoProvider.addProvider "User",
    storageController: "UserStorage"
    labelProperty: "username"
    idProperty: "_id"
    properties:
      username:
        label: "Username"
        type: String
      email:
        label: "Email"
        type: String
      active:
        label: "Active"
        type: Boolean
    operations:
      delete:
        label: "Remove user"
        action: (user) ->
          user.$delete()
      activate:
        label: "Activate user"
        action: (user) ->
          user.active = true
          user.$update()
      deactivate:
        label: "Deactivate user"
        action: (user) ->
          user.active = false
          user.$update()

  entityInfoProvider.addProvider "Group",
    storageController: "GroupStorage"
    labelProperty: "name"
    idProperty: "_id"
    properties:
      name:
        label: "Name"
        type: String
      members:
        label: "Members"
        type: []
      active:
        label: "Active"
        type: Boolean
    operations:
      delete:
        label: "Remove group"
        action: (group) ->
          group.remove()

  entityInfoProvider.addProvider "Provider",
    storageController: "ProviderStorage"
    labelProperty: "label"
    idProperty: "_id"
    properties:
      label:
        label: "Name"
        type: String
      type:
        label: "Type"
        type: String
      _id:
        label: "ID"
        type: String
])
.controller("UserProfileController",
["$scope", "UserState", "$routeParams", "UserStorage",
($scope, UserState, $routeParams, UserStorage) ->
  info = UserState.getInfo()
  $scope.user = UserStorage.get(info.info._id)
  .then (result) ->
    result.toObject()
])
.factory("GetParameters", ->
  search = window.location.search
  return {} if search.length is 0
  paramList = search.substr(1).split("&")
  params = {}
  for param in paramList
    item = param.split("=")
    params[item[0]] = decodeURIComponent(item[1])
  return params
)

.controller("DashboardController",
["$scope", "UserStorage", "UserState",
($scope, UserStorage, UserState) ->
  info = UserState.getInfo().info()
  $scope.translations =
    name: info.username
])

.controller("LoginController",
["$scope", "LoginStorage", "UserState", "$location", "GetParameters", "$http",
($scope, LoginStorage, UserState, $location, GetParameters, $http) ->
  UserState.loggedIn(true).then ->
    $location.url("/")
  $scope.loginUser = ->
    $scope.message = false
    LoginStorage.save
      username: $scope.username
      password: $scope.password,
      (result, err) ->
        UserState.saveInfo(result)
        if GetParameters["destination"]
          window.location = GetParameters["destination"]
        else
          window.location = "/"
      (result) ->
        $scope.message = "Felaktigt användarnamn eller lösenord"
  $scope.sendPassword = ->
    $http.post("/password/#{$scope.forgot}").then ->
      $scope.message = "LOGIN.PASSWORDSENT"
    , (err) ->
      $scope.message = "LOGIN.PASSWORDERROR"
])

.controller("DashboardController",
["$scope", "LoginStorage", "UserState", ($scope, LoginStorage, UserState) ->
  $scope.user = UserState.getInfo()
])

.directive("userEditForm",
["InputAutoSave", "UserStorage", "KonziloConfig", "userAccess",
(InputAutoSave, UserStorage, KonziloConfig, userAccess) ->
  restrict: "AE",
  templateUrl: "bundles/user/user-edit.html"
  scope: { user: "=" }
  controller: ["$scope", ($scope) ->
    activeUser = $scope.user
    $scope.languages = KonziloConfig.get("languages").listAll()
    KonziloConfig.get("roles").listAll().then (roles) ->
      $scope.roles = roles

    $scope.hasRole = (role) ->
      return if not $scope.user?.roles
      role in $scope.user.roles

    $scope.saveUser = ->
      if $scope.userForm?.$valid and
      _.isEqual($scope.user.password, $scope.password2)
        UserStorage.save user

    userAccess("administer system").then ->
      $scope.showAdminFields = true

    update = ->
      return if not $scope.user
      if $scope.user.toObject
        $scope.user = $scope.user.toObject()
      $scope.user.roles = $scope.user.roles or []
      if (not activeUser or $scope.user._id is not activeUser._id)
        $scope.autosave = InputAutoSave.createInstance $scope.user,
        ->
          UserStorage.save $scope.user
        , ->
          $scope.userForm?.$valid and
          _.isEqual($scope.user.password, $scope.password2)
    $scope.$watch('user', update)
  ]
])

.directive("userAddForm", ["UserStorage", (UserStorage) ->
  restrict: "AE",
  templateUrl: "bundles/user/user-add.html"
  scope: {}
  controller: ["$scope", ($scope) ->
    $scope.saveUser = ->
      if $scope.userForm?.$valid and
      _.isEqual($scope.user.password, $scope.password2)
        UserStorage.save $scope.user, (result) ->
          $scope.user = {}

    $scope.user = {}
  ]
])

.directive("userInfo",
["UserStorage", "UserState", "$translate",
(UserStorage, UserState, $translate) ->
  restrict: "AE",
  replace: true,
  template: "<a ng-href=\"{{user.link}}\"><i class=\"icon-user\"></i><span>{{user.username | translate}}</span></a>"
  scope: {}
  controller: ["$scope", ($scope) ->
    getUser = ->
      UserState.loggedIn(true).then ->
        info = UserState.getInfo()
        $scope.user = info.info
        $scope.user.link = "#/profile"
      , ->
        $scope.user =
          username: "LOGIN.LOGIN"
          link: "#/login"
    getUser()
    UserState.infoSaved ->
      getUser()
  ]
])

.controller("UserMgmtController",
["$scope", "UserStorage", "entityInfo", "$routeParams", "$translate",
($scope, UserStorage, entityInfo, $routeParams, $translate) ->
  UserStorage.query { group: false }, (result) ->
    updateUsers = ->
      $scope.users = for user in result.toArray()
        user.userlink =
          label: user.username
          link: "#/settings/users/#{user._id}"
        if user.active
          user.activeText = $translate("USER.ACTIVE")
        else
          user.activeText = $translate("USER.INACTIVE")
        user

    updateUsers()
    UserStorage.itemSaved (item) ->
      oldItem = result.get(item)
      if not oldItem
        result.add(item)
      else
        oldItem.setData(item.toObject())
      updateUsers()

  $scope.userGrid = ->
    if $scope.user then "half" else "full"

  $scope.entity = entityInfo("User")
  $scope.properties =
    userlink: $translate("GLOBAL.USERNAME")
    email: $translate("GLOBAL.EMAIL")
    activeText: $translate("USER.ACTIVE")

  if $routeParams.user
    UserStorage.get $routeParams.user, (user) ->
      $scope.user = user
])

.controller("GroupMgmtController",
["$scope", "KonziloConfig", "$http", "$routeParams",
"InputAutoSave", "GroupStorage", "$translate",
($scope, KonziloConfig, $http, $routeParams,
InputAutoSave, GroupStorage, $translate) ->
  $scope.query = {}
  $scope.properties =
    name: $translate("GLOBAL.NAME")
    operations:
      label: $translate("GLOBAL.OPERATIONS")
      value: (item) ->
        label: $translate("GLOBAL.EDIT")
        link: "#/settings/groups/#{item._id}"

  if $routeParams.group
    GroupStorage.get($routeParams.group).then (group) ->
      $scope.group = group.toObject()
      $scope.group.members = $scope.group.members or []
      valid = -> $scope.editGroupForm.$valid
      save = -> GroupStorage.save($scope.group)
      $scope.autosave = InputAutoSave.createInstance($scope.group, save, valid)

  $scope.mainClass = ->
    if $scope.group then "span6" else "span12"

  $scope.newGroup = {}
  $scope.addUser = ->
    $scope.group.members.push($scope.newUser)
    $scope.group.members = _.unique($scope.group.members)
    $scope.newUser = undefined

  $scope.removeUser = (user) ->
    $scope.group.members = _.without($scope.group.members, user)

  $scope.addGroup = ->
    if $scope.addGroupForm.$valid
      GroupStorage.save($scope.newGroup)
      $scope.newGroup = undefined
  return
])

.directive("kzUserAccess",
["userAccess", "UserState", (userAccess, UserState) ->
  restrict: "A"
  transclude: true
  link: (scope, element, attrs) ->
    access = attrs.kzUserAccess
    checkAccess = ->
      userAccess(access).then ->
        scope.access = true
    # Update if the user is changed.
    UserState.infoSaved ->
      checkAccess()
    checkAccess()

  template: '<div ng-show="access"><div ng-transclude></div></div>'
])

.directive("kzLogout", ["UserState", (UserState) ->
  restrict: "AE"
  replace: true
  controller: ($scope) ->
    loggedIn = ->
      $scope.loggedIn = UserState.loggedIn(true)
    loggedIn()
    UserState.infoSaved ->
      loggedIn()
  template: "<a href=\"/logout\" ng-show=\"loggedIn\">
    <i class=\"icon-signout\"></i>
    <span>{{'GLOBAL.LOGOUT' | translate}}</span></a>"
])
