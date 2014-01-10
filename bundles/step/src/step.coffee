angular.module("konzilo.step", ["konzilo.config", "konzilo.translations"])

.config(["$routeProvider", "entityInfoProvider", ($routeProvider, entityInfoProvider) ->
  entityInfoProvider.addProvider "Step",
    storageController: "StepStorage"
    labelProperty: "name"
    idProperty: "_id"
    properties:
      _id:
        label: "ID"
        type: String
      name:
        label: "Name"
        type: String
      description:
        label: "Description"
        type: String
      endpoint: String
    operations:
      delete:
        label: "Remove"
        action: (step) ->
          step.remove()

  stepAdmin =
    controller: "StepAdminController"
    templateUrl: "bundles/step/step-admin.html"
    resolve:
      access: (userAccess) ->
        userAccess("administer system")

  $routeProvider.when('/settings/steps', stepAdmin)
  $routeProvider.when('/settings/steps/:step', stepAdmin)
])

.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  konziloMenu("settingsMenu").addItem "#/settings/steps",
  $translate("STEP.TITLE"),
  (userAccess) ->
    userAccess("administer system")
])

.factory("StepStorage", ["KonziloStorage", (KonziloStorage) ->
  return new KonziloStorage "/step/:_id", "Step"
])

.controller("StepAdminController",
["$scope", "$http", "$routeParams",
"InputAutoSave", "StepStorage", "KonziloConfig", "$translate", "$location",
($scope, $http, $routeParams,
InputAutoSave, StepStorage, KonziloConfig, $translate, $location) ->
  getSteps = ->
    $scope.steps = StepStorage.query().then (result) -> result.toArray()
  getSteps()
  $scope.properties =
    name: $translate("GLOBAL.NAME")
    operations:
      label: $translate("GLOBAL.OPERATIONS")
      value: (item) ->
        label: $translate("GLOBAL.EDIT")
        link: "#/settings/steps/#{item._id}"

  if $routeParams.step
    StepStorage.get($routeParams.step).then (step) ->
      $scope.step = step.toObject()
      valid = -> $scope.editStepForm.$valid
      save = -> StepStorage.save($scope.step)
      $scope.autosave = InputAutoSave.createInstance($scope.step, save, valid)

  $scope.mainClass = ->
    if $scope.step then "span6" else "span12"

  $scope.newStep = {}
  $scope.addStep = ->
    if $scope.addStepForm.$valid
      StepStorage.save($scope.newStep).then ->
        $scope.newStep = {}
        getSteps()

  $scope.removeStep = (step) ->
    if confirm($translate("STEP.CONFIRMREMOVE"))
      StepStorage.remove(step._id).then ->
        $location.url('/settings/steps')

  return
])
