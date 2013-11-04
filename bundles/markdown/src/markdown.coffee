angular.module('konzilo.markdown', ["konzilo.file"])

.factory("MarkdownPlugin", ->
  class MarkdownPlugin
    constructor: (@icon, @template, @perLine=false) ->
      if _.isPlainObject(@template)
        @options = @template

    operation: (text, option, element, callback) ->
      if option and _.isPlainObject(@template)
        template = @template[option]
      else
        template = @template
      if @perLine
        result = ""
        for line, index in text.split("\n")
          result += template.replace("{{text}}", line)
          .replace("{{row}}", index + 1) + "\n"
      else
        result = template.replace("{{text}}", text)
      callback(result) if callback
)

.factory("MarkdownBrowserPlugin", (MarkdownPlugin, fileBrowser) ->
  class MarkdownBrowserPlugin extends MarkdownPlugin
    constructor: (@icon) ->
      super(@icon, "![{{text}}]({{url}})")

    operation: (text, option, element, callback) ->
      fileBrowser
        bundle: "media"
      .then (files) ->
        if files and files.length > 0
          file = files.shift()
          settings = file.settings
          callback("[[entityType: File, alt: #{settings.alt}, title: #{settings.title}, entityId: #{file._id}]]")
)

.factory("markdownPlugins",
["MarkdownPlugin", "MarkdownBrowserPlugin",
(MarkdownPlugin, MarkdownBrowserPlugin) ->
  headings =
    "Heading 1": "# {{text}}\r\n"
    "Heading 2": "## {{text}}\r\n"
    "Heading 3":"### {{text}}\r\n"

  bold: new MarkdownPlugin("icon-bold", "**{{text}}**")
  italic: new MarkdownPlugin('icon-italic', "*{{text}}*")
  heading: new MarkdownPlugin 'icon-text-height', headings
  blockquote: new MarkdownPlugin('icon-indent-right', "> {{text}}", true)
  unorderedlist: new MarkdownPlugin('icon-list-ul', "* {{text}}", true)
  orderedlist: new MarkdownPlugin('icon-list', "{{row}}. {{text}}", true)
  link: new MarkdownPlugin('icon-link', "[{{text}}]()")
  image: new MarkdownBrowserPlugin('icon-picture')
])

# Our markdown converter also supports some added
# features, like displaying entities inline.
.factory("MarkdownConverter", ["entityInfo", (entityInfo) ->
  class MarkdownConverter
    constructor: ->
      @converter = new Showdown.converter()

    convert: (text) ->
      getMatches = (regex, text, index=null) ->
        result = regex.exec(text)
        while result
          hit = (if index then result[index] else result)
          result = regex.exec(text)
          hit

      entityRegex = /\[\[(.*)\]\]/g
      for entityMatch in getMatches(entityRegex, text)
        propertyRegex = /(\w*):\s([\w/]*)/g
        entity = {}
        for prop in getMatches(propertyRegex, entityMatch[1])
          entity[prop[1]] = prop[2]
        if entity.entityType and entity.entityId
          text = text.replace(entityMatch[0],
          "<entity-view entity-id=\"#{entity.entityId}\" entity-type=\"#{entity.entityType}\">")
      return @converter.makeHtml(text)
])

.directive('markdown',
["MarkdownConverter", "$compile", (MarkdownConverter, $compile) ->
  converter = new MarkdownConverter()
  restrict: 'AE',
  scope: { "markdown": "=" },
  link: (scope, element, attrs) ->
    scope.$watch "markdown", (newVal) ->
      if scope.markdown
        element.html(converter.convert(scope.markdown))
        $compile(element.contents())(scope)
    $compile(element.contents())(scope)
])

.directive('markdownEditor', ["markdownPlugins", (markdownPlugins) ->
  restrict: 'AE'
  require: "ngModel"
  replace: true
  scope: { ngModel: "=", ngChange: "=", placeholder: "@" }
  link: (scope, element, attrs) ->
    editor = element.find('.editor')
    preview = element.find('.preview')
    textarea = element.find('textarea')
    editorFocused = false

    # Show the actual input if we have some text in the editor.
    if scope.ngModel and scope.ngModel > 0
      editor.height(0)
    else
      preview.hide()

    editor.css('overflow', "hidden")
    showInput = ->
      editor.height("auto")
      preview.hide()
      editorFocused = true
    focusTextArea = ->
      showInput()
      textarea.focus()

    textarea.focus(showInput)
    element.focus(focusTextArea)
    preview.focus(focusTextArea)
    preview.click(focusTextArea)
    $('*').focus ->
      if element.find(this).length == 0 and scope.ngModel and
      scope.ngModel.length > 0
        editor.height(0)
        preview.show()

    scope.$watch "ngModel", ->
      if not scope.ngModel or scope.ngModel.length == 0
        preview.hide()
        editor.height("auto")
      else if not editorFocused
        preview.show()
        editor.height(0)

  controller: ["$scope", "$attrs", "$element", ($scope, $attrs, $element) ->
    $scope.tools = []
    textarea = $element.find('textarea')
    # Some fixes for this to work with inline input.
    $element.focus ->
      textarea.focus()
    $scope.tools = (plugin for key, plugin of markdownPlugins)
    $scope.toggle = (tool) ->
      "dropdown-toggle" if tool.options

    $scope.useTool = (tool, template) ->
      return if tool.options and not template
      text = textarea.getSelection().text
      tool.operation text, template, $element, (result) ->
        textarea.replaceSelectedText(result) if result
        $scope.ngModel = textarea.val()
  ]
  templateUrl: "bundles/markdown/markdown-editor.html"
])
