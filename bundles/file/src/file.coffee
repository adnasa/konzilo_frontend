angular.module("konzilo.file",
["blueimp.fileupload", "ui.bootstrap",
"kntnt.user", "ngResource", "cmf.input", "konzilo.translations"])

.factory("fileBrowser", ["$modal", ($modal) ->
  (options) ->
    $modal.open
      templateUrl: 'bundles/file/media-manager.html'
      controller: "MediaManager"
      resolve:
        options: -> options
    .result
])

# Stores users and provides methods for retrieving them.
.factory("FileStorage", ["KonziloStorage", (KonziloStorage) ->
  return new KonziloStorage('/file/:_id', "File")
])

.factory("FileBundle", ["$resource", ($resource) ->
  $resource("/filebundle/:name", { "name": "@name" })
])

.config(["entityInfoProvider", (entityInfoProvider) ->
  entityInfoProvider.addProvider "File",
    storageController: "FileStorage"
    labelProperty: "name"
    idProperty: "_id"
    defaultViewMode: "default"
    viewModes:
      default:
        controller: ($scope, entity) ->
          $scope.file = entity.toObject()
        template: "<file-view file=\"file\"></file-view>"
    properties:
      _id:
        label: "ID"
        type: String
      uri:
        label: "URI"
        type: String
      name:
        label: "Name"
        type: String
      username:
        label: "Username"
        type: Boolean
      type:
        label: "Type"
        type: String
      bundle:
        label: "Uploaded to"
        type: String
      created:
        label: "Created"
        type: Date
    operations:
      delete:
        label: "Remove file"
        action: (file) ->
          file.remove()
])

.provider("fileModes", ->
  modes:
    image:
      types: ["image/jpeg", "image/gif", "image/png"]
      template: "<img src=\"{{file.uri}}\">"
      controller: ["$scope", "file", ($scope, file) ->
        $scope.file = file
      ]
      settings:
        templateUrl: "bundles/file/image-settings.html"
        controller: ["$scope", "file", ($scope, file) ->
          $scope.settings = file.settings
        ]
  $get: ->
    fn = (type) =>
      return @modes[type] if @modes[type]
      for name, mode of @modes when type in mode.types
        return mode
      return
    fn.getModes = => @modes
    fn
  getProviders: -> @modes
)

.controller("MediaManager",
["$scope", "options", "$modalInstance", "UserState", "fileModes",
($scope, options, $modalInstance, UserState, fileModes) ->
  $scope.active = true
  $scope.bundle = options.bundle
  $scope.user = UserState.getInfo().info

  $scope.filesUploaded = (files) ->
    mode = undefined
    $scope.files = files
    # Check if we need to input settings for any of the files.
    for file in files
      fileMode = fileModes(file.type)
      mode = fileMode
    if not mode
      return $scope.returnFiles()

  $scope.close = ->
    $modalInstance.close()

  $scope.fileSelected = (file) ->
    mode = fileModes(file.type)
    $scope.files = [file]
    if not mode
      return $scope.returnFiles()

  $scope.returnFiles = ->
    # @todo this should obviously not be like this.
    # It relates to https://github.com/angular-ui/bootstrap/issues/969
    # and should be fixed as soon as the proper fix is available.
    # if $scope.settingsForm?.$valid
    $modalInstance.close($scope.files)
])

.directive("fileUploadForm",
["UserState", "$timeout", "FileBundle",
(UserState, $timeout, FileBundle) ->
  restrict: "AE"
  templateUrl: 'bundles/file/file-upload.html'
  scope: { bundle: "=", filesUploaded: "=" }
  controller: ["$scope", ($scope) ->
    files= []
    FileBundle.get { name: $scope.bundle }, (bundleInfo) ->
      $scope.bundleInfo = bundleInfo
      $scope.options =
        headers:
          Authorization: UserState.getTokenHeader()
        formData: { bundle: $scope.bundle }
        maxFileSize: bundleInfo.maxFileSize
        acceptFileTypes: new RegExp(bundleInfo.acceptFileTypes)
        done: (e, data) ->
          files.push(data.result)
          # Really ugly hack to avoid errors when re-rendering the scope.
          if files.length == $scope.queue.length
            timeoutFn = -> $scope.filesUploaded(files)
            $timeout(timeoutFn, 100)
            return
  ]
])

.directive("fileBrowser", ["FileStorage", (FileStorage) ->
  restrict: "AE"
  templateUrl: 'bundles/file/file-browser.html'
  scope: { bundle: "=", username: "=", fileSelected: "=" }
  controller: ["$scope", ($scope) ->
    $scope.query = {}
    $scope.selected = []
    for key in ["bundle", "username"] when $scope[key]
      $scope.query[key] = $scope[key]
    FileStorage.query { q: $scope.query }, (result) ->
      $scope.files = result.toArray()

    $scope.selectFile = (file) ->
      if file not in $scope.selected
        $scope.selected.push(file)
        $scope.fileSelected(file) if $scope.fileSelected
  ]
])

