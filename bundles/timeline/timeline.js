(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  angular.module("konzilo.timeline", ["kntnt.article"]).factory("DomCanvas", function() {
    var Component, DomCanvas, Rectangle, Text;
    Component = (function() {
      function Component(x, y) {
        this.element = $("<div></div>");
        this.element.css({
          position: "absolute"
        });
        this.options = {};
        this.attr({
          x: x,
          y: y
        });
      }

      Component.prototype.attr = function(options) {
        this.options = _.extend(this.options, options);
        this.x = this.options.x;
        this.y = this.options.y;
        this.element.css({
          left: this.options.x,
          top: this.options.y
        });
        return this;
      };

      Component.prototype.collidesWith = function(component) {
        var callback, _i, _len, _ref, _results;
        if (!this.collidesEvent) {
          return;
        }
        _ref = this.collidesEvent;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          callback = _ref[_i];
          _results.push(callback.bind(this)(component));
        }
        return _results;
      };

      Component.prototype.collision = function(callback) {
        this.collidesEvent = this.collidesEvent || [];
        this.collisionCheck = true;
        this.collidesEvent.push(callback);
        return this;
      };

      return Component;

    })();
    Rectangle = (function(_super) {
      __extends(Rectangle, _super);

      function Rectangle(x, y, width, height) {
        this.width = width;
        this.height = height;
        Rectangle.__super__.constructor.call(this, x, y);
        this.element.css({
          width: this.width,
          height: this.height
        });
      }

      Rectangle.prototype.intersects = function(x, y, width, height) {
        return (this.x + this.width > x && x < this.x + this.width) && (this.y + this.height > y && y < this.height + this.y);
      };

      Rectangle.prototype.attr = function(options) {
        Rectangle.__super__.attr.call(this, options);
        return this;
      };

      return Rectangle;

    })(Component);
    Text = (function(_super) {
      __extends(Text, _super);

      function Text(text, x, y) {
        Text.__super__.constructor.call(this, x, y);
        this.element.html(text);
        this.element.css("word-wrap", "break-word");
        this.element.css("overflow", "hidden");
        return this;
      }

      return Text;

    })(Component);
    return DomCanvas = (function() {
      function DomCanvas(element) {
        this.element = element;
        this.components = [];
        this.element.css("position", "relative");
      }

      DomCanvas.prototype.addComponent = function(component) {
        this.components.push(component);
        return this.element.append(component.element);
      };

      DomCanvas.prototype.collisions = function() {
        var collides, collision, collisionCheck, collisions, component, test, _i, _j, _k, _len, _len1, _len2, _ref;
        collisionCheck = function(component) {
          return component.width && component.height && component.collisionCheck;
        };
        collides = function(component, test) {
          return test !== component && (test.x + test.width > component.x && test.x < component.x + component.width) && (test.y + test.height > component.y && test.y < component.height + component.y);
        };
        collisions = [];
        _ref = this.components;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          component = _ref[_i];
          if (!(collisionCheck(component))) {
            continue;
          }
          collision = (function() {
            var _j, _len1, _ref1, _results;
            _ref1 = this.components;
            _results = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              test = _ref1[_j];
              if (collisionCheck(test) && collides(component, test)) {
                _results.push(test);
              }
            }
            return _results;
          }).call(this);
          if (collision.length > 0) {
            collisions.push(collision);
          }
        }
        for (_j = 0, _len1 = collisions.length; _j < _len1; _j++) {
          collision = collisions[_j];
          for (_k = 0, _len2 = collision.length; _k < _len2; _k++) {
            component = collision[_k];
            component.collidesWith(_.without(collision, component));
          }
        }
        return collisions;
      };

      DomCanvas.prototype.rectangle = function(x, y, width, height) {
        var rectangle;
        rectangle = new Rectangle(x, y, width, height);
        this.addComponent(rectangle);
        return rectangle;
      };

      DomCanvas.prototype.text = function(text, x, y) {
        text = new Text(text, x, y);
        this.addComponent(text);
        return text;
      };

      DomCanvas.prototype.remove = function(component) {
        component.element.remove();
        return this.components = _.without(this.components, component);
      };

      DomCanvas.prototype.clear = function() {
        this.components = [];
        return this.element.html('');
      };

      return DomCanvas;

    })();
  }).factory("Timeline", [
    "ArticleStorage", "$location", "$filter", "DomCanvas", function(ArticleStorage, $location, $filter, DomCanvas) {
      var Timeline;
      return Timeline = (function() {
        Timeline.prototype.dayDiff = function(first, second) {
          return (second - first) / (1000 * 60 * 60 * 24);
        };

        Timeline.prototype.hourDiff = function(first, second) {
          return (second - first) / (1000 * 60 * 60);
        };

        function Timeline(element, dataRetreiveFn) {
          var dX, dragging, sensitivity, startDragDay, startX, stepX, x, y, zoom,
            _this = this;
          this.dataRetreiveFn = dataRetreiveFn;
          this.width = element.width();
          this.dayOffset = Math.round(this.width / 15);
          this.height = 200;
          x = 0;
          y = 0;
          startX = 0;
          stepX = 0;
          dX = 0;
          dragging = false;
          sensitivity = 10;
          zoom = 5;
          this.start = new Date();
          startDragDay = null;
          this.hourPaths = [];
          element.css("background", "#fff");
          element.css("height", this.height);
          this.draw = new DomCanvas(element);
          element.mousedown(function(e) {
            dragging = true;
            startX = e.pageX;
            startDragDay = _this.start;
            stepX = 0;
          });
          element.mousemove(function(e) {
            var step;
            if (dragging) {
              dX = startX - e.pageX;
              if (dX % sensitivity !== 0) {
                return;
              }
              step = dX > 0 ? 1 : -1;
              _this.start = new Date(_this.start.getFullYear(), _this.start.getMonth(), _this.start.getDate() + step);
              _this.end = new Date(_this.start.getFullYear(), _this.start.getMonth(), _this.start.getDate() + _this.width / _this.dayOffset);
              if (_this.dateChangedFn) {
                _this.dateChangedFn(_this.start, _this.end);
              }
              _this.drawLabels();
              _this.clearData();
            }
          });
          element.mouseup(function(e) {
            dragging = false;
            if (startDragDay !== _this.start) {
              _this.drawData();
            }
          });
          element.bind("mousewheel", function(e, delta) {
            zoom = delta > 0 ? 5 : -5;
            _this.dayOffset += zoom;
            _this.draw.clear();
            _this.drawBackground();
            _this.drawLabels();
            _this.drawData();
            e.preventDefault();
          });
        }

        Timeline.prototype.drawBackground = function() {
          var line;
          line = this.draw.rectangle(0, this.height - 30, this.width, 1);
          line.element.addClass("separator");
        };

        Timeline.prototype.drawLabels = function() {
          var date, hourOffset, label, prevDate, x, _i, _j, _len, _ref, _ref1, _ref2;
          hourOffset = this.dayOffset / 24;
          date = this.start;
          this.labels = this.labels || [];
          _ref = this.labels;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            label = _ref[_i];
            this.draw.remove(label);
          }
          this.labels = [];
          for (x = _j = 0, _ref1 = this.width, _ref2 = this.dayOffset; _ref2 > 0 ? _j <= _ref1 : _j >= _ref1; x = _j += _ref2) {
            prevDate = date;
            date = new Date(this.start.getFullYear(), this.start.getMonth(), this.start.getDate() + x / this.dayOffset);
            if (prevDate.getMonth() < date.getMonth()) {
              label = $filter('date')(date, "MMM");
              this.labels.push(this.draw.text(label, x - this.dayOffset / 2, this.height - 10));
            }
            if (this.dayOffset > 40) {
              label = $filter('date')(date, "dd/M");
              this.labels.push(this.draw.text(label, x - this.dayOffset / 2, this.height - 20));
            }
          }
          return this.date;
        };

        Timeline.prototype.render = function(start) {
          this.drawBackground();
          this.start = start;
          this.end = new Date(this.start.getFullYear(), this.start.getMonth(), this.start.getDate() + this.width / this.dayOffset);
          this.drawLabels();
          return this.drawData();
        };

        Timeline.prototype.clearData = function() {
          var item, _i, _len, _ref;
          this.items = this.items || [];
          _ref = this.items;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            this.draw.remove(item);
            this.draw.remove(item.line);
          }
          this.items = [];
        };

        Timeline.prototype.calculatePosition = function(x, y, width, height, items) {
          var item, _i, _len;
          for (_i = 0, _len = items.length; _i < _len; _i++) {
            item = items[_i];
            while (item.intersects(x, y, width, height)) {
              y = item.y + height + 20;
            }
          }
          return {
            x: x,
            y: y,
            width: width,
            height: height
          };
        };

        Timeline.prototype.dateChanged = function(fn) {
          return this.dateChangedFn = fn;
        };

        Timeline.prototype.drawData = function() {
          var hourOffset,
            _this = this;
          hourOffset = this.dayOffset / 24;
          return this.dataRetreiveFn(this.start, this.end).then(function(items) {
            var article, datestring, diff, item, line, p, startX, width, _i, _len;
            _this.clearData();
            for (_i = 0, _len = items.length; _i < _len; _i++) {
              item = items[_i];
              diff = Math.round(_this.hourDiff(_this.start, item.publishdate));
              startX = Math.round((diff * hourOffset) - hourOffset);
              datestring = $filter('date')(item.publishdate, 'yyyy-M-d');
              width = _this.dayOffset;
              p = _this.calculatePosition(startX - (width / 2), 10, width, 25, _this.items);
              line = _this.draw.rectangle(p.x + width / 2, p.y, hourOffset / 2, _this.height - p.y - 30);
              line.element.addClass("line");
              article = _this.draw.rectangle(p.x, p.y, p.width, p.height);
              article.element.html("<a href=\"#/plan/" + item._id + "\">" + item.title + "</a>");
              article.element.addClass("item");
              article._id = item._id;
              article.line = line;
              _this.items.push(article);
            }
          });
        };

        return Timeline;

      })();
    }
  ]).directive("timelineCanvas", [
    "ArticleStorage", "$location", "Timeline", function(ArticleStorage, $location, Timeline) {
      return {
        restrict: "AE",
        scope: {
          data: "=",
          start: "=",
          end: "="
        },
        link: function(scope, element, attrs) {
          var changeDate, timeline;
          timeline = new Timeline(element, scope.data);
          timeline.render(scope.start);
          changeDate = function() {
            timeline.start = scope.start;
            if (scope.end) {
              timeline.end = scope.end;
              timeline.dayOffset = timeline.width / timeline.dayDiff(timeline.start, timeline.end);
            }
            timeline.drawLabels();
            timeline.clearData();
            return timeline.drawData();
          };
          timeline.dateChanged(function(start, end) {
            scope.start = start;
            return scope.end = end;
          });
          ArticleStorage.on("changed", function() {
            return changeDate();
          });
          scope.$watch("start", changeDate);
          scope.$watch("end", changeDate);
        }
      };
    }
  ]).directive("timeline", [
    "ArticleStorage", "$location", "Timeline", function(ArticleStorage, $location, Timeline) {
      return {
        restrict: "AE",
        templateUrl: "bundles/timeline/timeline.html",
        scope: {
          storage: "=",
          query: "="
        },
        controller: function($scope) {
          $scope.startdate = new Date();
          $scope.getData = function(startDate, endDate) {
            return ArticleStorage.query({
              q: {
                $and: [
                  {
                    publishdate: {
                      $gte: startDate
                    }
                  }, {
                    publishdate: {
                      $lte: endDate
                    }
                  }
                ]
              }
            }).then(function(data) {
              return data.toArray();
            });
          };
        }
      };
    }
  ]);

}).call(this);
