(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  angular.module('konzilo.markdown', ["konzilo.file"]).factory("MarkdownPlugin", function() {
    var MarkdownPlugin;
    return MarkdownPlugin = (function() {
      function MarkdownPlugin(icon, template, perLine) {
        this.icon = icon;
        this.template = template;
        this.perLine = perLine != null ? perLine : false;
        if (_.isPlainObject(this.template)) {
          this.options = this.template;
        }
      }

      MarkdownPlugin.prototype.operation = function(text, option, element, callback) {
        var index, line, result, template, _i, _len, _ref;
        if (option && _.isPlainObject(this.template)) {
          template = this.template[option];
        } else {
          template = this.template;
        }
        if (this.perLine) {
          result = "";
          _ref = text.split("\n");
          for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
            line = _ref[index];
            result += template.replace("{{text}}", line).replace("{{row}}", index + 1) + "\n";
          }
        } else {
          result = template.replace("{{text}}", text);
        }
        if (callback) {
          return callback(result);
        }
      };

      return MarkdownPlugin;

    })();
  }).factory("MarkdownBrowserPlugin", function(MarkdownPlugin, fileBrowser) {
    var MarkdownBrowserPlugin;
    return MarkdownBrowserPlugin = (function(_super) {
      __extends(MarkdownBrowserPlugin, _super);

      function MarkdownBrowserPlugin(icon) {
        this.icon = icon;
        MarkdownBrowserPlugin.__super__.constructor.call(this, this.icon, "![{{text}}]({{url}})");
      }

      MarkdownBrowserPlugin.prototype.operation = function(text, option, element, callback) {
        return fileBrowser({
          bundle: "media"
        }).then(function(files) {
          var file, settings;
          if (files && files.length > 0) {
            file = files.shift();
            settings = file.settings;
            return callback("[[entityType: File, alt: " + settings.alt + ", title: " + settings.title + ", entityId: " + file._id + "]]");
          }
        });
      };

      return MarkdownBrowserPlugin;

    })(MarkdownPlugin);
  }).factory("markdownPlugins", [
    "MarkdownPlugin", "MarkdownBrowserPlugin", function(MarkdownPlugin, MarkdownBrowserPlugin) {
      var headings;
      headings = {
        "Heading 1": "# {{text}}\r\n",
        "Heading 2": "## {{text}}\r\n",
        "Heading 3": "### {{text}}\r\n"
      };
      return {
        bold: new MarkdownPlugin("icon-bold", "**{{text}}**"),
        italic: new MarkdownPlugin('icon-italic', "*{{text}}*"),
        heading: new MarkdownPlugin('icon-text-height', headings),
        blockquote: new MarkdownPlugin('icon-indent-right', "> {{text}}", true),
        unorderedlist: new MarkdownPlugin('icon-list-ul', "* {{text}}", true),
        orderedlist: new MarkdownPlugin('icon-list', "{{row}}. {{text}}", true),
        link: new MarkdownPlugin('icon-link', "[{{text}}]()"),
        image: new MarkdownBrowserPlugin('icon-picture')
      };
    }
  ]).factory("MarkdownConverter", [
    "entityInfo", function(entityInfo) {
      var MarkdownConverter;
      return MarkdownConverter = (function() {
        function MarkdownConverter() {
          this.converter = new Showdown.converter();
        }

        MarkdownConverter.prototype.convert = function(text) {
          var entity, entityMatch, entityRegex, getMatches, prop, propertyRegex, _i, _j, _len, _len1, _ref, _ref1;
          getMatches = function(regex, text, index) {
            var hit, result, _results;
            if (index == null) {
              index = null;
            }
            result = regex.exec(text);
            _results = [];
            while (result) {
              hit = (index ? result[index] : result);
              result = regex.exec(text);
              _results.push(hit);
            }
            return _results;
          };
          entityRegex = /\[\[(.*)\]\]/g;
          _ref = getMatches(entityRegex, text);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            entityMatch = _ref[_i];
            propertyRegex = /(\w*):\s([\w/]*)/g;
            entity = {};
            _ref1 = getMatches(propertyRegex, entityMatch[1]);
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              prop = _ref1[_j];
              entity[prop[1]] = prop[2];
            }
            if (entity.entityType && entity.entityId) {
              text = text.replace(entityMatch[0], "<entity-view entity-id=\"" + entity.entityId + "\" entity-type=\"" + entity.entityType + "\">");
            }
          }
          return this.converter.makeHtml(text);
        };

        return MarkdownConverter;

      })();
    }
  ]).directive('markdown', [
    "MarkdownConverter", "$compile", function(MarkdownConverter, $compile) {
      var converter;
      converter = new MarkdownConverter();
      return {
        restrict: 'AE',
        scope: {
          "markdown": "="
        },
        link: function(scope, element, attrs) {
          scope.$watch("markdown", function(newVal) {
            if (scope.markdown) {
              element.html(converter.convert(scope.markdown));
              return $compile(element.contents())(scope);
            }
          });
          return $compile(element.contents())(scope);
        }
      };
    }
  ]).directive('markdownEditor', [
    "markdownPlugins", function(markdownPlugins) {
      return {
        restrict: 'AE',
        require: "ngModel",
        replace: true,
        scope: {
          ngModel: "=",
          ngChange: "=",
          placeholder: "@"
        },
        link: function(scope, element, attrs) {
          var editor, editorFocused, focusTextArea, preview, showInput, textarea;
          editor = element.find('.editor');
          preview = element.find('.preview');
          textarea = element.find('textarea');
          editorFocused = false;
          if (scope.ngModel && scope.ngModel > 0) {
            editor.height(0);
          } else {
            preview.hide();
          }
          editor.css('overflow', "hidden");
          showInput = function() {
            editor.height("auto");
            preview.hide();
            return editorFocused = true;
          };
          focusTextArea = function() {
            showInput();
            return textarea.focus();
          };
          textarea.focus(showInput);
          element.focus(focusTextArea);
          preview.focus(focusTextArea);
          preview.click(focusTextArea);
          $('*').focus(function() {
            if (element.find(this).length === 0 && scope.ngModel && scope.ngModel.length > 0) {
              editor.height(0);
              return preview.show();
            }
          });
          return scope.$watch("ngModel", function() {
            if (!scope.ngModel || scope.ngModel.length === 0) {
              preview.hide();
              return editor.height("auto");
            } else if (!editorFocused) {
              preview.show();
              return editor.height(0);
            }
          });
        },
        controller: [
          "$scope", "$attrs", "$element", function($scope, $attrs, $element) {
            var key, plugin, textarea;
            $scope.tools = [];
            textarea = $element.find('textarea');
            $element.focus(function() {
              return textarea.focus();
            });
            $scope.tools = (function() {
              var _results;
              _results = [];
              for (key in markdownPlugins) {
                plugin = markdownPlugins[key];
                _results.push(plugin);
              }
              return _results;
            })();
            $scope.toggle = function(tool) {
              if (tool.options) {
                return "dropdown-toggle";
              }
            };
            return $scope.useTool = function(tool, template) {
              var text;
              if (tool.options && !template) {
                return;
              }
              text = textarea.getSelection().text;
              return tool.operation(text, template, $element, function(result) {
                if (result) {
                  textarea.replaceSelectedText(result);
                }
                return $scope.ngModel = textarea.val();
              });
            };
          }
        ],
        templateUrl: "bundles/markdown/markdown-editor.html"
      };
    }
  ]);

}).call(this);
