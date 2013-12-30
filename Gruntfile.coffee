bowerFolder = "bower_components"
bundleFolder = "bundles"
# Main files for inclusion.
dependencies = [
  "lodash/dist/lodash.js"
  "jquery/jquery.js"
  "jquery-ui/ui/jquery.ui.core.js"
  "jquery-ui/ui/jquery.ui.widget.js"
  "jquery-ui/ui/jquery.ui.mouse.js"
  "jquery-ui/ui/jquery.ui.sortable.js"
  "jquery-ui/ui/jquery.ui.draggable.js"
  "jquery-ui/ui/jquery.ui.droppable.js"
  "jquery-mousewheel/jquery.mousewheel.js"
  "rangyinputs/rangyinputs-jquery-src.js",
  "showdown/src/showdown.js"
  "angular/angular.js"
  "angular-i18n/angular-locale_sv-se.js"
  "angular-cookies/angular-cookies.js"
  "angular-resource/angular-resource.js"
  "angular-ui-sortable/src/sortable.js"
  "angular-ui-utils/modules/jq/jq.js"
  "angular-ui-utils/modules/scrollfix/scrollfix.js"
  "angular-bootstrap/ui-bootstrap.js"
  "angular-bootstrap/ui-bootstrap-tpls.js"
  "angular-translate/angular-translate.js"
  "angular-translate-loader-static-files/angular-translate-loader-static-files.js"
  "blueimp-load-image/js/load-image.min.js"
  "blueimp-file-upload/js/jquery.iframe-transport.js"
  "blueimp-file-upload/js/jquery.fileupload.js"
  "blueimp-file-upload/js/jquery.fileupload-process.js"
  "blueimp-file-upload/js/jquery.fileupload-image.js"
  "blueimp-file-upload/js/jquery.fileupload-validate.js"
  "blueimp-file-upload/js/jquery.fileupload-angular.js"
]

bundles = [
  "approve",
  "article",
  "author",
  "channel",
  "client",
  "clipboard",
  "comment",
  "config",
  "deliver",
  "endpoint",
  "entity",
  "file",
  "input",
  "language",
  "manage",
  "map",
  "markdown",
  "menu",
  "order",
  "plan",
  "query",
  "step",
  "timeline",
  "translations",
  "user",
  "vocabulary",
  "main",
  "contenttype"
]

dependencies = (bowerFolder + "/" + dependency for dependency in dependencies)
files = {}
scripts = ["js/dependencies.js"]

processBundle = (bundle, targetDir = "web/bundles/#{bundle}") ->
  folder = "#{bundleFolder}/#{bundle}"
  manifest = require("./#{folder}/manifest")
  # Aggregate all scripts.
  scripts.push("/bundles/#{bundle}/#{script}") for script in manifest.scripts

  for type in ["coffee", "jade", "less"] when manifest[type]
    for target, source of manifest[type]
      files[type] = files[type] or {}
      files[type]["#{targetDir}/#{target}"] = "#{folder}/#{source}"

for bundle in bundles
  processBundle(bundle)

# The index bundle is a "special bundle".
# We have to handle this separately.
files.jade = files.jade or {}
files.less = files.less or {}

files.jade["web/index.html"] = "index/index.jade"
files.less["web/css/main.css"] = "index/less/main.less"

module.exports = (grunt) ->
  # Project configuration.
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    copy:
      main:
        files: [
          {
            expand: true
            cwd: "bower_components/font-awesome/font"
            src: ['*']
            dest: 'web/font'
            filter: 'isFile'
          }
          {
            expand: true
            cwd: "locale"
            src: ['*']
            dest: 'web/locale'
            filter: 'isFile'
          }
        ]
    less:
      development:
        options:
          paths: ["bower_components", "index/less"]
        files: files.less
      production:
        options:
          paths: ["bower_components", "index/less"]
          yuicompress: true
        files: files.less
    concat:
      options:
        separator: ';'
      dist:
        src: dependencies
        dest: 'web/js/dependencies.js'
    watch:
      scripts:
        files: [
          'bundles/*/src/*.coffee',
          'index/less/*.less'
          'locale/*.json'
          "bundles/*/templates/*.jade",
          ]
        tasks: ['less', 'coffee', 'jade', 'copy']
    coffee:
      compile:
        files: files.coffee
    jade:
      compile:
        options:
          pretty: true
          data:
            debug: false
            scripts: scripts
        files: files.jade
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-contrib-less'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-jade'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-copy'

  grunt.registerTask('default', ['concat', 'copy', 'less', 'coffee', 'jade'])
