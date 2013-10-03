angular.module("kntnt.map",
["ui.bootstrap", "cmf.input", "konzilo.config", "konzilo.translations"])

.config(["$routeProvider", "entityInfoProvider",
($routeProvider, entityInfoProvider) ->
  entityInfoProvider.addProvider "Target",
    storageController: "TargetStorage"
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
      steps: []
    operations:
      delete:
        label: "Remove term"
        action: (term) ->
          term.remove()
  map =
    controller: 'MapController'
    templateUrl: 'bundles/map/map.html'
    resolve:
      access: (userAccess) ->
        userAccess("administer system")

  $routeProvider
    .when('/settings/targets', map)
    .when('/settings/targets/:target', map)
])

.run(["konziloMenu", "$translate", (konziloMenu, $translate) ->
  konziloMenu("settingsMenu").addItem "#/settings/targets", $translate("TARGET.TITLE"),
    (userAccess) ->
      userAccess("administer system")
])

.factory("TargetStorage", ["KonziloStorage", (KonziloStorage) ->
  return new KonziloStorage "/target/:_id", "Target"
])

# Hard-coded moods. Should be configurable later on.
.factory("MapMoods", ->
  thinking: "TARGET.THINKING"
  infoabout: "TARGET.INFOABOUT"
  influences: "TARGET.INFLUENCES"
  doing: "TARGET.DOING"
  influenced: "TARGET.INFLUENCED"
  experience: "TARGET.EXPERIENCE"
)

.factory("kzAnalysisDialog", ["MapMoods", "$modal", (MapMoods, $modal) ->
  (target) ->
    $modal.open
      templateUrl: 'bundles/map/target-analysis.html'
      controller: ($scope, target, $modalInstance) ->
        $scope.target = target
        $scope.moods = MapMoods
        $scope.close = ->
          $modalInstance.close()
      resolve:
        target: -> target
    .result
])

.controller("MapController",
["$scope", "TargetStorage", "$routeParams", "StepStorage",
"InputAutoSave", "MapMoods", "$translate", "$location",
($scope, TargetStorage, $routeParams, StepStorage,
InputAutoSave, MapMoods, $translate, $location) ->
  $scope.newTopics = {}
  $scope.$parent.title = $translate("TARGET.TITLE")

  $scope.moods = MapMoods

  $scope.steps = StepStorage.query(sort: weight: "asc")
  .then (result) ->
    result.toArray()

  newTarget = ->
    $scope.target =
      strategies: []
      descriptions: []
      reasons: []
      keywords: []
      weight: 0

  $scope.removeTarget = (target) ->
    return if not target._id
    if confirm($translate('TARGET.CONFIRMREMOVE'))
      TargetStorage.remove(target._id).then (result) ->
        $scope.targets = TargetStorage.query().then (result) ->
          result.toArray()
          $location.url("/settings/targets")

  # Create a new target based on the targetName variable in the scope.
  $scope.newTarget = ->
    target = newTarget()
    target.name = $scope.targetName
    $scope.targetName = ""
    TargetStorage.save(target).then (result) ->
      $location.url("/settings/targets/#{result._id}")

  $scope.targets = TargetStorage.query().then (result) ->
    result.toArray()

  $scope.$watch("target", $scope.saveTarget)

  setActive = (target) ->
    target = target.toObject()
    target.steps = target.steps or {}
    target.analysis = target.analysis or
      thinking: []
      infoabout: []
      influences: []
      doing: []
      influenced: []
      experience: []

    $scope.steps.then (steps) ->
      for step in steps
        target.steps[step._id] = target.steps[step._id] or {}
        target.steps[step._id].topics = target.steps[step._id].topics or []
        $scope.newTopics[step._id] = {}

    $scope.target = _.clone target
    $scope.autosave = new InputAutoSave $scope.target, $scope.saveTarget, ->
      $scope.mapForm.$valid

    $scope.title = $scope.target.name

  $scope.addTopic = (step, stepId) ->
    step.topics.push
      name: $scope.newTopics[stepId].name
      description: $scope.newTopics[stepId].description
    $scope.newTopics[stepId] = {}

  # Save a target from the target variable in the $scope.
  $scope.saveTarget = ->
    if not angular.equals($scope.target, target)
      target = _.clone $scope.target
      TargetStorage.save $scope.target
      $scope.targets = TargetStorage.query().then (result) -> result.toArray()
      $scope.target = {} if not $scope.target._id

  if $routeParams.target
    target = TargetStorage.get($routeParams.target).then(setActive)
])