.directive("fileView",
["$controller", "loadTemplate", "fileModes", "$compile",
($controller, loadTemplate, fileModes, $compile) ->
  restrict: "AE"
  scope: { file: "=" }
  link: (scope, element, attrs) ->
    getView = (newVal, oldVal) ->
      return clear() if not scope.file
      definition = fileModes(scope.file.type)
      return clear() if not definition
      loadTemplate(definition).then (template) ->
        if definition.controller
          $controller definition.controller,
          { $scope: scope, file: scope.file }
          element.html(template)
          $compile(element.contents())(scope)
    clear = ->
      element.html('')

    getView()
    scope.$watch("file", getView)
])

.directive("fileSettingsForm",
["$compile", "$controller", "$http", "$templateCache", "fileModes",
($compile, $controller, $http, $templateCache, fileModes) ->
  restrict: "AE",
  scope: { file: "=" }
  link: (scope, element) ->
    getSettingsForm = ->
      file = scope.file
      if file
        definition = fileModes(file.type)
        return if not definition or not definition.settings
        settings = definition.settings
        if settings.template
          templatePromise = $q.when(settings.template)
        else if definition.settings.templateUrl
          templatePromise = $http.get settings.templateUrl,
            { cache: $templateCache }
          .then (response) -> return response.data

        templatePromise.then (template) ->
          if settings.controller
            file.settings = {} if not file.settings
            $controller settings.controller,
            { "$scope": scope, file: file }
          element.html(template)
          $compile(element.contents())(scope)
    getSettingsForm()
    scope.$watch("file", getSettingsForm)
])

.directive("filePreview", ["$compile", ($compile) ->
  restrict: "AE"
  scope: { file: "=" }
  link: (scope, element, attrs) ->
    update = ->
      template = "<span class=\"file-preview\">"
      if /image/i.test(scope.file.type)
        template += "<img class=\"preview\" src=\"{{file.uri}}\" alt=\"{{file.name}}\"/>"
      else
        template += "<i class=\"preview icon-xlarge icon-file\"></i>"

      template += "<span class=\"name\">{{file.name}}</span></span>"
      element.html(template)
      $compile(element.contents())(scope)
    update()
    scope.$watch('file', update)
])

.directive("filePicker", ["fileBrowser", (fileBrowser) ->
  restrict: "AE"
  replace: true
  require: 'ngModel'
  templateUrl: 'bundles/file/file-picker.html'
  scope: { ngModel: "=" }
  controller: ["$scope", "$attrs", ($scope, $attrs) ->
    $scope.pickFile = ->
      fileBrowser
        bundle: $attrs.bundle
      .then (files) ->
        $scope.ngModel = files[0] if files?.length
  ]
])

.directive("fileUploadList", ["fileBrowser", (fileBrowser) ->
  restrict: "E"
  replace: true
  transclude: true
  require: 'ngModel'
  templateUrl: 'bundles/file/file-upload-list.html'
  scope: { ngModel: '=', ngChange: '=' }
  controller: ["$scope", "$attrs", "$modal", ($scope, $attrs, $modal) ->
    $scope.show = $attrs.bundle?

    if $attrs.preview
      $scope.limit = $scope.$eval($attrs.limit) or $attrs.preview
    else
      $scope.preview = true

    if $attrs.limit
      $scope.limit = parseInt($scope.$eval($attrs.limit) or $attrs.limit)
    else
      $scope.limit = 0

    $scope.allowUpload = ->
      return true if $scope.limit is 0
      $scope.list?.length < $scope.limit

    # We need to clone the array to avoid losing focus
    # when updates occur.
    $scope.list = _.clone($scope.ngModel)

    $scope.$watch 'ngModel', ->
      $scope.list = _.clone($scope.ngModel)

    $scope.files = ""
    # Change the model.
    $scope.changeValue = (key) ->
      $scope.ngModel[key] = $scope.data[key]
      return

    $scope.editSettings = (item) ->
      $modal.open
        templateUrl: 'bundles/file/file-settings-modal.html'
        controller: ["$scope", "$modalInstance", "file",
        ($scope, $modalInstance, file) ->
          $scope.file = file
          $scope.close = ->
            $modalInstance.close()
        ]
        resolve:
          file: -> item
    $scope.addFile = ->
      fileBrowser
        bundle: $attrs.bundle
      .then (files) ->
        if files
          # Update our ngmodel with new files.
          for file in files
            $scope.ngModel.push
              _id: file._id
              name: file.name
              uri: file.uri
              type: file.type
              settings: file.settings

        $scope.list = _.clone($scope.ngModel)

    $scope.removeElement = (item) ->
      $scope.ngModel = _.without($scope.ngModel, item)
      $scope.list = _.clone($scope.ngModel)
  ]
])
