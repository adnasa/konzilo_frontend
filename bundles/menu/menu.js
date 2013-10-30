(function() {
  angular.module("konzilo.menu", ["konzilo.translations"]).provider("konziloMenu", function() {
    var KonziloMenu, menus;
    menus = {};
    KonziloMenu = (function() {
      function KonziloMenu(name, parent) {
        this.name = name;
        this.parent = parent;
        this.items = [];
      }

      KonziloMenu.prototype.setInjector = function(injector) {
        return this.injector = injector;
      };

      KonziloMenu.prototype.setQ = function(q) {
        return this.q = q;
      };

      KonziloMenu.prototype.checkItem = function(item) {
        var promise,
          _this = this;
        if (!item.access) {
          promise = this.q.when(item);
        } else {
          promise = this.injector.invoke(item.access);
        }
        return promise.then(function() {
          return item;
        });
      };

      KonziloMenu.prototype.setOrder = function(order) {
        this.order = order;
      };

      KonziloMenu.prototype.addItem = function(path, label, accessFn) {
        var item, newItem, options;
        if (_.isPlainObject(path)) {
          options = path;
          path = options.path;
          accessFn = label;
          label = options.label;
        }
        newItem = function(path, label, accessFn) {
          return {
            path: path,
            label: label,
            icon: options != null ? options.icon : void 0,
            access: accessFn,
            items: [],
            addItem: function(path, label, accessFn) {
              var item;
              item = newItem(path, label, accessFn);
              return this.items.push(item);
            }
          };
        };
        item = newItem(path, label, accessFn);
        this.items.push(item);
        return item;
      };

      KonziloMenu.prototype.children = function(index) {
        var child, _i, _len, _ref, _results;
        if (this.items[index]) {
          _ref = this.items[index].items;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            child = _ref[_i];
            _results.push(this.checkItem(child));
          }
          return _results;
        }
      };

      KonziloMenu.prototype.getItems = function() {
        var item, items, _i, _len, _results,
          _this = this;
        if (this.order) {
          items = _.sortBy(this.items, function(item) {
            return _this.order.indexOf(item.path);
          });
        } else {
          items = this.items;
        }
        _results = [];
        for (_i = 0, _len = items.length; _i < _len; _i++) {
          item = items[_i];
          _results.push(this.checkItem(item));
        }
        return _results;
      };

      return KonziloMenu;

    })();
    return {
      addMenu: function(name) {
        menus[name] = new KonziloMenu(name);
        return menus[name];
      },
      $get: function($injector, $q) {
        return function(name) {
          menus[name].setInjector($injector);
          menus[name].setQ($q);
          return menus[name];
        };
      }
    };
  }).directive("konziloMenu", [
    "konziloMenu", "loadTemplate", "$compile", "$q", "UserState", "$location", function(konziloMenu, loadTemplate, $compile, $q, UserState, $location) {
      return {
        restrict: "AE",
        replace: true,
        templateUrl: "bundles/menu/menu.html",
        scope: {
          parent: "="
        },
        link: function(scope, element, attrs) {
          var items, menu;
          menu = null;
          if (scope.parent) {
            items = scope.parent.items;
          } else if (attrs.menu) {
            menu = konziloMenu(attrs.menu);
            items = menu != null ? menu.getItems() : void 0;
          } else {
            return;
          }
          scope.active = function(item) {
            var path;
            if (!(item != null ? item.path : void 0)) {
              return "";
            }
            path = item.path[0] === "#" ? item.path.substring(1, item.path.length - 1) : item.path;
            if ($location.absUrl().indexOf(path) >= 0) {
              return "active";
            }
            return "";
          };
          UserState.infoSaved(function() {
            return scope.items = menu != null ? menu.getItems() : void 0;
          });
          scope.menu = menu;
          return scope.items = items;
        },
        controller: function($scope, $attrs) {}
      };
    }
  ]);

}).call(this);
