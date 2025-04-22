/*!
 * chartjs-plugin-dragdata v2.3.1
 * https://github.com/artus9033/chartjs-plugin-dragdata.git
 * (c) 2018-2025 chartjs-plugin-dragdata contributors
 * Released under the MIT license
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('chart.js'), require('chart.js/helpers')) :
  typeof define === 'function' && define.amd ? define(['exports', 'chart.js', 'chart.js/helpers'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ChartJSDragDataPlugin = {}, global.Chart, global.Chart.helpers));
})(this, (function (exports, chart_js, helpers) { 'use strict';

  var noop = {value: () => {}};

  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }

  function Dispatch(_) {
    this._ = _;
  }

  function parseTypenames$1(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {type: t, name: name};
    });
  }

  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._,
          T = parseTypenames$1(typename + "", _),
          t,
          i = -1,
          n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
      }

      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };

  function get(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }

  function set(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({name: name, value: callback});
    return type;
  }

  var xhtml = "http://www.w3.org/1999/xhtml";

  var namespaces = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  function namespace(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
  }

  function creatorInherit(name) {
    return function() {
      var document = this.ownerDocument,
          uri = this.namespaceURI;
      return uri === xhtml && document.documentElement.namespaceURI === xhtml
          ? document.createElement(name)
          : document.createElementNS(uri, name);
    };
  }

  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator(name) {
    var fullname = namespace(name);
    return (fullname.local
        ? creatorFixed
        : creatorInherit)(fullname);
  }

  function none() {}

  function selector(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  function selection_select(select) {
    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  // Given something array like (or null), returns something that is strictly an
  // array. This is used to ensure that array-like objects passed to d3.selectAll
  // or selection.selectAll are converted into proper arrays when creating a
  // selection; we don’t ever want to create a selection backed by a live
  // HTMLCollection or NodeList. However, note that selection.selectAll will use a
  // static NodeList as a group, since it safely derived from querySelectorAll.
  function array(x) {
    return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
  }

  function empty() {
    return [];
  }

  function selectorAll(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  function arrayAll(select) {
    return function() {
      return array(select.apply(this, arguments));
    };
  }

  function selection_selectAll(select) {
    if (typeof select === "function") select = arrayAll(select);
    else select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection(subgroups, parents);
  }

  function matcher(selector) {
    return function() {
      return this.matches(selector);
    };
  }

  function childMatcher(selector) {
    return function(node) {
      return node.matches(selector);
    };
  }

  var find = Array.prototype.find;

  function childFind(match) {
    return function() {
      return find.call(this.children, match);
    };
  }

  function childFirst() {
    return this.firstElementChild;
  }

  function selection_selectChild(match) {
    return this.select(match == null ? childFirst
        : childFind(typeof match === "function" ? match : childMatcher(match)));
  }

  var filter = Array.prototype.filter;

  function children() {
    return Array.from(this.children);
  }

  function childrenFilter(match) {
    return function() {
      return filter.call(this.children, match);
    };
  }

  function selection_selectChildren(match) {
    return this.selectAll(match == null ? children
        : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
  }

  function selection_filter(match) {
    if (typeof match !== "function") match = matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function sparse(update) {
    return new Array(update.length);
  }

  function selection_enter() {
    return new Selection(this._enter || this._groups.map(sparse), this._parents);
  }

  function EnterNode(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
    insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
    querySelector: function(selector) { return this._parent.querySelector(selector); },
    querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
  };

  function constant$1(x) {
    return function() {
      return x;
    };
  }

  function bindIndex(parent, group, enter, update, exit, data) {
    var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey(parent, group, enter, update, exit, data, key) {
    var i,
        node,
        nodeByKeyValue = new Map,
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
        if (nodeByKeyValue.has(keyValue)) {
          exit[i] = node;
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = key.call(parent, data[i], i, data) + "";
      if (node = nodeByKeyValue.get(keyValue)) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue.delete(keyValue);
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
        exit[i] = node;
      }
    }
  }

  function datum(node) {
    return node.__data__;
  }

  function selection_data(value, key) {
    if (!arguments.length) return Array.from(this, datum);

    var bind = key ? bindKey : bindIndex,
        parents = this._parents,
        groups = this._groups;

    if (typeof value !== "function") value = constant$1(value);

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
          dataLength = data.length,
          enterGroup = enter[j] = new Array(dataLength),
          updateGroup = update[j] = new Array(dataLength),
          exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null;
        }
      }
    }

    update = new Selection(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  // Given some data, this returns an array-like view of it: an object that
  // exposes a length property and allows numeric indexing. Note that unlike
  // selectAll, this isn’t worried about “live” collections because the resulting
  // array will only be used briefly while data is being bound. (It is possible to
  // cause the data to change while iterating by using a key function, but please
  // don’t; we’d rather avoid a gratuitous copy.)
  function arraylike(data) {
    return typeof data === "object" && "length" in data
      ? data // Array, TypedArray, NodeList, array-like
      : Array.from(data); // Map, Set, iterable, string, or anything else
  }

  function selection_exit() {
    return new Selection(this._exit || this._groups.map(sparse), this._parents);
  }

  function selection_join(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    if (typeof onenter === "function") {
      enter = onenter(enter);
      if (enter) enter = enter.selection();
    } else {
      enter = enter.append(onenter + "");
    }
    if (onupdate != null) {
      update = onupdate(update);
      if (update) update = update.selection();
    }
    if (onexit == null) exit.remove(); else onexit(exit);
    return enter && update ? enter.merge(update).order() : update;
  }

  function selection_merge(context) {
    var selection = context.selection ? context.selection() : context;

    for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection(merges, this._parents);
  }

  function selection_order() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort(compare) {
    if (!compare) compare = ascending;

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection(sortgroups, this._parents).order();
  }

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes() {
    return Array.from(this);
  }

  function selection_node() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }

    return null;
  }

  function selection_size() {
    let size = 0;
    for (const node of this) ++size; // eslint-disable-line no-unused-vars
    return size;
  }

  function selection_empty() {
    return !this.node();
  }

  function selection_each(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }

    return this;
  }

  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }

  function attrFunctionNS(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }

  function selection_attr(name, value) {
    var fullname = namespace(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
    }

    return this.each((value == null
        ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
        ? (fullname.local ? attrFunctionNS : attrFunction)
        : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
  }

  function defaultView(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView; // node is a Document
  }

  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }

  function selection_style(name, value, priority) {
    return arguments.length > 1
        ? this.each((value == null
              ? styleRemove : typeof value === "function"
              ? styleFunction
              : styleConstant)(name, value, priority == null ? "" : priority))
        : styleValue(this.node(), name);
  }

  function styleValue(node, name) {
    return node.style.getPropertyValue(name)
        || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }

  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }

  function propertyFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }

  function selection_property(name, value) {
    return arguments.length > 1
        ? this.each((value == null
            ? propertyRemove : typeof value === "function"
            ? propertyFunction
            : propertyConstant)(name, value))
        : this.node()[name];
  }

  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList(node) {
    return node.classList || new ClassList(node);
  }

  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }

  ClassList.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };

  function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }

  function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }

  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }

  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }

  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }

  function selection_classed(name, value) {
    var names = classArray(name + "");

    if (arguments.length < 2) {
      var list = classList(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction : value
        ? classedTrue
        : classedFalse)(names, value));
  }

  function textRemove() {
    this.textContent = "";
  }

  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }

  function selection_text(value) {
    return arguments.length
        ? this.each(value == null
            ? textRemove : (typeof value === "function"
            ? textFunction
            : textConstant)(value))
        : this.node().textContent;
  }

  function htmlRemove() {
    this.innerHTML = "";
  }

  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }

  function htmlFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }

  function selection_html(value) {
    return arguments.length
        ? this.each(value == null
            ? htmlRemove : (typeof value === "function"
            ? htmlFunction
            : htmlConstant)(value))
        : this.node().innerHTML;
  }

  function raise() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }

  function selection_raise() {
    return this.each(raise);
  }

  function lower() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }

  function selection_lower() {
    return this.each(lower);
  }

  function selection_append(name) {
    var create = typeof name === "function" ? name : creator(name);
    return this.select(function() {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull() {
    return null;
  }

  function selection_insert(name, before) {
    var create = typeof name === "function" ? name : creator(name),
        select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
    return this.select(function() {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }

  function selection_remove() {
    return this.each(remove);
  }

  function selection_cloneShallow() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_cloneDeep() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_clone(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  function selection_datum(value) {
    return arguments.length
        ? this.property("__data__", value)
        : this.node().__data__;
  }

  function contextListener(listener) {
    return function(event) {
      listener.call(this, event, this.__data__);
    };
  }

  function parseTypenames(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return {type: t, name: name};
    });
  }

  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }

  function onAdd(typename, value, options) {
    return function() {
      var on = this.__on, o, listener = contextListener(value);
      if (on) for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, o.listener = listener, o.options = options);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, options);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }

  function selection_on(typename, value, options) {
    var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }

    on = value ? onAdd : onRemove;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
    return this;
  }

  function dispatchEvent(node, type, params) {
    var window = defaultView(node),
        event = window.CustomEvent;

    if (typeof event === "function") {
      event = new event(type, params);
    } else {
      event = window.document.createEvent("Event");
      if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type, false, false);
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant(type, params) {
    return function() {
      return dispatchEvent(this, type, params);
    };
  }

  function dispatchFunction(type, params) {
    return function() {
      return dispatchEvent(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch(type, params) {
    return this.each((typeof params === "function"
        ? dispatchFunction
        : dispatchConstant)(type, params));
  }

  function* selection_iterator() {
    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) yield node;
      }
    }
  }

  var root = [null];

  function Selection(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection_selection() {
    return this;
  }

  Selection.prototype = {
    constructor: Selection,
    select: selection_select,
    selectAll: selection_selectAll,
    selectChild: selection_selectChild,
    selectChildren: selection_selectChildren,
    filter: selection_filter,
    data: selection_data,
    enter: selection_enter,
    exit: selection_exit,
    join: selection_join,
    merge: selection_merge,
    selection: selection_selection,
    order: selection_order,
    sort: selection_sort,
    call: selection_call,
    nodes: selection_nodes,
    node: selection_node,
    size: selection_size,
    empty: selection_empty,
    each: selection_each,
    attr: selection_attr,
    style: selection_style,
    property: selection_property,
    classed: selection_classed,
    text: selection_text,
    html: selection_html,
    raise: selection_raise,
    lower: selection_lower,
    append: selection_append,
    insert: selection_insert,
    remove: selection_remove,
    clone: selection_clone,
    datum: selection_datum,
    on: selection_on,
    dispatch: selection_dispatch,
    [Symbol.iterator]: selection_iterator
  };

  function select(selector) {
    return typeof selector === "string"
        ? new Selection([[document.querySelector(selector)]], [document.documentElement])
        : new Selection([[selector]], root);
  }

  function sourceEvent(event) {
    let sourceEvent;
    while (sourceEvent = event.sourceEvent) event = sourceEvent;
    return event;
  }

  function pointer(event, node) {
    event = sourceEvent(event);
    if (node === undefined) node = event.currentTarget;
    if (node) {
      var svg = node.ownerSVGElement || node;
      if (svg.createSVGPoint) {
        var point = svg.createSVGPoint();
        point.x = event.clientX, point.y = event.clientY;
        point = point.matrixTransform(node.getScreenCTM().inverse());
        return [point.x, point.y];
      }
      if (node.getBoundingClientRect) {
        var rect = node.getBoundingClientRect();
        return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
      }
    }
    return [event.pageX, event.pageY];
  }

  // These are typically used in conjunction with noevent to ensure that we can
  // preventDefault on the event.
  const nonpassive = {passive: false};
  const nonpassivecapture = {capture: true, passive: false};

  function nopropagation(event) {
    event.stopImmediatePropagation();
  }

  function noevent(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function nodrag(view) {
    var root = view.document.documentElement,
        selection = select(view).on("dragstart.drag", noevent, nonpassivecapture);
    if ("onselectstart" in root) {
      selection.on("selectstart.drag", noevent, nonpassivecapture);
    } else {
      root.__noselect = root.style.MozUserSelect;
      root.style.MozUserSelect = "none";
    }
  }

  function yesdrag(view, noclick) {
    var root = view.document.documentElement,
        selection = select(view).on("dragstart.drag", null);
    if (noclick) {
      selection.on("click.drag", noevent, nonpassivecapture);
      setTimeout(function() { selection.on("click.drag", null); }, 0);
    }
    if ("onselectstart" in root) {
      selection.on("selectstart.drag", null);
    } else {
      root.style.MozUserSelect = root.__noselect;
      delete root.__noselect;
    }
  }

  var constant = x => () => x;

  function DragEvent(type, {
    sourceEvent,
    subject,
    target,
    identifier,
    active,
    x, y, dx, dy,
    dispatch
  }) {
    Object.defineProperties(this, {
      type: {value: type, enumerable: true, configurable: true},
      sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
      subject: {value: subject, enumerable: true, configurable: true},
      target: {value: target, enumerable: true, configurable: true},
      identifier: {value: identifier, enumerable: true, configurable: true},
      active: {value: active, enumerable: true, configurable: true},
      x: {value: x, enumerable: true, configurable: true},
      y: {value: y, enumerable: true, configurable: true},
      dx: {value: dx, enumerable: true, configurable: true},
      dy: {value: dy, enumerable: true, configurable: true},
      _: {value: dispatch}
    });
  }

  DragEvent.prototype.on = function() {
    var value = this._.on.apply(this._, arguments);
    return value === this._ ? this : value;
  };

  // Ignore right-click, since that should open the context menu.
  function defaultFilter(event) {
    return !event.ctrlKey && !event.button;
  }

  function defaultContainer() {
    return this.parentNode;
  }

  function defaultSubject(event, d) {
    return d == null ? {x: event.x, y: event.y} : d;
  }

  function defaultTouchable() {
    return navigator.maxTouchPoints || ("ontouchstart" in this);
  }

  function drag() {
    var filter = defaultFilter,
        container = defaultContainer,
        subject = defaultSubject,
        touchable = defaultTouchable,
        gestures = {},
        listeners = dispatch("start", "drag", "end"),
        active = 0,
        mousedownx,
        mousedowny,
        mousemoving,
        touchending,
        clickDistance2 = 0;

    function drag(selection) {
      selection
          .on("mousedown.drag", mousedowned)
        .filter(touchable)
          .on("touchstart.drag", touchstarted)
          .on("touchmove.drag", touchmoved, nonpassive)
          .on("touchend.drag touchcancel.drag", touchended)
          .style("touch-action", "none")
          .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
    }

    function mousedowned(event, d) {
      if (touchending || !filter.call(this, event, d)) return;
      var gesture = beforestart(this, container.call(this, event, d), event, d, "mouse");
      if (!gesture) return;
      select(event.view)
        .on("mousemove.drag", mousemoved, nonpassivecapture)
        .on("mouseup.drag", mouseupped, nonpassivecapture);
      nodrag(event.view);
      nopropagation(event);
      mousemoving = false;
      mousedownx = event.clientX;
      mousedowny = event.clientY;
      gesture("start", event);
    }

    function mousemoved(event) {
      noevent(event);
      if (!mousemoving) {
        var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
        mousemoving = dx * dx + dy * dy > clickDistance2;
      }
      gestures.mouse("drag", event);
    }

    function mouseupped(event) {
      select(event.view).on("mousemove.drag mouseup.drag", null);
      yesdrag(event.view, mousemoving);
      noevent(event);
      gestures.mouse("end", event);
    }

    function touchstarted(event, d) {
      if (!filter.call(this, event, d)) return;
      var touches = event.changedTouches,
          c = container.call(this, event, d),
          n = touches.length, i, gesture;

      for (i = 0; i < n; ++i) {
        if (gesture = beforestart(this, c, event, d, touches[i].identifier, touches[i])) {
          nopropagation(event);
          gesture("start", event, touches[i]);
        }
      }
    }

    function touchmoved(event) {
      var touches = event.changedTouches,
          n = touches.length, i, gesture;

      for (i = 0; i < n; ++i) {
        if (gesture = gestures[touches[i].identifier]) {
          noevent(event);
          gesture("drag", event, touches[i]);
        }
      }
    }

    function touchended(event) {
      var touches = event.changedTouches,
          n = touches.length, i, gesture;

      if (touchending) clearTimeout(touchending);
      touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
      for (i = 0; i < n; ++i) {
        if (gesture = gestures[touches[i].identifier]) {
          nopropagation(event);
          gesture("end", event, touches[i]);
        }
      }
    }

    function beforestart(that, container, event, d, identifier, touch) {
      var dispatch = listeners.copy(),
          p = pointer(touch || event, container), dx, dy,
          s;

      if ((s = subject.call(that, new DragEvent("beforestart", {
          sourceEvent: event,
          target: drag,
          identifier,
          active,
          x: p[0],
          y: p[1],
          dx: 0,
          dy: 0,
          dispatch
        }), d)) == null) return;

      dx = s.x - p[0] || 0;
      dy = s.y - p[1] || 0;

      return function gesture(type, event, touch) {
        var p0 = p, n;
        switch (type) {
          case "start": gestures[identifier] = gesture, n = active++; break;
          case "end": delete gestures[identifier], --active; // falls through
          case "drag": p = pointer(touch || event, container), n = active; break;
        }
        dispatch.call(
          type,
          that,
          new DragEvent(type, {
            sourceEvent: event,
            subject: s,
            target: drag,
            identifier,
            active: n,
            x: p[0] + dx,
            y: p[1] + dy,
            dx: p[0] - p0[0],
            dy: p[1] - p0[1],
            dispatch
          }),
          d
        );
      };
    }

    drag.filter = function(_) {
      return arguments.length ? (filter = typeof _ === "function" ? _ : constant(!!_), drag) : filter;
    };

    drag.container = function(_) {
      return arguments.length ? (container = typeof _ === "function" ? _ : constant(_), drag) : container;
    };

    drag.subject = function(_) {
      return arguments.length ? (subject = typeof _ === "function" ? _ : constant(_), drag) : subject;
    };

    drag.touchable = function(_) {
      return arguments.length ? (touchable = typeof _ === "function" ? _ : constant(!!_), drag) : touchable;
    };

    drag.on = function() {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? drag : value;
    };

    drag.clickDistance = function(_) {
      return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
    };

    return drag;
  }

  function roundValue(value, pos) {
      if (pos === undefined || isNaN(pos) || pos < 0)
          return value;
      return Math.round(value * Math.pow(10, pos)) / Math.pow(10, pos);
  }

  /**
   * Clips a value between a minimum and maximum value.
   * @param value the value to be clipped
   * @param min the minimum value
   * @param max the maximum value
   * @returns value in range [min, max]
   */
  function clipValue(value, min, max) {
      return Math.min(Math.max(value, min), max);
  }

  function calcRadialLinear(event, chartInstance, curIndex, rAxisID, state) {
      var _a, _b, _c;
      if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
      var _d = helpers.getRelativePosition(event, chartInstance), cursorX = _d.x, cursorY = _d.y;
      var rScale = chartInstance.scales[rAxisID];
      var axisAngleRad = rScale.getPointPositionForValue(
      // the radar chart has points draggable along primary axes that are aligned with
      // scales' lines; the polarArea chart, however, is draggable along lines placed in the center
      // between major lines, thus the +0.5 of index is added for the helper to calculate the angle
      // of this center guide line (the helper accept a continuous argument, in spite of the name "index")
      curIndex + ((state === null || state === void 0 ? void 0 : state.type) === "polarArea" ? 0.5 : 0), chartInstance.scales[rAxisID].max).angle;
      var xCenter = rScale.xCenter, yCenter = rScale.yCenter;
      // we calculate the dot product of the vector from center to cursor & the axis direction vector
      // center-to-cursor vector v
      var vx = cursorX - xCenter;
      var vy = cursorY - yCenter;
      // axis direction vector d
      var dx = Math.cos(axisAngleRad);
      var dy = Math.sin(axisAngleRad);
      // dot product of v & d
      var dotProduct = vx * dx + vy * dy;
      var d = 
      // if dot product <= 0, then the point is on the opposite side of the center than the direction of the axis
      dotProduct > 0
          ? // Euclidean distance between cursor & center
              Math.sqrt(Math.pow(cursorX - xCenter, 2) + Math.pow(cursorY - yCenter, 2))
          : 0;
      // calculate the value from distance
      var v = rScale.getValueForDistanceFromCenter(d);
      // apply rounding
      v = roundValue(v, (_c = (_b = (_a = chartInstance.config.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData) === null || _c === void 0 ? void 0 : _c.round);
      v = clipValue(v, chartInstance.scales[rAxisID].min, chartInstance.scales[rAxisID].max);
      return v;
  }

  /******************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


  var __assign = function() {
      __assign = Object.assign || function __assign(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };

  function __spreadArray(to, from, pack) {
      if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
              if (!ar) ar = Array.prototype.slice.call(from, 0, i);
              ar[i] = from[i];
          }
      }
      return to.concat(ar || Array.prototype.slice.call(from));
  }

  typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
      var e = new Error(message);
      return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };

  function cloneDataPoint(source) {
      if (Array.isArray(source))
          return __spreadArray([], source, true);
      else if (typeof source === "object")
          return __assign({}, source);
      // below: typeof source === "number"
      return source;
  }

  function calcCartesian(event, chartInstance, data, _a, state) {
      var _b, _c, _d, _e, _f;
      var xAxisDraggingDisabled = _a.xAxisDraggingDisabled, yAxisDraggingDisabled = _a.yAxisDraggingDisabled;
      if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
      if (!state)
          return data;
      var dataPoint = cloneDataPoint(data);
      var _g = helpers.getRelativePosition(event, chartInstance), cursorX = _g.x, cursorY = _g.y;
      var x = chartInstance.scales[state.xAxisID].getValueForPixel(cursorX);
      var y = chartInstance.scales[state.yAxisID].getValueForPixel(cursorY);
      var rounding = (_d = (_c = (_b = chartInstance.config.options) === null || _b === void 0 ? void 0 : _b.plugins) === null || _c === void 0 ? void 0 : _c.dragData) === null || _d === void 0 ? void 0 : _d.round;
      x = roundValue(x, rounding);
      y = roundValue(y, rounding);
      x = clipValue(x, chartInstance.scales[state.xAxisID].min, chartInstance.scales[state.xAxisID].max);
      y = clipValue(y, chartInstance.scales[state.yAxisID].min, chartInstance.scales[state.yAxisID].max);
      if (state.floatingBar) {
          // x contains the new value for one end of the floating bar
          // dataPoint contains the old interval [left, right] of the floating bar
          // calculate difference between the new value and both sides
          // the side with the smallest difference from the new value was the one that was dragged
          // return an interval with new value on the dragged side and old value on the other side
          var newVal = void 0;
          // choose the right variable based on the orientation of the graph (vertical, horizontal)
          if (((_e = chartInstance.config.options) === null || _e === void 0 ? void 0 : _e.indexAxis) === "y") {
              newVal = x;
          }
          else {
              newVal = y;
          }
          var diffFromLeft = Math.abs(newVal - dataPoint[0]);
          var diffFromRight = Math.abs(newVal - dataPoint[1]);
          if (diffFromLeft <= diffFromRight) {
              dataPoint[0] = newVal;
          }
          else {
              dataPoint[1] = newVal;
          }
          return dataPoint;
      }
      if (dataPoint.x !== undefined && !xAxisDraggingDisabled) {
          dataPoint.x = x;
      }
      if (dataPoint.y !== undefined) {
          if (!yAxisDraggingDisabled) {
              dataPoint.y = y;
          }
          return dataPoint;
      }
      else {
          if (((_f = chartInstance.config.options) === null || _f === void 0 ? void 0 : _f.indexAxis) === "y") {
              if (!xAxisDraggingDisabled) {
                  return x;
              }
              else {
                  return dataPoint;
              }
          }
          else {
              if (!yAxisDraggingDisabled) {
                  return y;
              }
              else {
                  return dataPoint;
              }
          }
      }
  }

  /**
   * Updates values to the nearest values
   * @param chartInstance the chart instance
   * @param datasetIndex the dataset index
   * @param index the data point index
   * @returns value after applying magnet or unchanged if not magnet is configured
   */
  function applyMagnet(chartInstance, datasetIndex, index) {
      var _a, _b;
      var pluginOptions = (_b = (_a = chartInstance.config.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData;
      if (pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.magnet) {
          var magnet = pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.magnet;
          if (typeof magnet.to === "function") {
              var data = chartInstance.data.datasets[datasetIndex].data[index];
              data = magnet.to(data);
              chartInstance.data.datasets[datasetIndex].data[index] = data;
              chartInstance.update("none");
              return data;
          }
          return null;
      }
      else {
          return chartInstance.data.datasets[datasetIndex].data[index];
      }
  }

  function checkDraggingConfiguration(chartInstance, datasetIndex, dataPointIndex, state) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
      if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
      if (!state)
          return {
              chartDraggingDisabled: true,
              datasetDraggingDisabled: true,
              xAxisDraggingDisabled: true,
              yAxisDraggingDisabled: true,
              dataPointDraggingDisabled: true,
          };
      var dataset = chartInstance.data.datasets[datasetIndex];
      /** per-chart option */
      var chartDraggingDisabled = ((_b = (_a = chartInstance.config.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData) === false;
      /** per-dataset option */
      var datasetDraggingDisabled = chartDraggingDisabled || dataset.dragData === false;
      /** x-axis option (per-axis); dragging on the x-axis is disabled by default */
      var _xAxisDraggingPerAxisOptionValue = (_e = (_d = (_c = chartInstance.config.options) === null || _c === void 0 ? void 0 : _c.scales) === null || _d === void 0 ? void 0 : _d[state.xAxisID]) === null || _e === void 0 ? void 0 : _e.dragData;
      /** x-axis option (per-axis); dragging on the x-axis is disabled by default */
      var xAxisDraggingDisabled = true;
      if (!datasetDraggingDisabled &&
          (_xAxisDraggingPerAxisOptionValue === true || // finally, dragging can be enabled on the x-axis by the plugin options,
              // unless it's explicitly disabled in x-axis options
              (((_h = (_g = (_f = chartInstance.config.options) === null || _f === void 0 ? void 0 : _f.plugins) === null || _g === void 0 ? void 0 : _g.dragData) === null || _h === void 0 ? void 0 : _h.dragX) === true &&
                  _xAxisDraggingPerAxisOptionValue !== false))) {
          xAxisDraggingDisabled = false;
      }
      /** y-axis option (per-axis); dragging on the y-axis is enabled by default */
      var yAxisDraggingDisabled = datasetDraggingDisabled ||
          ((_l = (_k = (_j = chartInstance.config.options) === null || _j === void 0 ? void 0 : _j.plugins) === null || _k === void 0 ? void 0 : _k.dragData) === null || _l === void 0 ? void 0 : _l.dragY) === false ||
          ((_p = (_o = (_m = chartInstance.config.options) === null || _m === void 0 ? void 0 : _m.scales) === null || _o === void 0 ? void 0 : _o[state.yAxisID]) === null || _p === void 0 ? void 0 : _p.dragData) === false;
      /** per-data-point option */
      var dataPointDraggingDisabled = datasetDraggingDisabled ||
          ((_q = dataset.data[dataPointIndex]) === null || _q === void 0 ? void 0 : _q.dragData) ===
              false;
      return {
          chartDraggingDisabled: chartDraggingDisabled,
          datasetDraggingDisabled: datasetDraggingDisabled,
          xAxisDraggingDisabled: xAxisDraggingDisabled,
          yAxisDraggingDisabled: yAxisDraggingDisabled,
          dataPointDraggingDisabled: dataPointDraggingDisabled,
      };
  }

  function dragEndCallback(event, chartInstance, state) {
      var _a, _b, _c, _d, _e;
      if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
      if (!state)
          return;
      var callback = (_c = (_b = (_a = chartInstance.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData) === null || _c === void 0 ? void 0 : _c.onDragEnd;
      state.curIndex = undefined;
      state.isDragging = false;
      // re-enable the tooltip animation
      if ((_e = (_d = chartInstance.config.options) === null || _d === void 0 ? void 0 : _d.plugins) === null || _e === void 0 ? void 0 : _e.tooltip) {
          chartInstance.config.options.plugins.tooltip.animation =
              state.eventSettings;
          chartInstance.update("none");
      }
      if (typeof callback === "function" && state.element) {
          var datasetIndex = state.element.datasetIndex;
          var index = state.element.index;
          var value = applyMagnet(chartInstance, datasetIndex, index);
          return callback(event, datasetIndex, index, value);
      }
  }

  function getElement(event, chartInstance, state) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
      var _z, _0, _1;
      if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
      var callback = (_c = (_b = (_a = chartInstance.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData) === null || _c === void 0 ? void 0 : _c.onDragStart;
      if (!state)
          return;
      var searchMode = (_f = (_e = (_d = chartInstance.config.options) === null || _d === void 0 ? void 0 : _d.interaction) === null || _e === void 0 ? void 0 : _e.mode) !== null && _f !== void 0 ? _f : "nearest", searchOptions = (_h = (_g = chartInstance.config.options) === null || _g === void 0 ? void 0 : _g.interaction) !== null && _h !== void 0 ? _h : {
          intersect: true,
      };
      state.element = chartInstance.getElementsAtEventForMode(event, searchMode, searchOptions, false)[0];
      if (state.element) {
          var datasetIndex = state.element.datasetIndex;
          var index = state.element.index;
          // note: type may be absent if config is ChartConfigurationCustomTypesPerDataset, in which case we pull this value from the dataset
          state.type =
              (_k = (_j = chartInstance.config.type) !== null && _j !== void 0 ? _j : chartInstance.data.datasets[datasetIndex].type) !== null && _k !== void 0 ? _k : undefined;
          // save element settings
          state.eventSettings =
              (_o = (_m = (_l = chartInstance.config.options) === null || _l === void 0 ? void 0 : _l.plugins) === null || _m === void 0 ? void 0 : _m.tooltip) === null || _o === void 0 ? void 0 : _o.animation;
          var dataset = chartInstance.data.datasets[datasetIndex];
          var datasetMeta = chartInstance.getDatasetMeta(datasetIndex);
          var curValue = dataset.data[index];
          // get the id of the datasets scale
          state.xAxisID = datasetMeta.xAxisID;
          state.yAxisID = datasetMeta.yAxisID;
          state.rAxisID = datasetMeta.rAxisID;
          var draggingConfiguration = checkDraggingConfiguration(chartInstance, datasetIndex, index), datasetDraggingDisabled = draggingConfiguration.datasetDraggingDisabled, xAxisDraggingDisabled = draggingConfiguration.xAxisDraggingDisabled, yAxisDraggingDisabled = draggingConfiguration.yAxisDraggingDisabled, dataPointDraggingDisabled = draggingConfiguration.dataPointDraggingDisabled;
          // check if dragging the dataset or datapoint is prohibited
          if (datasetDraggingDisabled ||
              // dragging disabled on all scales
              (xAxisDraggingDisabled && yAxisDraggingDisabled) ||
              dataPointDraggingDisabled) {
              state.element = null;
              return;
          }
          if (state.type === "bar") {
              // note: stacked may be missing in RadialLinearScaleOptions
              state.stacked =
                  (_s = (_r = (_q = (_p = chartInstance.config.options) === null || _p === void 0 ? void 0 : _p.scales) === null || _q === void 0 ? void 0 : _q[state.xAxisID]) === null || _r === void 0 ? void 0 : _r.stacked) !== null && _s !== void 0 ? _s : undefined;
              // if a bar has a data point that is an array of length 2, it's a floating bar
              var samplePoint = chartInstance.data.datasets[0].data[0];
              state.floatingBar =
                  samplePoint !== null &&
                      Array.isArray(samplePoint) &&
                      samplePoint.length >= 2;
              var dataPoint = chartInstance.data.datasets[datasetIndex].data[index];
              var newPos = calcCartesian(event, chartInstance, dataPoint, draggingConfiguration, state);
              state.initValue = newPos - curValue;
          }
          // disable the tooltip animation
          var showTooltipOptionValue = (_v = (_u = (_t = chartInstance.config.options) === null || _t === void 0 ? void 0 : _t.plugins) === null || _u === void 0 ? void 0 : _u.dragData) === null || _v === void 0 ? void 0 : _v.showTooltip;
          if (showTooltipOptionValue === undefined ||
              showTooltipOptionValue === true) {
              (_w = (_z = chartInstance.config).options) !== null && _w !== void 0 ? _w : (_z.options = {});
              (_x = (_0 = chartInstance.config.options).plugins) !== null && _x !== void 0 ? _x : (_0.plugins = {});
              (_y = (_1 = chartInstance.config.options.plugins).tooltip) !== null && _y !== void 0 ? _y : (_1.tooltip = {});
              chartInstance.config.options.plugins.tooltip.animation = false;
          }
          if (typeof callback === "function" && state.element) {
              if (callback(event, datasetIndex, index, curValue) === false) {
                  state.element = null;
              }
          }
      }
  }

  function updateData(event, chartInstance, state) {
      var _a, _b;
      if (state === void 0) { state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id); }
      console.log("draga data run");
      if (!state)
          return;
      var pluginOptions = (_b = (_a = chartInstance.options) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.dragData;
      var callback = pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.onDrag;
      if (state.element) {
          state.curDatasetIndex = state.element.datasetIndex;
          state.curIndex = state.element.index;
          state.isDragging = true;
          var dataPoint = chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex];
          var draggingConfiguration = checkDraggingConfiguration(chartInstance, state.curDatasetIndex, state.curIndex);
          if (state.type === "radar" || state.type === "polarArea") {
              dataPoint = calcRadialLinear(event, chartInstance, state.curIndex, state.rAxisID, state);
          }
          else if (state.stacked) {
              var cursorPos = calcCartesian(event, chartInstance, dataPoint, draggingConfiguration, state);
              dataPoint = roundValue(cursorPos - state.initValue, pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.round);
          }
          else {
              dataPoint = calcCartesian(event, chartInstance, dataPoint, draggingConfiguration, state);
          }
          // ✅ Collision check for bubble charts in pixel space
          if (chartInstance.config.type === "bubble" &&
              typeof dataPoint === "object" &&
              "x" in dataPoint &&
              "y" in dataPoint &&
              "r" in dataPoint) {
              var collided = checkBubbleCollisionPixelSpace(chartInstance, state.curDatasetIndex, state.curIndex, dataPoint);
              if (collided) {
                  console.warn("🚫 Bubble collision detected. Drag blocked.");
                  // 👇 Cancel dragging state
                  state.isDragging = false;
                  state.element = null;
                  // 👇 Remove any active elements (visually unselect the point)
                  chartInstance.setActiveElements([]);
                  // 👇 Force an update to reflect UI change
                  chartInstance.update("none");
                  return;
              }
          }
          var allowed = typeof callback === "function"
              ? callback(event, state.curDatasetIndex, state.curIndex, dataPoint) !==
                  false
              : true;
          if (allowed) {
              chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex] =
                  dataPoint;
              chartInstance.update("none");
          }
      }
  }
  // ✅ Collision checker (pixel-based)
  function checkBubbleCollisionPixelSpace(chart, datasetIndex, pointIndex, newDataPoint) {
      var xScale = chart.scales["x"];
      var yScale = chart.scales["y"];
      var newX = xScale.getPixelForValue(newDataPoint.x);
      var newY = yScale.getPixelForValue(newDataPoint.y);
      var newR = newDataPoint.r;
      var finalDataset = chart.data.datasets;
      return finalDataset.some(function (dataset, i) {
          if (i === datasetIndex ||
              !chart.isDatasetVisible(i) ||
              dataset.type !== "bubble")
              return false;
          var points = dataset.data;
          return points.some(function (point) {
              var px = xScale.getPixelForValue(point.x);
              var py = yScale.getPixelForValue(point.y);
              var pr = point.r;
              var dx = newX - px;
              var dy = newY - py;
              var dist = Math.sqrt(dx * dx + dy * dy);
              return dist < newR + pr;
          });
      });
  }

  var ChartJSDragDataPlugin = {
      id: "dragdata",
      statesStore: new Map(),
      afterInit: function (chartInstance) {
          var state = {
              curIndex: undefined,
              curDatasetIndex: undefined,
              element: null,
              eventSettings: false,
              floatingBar: false,
              initValue: 0,
              xAxisID: "",
              yAxisID: "",
              rAxisID: "",
              stacked: false,
              type: undefined,
              isDragging: false,
          };
          ChartJSDragDataPlugin.statesStore.set(chartInstance.id, state);
          select(chartInstance.canvas).call(drag()
              .container(chartInstance.canvas)
              .on("start", function (e) {
              return getElement(e.sourceEvent, chartInstance, state);
          })
              .on("drag", function (e) { return updateData(e.sourceEvent, chartInstance, state); })
              .on("end", function (e) {
              return dragEndCallback(e.sourceEvent, chartInstance, state);
          }));
      },
      beforeEvent: function (chartInstance) {
          var _a;
          var state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id);
          if (state === null || state === void 0 ? void 0 : state.isDragging) {
              (_a = chartInstance.tooltip) === null || _a === void 0 ? void 0 : _a.update();
              return false;
          }
      },
      afterDestroy: function (chartInstance) {
          ChartJSDragDataPlugin.statesStore.delete(chartInstance.id);
      },
  };
  // TODO: in a future major release, stop auto-registering the plugin and require users to manually register it
  // see https://chartjs-plugin-datalabels.netlify.app/guide/getting-started.html#registration
  chart_js.Chart.register(ChartJSDragDataPlugin);

  exports.applyMagnet = applyMagnet;
  exports.calcCartesian = calcCartesian;
  exports.calcRadialLinear = calcRadialLinear;
  exports.checkDraggingConfiguration = checkDraggingConfiguration;
  exports.clipValue = clipValue;
  exports.cloneDataPoint = cloneDataPoint;
  exports.default = ChartJSDragDataPlugin;
  exports.dragEndCallback = dragEndCallback;
  exports.getElement = getElement;
  exports.roundValue = roundValue;
  exports.updateData = updateData;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
