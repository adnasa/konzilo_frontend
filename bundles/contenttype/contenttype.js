(function() {
  angular.module("konzilo.contenttype", ["konzilo.config", 'konzilo.translations', 'kntnt.article', 'konzilo.contenttype']).run([
    "ArticleStorage", "ChannelStorage", "$q", function(ArticleStorage, ChannelStorage, $q, UserState) {
      return ArticleStorage.preSave(function(article) {
        if (!article.get("channel")) {
          return $q.when(article);
        }
        return ChannelStorage.get(article.get("channel")).then(function(channel) {
          var articlePart, existingParts, part, partTypes, parts, _i, _len, _ref, _ref1, _ref2;
          parts = article.get("parts") || [];
          partTypes = (_ref = channel.get("contentType")) != null ? _ref.parts : void 0;
          if (partTypes) {
            for (_i = 0, _len = partTypes.length; _i < _len; _i++) {
              part = partTypes[_i];
              existingParts = _.filter(parts, {
                typeName: part.name
              });
              while (existingParts.length < part.min) {
                articlePart = {
                  title: part.label,
                  state: "notstarted",
                  type: part.type,
                  typeName: part.name,
                  provider: (_ref1 = article.get("provider")) != null ? _ref1._id : void 0,
                  submitter: (_ref2 = article.get("responsible")) != null ? _ref2._id : void 0
                };
                parts.push(articlePart);
                existingParts.push(articlePart);
              }
            }
          }
          article.set("parts", parts);
          return article;
        });
      });
    }
  ]).factory("kzPartSettings", [
    "ChannelStorage", "$q", "KonziloEntity", "ArticleStorage", function(ChannelStorage, $q, KonziloEntity, ArticleStorage) {
      return function(part) {
        var article, deferred, getChannel;
        if (!part.toObject) {
          part = new KonziloEntity('ArticlePart', part);
        }
        deferred = $q.defer();
        getChannel = function(article) {
          var channel;
          channel = article.channel;
          if (!channel) {
            return deferred.resolve(false);
          }
          return ChannelStorage.get(channel).then(function(result) {
            var parts, _ref;
            parts = (_ref = result.get("contentType")) != null ? _ref.parts : void 0;
            if (parts) {
              return deferred.resolve(_.find(parts, {
                name: part.get("typeName")
              }));
            } else {
              return deferred.resolve(false);
            }
          });
        };
        article = part.get("article");
        if (!_.isPlainObject(article)) {
          ArticleStorage.get(article).then(function(article) {
            return getChannel(article.toObject());
          });
        } else {
          getChannel(article);
        }
        return deferred.promise;
      };
    }
  ]).factory("kzArticleSettings", [
    "ChannelStorage", "$q", "KonziloEntity", function(ChannelStorage, $q, KonziloEntity) {
      return function(article) {
        var channel, deferred, part;
        if (!article.toObject) {
          part = new KonziloEntity('Article', article);
        }
        deferred = $q.defer();
        channel = article.channel;
        if (!channel) {
          return $q.when(false);
        }
        ChannelStorage.get(channel).then(function(result) {
          return deferred.resolve(result.get("contentType"));
        });
        return deferred.promise;
      };
    }
  ]).directive("kzContentTypeArticleForm", [
    "kzArticleSettings", "InputAutoSave", "ArticlePartStorage", "articleParts", function(kzArticleSettings, InputAutoSave, ArticlePartStorage, articleParts) {
      return {
        restrict: "AE",
        scope: {
          article: "="
        },
        controller: [
          "$scope", function($scope) {
            var article, saveParts, update, valid;
            article = void 0;
            $scope.useSave = false;
            saveParts = function() {
              var part, _i, _len, _ref, _ref1, _results;
              if (!((_ref = $scope.article) != null ? _ref.parts : void 0)) {
                return;
              }
              _ref1 = $scope.article.parts;
              _results = [];
              for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                part = _ref1[_i];
                _results.push(ArticlePartStorage.save(part));
              }
              return _results;
            };
            valid = function() {
              var part, _i, _len, _ref, _ref1;
              _ref1 = (_ref = $scope.article) != null ? _ref.parts : void 0;
              for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                part = _ref1[_i];
                if (!articleParts.valid(part)) {
                  return false;
                }
              }
              return true;
            };
            update = function() {
              var part, _i, _len, _ref, _ref1, _ref2, _results;
              if ((_ref = $scope.autosave) != null) {
                _ref.stop();
              }
              if (!((_ref1 = $scope.article) != null ? _ref1.channel : void 0)) {
                return;
              }
              article = $scope.article._id;
              kzArticleSettings($scope.article).then(function(settings) {
                var part, parts, results, _i, _j, _len, _len1, _ref2, _ref3, _ref4;
                parts = [];
                if ((settings != null ? (_ref2 = settings.parts) != null ? _ref2.length : void 0 : void 0) > 0) {
                  _ref3 = settings.parts;
                  for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
                    part = _ref3[_i];
                    results = _.filter($scope.article.parts, {
                      typeName: part.name
                    });
                    parts.push({
                      partInfo: part,
                      parts: results
                    });
                  }
                } else {
                  _ref4 = $scope.article.parts;
                  for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
                    part = _ref4[_j];
                    parts.push({
                      partInfo: {
                        label: part.title
                      },
                      parts: [part]
                    });
                  }
                }
                $scope.parts = parts;
                return $scope.autosave = InputAutoSave.createInstance($scope.article.parts, saveParts, valid);
              });
              $scope.active = {};
              _ref2 = $scope.article.parts;
              _results = [];
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                part = _ref2[_i];
                _results.push($scope.active[part._id] = false);
              }
              return _results;
            };
            $scope.$watch("article", update);
            return $scope.$watch("article.parts", update);
          }
        ],
        templateUrl: "bundles/contenttype/content-type-article-form.html"
      };
    }
  ]).directive("kzContentTypeForm", [
    "articleParts", function(articleParts) {
      return {
        restrict: "AE",
        scope: {
          contentType: "="
        },
        controller: [
          "$scope", function($scope) {
            var getMaxLimit, getMinLimit, update;
            $scope.types = articleParts.types();
            $scope.typeLabels = articleParts.labels();
            $scope.newPart = {
              show: {},
              min: 1,
              max: 1
            };
            getMaxLimit = function(minLimit) {
              var i, limit;
              if (!minLimit || parseInt(minLimit) < 1) {
                minLimit = 1;
              }
              minLimit = parseInt(minLimit);
              limit = (function() {
                var _i, _results;
                _results = [];
                for (i = _i = minLimit; minLimit <= 10 ? _i <= 10 : _i >= 10; i = minLimit <= 10 ? ++_i : --_i) {
                  _results.push({
                    label: i,
                    value: i
                  });
                }
                return _results;
              })();
              limit.unshift({
                label: "GLOBAL.UNLIMITED",
                value: 0
              });
              return limit;
            };
            getMinLimit = function(maxLimit) {
              var _i, _results;
              if (maxLimit == null) {
                maxLimit = 10;
              }
              return (function() {
                _results = [];
                for (var _i = 0; 0 <= maxLimit ? _i <= maxLimit : _i >= maxLimit; 0 <= maxLimit ? _i++ : _i--){ _results.push(_i); }
                return _results;
              }).apply(this);
            };
            $scope.newPartMinLimit = function(index, maxLimit) {
              return $scope.partMinLimit[index] = getMinLimit(maxLimit);
            };
            $scope.newPartMaxLimit = function(index, minLimit) {
              return $scope.partMaxLimit[index] = getMaxLimit(minLimit);
            };
            $scope.newMinLimit = function() {
              return $scope.minLimit = getMinLimit($scope.newPart.max);
            };
            $scope.newMaxLimit = function() {
              return $scope.maxLimit = getMaxLimit($scope.newPart.min);
            };
            $scope.newMaxLimit();
            $scope.newMinLimit();
            $scope.valid = function(candidate) {
              return !_.find($scope.contentType.parts, {
                name: candidate
              });
            };
            $scope.changeCardinality = function(part) {
              part.min = parseInt(part.min);
              return part.max = parseInt(part.max);
            };
            update = function() {
              var index, part, _i, _len, _ref, _results;
              if (!$scope.contentType) {
                return;
              }
              if (!$scope.contentType.parts) {
                $scope.contentType.parts = [];
              }
              $scope.partMaxLimit = {};
              $scope.partMinLimit = {};
              _ref = $scope.contentType.parts;
              _results = [];
              for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                part = _ref[index];
                $scope.newPartMaxLimit(index, part.min);
                _results.push($scope.newPartMinLimit(index, part.max));
              }
              return _results;
            };
            $scope.removePart = function(index) {
              var i, part;
              return $scope.contentType.parts = (function() {
                var _i, _len, _ref, _results;
                _ref = $scope.contentType.parts;
                _results = [];
                for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                  part = _ref[i];
                  if (i !== index) {
                    _results.push(part);
                  }
                }
                return _results;
              })();
            };
            $scope.addPart = function() {
              var type;
              if ($scope.addPartType.$valid) {
                type = $scope.contentType;
                type.parts = type.parts || [];
                type.parts.push($scope.newPart);
                $scope.newPartMaxLimit(type.parts.length - 1);
                $scope.newPartMinLimit(type.parts.length - 1);
                return $scope.newPart = {
                  show: {},
                  min: 1,
                  max: 1
                };
              }
            };
            return $scope.$watch("contentType", update);
          }
        ],
        templateUrl: "bundles/contenttype/content-type-form.html"
      };
    }
  ]);

}).call(this);
