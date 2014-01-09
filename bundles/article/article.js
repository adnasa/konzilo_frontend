(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  angular.module("kntnt.article", ["ui.bootstrap", "cmf.input", "ui.jq", "ui.bootstrap", "konzilo.query", "konzilo.entity", "konzilo.markdown", "konzilo.author", "konzilo.translations"]).value('uiJqConfig', {
    draggable: {
      revert: "invalid"
    }
  }).provider("articleParts", function() {
    return {
      providers: {
        text: [
          "$translate", function($translate) {
            return {
              label: $translate("TEXTPART.LABEL"),
              defaultName: $translate("TEXTPART.DEFAULTNAME"),
              fields: [
                {
                  name: "topheadline",
                  label: "GLOBAL.TOPHEADLINE"
                }, {
                  name: "headline",
                  label: "GLOBAL.HEADLINE"
                }, {
                  name: "kicker",
                  label: "GLOBAL.KICKER"
                }, {
                  name: "lead",
                  label: "GLOBAL.LEAD"
                }, {
                  name: "body",
                  label: "GLOBAL.BODY"
                }
              ],
              controller: [
                "$scope", "articlePart", "InputAutoSave", "useAutoSave", "showFields", "definition", "useAuthor", function($scope, articlePart, InputAutoSave, useAutoSave, showFields, definition, useAuthor) {
                  var clean, savePart;
                  $scope.setActive = function() {
                    return $scope.$emit("kzActivePart", $scope.part);
                  };
                  $scope.part = articlePart.toObject();
                  $scope.part.content = $scope.part.content || {};
                  $scope.content = $scope.part.content;
                  $scope.useAuthor = useAuthor;
                  $scope.showFields = showFields;
                  $scope.part.vocabularies = $scope.part.vocabularies || {};
                  savePart = function() {
                    articlePart.set("byline", $scope.part.byline);
                    articlePart.set("content", $scope.content);
                    return articlePart.save();
                  };
                  clean = function() {
                    return $scope.partForm.$valid;
                  };
                  if (useAutoSave) {
                    return $scope.autosave = InputAutoSave.createInstance($scope.part, savePart, clean);
                  }
                }
              ],
              templateUrl: "bundles/article/articlepart-text.html"
            };
          }
        ],
        media: [
          "$translate", function($translate) {
            return {
              label: $translate("MEDIAPART.LABEL"),
              defaultName: $translate("MEDIAPART.DEFAULTNAME"),
              fields: [
                {
                  name: "media",
                  label: "MEDIAPART.MEDIA"
                }, {
                  name: "title",
                  label: "GLOBAL.TITLE"
                }, {
                  name: "description",
                  label: "GLOBAL.DESCRIPTION"
                }
              ],
              valid: function(part) {
                var validUrl, _ref;
                validUrl = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
                if (((_ref = part.content) != null ? _ref.media : void 0) && !validUrl.test(part.content.media)) {
                  return false;
                }
                return true;
              },
              controller: [
                "$scope", "articlePart", "InputAutoSave", "useAutoSave", "$http", "showFields", "useAuthor", function($scope, articlePart, InputAutoSave, useAutoSave, $http, showFields, useAuthor) {
                  var clean, savePart;
                  $scope.part = articlePart.toObject();
                  $scope.showFields = showFields;
                  $scope.useAuthor = useAuthor;
                  $scope.part.vocabularies = $scope.part.vocabularies || {};
                  $scope.part.content = $scope.part.content || {};
                  $scope.content = $scope.part.content;
                  savePart = function() {
                    articlePart.set("byline", $scope.part.byline);
                    articlePart.set("content", $scope.content);
                    return articlePart.save();
                  };
                  clean = function() {
                    return $scope.partForm.$valid;
                  };
                  $scope.showMedia = function() {
                    var request;
                    if ($scope.content.media) {
                      request = $http.get("/oembed", {
                        params: {
                          url: $scope.content.media
                        }
                      });
                      return request.then(function(result) {
                        $scope.video = void 0;
                        $scope.photo = void 0;
                        $scope.preview = true;
                        if (result.data.type === "video") {
                          $scope.video = result.data.html;
                        }
                        if (result.data.type === "photo") {
                          $scope.photo = result.data.url;
                        }
                        if (!$scope.content.title && result.data.title) {
                          $scope.content.title = result.data.title;
                        }
                        if (!$scope.content.creator && result.data.author_name) {
                          return $scope.content.creator = result.data.author_name;
                        }
                      }, function() {
                        return $scope.preview = false;
                      });
                    }
                  };
                  $scope.showMedia();
                  if (useAutoSave) {
                    return $scope.autosave = InputAutoSave.createInstance($scope.part, savePart, clean);
                  }
                }
              ],
              templateUrl: "bundles/article/articlepart-media.html"
            };
          }
        ],
        image: [
          "$translate", function($translate) {
            return {
              label: $translate("IMAGEPART.LABEL"),
              fields: [
                {
                  name: "images",
                  label: "IMAGEPART.UPLOADFILES"
                }, {
                  name: "title",
                  label: "GLOBAL.TITLE"
                }, {
                  name: "description",
                  label: "GLOBAL.DESCRIPTION"
                }
              ],
              defaultName: $translate("IMAGEPART.DEFAULTNAME"),
              controller: [
                "$scope", "articlePart", "InputAutoSave", "UserStorage", "$q", "useAutoSave", "showFields", "useAuthor", function($scope, articlePart, InputAutoSave, UserStorage, $q, useAutoSave, showFields, useAuthor) {
                  var clean, savePart;
                  $scope.part = articlePart.toObject();
                  $scope.part.content = $scope.part.content || {};
                  $scope.part.vocabularies = $scope.part.vocabularies || {};
                  $scope.showFields = showFields;
                  $scope.useAuthor = useAuthor;
                  $scope.content = $scope.part.content;
                  if (!$scope.content.images) {
                    $scope.content.images = [];
                  }
                  savePart = function() {
                    articlePart.set("content", $scope.content);
                    articlePart.set("byline", $scope.part.byline);
                    articlePart.save();
                  };
                  clean = function() {
                    return $scope.partForm.$valid;
                  };
                  if (useAutoSave) {
                    return $scope.autosave = InputAutoSave.createInstance($scope.part, savePart, clean);
                  }
                }
              ],
              templateUrl: "bundles/article/articlepart-image.html"
            };
          }
        ]
      },
      $get: function($injector) {
        var fn,
          _this = this;
        fn = function(name) {
          return _this.providers[name];
        };
        fn.getProviders = function() {
          return _this.providers;
        };
        fn.types = function() {
          var definition, name, types, _ref;
          types = {};
          _ref = _this.providers;
          for (name in _ref) {
            definition = _ref[name];
            if (_.isPlainObject(definition)) {
              types[name] = definition;
            } else {
              types[name] = $injector.invoke(definition);
            }
          }
          return types;
        };
        fn.labels = function() {
          var definition, labels, name, _ref;
          labels = {};
          _ref = _this.providers;
          for (name in _ref) {
            definition = _ref[name];
            if (_.isPlainObject(definition)) {
              labels[name] = definition.label;
            } else {
              labels[name] = $injector.invoke(definition).label;
            }
          }
          return labels;
        };
        fn.defaultNames = function() {
          var definition, name, names, _ref;
          names = {};
          _ref = _this.providers;
          for (name in _ref) {
            definition = _ref[name];
            if (_.isPlainObject(definition)) {
              names[name] = definition.defaultName;
            } else {
              names[name] = $injector.invoke(definition).defaultName;
            }
          }
          return names;
        };
        fn.valid = function(part) {
          if (!_this.providers[part.type].valid) {
            return true;
          }
          return _this.providers[part.type].valid(part);
        };
        return fn;
      },
      getProviders: function() {
        return this.providers;
      }
    };
  }).factory("ArticleStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage('/article/:_id', "Article");
    }
  ]).factory("ArticlePartStorage", [
    "KonziloStorage", function(KonziloStorage) {
      return new KonziloStorage('/articlepart/:_id', "ArticlePart");
    }
  ]).config([
    "entityInfoProvider", function(entityInfoProvider) {
      entityInfoProvider.addProvider("Article", {
        storageController: "ArticleStorage",
        labelProperty: "title",
        idProperty: "_id",
        properties: {
          _id: {
            label: "Identifier",
            type: String
          },
          title: {
            label: "Title",
            type: String
          },
          responsible: {
            label: "Responsible",
            type: String
          },
          publishdate: {
            label: "Publish date",
            processor: "processDate",
            type: Date
          },
          unpublishdate: {
            label: "Unpublish date",
            processor: "processDate",
            type: String
          },
          channel: {
            label: "Channel",
            type: String
          },
          step: {
            label: "Step",
            type: String
          },
          keyword: {
            label: "Topic",
            type: String
          },
          comments: {
            label: "Comments",
            type: []
          },
          keywords: {
            label: "Keywords",
            type: []
          },
          description: {
            label: "Task",
            type: String
          },
          ready: {
            label: "Ready",
            type: Boolean
          }
        },
        operations: {}
      });
      return entityInfoProvider.addProvider("ArticlePart", {
        storageController: "ArticlePartStorage",
        labelProperty: "title",
        idProperty: "_id",
        properties: {
          _id: {
            label: "Identifier",
            type: String
          },
          title: {
            label: "Title",
            type: String
          },
          partId: {
            label: "part id",
            type: String
          },
          article: {
            label: "Article",
            type: {}
          },
          submitter: {
            label: "Submitter",
            type: String
          },
          state: {
            label: "Status",
            type: String
          },
          provider: {
            label: "Provider",
            type: String
          },
          type: {
            label: "Type",
            type: String
          },
          language: {
            label: "Language",
            type: String
          },
          terms: {
            label: "Terms",
            type: []
          },
          assignment: {
            label: "Task",
            type: String
          },
          deadline: {
            label: "Deadline",
            processor: "processDate",
            type: Date
          },
          comments: {
            label: "Comments",
            type: []
          },
          content: {
            label: "Content",
            type: {}
          },
          byline: {
            label: "Byline",
            type: {}
          }
        }
      });
    }
  ]).directive("kntntAddArticle", [
    "ClipboardStorage", "ArticleStorage", function(ClipboardStorage, ArticleStorage) {
      return {
        restrict: 'AE',
        scope: {
          defaults: "=",
          articleCreated: "=",
          inherits: "="
        },
        controller: [
          "$scope", "$element", "$attrs", "UserState", function($scope, $element, $attrs, UserState) {
            var defaults, info;
            defaults = $scope.defaults || {};
            info = UserState.getInfo().info;
            $element.find("input").focus();
            return $scope.addArticle = function() {
              var article, property, _i, _len, _ref;
              if ($scope.articleTitle) {
                article = {
                  title: $scope.articleTitle,
                  keywords: [],
                  responsible: info._id
                };
                if ($scope.inherits) {
                  _ref = ["target", "step", "channel", "topic"];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    property = _ref[_i];
                    if ($scope.inherits[property]) {
                      article[property] = $scope.inherits[property];
                    }
                  }
                }
                article = _.defaults(article, defaults);
                return ArticleStorage.save(article, function(result) {
                  if ($scope.articleCreated) {
                    $scope.articleCreated(result);
                  }
                  ClipboardStorage.add(result._id);
                  return $scope.articleTitle = '';
                });
              }
            };
          }
        ],
        templateUrl: "bundles/article/add-article.html"
      };
    }
  ]).directive("kntntAddArticlePart", [
    "ArticlePartStorage", "UserState", "KonziloConfig", "articleParts", "kzArticleSettings", function(ArticlePartStorage, UserState, KonziloConfig, articleParts, kzArticleSettings) {
      return {
        restrict: 'AE',
        scope: {
          article: "=",
          partCreated: "="
        },
        controller: [
          "$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            var defaultNames, label, type, types, update, user, _ref;
            types = {};
            _ref = articleParts.labels();
            for (type in _ref) {
              label = _ref[type];
              types[type] = {
                label: label
              };
            }
            defaultNames = articleParts.defaultNames();
            user = UserState.getInfo().info;
            update = function() {
              var article, _ref1, _ref2;
              if (((_ref1 = $scope.article) != null ? _ref1._id : void 0) !== (typeof article !== "undefined" && article !== null ? article._id : void 0) && ((_ref2 = $scope.article) != null ? _ref2.channel : void 0)) {
                $scope.types = {};
                article = $scope.article;
                return kzArticleSettings(article).then(function(settings) {
                  var length, part, _i, _len, _ref3, _ref4;
                  if (!(settings != null ? (_ref3 = settings.parts) != null ? _ref3.length : void 0 : void 0) > 0) {
                    $scope.types = types;
                  } else {
                    _ref4 = settings.parts;
                    for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                      part = _ref4[_i];
                      length = _.filter(article.parts, {
                        typeName: part.name
                      }).length;
                      if (length < part.max || part.max === 0) {
                        $scope.types[part.type] = {
                          typeName: part.name,
                          label: part.label
                        };
                      }
                    }
                  }
                  return $scope.showForm = _.size($scope.types);
                });
              }
            };
            $scope.$watch("article", update);
            $scope.addArticlePart = function() {
              var _ref1;
              if ($scope.addArticlePartForm.$valid && ((_ref1 = $scope.type) != null ? _ref1.length : void 0) > 0) {
                return KonziloConfig.get("languages").listAll().then(function(languages) {
                  var articlePart, count, defaultLang;
                  defaultLang = _.find(languages, {
                    "default": true
                  });
                  articlePart = {
                    title: $scope.types[$scope.type].label,
                    state: "notstarted",
                    type: $scope.type,
                    typeName: $scope.types[$scope.type].typeName,
                    submitter: user._id,
                    provider: $scope.article.provider,
                    article: $scope.article._id
                  };
                  if (defaultLang) {
                    articlePart.language = defaultLang.langcode;
                  }
                  count = _.filter($scope.article.parts, {
                    type: articlePart.type
                  }).length;
                  if (count > 1) {
                    articlePart.title += " " + count;
                  }
                  return ArticlePartStorage.save(articlePart, function(result) {
                    $scope.article.parts.push(result);
                    if ($scope.partCreated) {
                      $scope.partCreated($scope.article, result);
                      return $scope.articlePartTitle = "";
                    }
                  });
                });
              }
            };
          }
        ],
        templateUrl: "bundles/article/add-article-part.html"
      };
    }
  ]).directive("kntntClipboardArticleList", [
    "ArticleStorage", "ClipboardStorage", function(ArticleStorage, ClipboardStorage) {
      return {
        restrict: "AE",
        scope: {
          selected: "="
        },
        controller: [
          "$scope", "$attrs", function($scope, $attrs) {
            var getArticles, linkPattern, prepareArticles;
            linkPattern = $attrs.linkPattern;
            prepareArticles = function(articles) {
              var article, _i, _len, _results;
              if (articles.toArray) {
                articles = articles.toArray();
              }
              _results = [];
              for (_i = 0, _len = articles.length; _i < _len; _i++) {
                article = articles[_i];
                article.link = linkPattern.replace(":article", article._id);
                _results.push(article);
              }
              return _results;
            };
            getArticles = function() {
              $scope.size = 0;
              return ClipboardStorage.query().then(function(articles) {
                $scope.collection = articles;
                $scope.articles = prepareArticles(articles);
              });
            };
            $scope.nextPage = function(articles) {
              var article, _i, _len, _ref, _results;
              _ref = prepareArticles(articles);
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                article = _ref[_i];
                _results.push($scope.articles.push(article));
              }
              return _results;
            };
            getArticles();
            ArticleStorage.changed(getArticles);
            return ClipboardStorage.changed(getArticles);
          }
        ],
        templateUrl: "bundles/article/article-list.html"
      };
    }
  ]).directive("kntntClipboardArticleParts", [
    "ClipboardStorage", "ArticleStorage", "ArticlePartStorage", "$translate", "$routeParams", "kzPartSettings", function(ClipboardStorage, ArticleStorage, ArticlePartStorage, $translate, $routeParams, kzPartSettings) {
      return {
        restrict: "AE",
        scope: {
          selected: "=",
          linkPattern: "@",
          partCreated: "="
        },
        controller: [
          "$scope", "$attrs", function($scope, $attrs) {
            var articleMap, drawClipboard, getClipboard, linkPattern, setSelected;
            articleMap = {};
            linkPattern = $attrs.linkPattern;
            $scope.size = 1;
            drawClipboard = function(articles) {
              var article, part, _i, _j, _len, _len1, _ref, _results;
              if (articles != null ? articles.toArray : void 0) {
                articles = articles.toArray();
              }
              _results = [];
              for (_i = 0, _len = articles.length; _i < _len; _i++) {
                article = articles[_i];
                if (!article.publishdate) {
                  continue;
                }
                articleMap[article._id] = article;
                if (article.parts) {
                  _ref = article.parts;
                  for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                    part = _ref[_j];
                    part.link = linkPattern.replace(":article", article._id).replace(":part", part._id);
                    if (part.typeName) {
                      part.article = article;
                      part.removable = kzPartSettings(part).then(function(settings) {
                        var length;
                        length = _.filter(article.parts, {
                          typeName: part.typeName
                        }).length;
                        return !settings || settings.min < length;
                      });
                    } else {
                      part.removable = true;
                    }
                  }
                }
                _results.push(article);
              }
              return _results;
            };
            getClipboard = function(reset) {
              if (reset == null) {
                reset = false;
              }
              return function() {
                ClipboardStorage.query({
                  reset: reset
                }).then(function(articles) {
                  articleMap = {};
                  $scope.collection = articles;
                  $scope.articles = drawClipboard($scope.collection);
                  return $scope.size = $scope.articles.length;
                });
              };
            };
            getClipboard()();
            $scope.options = {
              stop: function(event, ui) {
                var id;
                id = ui.item.attr("data-id");
                if (articleMap[id]) {
                  return ArticleStorage.save(articleMap[id]);
                }
              }
            };
            $scope.removeArticlePart = function(article, part) {
              if (confirm($translate("MANAGE.CONFIRMPARTREMOVE"))) {
                article.parts = _.without(article.parts, part);
                return ArticlePartStorage.remove(part._id).then(function() {
                  return ArticleStorage.get(article._id);
                });
              }
            };
            ArticleStorage.changed(getClipboard());
            ArticlePartStorage.changed(getClipboard(true));
            ClipboardStorage.changed(getClipboard());
            setSelected = function() {
              if ($scope.selected) {
                $scope.openPart = $scope.selected;
                return $scope.openArticle = $scope.selected.article;
              }
            };
            setSelected();
            $scope.$watch("selected", setSelected);
            $scope.toggleArticle = function(article) {
              if ($scope.openArticle === article) {
                return $scope.openArticle = null;
              } else {
                return $scope.openArticle = article;
              }
            };
            $scope.toggleIcon = function(article) {
              var _ref;
              if (((_ref = $scope.openArticle) != null ? _ref._id : void 0) !== article._id) {
                return "icon-chevron-right";
              } else {
                return "icon-chevron-down";
              }
            };
            $scope.nextPage = function(articles) {
              var article, _i, _len, _ref, _results;
              _ref = drawClipboard(articles);
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                article = _ref[_i];
                _results.push($scope.articles.push(article));
              }
              return _results;
            };
            $scope.activePart = function(part) {
              var _ref;
              if (((_ref = $scope.openPart) != null ? _ref._id : void 0) === part._id) {
                return "active";
              } else {
                return "";
              }
            };
            return $scope.active = function(article) {
              var _ref;
              return ((_ref = $scope.openArticle) != null ? _ref._id : void 0) === article._id;
            };
          }
        ],
        templateUrl: "bundles/article/clipboard-articleparts.html"
      };
    }
  ]).directive("kntntArticleParts", [
    "ArticlePartStorage", function(ArticlePartStorage) {
      return {
        restrict: "AE",
        scope: {
          selected: "=",
          query: "=",
          linkPattern: "@",
          part: "="
        },
        controller: [
          "$scope", function($scope) {
            var articlesToggled, getArticles, setSelected;
            articlesToggled = {};
            getArticles = function() {
              return ArticlePartStorage.query({
                q: $scope.query,
                limit: 500
              }).then(function(result) {
                var article, articlePart, _i, _len, _ref;
                $scope.articles = {};
                _ref = result.toArray();
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  articlePart = _ref[_i];
                  article = articlePart.article;
                  if ($scope.part && $scope.part.id() === articlePart._id && article._id === $scope.part.get("article")._id) {
                    articlesToggled[article._id] = true;
                  }
                  articlePart.article = article._id;
                  if (!$scope.articles[article._id]) {
                    $scope.articles[article._id] = article;
                    $scope.articles[article._id].parts = [];
                  }
                  articlePart.link = $scope.linkPattern.replace(":part", articlePart._id);
                  $scope.articles[article._id].parts.push(articlePart);
                }
                return $scope.size = _.size($scope.articles);
              });
            };
            getArticles();
            ArticlePartStorage.changed(getArticles);
            setSelected = function() {
              if ($scope.selected) {
                return $scope.openArticle = $scope.selected;
              }
            };
            setSelected();
            $scope.$watch("selected", setSelected);
            $scope.toggleArticle = function(article) {
              if ($scope.openArticle === article) {
                return $scope.openArticle = null;
              } else {
                return $scope.openArticle = article;
              }
            };
            $scope.toggleIcon = function(article) {
              if ($scope.openArticle !== article) {
                return "icon-chevron-right";
              } else {
                return "icon-chevron-down";
              }
            };
            $scope.activeItem = function(article) {
              if ($scope.openArticle === article) {
                return "active";
              } else {
                return "";
              }
            };
            return $scope.active = function(article) {
              return $scope.openArticle === article;
            };
          }
        ],
        templateUrl: "bundles/article/article-parts.html"
      };
    }
  ]).factory("ArticleStates", [
    "$translate", function($translate) {
      return {
        idea: $translate("ARTICLE.IDEA"),
        planned: $translate("ARTICLE.PLANNED"),
        ready: $translate("ARTICLE.READY")
      };
    }
  ]).factory("ArticlePartStates", function() {
    return [
      {
        name: "notstarted",
        label: "ARTICLE.NOTSTARTED",
        backLabel: "ARTICLE.BACKTONOTSTARTED"
      }, {
        name: "started",
        label: "ARTICLE.STARTED",
        transitionLabel: "ARTICLE.STARTWORKING",
        backLabel: "ARTICLE.BACKTOSTARTED"
      }, {
        name: "needsreview",
        label: "ARTICLE.NEEDSREVIEW",
        transitionLabel: "ARTICLE.POSTFORREVIEW"
      }, {
        name: "approved",
        label: "ARTICLE.APPROVED",
        transitionLabel: "ARTICLE.APPROVE"
      }
    ];
  }).directive("kntntArticleDeliver", [
    "ClipboardStorage", "ArticlePartStorage", "UserState", "ArticlePartStates", "GroupStorage", function(ClipboardStorage, ArticlePartStorage, UserState, ArticlePartStates, GroupStorage) {
      return {
        restrict: "AE",
        scope: {
          selected: "=",
          states: "=",
          linkPattern: "@",
          part: "="
        },
        controller: [
          "$scope", function($scope) {
            var articlesToggled, availableParts, fetchParts, groupParts, info, state, states;
            info = UserState.getInfo().info;
            articlesToggled = {};
            states = ArticlePartStates;
            if ($scope.states) {
              $scope.states = (function() {
                var _i, _len, _ref, _results;
                _results = [];
                for (_i = 0, _len = ArticlePartStates.length; _i < _len; _i++) {
                  state = ArticlePartStates[_i];
                  if (_ref = state.name, __indexOf.call($scope.states, _ref) >= 0) {
                    _results.push(state);
                  }
                }
                return _results;
              })();
            }
            availableParts = {};
            $scope.droppableOptions = {
              hoverClass: "droppable-hover",
              activeClass: "droppable-active",
              containment: ".group",
              axis: "y",
              accept: function(item) {
                var id;
                id = item.attr('data-id');
                if (availableParts[id]) {
                  return true;
                } else {
                  return false;
                }
              },
              drop: function(event, ui) {
                var currentPart, id;
                id = $(ui.draggable).attr('data-id');
                state = $(this).attr('data-state');
                currentPart = availableParts[id];
                currentPart.state = state;
                return ArticlePartStorage.get(id).then(function(part) {
                  part.set("state", state);
                  return ArticlePartStorage.save(part, function() {
                    return groupParts(_.toArray(availableParts));
                  });
                });
              }
            };
            groupParts = function(parts) {
              var article, articlePart, groupedResults, _i, _len;
              groupedResults = {};
              for (_i = 0, _len = parts.length; _i < _len; _i++) {
                articlePart = parts[_i];
                articlePart.link = $scope.linkPattern.replace(":part", articlePart._id);
                availableParts[articlePart._id] = articlePart;
                if (!groupedResults[articlePart.state]) {
                  groupedResults[articlePart.state] = {};
                }
                article = articlePart.article;
                if (!groupedResults[articlePart.state][article._id]) {
                  groupedResults[articlePart.state][article._id] = {
                    _id: article._id,
                    publishdate: article.publishdate,
                    title: article.title,
                    items: []
                  };
                }
                groupedResults[articlePart.state][article._id].items.push(articlePart);
              }
              return $scope.articles = groupedResults;
            };
            fetchParts = function() {
              var ids;
              ids = [info._id];
              return GroupStorage.query({
                q: {
                  members: {
                    $all: [info._id]
                  }
                }
              }).then(function(result) {
                var group;
                return ids.concat((function() {
                  var _i, _len, _ref, _results;
                  _ref = result.toArray();
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    group = _ref[_i];
                    _results.push(group._id);
                  }
                  return _results;
                })());
              }).then(function(providers) {
                return ArticlePartStorage.query({
                  q: {
                    provider: {
                      $in: providers
                    },
                    state: {
                      $ne: "approved"
                    },
                    type: {
                      $exists: true
                    }
                  },
                  limit: 500
                });
              }).then(function(result) {
                return groupParts(result.toArray());
              });
            };
            fetchParts();
            $scope.toggleArticle = function(article) {
              if ($scope.selectedArticle === article._id) {
                return $scope.selectedArticle = void 0;
              } else {
                return $scope.selectedArticle = article._id;
              }
            };
            $scope.$watch('selected', function(e, f) {
              var _ref, _ref1;
              if ((_ref = $scope.selected) != null ? _ref.toObject : void 0) {
                $scope.selectedId = $scope.selected.get('_id');
                return $scope.selectedArticle = $scope.selected.get('article')._id;
              } else {
                return $scope.selectedId = (_ref1 = $scope.selected) != null ? _ref1._id : void 0;
              }
            });
            ArticlePartStorage.changed(fetchParts);
            return $scope.collapsed = function(article) {
              return articlesToggled[article._id];
            };
          }
        ],
        templateUrl: "bundles/article/article-deliver.html"
      };
    }
  ]).directive("kntntClipboardArticles", [
    "ClipboardStorage", "ArticleStorage", "$routeParams", "$filter", function(ClipboardStorage, ArticleStorage, $routeParams, $filter) {
      return {
        restrict: 'A',
        scope: {
          firstArticle: "=",
          articleCreated: "="
        },
        controller: [
          "$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            var appendPage, articleMap, drawClipboard, fetchedArticles, formatDate, getClipboard, originalDates, pattern, transformLink;
            formatDate = function(date) {
              return $filter('date')(date, 'yyyy-MM');
            };
            transformLink = function(pattern, article) {
              var key, link, value;
              link = pattern;
              for (key in article) {
                value = article[key];
                link = link.replace(":" + key, value);
              }
              return link;
            };
            $scope.skip = 0;
            $scope.count = 0;
            $scope.getDate = function(dateString) {
              return new Date(dateString);
            };
            $scope.monthHidden = {};
            $scope.toggleMonth = function(date) {
              return $scope.monthHidden[date] = !$scope.monthHidden[date];
            };
            pattern = $attrs.linkPattern;
            fetchedArticles = [];
            articleMap = {};
            $scope.activeArticle = function(article) {
              if (article._id === $routeParams.id) {
                return "active";
              }
            };
            $scope.link = function(article) {
              return transformLink(pattern, article);
            };
            $scope.name = function(article) {
              var link;
              link = transformLink(pattern, article);
              return link.slice(1);
            };
            originalDates = [];
            drawClipboard = function(articles) {
              var article, clipboard, dateString, _i, _len;
              clipboard = {};
              $scope.unscheduled = [];
              for (_i = 0, _len = articles.length; _i < _len; _i++) {
                article = articles[_i];
                if (!article.publishdate) {
                  $scope.unscheduled.push(article);
                } else {
                  dateString = formatDate(article.publishdate);
                  if (!clipboard[dateString]) {
                    clipboard[dateString] = [];
                  }
                  clipboard[dateString].push(article);
                }
              }
              $scope.unscheduled = $scope.unscheduled.reverse();
              if ($scope.unscheduled.length > 0) {
                $scope.firstArticle = $scope.unscheduled[0];
              }
              $scope.clipboard = clipboard;
              return $scope.dates = _.keys($scope.clipboard).sort();
            };
            getClipboard = function(skip) {
              var _this = this;
              if (skip == null) {
                skip = 0;
              }
              return ClipboardStorage.query({
                sort: {
                  publishdate: "asc"
                },
                skip: skip
              }).then(function(articles) {
                var article, _i, _len;
                articleMap = {};
                $scope.count = articles.count;
                if (articles != null ? articles.toArray : void 0) {
                  articles = articles.toArray();
                }
                for (_i = 0, _len = articles.length; _i < _len; _i++) {
                  article = articles[_i];
                  articleMap[article._id] = article;
                }
                fetchedArticles = articles;
                drawClipboard(articles);
                return originalDates = $scope.dates.slice(0);
              });
            };
            appendPage = function(skip) {
              var _this = this;
              if (skip == null) {
                skip = 0;
              }
              return ClipboardStorage.query({
                sort: {
                  publishdate: "asc"
                },
                skip: skip
              }).then(function(articles) {
                var article, _i, _len;
                if (articles != null ? articles.toArray : void 0) {
                  articles = articles.toArray();
                }
                for (_i = 0, _len = articles.length; _i < _len; _i++) {
                  article = articles[_i];
                  articleMap[article._id] = article;
                  fetchedArticles.push(article);
                }
                return drawClipboard(fetchedArticles);
              });
            };
            getClipboard();
            $scope.nextPage = function() {
              $scope.skip += 20;
              return appendPage($scope.skip);
            };
            ArticleStorage.changed(getClipboard);
            ClipboardStorage.changed(getClipboard);
            return $scope.removeFromClipboard = function(article) {
              return ClipboardStorage.remove(article._id);
            };
          }
        ],
        templateUrl: "bundles/article/clipboard-articles.html"
      };
    }
  ]).directive("kntntArticlePicker", [
    "ClipboardStorage", "ArticleStorage", "$routeParams", "QueryBuilder", "queryFilter", "TargetStorage", "StepStorage", "ChannelStorage", "$filter", "ArticleStates", "ProviderStorage", "$translate", function(ClipboardStorage, ArticleStorage, $routeParams, QueryBuilder, queryFilter, TargetStorage, StepStorage, ChannelStorage, $filter, ArticleStates, ProviderStorage, $translate) {
      return {
        restrict: 'AE',
        controller: [
          "$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            var advancedCallback, channelFilter, collection, filters, selectors, stepFilter;
            $scope.isCollapsed = true;
            $scope.purge = false;
            collection = null;
            $scope.tableShown = false;
            $scope.pickLabel = 'ARTICLE.PICKFILTERED';
            $scope.showTable = function() {
              $scope.tableShown = !$scope.tableShown;
              if ($scope.tableShown) {
                return $scope.pickLabel = 'ARTICLE.PICKALL';
              } else {
                return $scope.pickLabel = 'ARTICLE.PICKFILTERED';
              }
            };
            stepFilter = new (queryFilter("ReferenceFilter"))("step", $translate('GLOBAL.STEP'), $translate("ARTICLEPICKER.STEPDESC"), StepStorage, "name", "_id");
            channelFilter = new (queryFilter("ReferenceFilter"))("channel", $translate("GLOBAL.CHANNEL"), $translate("ARTICLEPICKER.PUBLISHDESC"), ChannelStorage, "name", "_id");
            filters = [new (queryFilter("ReferenceFilter"))("target", $translate("GLOBAL.TARGET"), $translate("ARTICLEPICKER.TARGETDESC"), TargetStorage, "name", "_id"), new (queryFilter("ReferenceFilter"))("responsible", $translate("GLOBAL.RESPONSIBLE"), $translate("ARTICLEPICKER.RESPONSIBLEDESC"), ProviderStorage, "label", "_id"), new (queryFilter("OptionsFilter"))("state", $translate("GLOBAL.STATUS"), $translate("ARTICLEPICKER.STATUSDESC"), ArticleStates), stepFilter, channelFilter, new (queryFilter("MatchFilter"))("title", $translate("ARTICLEPICKER.MATCHES"), $translate("ARTICLEPICKER.MATCHESDESC"))];
            advancedCallback = null;
            $scope.builder = new QueryBuilder(ArticleStorage, filters);
            $scope.builder.queryExecuted(function(articles) {
              $scope.selector = "advanced";
              if (!advancedCallback) {
                $scope.showArticles();
              }
              return advancedCallback(articles);
            });
            selectors = {
              all: function(callback) {
                return ArticleStorage.query({}, function(result) {
                  return callback(result);
                });
              },
              recommended: function(callback) {
                return ArticleStorage.query({
                  q: {
                    $or: [
                      {
                        ready: {
                          $exists: false
                        }
                      }, {
                        ready: false
                      }
                    ]
                  },
                  sort: {
                    publishdate: "asc"
                  }
                }).then(function(result) {
                  return callback(result);
                });
              },
              advanced: function(callback) {
                $scope.showAdvanced = true;
                return advancedCallback = callback;
              }
            };
            $scope.showArticles = function() {
              var selector;
              $scope.articles = [];
              if (!$scope.selector || !selectors[$scope.selector]) {
                return;
              }
              selector = selectors[$scope.selector];
              return selector(function(articles) {
                var pages, _i, _ref, _results;
                pages = articles.pages();
                if (pages > 0) {
                  $scope.pages = (function() {
                    _results = [];
                    for (var _i = 0, _ref = articles.pages(); 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
                    return _results;
                  }).apply(this);
                } else {
                  $scope.pages = void 0;
                }
                $scope.articles = articles.toArray();
                collection = articles;
                $scope.count = collection.count;
                $scope.translations = {
                  count: $scope.count
                };
                $scope.selected = {};
                return $scope.selectall = false;
              });
            };
            $scope.getPage = function(number) {
              if (collection) {
                return collection.getPage(number).then(function(result) {
                  collection = result;
                  return $scope.articles = collection.toArray();
                });
              }
            };
            $scope.addArticles = function() {
              var save, selector;
              if (!collection.count) {
                return;
              }
              if (!$scope.tableShown) {
                if (!$scope.selector || !selectors[$scope.selector]) {
                  return;
                }
                save = function(articles) {
                  var saveData;
                  saveData = function() {
                    return ClipboardStorage.getIds().then(function(ids) {
                      var article, _i, _len, _ref, _ref1;
                      _ref = articles.toArray();
                      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        article = _ref[_i];
                        if (_ref1 = article._id, __indexOf.call(ids, _ref1) < 0) {
                          ids.push(article._id);
                        }
                      }
                      return ClipboardStorage.save(ids);
                    });
                  };
                  if ($scope.purge) {
                    return ClipboardStorage.truncate().then(saveData);
                  } else {
                    return saveData();
                  }
                };
                selector = $scope.selector;
                if (selector === "advanced") {
                  $scope.builder.limit = collection.count;
                  $scope.builder.execute(save);
                } else if (selector === "all") {
                  ArticleStorage.query({
                    limit: collection.count
                  }).then(save);
                } else {
                  selectors[selector](save);
                }
                return selector = selectors[$scope.selector];
              } else {
                save = function() {
                  return ClipboardStorage.getIds().then(function(ids) {
                    var id, selected, _ref;
                    _ref = $scope.selected;
                    for (id in _ref) {
                      selected = _ref[id];
                      if (selected) {
                        if (__indexOf.call(ids, id) < 0) {
                          ids.push(id);
                        }
                      }
                    }
                    return ClipboardStorage.save(ids);
                  });
                };
                if ($scope.purge) {
                  return ClipboardStorage.truncate().then(save);
                } else {
                  return save();
                }
              }
            };
            $scope.clearClipboard = function() {
              return ClipboardStorage.truncate();
            };
            $scope.collapseClass = function() {
              if ($scope.isCollapsed) {
                return "collapsed";
              } else {
                return "open";
              }
            };
            return $scope.toggleSelect = function() {
              var article, articles, _i, _len, _results;
              articles = $filter('filter')($scope.articles, $scope.search);
              _results = [];
              for (_i = 0, _len = articles.length; _i < _len; _i++) {
                article = articles[_i];
                _results.push($scope.selected[article._id] = $scope.selectall);
              }
              return _results;
            };
          }
        ],
        templateUrl: "bundles/article/article-picker.html"
      };
    }
  ]).directive("konziloArticlepartForm", [
    "articleParts", "$compile", "$controller", "$injector", "$http", "$templateCache", "KonziloEntity", "UserState", "kzPartSettings", "$q", function(articleParts, $compile, $controller, $injector, $http, $templateCache, KonziloEntity, UserState, kzPartSettings, $q) {
      return {
        restrict: "AE",
        scope: {
          articlePart: "=",
          useAutoSave: "="
        },
        link: function(scope, element, attrs) {
          var currentPart, getPartForm, userId;
          currentPart = null;
          userId = UserState.getInfo().info._id;
          getPartForm = function() {
            var articlePart, loadPartForm, locked, lockedId, template;
            loadPartForm = function() {
              var definition, templatePromise, type, useAutoSave;
              type = articlePart.get('type');
              if (typeof scope.useAutoSave === 'undefined') {
                useAutoSave = true;
              } else {
                useAutoSave = scope.useAutoSave;
              }
              definition = articleParts(type);
              if (!definition) {
                return;
              }
              if (!_.isPlainObject(definition)) {
                definition = $injector.invoke(definition);
              }
              if (definition.template) {
                templatePromise = $q.when(definition.template);
              } else if (definition.templateUrl) {
                templatePromise = $http.get(definition.templateUrl, {
                  cache: $templateCache
                }).then(function(response) {
                  return response.data;
                });
              }
              return kzPartSettings(articlePart).then(function(partSettings) {
                var field, showFields, useAuthor, _i, _len, _ref;
                if (!partSettings) {
                  showFields = {};
                  useAuthor = true;
                  _ref = definition.fields;
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    field = _ref[_i];
                    showFields[field.name] = true;
                  }
                } else {
                  showFields = partSettings.show;
                  useAuthor = partSettings.useAuthor;
                }
                return templatePromise.then(function(template) {
                  if (definition.controller) {
                    $controller(definition.controller, {
                      $scope: scope,
                      articlePart: articlePart,
                      useAutoSave: useAutoSave,
                      showFields: showFields,
                      useAuthor: useAuthor,
                      definition: definition
                    });
                  }
                  element.html(template);
                  return $compile(element.contents())(scope);
                });
              });
            };
            articlePart = scope.articlePart;
            if (articlePart && (!currentPart || !_.isEqual(articlePart, currentPart))) {
              if (!articlePart.toObject) {
                articlePart = new KonziloEntity('ArticlePart', articlePart);
              }
              currentPart = articlePart;
              locked = articlePart.get('locked');
              lockedId = (locked != null ? locked._id : void 0) || locked;
              if (locked && userId !== lockedId) {
                scope.translations = {
                  user: locked.username
                };
                template = "<div class=\"well locked\">              <p>{{'ARTICLE.LOCKEDTEXT' | translate: translations }}</p>              <button class=\"btn\" ng-click=\"unlockPart()\">              <i class=\"icon-unlock\"></i>              <span>{{'ARTICLE.UNLOCK' | translate}}</span></button></div>";
                element.html(template);
                scope.unlockPart = function() {
                  return articlePart.set("unlock", true).save().then(function() {
                    articlePart.set("unlock", false);
                    return loadPartForm();
                  });
                };
                return $compile(element.contents())(scope);
              } else {
                return loadPartForm();
              }
            }
          };
          getPartForm();
          return scope.$watch("articlePart", getPartForm);
        }
      };
    }
  ]).directive("konziloArticlepartApprove", [
    "ArticlePartStorage", "ArticlePartStates", function(ArticlePartStorage, ArticlePartStates) {
      return {
        restrict: "AE",
        scope: {
          articlePart: "=",
          failState: "=",
          approveState: "="
        },
        controller: [
          "$scope", function($scope) {
            $scope.approve = function() {
              if ($scope.approveState) {
                $scope.articlePart.set("state", $scope.approveState);
                return $scope.articlePart.save();
              }
            };
            return $scope.sendback = function() {
              if ($scope.failState) {
                $scope.articlePart.set("state", $scope.failState);
                return $scope.articlePart.save();
              }
            };
          }
        ],
        templateUrl: "bundles/article/articlepart-approve.html"
      };
    }
  ]).directive("konziloArticlepartChangeState", [
    "ArticlePartStorage", "ArticlePartStates", "userAccess", "UserState", function(ArticlePartStorage, ArticlePartStates, userAccess, UserState) {
      return {
        restrict: "AE",
        scope: {
          articlePart: "="
        },
        controller: [
          "$scope", function($scope) {
            var nextState, prevState, stateChanged, update;
            prevState = null;
            nextState = null;
            update = function() {
              var currentState, index, locked, userId, _ref, _ref1, _ref2;
              if (!$scope.articlePart) {
                return;
              }
              if ($scope.articlePart.toObject) {
                $scope.part = $scope.articlePart.toObject();
              } else {
                $scope.part = $scope.articlePart;
              }
              userId = UserState.getInfo().info._id;
              locked = $scope.part.locked;
              locked = _.isPlainObject(locked) ? locked._id : locked;
              $scope.locked = locked && userId !== locked;
              currentState = $scope.part.state;
              if (!currentState || currentState === ArticlePartStates[0].name) {
                index = 0;
              } else {
                index = _.findIndex(ArticlePartStates, {
                  name: currentState
                });
              }
              nextState = (_ref = ArticlePartStates[index + 1]) != null ? _ref.name : void 0;
              if (index > 0) {
                prevState = ArticlePartStates[index - 1].name;
              }
              $scope.backLabel = (_ref1 = ArticlePartStates[index - 1]) != null ? _ref1.backLabel : void 0;
              if (nextState !== "approved") {
                $scope.nextLabel = (_ref2 = ArticlePartStates[index + 1]) != null ? _ref2.transitionLabel : void 0;
              } else {
                userAccess("update articles").then(function() {
                  var _ref3;
                  $scope.nextLabel = (_ref3 = ArticlePartStates[index + 1]) != null ? _ref3.transitionLabel : void 0;
                  return $scope.show = !$scope.locked && ($scope.backLabel || $scope.nextLabel);
                }, function() {
                  $scope.nextLabel = void 0;
                  return $scope.show = !$scope.locked && ($scope.backLabel || $scope.nextLabel);
                });
              }
              return $scope.show = !$scope.locked && ($scope.prevLabel || $scope.nextLabel);
            };
            stateChanged = function(part) {
              $scope.$emit("stateChanged", part);
              return update();
            };
            $scope.nextState = function() {
              $scope.part.state = nextState;
              return ArticlePartStorage.save($scope.part).then(stateChanged);
            };
            $scope.prevState = function() {
              if (prevState) {
                $scope.part.state = prevState;
                return ArticlePartStorage.save($scope.part).then(stateChanged);
              }
            };
            $scope.$watch("articlePart", update);
            return ArticlePartStorage.itemSaved(function(item) {
              var _ref;
              if (((_ref = $scope.part) != null ? _ref._id : void 0) === item.get("_id")) {
                $scope.part.state = item.get("state");
                return update();
              }
            });
          }
        ],
        templateUrl: "bundles/article/articlepart-change-state.html"
      };
    }
  ]).directive("kntntArticleList", [
    "ArticleStorage", function(ArticleStorage) {
      return {
        restrict: "AE",
        scope: {
          selected: "=",
          query: "="
        },
        controller: [
          "$scope", "$attrs", function($scope, $attrs) {
            var getArticles, linkPattern, prepareArticles;
            linkPattern = $attrs.linkPattern;
            prepareArticles = function(articles) {
              var article, _i, _len, _results;
              _results = [];
              for (_i = 0, _len = articles.length; _i < _len; _i++) {
                article = articles[_i];
                _results.push(article.link = linkPattern.replace(":article", article._id));
              }
              return _results;
            };
            getArticles = function() {
              return ArticleStorage.query({
                q: $scope.query
              }).then(function(result) {
                $scope.collection = articles;
                $scope.articles = prepareArticles($scope.collection);
              });
            };
            getArticles();
            $scope.nextPage = function(articles) {
              var article, _i, _len, _ref, _results;
              _ref = prepareArticles(articles);
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                article = _ref[_i];
                _results.push($scope.articles.push(articles));
              }
              return _results;
            };
            ArticleStorage.changed(getArticles);
            return ClipboardStorage.changed(getArticles);
          }
        ],
        templateUrl: "bundles/article/article-list.html"
      };
    }
  ]).directive("konziloArticleForm", [
    "ArticleStorage", "TargetStorage", "InputAutoSave", "ChannelStorage", "StepStorage", "$filter", "$q", "$translate", function(ArticleStorage, TargetStorage, InputAutoSave, ChannelStorage, StepStorage, $filter, $q, $translate) {
      return {
        restrict: "AE",
        scope: {
          article: "="
        },
        controller: [
          "$scope", "$attrs", function($scope, $attrs) {
            var update;
            $scope.translations = {};
            $scope.saveArticle = function(article) {
              var part, _i, _len, _ref;
              if (article.provider) {
                _ref = article.parts;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  part = _ref[_i];
                  if (!part.provider) {
                    part.provider = article.provider;
                  }
                }
              }
              return ArticleStorage.save(article).then(function(result) {
                $scope.article.parts = result.parts;
                return article;
              });
            };
            $scope.today = new Date();
            $scope.changeTarget = function() {
              ChannelStorage.query().then(function(result) {
                $scope.channels = result.toArray();
                return $scope.channel = _.find($scope.channels, {
                  _id: $scope.article.channel
                });
              });
              $q.all([
                TargetStorage.query().then(function(targets) {
                  $scope.targets = targets.toArray();
                  $scope.target = _.find($scope.targets, function(target) {
                    return $scope.article.target === target._id;
                  });
                  if ($scope.target) {
                    return $scope.translations.target = $scope.target.name;
                  }
                }), StepStorage.query({
                  sort: {
                    weight: "asc"
                  }
                }).then(function(result) {
                  $scope.steps = result.toArray();
                  return $scope.step = _.find($scope.steps, function(step) {
                    return $scope.article.step === step._id;
                  });
                })
              ]).then(function() {
                var _ref;
                if ($scope.target && $scope.step) {
                  return $scope.topics = (_ref = $scope.target.steps[$scope.step._id]) != null ? _ref.topics : void 0;
                }
              });
            };
            $scope.topicChanged = function(topic) {
              if (topic) {
                return $scope.translations.topic = topic.toLowerCase();
              }
            };
            $scope.changeTime = function(time, date) {
              var result;
              if (time.match(/[0-9]{2}:[0-9]{2}/)) {
                result = time.split(':');
                date.setHours(result[0]);
                return date.setMinutes(result[1]);
              }
            };
            update = function() {
              if (!$scope.article) {
                return;
              }
              if (!$scope.article.vocabularies) {
                $scope.article.vocabularies = {};
              }
              if ($scope.article.publishdate) {
                $scope.publishtime = $filter('date')($scope.article.publishdate, "HH:mm");
              }
              if ($scope.article.unpublishdate) {
                $scope.unpublishtime = $filter('date')($scope.article.unpublishdate, "HH:mm");
              }
              if (!$scope.article.keywords) {
                $scope.article.keywords = [];
              }
              if ($scope.article.topic) {
                $scope.translations.topic = $scope.article.topic.toLowerCase();
              }
              if ($scope.autosave) {
                $scope.autosave.stop();
              }
              $scope.autosave = InputAutoSave.createInstance($scope.article, $scope.saveArticle, function() {
                var _ref;
                return (_ref = $scope.articleForm) != null ? _ref.$valid : void 0;
              });
              $scope.changeTarget();
            };
            return $scope.$watch("article", update);
          }
        ],
        templateUrl: "bundles/article/article-form.html"
      };
    }
  ]).directive("konziloArticlePartVersions", function() {
    return {
      restrict: "AE",
      scope: {
        part: "="
      },
      controller: [
        "$scope", "$attrs", function($scope, $attrs) {
          var linkPattern;
          linkPattern = $attrs.linkPattern;
          $scope.$watch("part", function() {
            if ($scope.part) {
              return $scope.query = {
                partId: $scope.part.partId
              };
            }
          });
          $scope.properties = {
            title: "Titel",
            state: "Status"
          };
          if (linkPattern) {
            $scope.properties["link"] = {
              label: "Redigera",
              value: function(item) {
                return {
                  label: "redigera",
                  link: linkPattern.replace(':id', item._id).replace(':article_id', item.article._id)
                };
              }
            };
          }
          return $scope.properties["activate"] = {
            label: "Aktivera",
            value: function(item) {
              return {
                html: "<konzilo-article-part-set-active part=\"item\"></konzilo-article-part-set-active>"
              };
            }
          };
        }
      ],
      template: '<content-table query="query" entity-type="ArticlePart", properties="properties"></content-table>'
    };
  }).directive("konziloArticlePartNewVersion", [
    "ArticlePartStorage", "$translate", function(ArticlePartStorage, $translate) {
      return {
        restrict: "AE",
        scope: {
          part: "="
        },
        controller: [
          "$scope", function($scope) {
            return $scope.newVersion = function() {
              var part;
              if ($scope.part) {
                part = _.clone($scope.part);
                delete part._id;
                part.active = false;
                part.state = "notstarted";
                return ArticlePartStorage.save(part);
              }
            };
          }
        ],
        template: "<button class=\"btn btn-primary\" ng-click=\"newVersion()\">" + ($translate("ARTICLE.NEWVERSION")) + "</button>"
      };
    }
  ]).directive("kzLocked", [
    "UserState", function(UserState) {
      return {
        restrict: "A",
        scope: {
          kzLocked: "="
        },
        link: function(scope, element, attrs) {
          var userId;
          userId = UserState.getInfo().info._id;
          return scope.$watch("kzLocked", function() {
            var _ref;
            if (((_ref = scope.kzLocked) != null ? _ref.locked : void 0) === userId) {
              return element.removeAttr("disabled");
            } else {
              return element.attr("disabled", "disabled");
            }
          });
        }
      };
    }
  ]).directive("konziloArticlePartSetActive", [
    "ArticlePartStorage", "$translate", function(ArticlePartStorage, $translate) {
      return {
        restrict: "AE",
        scope: {
          part: "="
        },
        controller: [
          "$scope", function($scope) {
            return $scope.activate = function() {
              var part;
              if (!$scope.part) {
                return;
              }
              part = _.clone($scope.part);
              part.active = true;
              ArticlePartStorage.save(part);
            };
          }
        ],
        template: "<button class=\"btn btn-primary\" ng-click=\"activate()\", ng-show=\"!part.active\">" + ($translate("GLOBAL.ACTIVATE")) + "</button>"
      };
    }
  ]);

}).call(this);
