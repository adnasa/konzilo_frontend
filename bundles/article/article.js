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
              controller: [
                "$scope", "articlePart", "InputAutoSave", "useAutoSave", function($scope, articlePart, InputAutoSave, useAutoSave) {
                  var clean, savePart;
                  $scope.part = articlePart.toObject();
                  $scope.part.content = $scope.part.content || {};
                  $scope.content = $scope.part.content;
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
                    return $scope.autosave = new InputAutoSave($scope.part, savePart, clean);
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
              controller: [
                "$scope", "articlePart", "InputAutoSave", "useAutoSave", "$http", function($scope, articlePart, InputAutoSave, useAutoSave, $http) {
                  var clean, savePart;
                  $scope.part = articlePart.toObject();
                  $scope.part.vocabularies = $scope.part.vocabularies || {};
                  $scope.part.content = $scope.part.content || {};
                  $scope.content = $scope.part.content;
                  savePart = function() {
                    articlePart.set("byline", $scope.part.byline);
                    articlePart.set("content", $scope.content);
                    articlePart.save();
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
                    return $scope.autosave = new InputAutoSave($scope.part, savePart, clean);
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
              defaultName: $translate("IMAGEPART.DEFAULTNAME"),
              controller: [
                "$scope", "articlePart", "InputAutoSave", "UserStorage", "$q", "useAutoSave", function($scope, articlePart, InputAutoSave, UserStorage, $q, useAutoSave) {
                  var clean, savePart;
                  $scope.part = articlePart.toObject();
                  $scope.part.content = $scope.part.content || {};
                  $scope.part.vocabularies = $scope.part.vocabularies || {};
                  $scope.content = $scope.part.content;
                  if (!$scope.content.images) {
                    $scope.content.images = [];
                  }
                  savePart = function() {
                    articlePart.set("byline", $scope.part.byline);
                    articlePart.set("content", $scope.content);
                    articlePart.save();
                  };
                  clean = function() {
                    return $scope.partForm.$valid;
                  };
                  if (useAutoSave) {
                    return $scope.autosave = new InputAutoSave($scope.part, savePart, clean);
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
          articleCreated: "="
        },
        controller: [
          "$scope", "$element", "$attrs", "UserState", function($scope, $element, $attrs, UserState) {
            var defaults, info;
            defaults = $scope.defaults || {};
            info = UserState.getInfo().info;
            $element.find("input").focus();
            return $scope.addArticle = function() {
              var article;
              if ($scope.articleTitle) {
                article = {
                  title: $scope.articleTitle,
                  keywords: [],
                  responsible: info._id
                };
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
    "ArticleStorage", "UserState", "KonziloConfig", "articleParts", function(ArticleStorage, UserState, KonziloConfig, articleParts) {
      return {
        restrict: 'AE',
        scope: {
          article: "=",
          partCreated: "="
        },
        controller: [
          "$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            var defaultNames;
            $scope.types = articleParts.labels();
            defaultNames = articleParts.defaultNames();
            return $scope.addArticlePart = function() {
              var article, user;
              article = $scope.article;
              user = UserState.getInfo().info;
              return $scope.addArticlePart = function() {
                if ($scope.addArticlePartForm.$valid) {
                  return KonziloConfig.get("languages").listAll().then(function(languages) {
                    var articlePart, count, defaultLang;
                    defaultLang = _.find(languages, {
                      "default": true
                    });
                    articlePart = {
                      title: defaultNames[$scope.type],
                      state: "notstarted",
                      type: $scope.type,
                      submitter: user._id
                    };
                    if (defaultLang) {
                      articlePart.language = defaultLang.langcode;
                    }
                    article.parts = article.parts || [];
                    article.parts.push(articlePart);
                    count = _.filter(article.parts, {
                      type: articlePart.type
                    }).length;
                    if (count > 1) {
                      articlePart.title += " " + count;
                    }
                    return ArticleStorage.save(article, function(result) {
                      if ($scope.partCreated) {
                        $scope.partCreated(result, result.parts[result.parts.length - 1]);
                      }
                      return $scope.articlePartTitle = "";
                    });
                  });
                }
              };
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
            var getArticles, linkPattern;
            linkPattern = $attrs.linkPattern;
            getArticles = function() {
              $scope.size = 0;
              return ClipboardStorage.query().then(function(articles) {
                var article;
                $scope.articles = (function() {
                  var _i, _len, _ref, _results;
                  _ref = articles.toArray();
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    article = _ref[_i];
                    article.link = linkPattern.replace(":article", article._id);
                    _results.push(article);
                  }
                  return _results;
                })();
                $scope.size = article.length;
              });
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
    "ClipboardStorage", "ArticleStorage", "ArticlePartStorage", "$translate", function(ClipboardStorage, ArticleStorage, ArticlePartStorage, $translate) {
      return {
        restrict: "AE",
        scope: {
          selected: "=",
          linkPattern: "@",
          partCreated: "="
        },
        controller: [
          "$scope", "$attrs", function($scope, $attrs) {
            var articleMap, getClipboard, linkPattern, setSelected;
            articleMap = {};
            linkPattern = $attrs.linkPattern;
            getClipboard = function() {
              $scope.size = 0;
              ClipboardStorage.query().then(function(articles) {
                var article, part;
                articleMap = {};
                $scope.articles = (function() {
                  var _i, _j, _len, _len1, _ref, _ref1, _results;
                  _ref = articles.toArray();
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    article = _ref[_i];
                    if (!article.publishdate) {
                      continue;
                    }
                    articleMap[article._id] = article;
                    if (article.parts) {
                      _ref1 = article.parts;
                      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                        part = _ref1[_j];
                        part.link = linkPattern.replace(":article", article._id).replace(":part", part._id);
                      }
                    }
                    _results.push(article);
                  }
                  return _results;
                })();
                return $scope.size = $scope.articles.length;
              });
            };
            getClipboard();
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
                ClipboardStorage.add(article._id);
                return ArticlePartStorage.remove(part._id).then(function() {
                  return ArticleStorage.get(article._id).then(function(loadedArticle) {
                    return ClipboardStorage.add(loadedArticle._id);
                  });
                });
              }
            };
            ArticleStorage.changed(getClipboard);
            ClipboardStorage.changed(getClipboard);
            setSelected = function() {
              if ($scope.selected) {
                return $scope.openArticle = $scope.selected;
              }
            };
            setSelected();
            $scope.$watch("selected", setSelected);
            $scope.toggleArticle = function(article) {
              var _ref;
              if (((_ref = $scope.openArticle) != null ? _ref._id : void 0) === article._id) {
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
            $scope.activeItem = function(article) {
              var _ref;
              if (((_ref = $scope.openArticle) != null ? _ref._id : void 0) === article._id) {
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
                q: $scope.query
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
        templateUrl: "bundles/article/clipboard-articleparts.html"
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
                  part.set("provider", info._id);
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
                  }
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
            ArticlePartStorage.changed(fetchParts);
            $scope.$watch("selected", function() {
              if (!$scope.selected) {
                return;
              }
              $scope.selectedPart = $scope.selected.id();
              return $scope.selectedArticle = $scope.selected.get("article")._id;
            });
            return $scope.collapsed = function(article) {
              return articlesToggled[article._id];
            };
          }
        ],
        templateUrl: "bundles/article/article-deliver.html"
      };
    }
  ]).directive("kntntClipboardArticles", [
    "ClipboardStorage", "ArticleStorage", "$routeParams", "formatDate", function(ClipboardStorage, ArticleStorage, $routeParams, formatDate) {
      return {
        restrict: 'A',
        scope: {
          firstArticle: "=",
          articleCreated: "="
        },
        controller: [
          "$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            var appendPage, articleMap, calculateNewDate, calculatePrevDate, datePickers, drawClipboard, fetchedArticles, getClipboard, height, originalDates, pattern, scrollableElement, switchDate, transformLink,
              _this = this;
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
            pattern = $attrs.linkPattern;
            fetchedArticles = [];
            articleMap = {};
            height = $(window).height();
            scrollableElement = $element.find(".scheduled > .inner");
            scrollableElement.css("max-height", height - 300);
            $(window).resize(function() {
              height = $(window).height();
              return scrollableElement.css("max-height", height - 300);
            });
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
                calculatePrevDate();
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
            calculatePrevDate = function() {
              var currentDate, firstDate, lastDate, prevDate;
              currentDate = new Date();
              currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes());
              if ($scope.dates.length > 0) {
                firstDate = new Date($scope.dates[0]);
                lastDate = new Date(_.last($scope.dates));
                prevDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() - 1, firstDate.getHours(), firstDate.getMinutes());
                if (prevDate >= currentDate) {
                  $scope.prevDate = formatDate(prevDate);
                } else {
                  $scope.prevDate = null;
                }
                return $scope.nextDate = formatDate(new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1, lastDate.getHours(), lastDate.getMinutes()));
              } else {
                $scope.prevDate = formatDate(currentDate);
                return $scope.nextDDate = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, currentDate.getHours(), currentDate.getMinutes()));
              }
            };
            calculateNewDate = function(originalDate, index) {
              var newDate, nextDate, prevDate, tempDate;
              if (index > 0) {
                prevDate = new Date($scope.dates[index - 1]);
              }
              if (index < $scope.dates.length - 1) {
                nextDate = new Date($scope.dates[index + 1]);
              }
              if (prevDate && nextDate) {
                tempDate = new Date(nextDate - (nextDate - prevDate));
                if (tempDate === new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate() - 1, nextDate.getHours(), nextDate.getMinutes()) && tempDate !== prevDate) {
                  newDate = new Date(nextDate - (nextDate - prevDate));
                }
              } else if (nextDate) {
                newDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate() - 1, nextDate.getHours(), nextDate.getMinutes());
              } else if (prevDate && prevDate > originalDate) {
                newDate = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate() + 1, prevDate.getHours(), prevDate.getMinutes());
              }
              return newDate;
            };
            switchDate = function(oldDate, newDate) {
              var article, _i, _len, _ref;
              _ref = $scope.clipboard[oldDate];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                article = _ref[_i];
                article.publishdate = newDate;
                ArticleStorage.save(article);
              }
              return calculatePrevDate();
            };
            datePickers = {};
            $scope.datePickerValues = {};
            $scope.today = new Date();
            $scope.newDate = function(index) {
              var currentDate;
              currentDate = $scope.dates[index];
              switchDate(currentDate, $scope.datePickerValues[index]);
              return datePickers = {};
            };
            $scope.toggleDatePicker = function(date) {
              return datePickers[date] = datePickers[date] ? !datePickers[date] : true;
            };
            $scope.datePickerShown = function(date) {
              return datePickers[date];
            };
            $scope.options = {
              stop: function(event, ui) {
                var date, index, newDate, newDateString, originalDate;
                date = originalDates[ui.item.sortable.index];
                index = _.indexOf($scope.dates, date);
                originalDate = new Date(date);
                newDate = calculateNewDate(originalDate, index);
                if (newDate) {
                  newDateString = formatDate(newDate);
                  switchDate(date, newDateString);
                  originalDates = $scope.dates.slice(0);
                  return calculatePrevDate();
                } else {
                  return getClipboard();
                }
              },
              placeholder: "ui-placeholder box pad"
            };
            $scope.droppableOptions = {
              hoverClass: "droppable-hover",
              activeClass: "droppable-active",
              containment: ".scheduled",
              axis: "y",
              accept: function(item) {
                var article, id;
                id = item.attr('data-id');
                article = ClipboardStorage.get(id);
                return article && article.publishdate !== $(this).attr('data-date');
              },
              drop: function(event, ui) {
                var article, id,
                  _this = this;
                id = $(ui.draggable).attr('data-id');
                article = articleMap[id];
                article.publishDate = $(this).attr('data-date');
                drawClipboard(fetchedArticles);
                return ArticleStorage.get(id, function(article) {
                  article = article.toObject();
                  article.publishdate = $(_this).attr('data-date');
                  return ArticleStorage.save(article, function(result) {
                    return calculatePrevDate();
                  });
                });
              }
            };
            $scope.draggableOptions = {};
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
    "articleParts", "$compile", "$controller", "$injector", "$http", "$templateCache", "KonziloEntity", function(articleParts, $compile, $controller, $injector, $http, $templateCache, KonziloEntity) {
      return {
        restrict: "AE",
        scope: {
          articlePart: "=",
          useAutoSave: "="
        },
        link: function(scope, element, attrs) {
          var currentPart, getPartForm;
          currentPart = null;
          getPartForm = function() {
            var articlePart, definition, templatePromise, type;
            articlePart = scope.articlePart;
            if (articlePart && (!currentPart || !_.isEqual(articlePart, currentPart))) {
              if (!articlePart.toObject) {
                articlePart = new KonziloEntity('ArticlePart', articlePart);
              }
              type = articlePart.get('type');
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
              templatePromise.then(function(template) {
                if (definition.controller) {
                  $controller(definition.controller, {
                    "$scope": scope,
                    "articlePart": articlePart,
                    useAutoSave: scope.useAutoSave
                  });
                }
                element.html(template);
                return $compile(element.contents())(scope);
              });
              return currentPart = articlePart;
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
    "ArticlePartStorage", "ArticlePartStates", "userAccess", function(ArticlePartStorage, ArticlePartStates, userAccess) {
      return {
        restrict: "AE",
        scope: {
          articlePart: "="
        },
        controller: [
          "$scope", function($scope) {
            var nextState, prevState, update;
            prevState = null;
            nextState = null;
            update = function() {
              var currentState, index, _ref, _ref1, _ref2;
              if (!$scope.articlePart) {
                return;
              }
              currentState = $scope.articlePart.get("state");
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
                return $scope.nextLabel = (_ref2 = ArticlePartStates[index + 1]) != null ? _ref2.transitionLabel : void 0;
              } else {
                return userAccess("update articles").then(function() {
                  var _ref3;
                  return $scope.nextLabel = (_ref3 = ArticlePartStates[index + 1]) != null ? _ref3.transitionLabel : void 0;
                }, function() {
                  return $scope.nextLabel = void 0;
                });
              }
            };
            $scope.nextState = function() {
              $scope.articlePart.set("state", nextState);
              return $scope.articlePart.save().then(update);
            };
            $scope.prevState = function() {
              if (prevState) {
                $scope.articlePart.set("state", prevState);
                return $scope.articlePart.save().then(update);
              }
            };
            return $scope.$watch("articlePart", update);
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
            var getArticles, linkPattern;
            linkPattern = $attrs.linkPattern;
            getArticles = function() {
              return ArticleStorage.query({
                q: $scope.query
              }).then(function(result) {
                var article, articles, _i, _len;
                articles = result.toArray();
                for (_i = 0, _len = articles.length; _i < _len; _i++) {
                  article = articles[_i];
                  article.link = linkPattern.replace(":article", article._id);
                }
                $scope.articles = articles;
              });
            };
            getArticles();
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
              return ArticleStorage.save(article);
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
              delete $scope.autosave;
              $scope.autosave = new InputAutoSave($scope.article, $scope.saveArticle, function() {
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
