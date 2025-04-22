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

  function cov_1qtznsj5cn(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/roundValue.ts";var hash="a4217fabe40e4d5c45c884e12a4048cb609b624b";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/roundValue.ts",statementMap:{"0":{start:{line:2,column:4},end:{line:3,column:21}},"1":{start:{line:3,column:8},end:{line:3,column:21}},"2":{start:{line:4,column:4},end:{line:4,column:69}}},fnMap:{"0":{name:"roundValue",decl:{start:{line:1,column:16},end:{line:1,column:26}},loc:{start:{line:1,column:39},end:{line:5,column:1}},line:1}},branchMap:{"0":{loc:{start:{line:2,column:4},end:{line:3,column:21}},type:"if",locations:[{start:{line:2,column:4},end:{line:3,column:21}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:2},"1":{loc:{start:{line:2,column:8},end:{line:2,column:50}},type:"binary-expr",locations:[{start:{line:2,column:8},end:{line:2,column:25}},{start:{line:2,column:29},end:{line:2,column:39}},{start:{line:2,column:43},end:{line:2,column:50}}],line:2}},s:{"0":0,"1":0,"2":0},f:{"0":0},b:{"0":[0,0],"1":[0,0,0]},inputSourceMap:{version:3,sources:["../../../src/util/roundValue.ts"],sourcesContent:["export function roundValue(value: number, pos: number | undefined) {\n\tif (pos === undefined || isNaN(pos) || pos < 0) return value;\n\n\treturn Math.round(value * Math.pow(10, pos)) / Math.pow(10, pos);\n}\n"],names:[],mappings:"AAAA,MAAM,UAAU,UAAU,CAAC,KAAa,EAAE,GAAuB;IAChE,IAAI,GAAG,KAAK,SAAS,IAAI,KAAK,CAAC,GAAG,CAAC,IAAI,GAAG,GAAG,CAAC;QAAE,OAAO,KAAK,CAAC;IAE7D,OAAO,IAAI,CAAC,KAAK,CAAC,KAAK,GAAG,IAAI,CAAC,GAAG,CAAC,EAAE,EAAE,GAAG,CAAC,CAAC,GAAG,IAAI,CAAC,GAAG,CAAC,EAAE,EAAE,GAAG,CAAC,CAAC;AAClE,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"a4217fabe40e4d5c45c884e12a4048cb609b624b"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_1qtznsj5cn=function(){return actualCoverage;};}return actualCoverage;}cov_1qtznsj5cn();function roundValue(value,pos){cov_1qtznsj5cn().f[0]++;cov_1qtznsj5cn().s[0]++;if((cov_1qtznsj5cn().b[1][0]++,pos===undefined)||(cov_1qtznsj5cn().b[1][1]++,isNaN(pos))||(cov_1qtznsj5cn().b[1][2]++,pos<0)){cov_1qtznsj5cn().b[0][0]++;cov_1qtznsj5cn().s[1]++;return value;}else {cov_1qtznsj5cn().b[0][1]++;}cov_1qtznsj5cn().s[2]++;return Math.round(value*Math.pow(10,pos))/Math.pow(10,pos);}

  function cov_9o641e5i0(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/calc/clipValue.ts";var hash="478d395caef8d265383cdd1c61ba3fc5aad1aa04";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/calc/clipValue.ts",statementMap:{"0":{start:{line:9,column:4},end:{line:9,column:47}}},fnMap:{"0":{name:"clipValue",decl:{start:{line:8,column:16},end:{line:8,column:25}},loc:{start:{line:8,column:43},end:{line:10,column:1}},line:8}},branchMap:{},s:{"0":0},f:{"0":0},b:{},inputSourceMap:{version:3,sources:["../../../../src/util/calc/clipValue.ts"],sourcesContent:["/**\n * Clips a value between a minimum and maximum value.\n * @param value the value to be clipped\n * @param min the minimum value\n * @param max the maximum value\n * @returns value in range [min, max]\n */\nexport function clipValue(value: number, min: number, max: number): number {\n\treturn Math.min(Math.max(value, min), max);\n}\n"],names:[],mappings:"AAAA;;;;;;GAMG;AACH,MAAM,UAAU,SAAS,CAAC,KAAa,EAAE,GAAW,EAAE,GAAW;IAChE,OAAO,IAAI,CAAC,GAAG,CAAC,IAAI,CAAC,GAAG,CAAC,KAAK,EAAE,GAAG,CAAC,EAAE,GAAG,CAAC,CAAC;AAC5C,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"478d395caef8d265383cdd1c61ba3fc5aad1aa04"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_9o641e5i0=function(){return actualCoverage;};}return actualCoverage;}cov_9o641e5i0();/**
   * Clips a value between a minimum and maximum value.
   * @param value the value to be clipped
   * @param min the minimum value
   * @param max the maximum value
   * @returns value in range [min, max]
   */function clipValue(value,min,max){cov_9o641e5i0().f[0]++;cov_9o641e5i0().s[0]++;return Math.min(Math.max(value,min),max);}

  function cov_5f9cdl8jv(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/calc/radialLinear.ts";var hash="db266bd7e0c33e6b2f1cbfa31318610554b81a62";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/calc/radialLinear.ts",statementMap:{"0":{start:{line:7,column:4},end:{line:7,column:94}},"1":{start:{line:7,column:28},end:{line:7,column:92}},"2":{start:{line:8,column:13},end:{line:8,column:54}},"3":{start:{line:8,column:66},end:{line:8,column:70}},"4":{start:{line:8,column:82},end:{line:8,column:86}},"5":{start:{line:9,column:17},end:{line:9,column:46}},"6":{start:{line:10,column:23},end:{line:15,column:143}},"7":{start:{line:16,column:18},end:{line:16,column:32}},"8":{start:{line:16,column:44},end:{line:16,column:58}},"9":{start:{line:19,column:13},end:{line:19,column:30}},"10":{start:{line:20,column:13},end:{line:20,column:30}},"11":{start:{line:22,column:13},end:{line:22,column:35}},"12":{start:{line:23,column:13},end:{line:23,column:35}},"13":{start:{line:25,column:21},end:{line:25,column:38}},"14":{start:{line:28,column:4},end:{line:31,column:11}},"15":{start:{line:33,column:12},end:{line:33,column:51}},"16":{start:{line:35,column:4},end:{line:35,column:216}},"17":{start:{line:36,column:4},end:{line:36,column:91}},"18":{start:{line:37,column:4},end:{line:37,column:13}}},fnMap:{"0":{name:"calcRadialLinear",decl:{start:{line:5,column:16},end:{line:5,column:32}},loc:{start:{line:5,column:81},end:{line:38,column:1}},line:5}},branchMap:{"0":{loc:{start:{line:7,column:4},end:{line:7,column:94}},type:"if",locations:[{start:{line:7,column:4},end:{line:7,column:94}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:7},"1":{loc:{start:{line:15,column:16},end:{line:15,column:100}},type:"cond-expr",locations:[{start:{line:15,column:93},end:{line:15,column:96}},{start:{line:15,column:99},end:{line:15,column:100}}],line:15},"2":{loc:{start:{line:15,column:17},end:{line:15,column:73}},type:"cond-expr",locations:[{start:{line:15,column:54},end:{line:15,column:60}},{start:{line:15,column:63},end:{line:15,column:73}}],line:15},"3":{loc:{start:{line:15,column:17},end:{line:15,column:51}},type:"binary-expr",locations:[{start:{line:15,column:17},end:{line:15,column:31}},{start:{line:15,column:35},end:{line:15,column:51}}],line:15},"4":{loc:{start:{line:28,column:4},end:{line:31,column:11}},type:"cond-expr",locations:[{start:{line:30,column:12},end:{line:30,column:86}},{start:{line:31,column:10},end:{line:31,column:11}}],line:28},"5":{loc:{start:{line:35,column:22},end:{line:35,column:214}},type:"cond-expr",locations:[{start:{line:35,column:197},end:{line:35,column:203}},{start:{line:35,column:206},end:{line:35,column:214}}],line:35},"6":{loc:{start:{line:35,column:22},end:{line:35,column:194}},type:"binary-expr",locations:[{start:{line:35,column:22},end:{line:35,column:177}},{start:{line:35,column:181},end:{line:35,column:194}}],line:35},"7":{loc:{start:{line:35,column:28},end:{line:35,column:167}},type:"cond-expr",locations:[{start:{line:35,column:147},end:{line:35,column:153}},{start:{line:35,column:156},end:{line:35,column:167}}],line:35},"8":{loc:{start:{line:35,column:28},end:{line:35,column:144}},type:"binary-expr",locations:[{start:{line:35,column:28},end:{line:35,column:127}},{start:{line:35,column:131},end:{line:35,column:144}}],line:35},"9":{loc:{start:{line:35,column:34},end:{line:35,column:117}},type:"cond-expr",locations:[{start:{line:35,column:98},end:{line:35,column:104}},{start:{line:35,column:107},end:{line:35,column:117}}],line:35},"10":{loc:{start:{line:35,column:34},end:{line:35,column:95}},type:"binary-expr",locations:[{start:{line:35,column:34},end:{line:35,column:78}},{start:{line:35,column:82},end:{line:35,column:95}}],line:35}},s:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0},f:{"0":0},b:{"0":[0,0],"1":[0,0],"2":[0,0],"3":[0,0],"4":[0,0],"5":[0,0],"6":[0,0],"7":[0,0],"8":[0,0],"9":[0,0],"10":[0,0]},inputSourceMap:{version:3,sources:["../../../../src/util/calc/radialLinear.ts"],sourcesContent:["import type { Chart, ChartType, RadialLinearScale } from \"chart.js\";\nimport { getRelativePosition } from \"chart.js/helpers\";\n\nimport ChartJSDragDataPlugin from \"../../plugin\";\nimport {\n\tDragDataEvent,\n\tDragDataState,\n\tOptionalPluginConfiguration,\n} from \"../../types\";\nimport { roundValue } from \"../roundValue\";\nimport { clipValue } from \"./clipValue\";\n\nexport function calcRadialLinear<TType extends ChartType>(\n\tevent: DragDataEvent,\n\tchartInstance: Chart<TType>,\n\tcurIndex: number,\n\trAxisID: string,\n\tstate: DragDataState | undefined = ChartJSDragDataPlugin.statesStore.get(\n\t\tchartInstance.id,\n\t),\n) {\n\tlet { x: cursorX, y: cursorY } = getRelativePosition(\n\t\tevent,\n\t\tchartInstance as any,\n\t);\n\tconst rScale = chartInstance.scales[rAxisID] as RadialLinearScale;\n\tlet { angle: axisAngleRad } = rScale.getPointPositionForValue(\n\t\t// the radar chart has points draggable along primary axes that are aligned with\n\t\t// scales' lines; the polarArea chart, however, is draggable along lines placed in the center\n\t\t// between major lines, thus the +0.5 of index is added for the helper to calculate the angle\n\t\t// of this center guide line (the helper accept a continuous argument, in spite of the name \"index\")\n\t\tcurIndex + (state?.type === \"polarArea\" ? 0.5 : 0),\n\t\tchartInstance.scales[rAxisID].max,\n\t);\n\tconst { xCenter, yCenter } = rScale;\n\n\t// we calculate the dot product of the vector from center to cursor & the axis direction vector\n\t// center-to-cursor vector v\n\tlet vx = cursorX - xCenter;\n\tlet vy = cursorY - yCenter;\n\t// axis direction vector d\n\tlet dx = Math.cos(axisAngleRad);\n\tlet dy = Math.sin(axisAngleRad);\n\t// dot product of v & d\n\tlet dotProduct = vx * dx + vy * dy;\n\tlet d =\n\t\t// if dot product <= 0, then the point is on the opposite side of the center than the direction of the axis\n\t\tdotProduct > 0\n\t\t\t? // Euclidean distance between cursor & center\n\t\t\t\tMath.sqrt(\n\t\t\t\t\tMath.pow(cursorX - xCenter, 2) + Math.pow(cursorY - yCenter, 2),\n\t\t\t\t)\n\t\t\t: 0;\n\n\t// calculate the value from distance\n\tlet v = rScale.getValueForDistanceFromCenter(d);\n\n\t// apply rounding\n\tv = roundValue(\n\t\tv,\n\t\t(\n\t\t\tchartInstance.config.options?.plugins\n\t\t\t\t?.dragData as OptionalPluginConfiguration<TType>\n\t\t)?.round,\n\t);\n\n\tv = clipValue(\n\t\tv,\n\t\tchartInstance.scales[rAxisID].min,\n\t\tchartInstance.scales[rAxisID].max,\n\t);\n\n\treturn v;\n}\n"],names:[],mappings:"AACA,OAAO,EAAE,mBAAmB,EAAE,MAAM,kBAAkB,CAAC;AAEvD,OAAO,qBAAqB,MAAM,cAAc,CAAC;AAMjD,OAAO,EAAE,UAAU,EAAE,MAAM,eAAe,CAAC;AAC3C,OAAO,EAAE,SAAS,EAAE,MAAM,aAAa,CAAC;AAExC,MAAM,UAAU,gBAAgB,CAC/B,KAAoB,EACpB,aAA2B,EAC3B,QAAgB,EAChB,OAAe,EACf,KAEC;;IAFD,sBAAA,EAAA,QAAmC,qBAAqB,CAAC,WAAW,CAAC,GAAG,CACvE,aAAa,CAAC,EAAE,CAChB;IAEG,IAAA,KAA6B,mBAAmB,CACnD,KAAK,EACL,aAAoB,CACpB,EAHQ,OAAO,OAAA,EAAK,OAAO,OAG3B,CAAC;IACF,IAAM,MAAM,GAAG,aAAa,CAAC,MAAM,CAAC,OAAO,CAAsB,CAAC;IAC5D,IAAO,YAAY,GAAK,MAAM,CAAC,wBAAwB;IAC5D,gFAAgF;IAChF,6FAA6F;IAC7F,6FAA6F;IAC7F,oGAAoG;IACpG,QAAQ,GAAG,CAAC,CAAA,KAAK,aAAL,KAAK,uBAAL,KAAK,CAAE,IAAI,MAAK,WAAW,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,EAClD,aAAa,CAAC,MAAM,CAAC,OAAO,CAAC,CAAC,GAAG,CACjC,MAPwB,CAOvB;IACM,IAAA,OAAO,GAAc,MAAM,QAApB,EAAE,OAAO,GAAK,MAAM,QAAX,CAAY;IAEpC,+FAA+F;IAC/F,4BAA4B;IAC5B,IAAI,EAAE,GAAG,OAAO,GAAG,OAAO,CAAC;IAC3B,IAAI,EAAE,GAAG,OAAO,GAAG,OAAO,CAAC;IAC3B,0BAA0B;IAC1B,IAAI,EAAE,GAAG,IAAI,CAAC,GAAG,CAAC,YAAY,CAAC,CAAC;IAChC,IAAI,EAAE,GAAG,IAAI,CAAC,GAAG,CAAC,YAAY,CAAC,CAAC;IAChC,uBAAuB;IACvB,IAAI,UAAU,GAAG,EAAE,GAAG,EAAE,GAAG,EAAE,GAAG,EAAE,CAAC;IACnC,IAAI,CAAC;IACJ,2GAA2G;IAC3G,UAAU,GAAG,CAAC;QACb,CAAC,CAAC,6CAA6C;YAC9C,IAAI,CAAC,IAAI,CACR,IAAI,CAAC,GAAG,CAAC,OAAO,GAAG,OAAO,EAAE,CAAC,CAAC,GAAG,IAAI,CAAC,GAAG,CAAC,OAAO,GAAG,OAAO,EAAE,CAAC,CAAC,CAC/D;QACF,CAAC,CAAC,CAAC,CAAC;IAEN,oCAAoC;IACpC,IAAI,CAAC,GAAG,MAAM,CAAC,6BAA6B,CAAC,CAAC,CAAC,CAAC;IAEhD,iBAAiB;IACjB,CAAC,GAAG,UAAU,CACb,CAAC,EACD,MACC,MAAA,MAAA,aAAa,CAAC,MAAM,CAAC,OAAO,0CAAE,OAAO,0CAClC,QACH,0CAAE,KAAK,CACR,CAAC;IAEF,CAAC,GAAG,SAAS,CACZ,CAAC,EACD,aAAa,CAAC,MAAM,CAAC,OAAO,CAAC,CAAC,GAAG,EACjC,aAAa,CAAC,MAAM,CAAC,OAAO,CAAC,CAAC,GAAG,CACjC,CAAC;IAEF,OAAO,CAAC,CAAC;AACV,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"db266bd7e0c33e6b2f1cbfa31318610554b81a62"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_5f9cdl8jv=function(){return actualCoverage;};}return actualCoverage;}cov_5f9cdl8jv();function calcRadialLinear(event,chartInstance,curIndex,rAxisID,state){cov_5f9cdl8jv().f[0]++;var _a,_b,_c;cov_5f9cdl8jv().s[0]++;if(state===void 0){cov_5f9cdl8jv().b[0][0]++;cov_5f9cdl8jv().s[1]++;state=ChartJSDragDataPlugin.statesStore.get(chartInstance.id);}else {cov_5f9cdl8jv().b[0][1]++;}var _d=(cov_5f9cdl8jv().s[2]++,helpers.getRelativePosition(event,chartInstance)),cursorX=(cov_5f9cdl8jv().s[3]++,_d.x),cursorY=(cov_5f9cdl8jv().s[4]++,_d.y);var rScale=(cov_5f9cdl8jv().s[5]++,chartInstance.scales[rAxisID]);var axisAngleRad=(cov_5f9cdl8jv().s[6]++,rScale.getPointPositionForValue(// the radar chart has points draggable along primary axes that are aligned with
  // scales' lines; the polarArea chart, however, is draggable along lines placed in the center
  // between major lines, thus the +0.5 of index is added for the helper to calculate the angle
  // of this center guide line (the helper accept a continuous argument, in spite of the name "index")
  curIndex+(((cov_5f9cdl8jv().b[3][0]++,state===null)||(cov_5f9cdl8jv().b[3][1]++,state===void 0)?(cov_5f9cdl8jv().b[2][0]++,void 0):(cov_5f9cdl8jv().b[2][1]++,state.type))==="polarArea"?(cov_5f9cdl8jv().b[1][0]++,0.5):(cov_5f9cdl8jv().b[1][1]++,0)),chartInstance.scales[rAxisID].max).angle);var xCenter=(cov_5f9cdl8jv().s[7]++,rScale.xCenter),yCenter=(cov_5f9cdl8jv().s[8]++,rScale.yCenter);// we calculate the dot product of the vector from center to cursor & the axis direction vector
  // center-to-cursor vector v
  var vx=(cov_5f9cdl8jv().s[9]++,cursorX-xCenter);var vy=(cov_5f9cdl8jv().s[10]++,cursorY-yCenter);// axis direction vector d
  var dx=(cov_5f9cdl8jv().s[11]++,Math.cos(axisAngleRad));var dy=(cov_5f9cdl8jv().s[12]++,Math.sin(axisAngleRad));// dot product of v & d
  var dotProduct=(cov_5f9cdl8jv().s[13]++,vx*dx+vy*dy);var d=(// if dot product <= 0, then the point is on the opposite side of the center than the direction of the axis
  cov_5f9cdl8jv().s[14]++,dotProduct>0?(// Euclidean distance between cursor & center
  cov_5f9cdl8jv().b[4][0]++,Math.sqrt(Math.pow(cursorX-xCenter,2)+Math.pow(cursorY-yCenter,2))):(cov_5f9cdl8jv().b[4][1]++,0));// calculate the value from distance
  var v=(cov_5f9cdl8jv().s[15]++,rScale.getValueForDistanceFromCenter(d));// apply rounding
  cov_5f9cdl8jv().s[16]++;v=roundValue(v,(cov_5f9cdl8jv().b[6][0]++,(_c=(cov_5f9cdl8jv().b[8][0]++,(_b=(cov_5f9cdl8jv().b[10][0]++,(_a=chartInstance.config.options)===null)||(cov_5f9cdl8jv().b[10][1]++,_a===void 0)?(cov_5f9cdl8jv().b[9][0]++,void 0):(cov_5f9cdl8jv().b[9][1]++,_a.plugins))===null)||(cov_5f9cdl8jv().b[8][1]++,_b===void 0)?(cov_5f9cdl8jv().b[7][0]++,void 0):(cov_5f9cdl8jv().b[7][1]++,_b.dragData))===null)||(cov_5f9cdl8jv().b[6][1]++,_c===void 0)?(cov_5f9cdl8jv().b[5][0]++,void 0):(cov_5f9cdl8jv().b[5][1]++,_c.round));cov_5f9cdl8jv().s[17]++;v=clipValue(v,chartInstance.scales[rAxisID].min,chartInstance.scales[rAxisID].max);cov_5f9cdl8jv().s[18]++;return v;}

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

  function cov_15dhvpypgv(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/cloneDataPoint.ts";var hash="9dd1c72f5c69fedb90c68d26d5f1da47dad00788";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/cloneDataPoint.ts",statementMap:{"0":{start:{line:3,column:4},end:{line:6,column:36}},"1":{start:{line:4,column:8},end:{line:4,column:47}},"2":{start:{line:5,column:9},end:{line:6,column:36}},"3":{start:{line:6,column:8},end:{line:6,column:36}},"4":{start:{line:8,column:4},end:{line:8,column:18}}},fnMap:{"0":{name:"cloneDataPoint",decl:{start:{line:2,column:16},end:{line:2,column:30}},loc:{start:{line:2,column:39},end:{line:9,column:1}},line:2}},branchMap:{"0":{loc:{start:{line:3,column:4},end:{line:6,column:36}},type:"if",locations:[{start:{line:3,column:4},end:{line:6,column:36}},{start:{line:5,column:9},end:{line:6,column:36}}],line:3},"1":{loc:{start:{line:5,column:9},end:{line:6,column:36}},type:"if",locations:[{start:{line:5,column:9},end:{line:6,column:36}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:5}},s:{"0":0,"1":0,"2":0,"3":0,"4":0},f:{"0":0},b:{"0":[0,0],"1":[0,0]},inputSourceMap:{version:3,sources:["../../../src/util/cloneDataPoint.ts"],sourcesContent:["import type { ChartType } from \"chart.js\";\n\nimport { ChartDataItemType } from \"../types\";\n\nexport function cloneDataPoint<\n\tTType extends ChartType,\n\tT = ChartDataItemType<TType>,\n>(source: T): T {\n\tif (Array.isArray(source)) return [...source] as T;\n\telse if (typeof source === \"object\") return { ...source };\n\n\t// below: typeof source === \"number\"\n\treturn source;\n}\n"],names:[],mappings:";AAIA,MAAM,UAAU,cAAc,CAG5B,MAAS;IACV,IAAI,KAAK,CAAC,OAAO,CAAC,MAAM,CAAC;QAAE,OAAO,kBAAI,MAAM,OAAM,CAAC;SAC9C,IAAI,OAAO,MAAM,KAAK,QAAQ;QAAE,oBAAY,MAAM,EAAG;IAE1D,oCAAoC;IACpC,OAAO,MAAM,CAAC;AACf,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"9dd1c72f5c69fedb90c68d26d5f1da47dad00788"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_15dhvpypgv=function(){return actualCoverage;};}return actualCoverage;}cov_15dhvpypgv();function cloneDataPoint(source){cov_15dhvpypgv().f[0]++;cov_15dhvpypgv().s[0]++;if(Array.isArray(source)){cov_15dhvpypgv().b[0][0]++;cov_15dhvpypgv().s[1]++;return __spreadArray([],source,true);}else {cov_15dhvpypgv().b[0][1]++;cov_15dhvpypgv().s[2]++;if(typeof source==="object"){cov_15dhvpypgv().b[1][0]++;cov_15dhvpypgv().s[3]++;return __assign({},source);}else {cov_15dhvpypgv().b[1][1]++;}}// below: typeof source === "number"
  cov_15dhvpypgv().s[4]++;return source;}

  function cov_1a3c56ytxf(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/calc/cartesian.ts";var hash="f58e08b29b6af09c31c149b6962ebd32cccc6b3a";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/calc/cartesian.ts",statementMap:{"0":{start:{line:8,column:32},end:{line:8,column:56}},"1":{start:{line:8,column:82},end:{line:8,column:106}},"2":{start:{line:9,column:4},end:{line:9,column:94}},"3":{start:{line:9,column:28},end:{line:9,column:92}},"4":{start:{line:10,column:4},end:{line:11,column:20}},"5":{start:{line:11,column:8},end:{line:11,column:20}},"6":{start:{line:12,column:20},end:{line:12,column:40}},"7":{start:{line:13,column:13},end:{line:13,column:54}},"8":{start:{line:13,column:66},end:{line:13,column:70}},"9":{start:{line:13,column:82},end:{line:13,column:86}},"10":{start:{line:14,column:12},end:{line:14,column:73}},"11":{start:{line:15,column:12},end:{line:15,column:73}},"12":{start:{line:16,column:19},end:{line:16,column:211}},"13":{start:{line:17,column:4},end:{line:17,column:32}},"14":{start:{line:18,column:4},end:{line:18,column:32}},"15":{start:{line:19,column:4},end:{line:19,column:103}},"16":{start:{line:20,column:4},end:{line:20,column:103}},"17":{start:{line:21,column:4},end:{line:44,column:5}},"18":{start:{line:27,column:21},end:{line:27,column:27}},"19":{start:{line:29,column:8},end:{line:34,column:9}},"20":{start:{line:30,column:12},end:{line:30,column:23}},"21":{start:{line:33,column:12},end:{line:33,column:23}},"22":{start:{line:35,column:27},end:{line:35,column:58}},"23":{start:{line:36,column:28},end:{line:36,column:59}},"24":{start:{line:37,column:8},end:{line:42,column:9}},"25":{start:{line:38,column:12},end:{line:38,column:34}},"26":{start:{line:41,column:12},end:{line:41,column:34}},"27":{start:{line:43,column:8},end:{line:43,column:25}},"28":{start:{line:45,column:4},end:{line:47,column:5}},"29":{start:{line:46,column:8},end:{line:46,column:24}},"30":{start:{line:48,column:4},end:{line:71,column:5}},"31":{start:{line:49,column:8},end:{line:51,column:9}},"32":{start:{line:50,column:12},end:{line:50,column:28}},"33":{start:{line:52,column:8},end:{line:52,column:25}},"34":{start:{line:55,column:8},end:{line:70,column:9}},"35":{start:{line:56,column:12},end:{line:61,column:13}},"36":{start:{line:57,column:16},end:{line:57,column:25}},"37":{start:{line:60,column:16},end:{line:60,column:33}},"38":{start:{line:64,column:12},end:{line:69,column:13}},"39":{start:{line:65,column:16},end:{line:65,column:25}},"40":{start:{line:68,column:16},end:{line:68,column:33}}},fnMap:{"0":{name:"calcCartesian",decl:{start:{line:6,column:16},end:{line:6,column:29}},loc:{start:{line:6,column:69},end:{line:72,column:1}},line:6}},branchMap:{"0":{loc:{start:{line:9,column:4},end:{line:9,column:94}},type:"if",locations:[{start:{line:9,column:4},end:{line:9,column:94}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:9},"1":{loc:{start:{line:10,column:4},end:{line:11,column:20}},type:"if",locations:[{start:{line:10,column:4},end:{line:11,column:20}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:10},"2":{loc:{start:{line:16,column:19},end:{line:16,column:211}},type:"cond-expr",locations:[{start:{line:16,column:194},end:{line:16,column:200}},{start:{line:16,column:203},end:{line:16,column:211}}],line:16},"3":{loc:{start:{line:16,column:19},end:{line:16,column:191}},type:"binary-expr",locations:[{start:{line:16,column:19},end:{line:16,column:174}},{start:{line:16,column:178},end:{line:16,column:191}}],line:16},"4":{loc:{start:{line:16,column:25},end:{line:16,column:164}},type:"cond-expr",locations:[{start:{line:16,column:144},end:{line:16,column:150}},{start:{line:16,column:153},end:{line:16,column:164}}],line:16},"5":{loc:{start:{line:16,column:25},end:{line:16,column:141}},type:"binary-expr",locations:[{start:{line:16,column:25},end:{line:16,column:124}},{start:{line:16,column:128},end:{line:16,column:141}}],line:16},"6":{loc:{start:{line:16,column:31},end:{line:16,column:114}},type:"cond-expr",locations:[{start:{line:16,column:95},end:{line:16,column:101}},{start:{line:16,column:104},end:{line:16,column:114}}],line:16},"7":{loc:{start:{line:16,column:31},end:{line:16,column:92}},type:"binary-expr",locations:[{start:{line:16,column:31},end:{line:16,column:75}},{start:{line:16,column:79},end:{line:16,column:92}}],line:16},"8":{loc:{start:{line:21,column:4},end:{line:44,column:5}},type:"if",locations:[{start:{line:21,column:4},end:{line:44,column:5}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:21},"9":{loc:{start:{line:29,column:8},end:{line:34,column:9}},type:"if",locations:[{start:{line:29,column:8},end:{line:34,column:9}},{start:{line:32,column:13},end:{line:34,column:9}}],line:29},"10":{loc:{start:{line:29,column:13},end:{line:29,column:98}},type:"cond-expr",locations:[{start:{line:29,column:77},end:{line:29,column:83}},{start:{line:29,column:86},end:{line:29,column:98}}],line:29},"11":{loc:{start:{line:29,column:13},end:{line:29,column:74}},type:"binary-expr",locations:[{start:{line:29,column:13},end:{line:29,column:57}},{start:{line:29,column:61},end:{line:29,column:74}}],line:29},"12":{loc:{start:{line:37,column:8},end:{line:42,column:9}},type:"if",locations:[{start:{line:37,column:8},end:{line:42,column:9}},{start:{line:40,column:13},end:{line:42,column:9}}],line:37},"13":{loc:{start:{line:45,column:4},end:{line:47,column:5}},type:"if",locations:[{start:{line:45,column:4},end:{line:47,column:5}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:45},"14":{loc:{start:{line:45,column:8},end:{line:45,column:59}},type:"binary-expr",locations:[{start:{line:45,column:8},end:{line:45,column:33}},{start:{line:45,column:37},end:{line:45,column:59}}],line:45},"15":{loc:{start:{line:48,column:4},end:{line:71,column:5}},type:"if",locations:[{start:{line:48,column:4},end:{line:71,column:5}},{start:{line:54,column:9},end:{line:71,column:5}}],line:48},"16":{loc:{start:{line:49,column:8},end:{line:51,column:9}},type:"if",locations:[{start:{line:49,column:8},end:{line:51,column:9}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:49},"17":{loc:{start:{line:55,column:8},end:{line:70,column:9}},type:"if",locations:[{start:{line:55,column:8},end:{line:70,column:9}},{start:{line:63,column:13},end:{line:70,column:9}}],line:55},"18":{loc:{start:{line:55,column:13},end:{line:55,column:98}},type:"cond-expr",locations:[{start:{line:55,column:77},end:{line:55,column:83}},{start:{line:55,column:86},end:{line:55,column:98}}],line:55},"19":{loc:{start:{line:55,column:13},end:{line:55,column:74}},type:"binary-expr",locations:[{start:{line:55,column:13},end:{line:55,column:57}},{start:{line:55,column:61},end:{line:55,column:74}}],line:55},"20":{loc:{start:{line:56,column:12},end:{line:61,column:13}},type:"if",locations:[{start:{line:56,column:12},end:{line:61,column:13}},{start:{line:59,column:17},end:{line:61,column:13}}],line:56},"21":{loc:{start:{line:64,column:12},end:{line:69,column:13}},type:"if",locations:[{start:{line:64,column:12},end:{line:69,column:13}},{start:{line:67,column:17},end:{line:69,column:13}}],line:64}},s:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0},f:{"0":0},b:{"0":[0,0],"1":[0,0],"2":[0,0],"3":[0,0],"4":[0,0],"5":[0,0],"6":[0,0],"7":[0,0],"8":[0,0],"9":[0,0],"10":[0,0],"11":[0,0],"12":[0,0],"13":[0,0],"14":[0,0],"15":[0,0],"16":[0,0],"17":[0,0],"18":[0,0],"19":[0,0],"20":[0,0],"21":[0,0]},inputSourceMap:{version:3,sources:["../../../../src/util/calc/cartesian.ts"],sourcesContent:["import type { Chart, ChartType, Point } from \"chart.js\";\nimport { getRelativePosition } from \"chart.js/helpers\";\n\nimport ChartJSDragDataPlugin from \"../../plugin\";\nimport {\n\tChartDataItemType,\n\tDragDataEvent,\n\tDragDataState,\n\tOptionalPluginConfiguration,\n} from \"../../types\";\nimport { AxisDraggingConfiguration } from \"../../types/DraggingConfiguration\";\nimport { cloneDataPoint } from \"../cloneDataPoint\";\nimport { roundValue } from \"../roundValue\";\nimport { clipValue } from \"./clipValue\";\n\nexport function calcCartesian<TType extends ChartType>(\n\tevent: DragDataEvent,\n\tchartInstance: Chart<TType>,\n\tdata: NonNullable<ChartDataItemType<TType>>,\n\t{ xAxisDraggingDisabled, yAxisDraggingDisabled }: AxisDraggingConfiguration,\n\tstate: DragDataState | undefined = ChartJSDragDataPlugin.statesStore.get(\n\t\tchartInstance.id,\n\t),\n): NonNullable<ChartDataItemType<ChartType>> {\n\tif (!state) return data;\n\n\tconst dataPoint = cloneDataPoint(data)!;\n\n\tlet { x: cursorX, y: cursorY } = getRelativePosition(\n\t\tevent,\n\t\tchartInstance as any,\n\t);\n\n\tlet x = chartInstance.scales[state.xAxisID].getValueForPixel(cursorX);\n\tlet y = chartInstance.scales[state.yAxisID].getValueForPixel(cursorY);\n\n\tconst rounding = (\n\t\tchartInstance.config.options?.plugins\n\t\t\t?.dragData as OptionalPluginConfiguration<TType>\n\t)?.round;\n\n\tx = roundValue(x!, rounding);\n\ty = roundValue(y!, rounding);\n\n\tx = clipValue(\n\t\tx,\n\t\tchartInstance.scales[state.xAxisID].min,\n\t\tchartInstance.scales[state.xAxisID].max,\n\t);\n\ty = clipValue(\n\t\ty,\n\t\tchartInstance.scales[state.yAxisID].min,\n\t\tchartInstance.scales[state.yAxisID].max,\n\t);\n\n\tif (state.floatingBar) {\n\t\t// x contains the new value for one end of the floating bar\n\t\t// dataPoint contains the old interval [left, right] of the floating bar\n\t\t// calculate difference between the new value and both sides\n\t\t// the side with the smallest difference from the new value was the one that was dragged\n\t\t// return an interval with new value on the dragged side and old value on the other side\n\t\tlet newVal;\n\t\t// choose the right variable based on the orientation of the graph (vertical, horizontal)\n\t\tif (chartInstance.config.options?.indexAxis === \"y\") {\n\t\t\tnewVal = x;\n\t\t} else {\n\t\t\tnewVal = y;\n\t\t}\n\t\tconst diffFromLeft = Math.abs(newVal - (dataPoint as [number, number])[0]);\n\t\tconst diffFromRight = Math.abs(newVal - (dataPoint as [number, number])[1]);\n\n\t\tif (diffFromLeft <= diffFromRight) {\n\t\t\t(dataPoint as [number, number])[0] = newVal;\n\t\t} else {\n\t\t\t(dataPoint as [number, number])[1] = newVal;\n\t\t}\n\n\t\treturn dataPoint;\n\t}\n\n\tif ((dataPoint as Point).x !== undefined && !xAxisDraggingDisabled) {\n\t\t(dataPoint as Point).x = x;\n\t}\n\n\tif ((dataPoint as Point).y !== undefined) {\n\t\tif (!yAxisDraggingDisabled) {\n\t\t\t(dataPoint as Point).y = y;\n\t\t}\n\t\treturn dataPoint;\n\t} else {\n\t\tif (chartInstance.config.options?.indexAxis === \"y\") {\n\t\t\tif (!xAxisDraggingDisabled) {\n\t\t\t\treturn x;\n\t\t\t} else {\n\t\t\t\treturn dataPoint;\n\t\t\t}\n\t\t} else {\n\t\t\tif (!yAxisDraggingDisabled) {\n\t\t\t\treturn y;\n\t\t\t} else {\n\t\t\t\treturn dataPoint;\n\t\t\t}\n\t\t}\n\t}\n}\n"],names:[],mappings:"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",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"f58e08b29b6af09c31c149b6962ebd32cccc6b3a"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_1a3c56ytxf=function(){return actualCoverage;};}return actualCoverage;}cov_1a3c56ytxf();function calcCartesian(event,chartInstance,data,_a,state){cov_1a3c56ytxf().f[0]++;var _b,_c,_d,_e,_f;var xAxisDraggingDisabled=(cov_1a3c56ytxf().s[0]++,_a.xAxisDraggingDisabled),yAxisDraggingDisabled=(cov_1a3c56ytxf().s[1]++,_a.yAxisDraggingDisabled);cov_1a3c56ytxf().s[2]++;if(state===void 0){cov_1a3c56ytxf().b[0][0]++;cov_1a3c56ytxf().s[3]++;state=ChartJSDragDataPlugin.statesStore.get(chartInstance.id);}else {cov_1a3c56ytxf().b[0][1]++;}cov_1a3c56ytxf().s[4]++;if(!state){cov_1a3c56ytxf().b[1][0]++;cov_1a3c56ytxf().s[5]++;return data;}else {cov_1a3c56ytxf().b[1][1]++;}var dataPoint=(cov_1a3c56ytxf().s[6]++,cloneDataPoint(data));var _g=(cov_1a3c56ytxf().s[7]++,helpers.getRelativePosition(event,chartInstance)),cursorX=(cov_1a3c56ytxf().s[8]++,_g.x),cursorY=(cov_1a3c56ytxf().s[9]++,_g.y);var x=(cov_1a3c56ytxf().s[10]++,chartInstance.scales[state.xAxisID].getValueForPixel(cursorX));var y=(cov_1a3c56ytxf().s[11]++,chartInstance.scales[state.yAxisID].getValueForPixel(cursorY));var rounding=(cov_1a3c56ytxf().s[12]++,(cov_1a3c56ytxf().b[3][0]++,(_d=(cov_1a3c56ytxf().b[5][0]++,(_c=(cov_1a3c56ytxf().b[7][0]++,(_b=chartInstance.config.options)===null)||(cov_1a3c56ytxf().b[7][1]++,_b===void 0)?(cov_1a3c56ytxf().b[6][0]++,void 0):(cov_1a3c56ytxf().b[6][1]++,_b.plugins))===null)||(cov_1a3c56ytxf().b[5][1]++,_c===void 0)?(cov_1a3c56ytxf().b[4][0]++,void 0):(cov_1a3c56ytxf().b[4][1]++,_c.dragData))===null)||(cov_1a3c56ytxf().b[3][1]++,_d===void 0)?(cov_1a3c56ytxf().b[2][0]++,void 0):(cov_1a3c56ytxf().b[2][1]++,_d.round));cov_1a3c56ytxf().s[13]++;x=roundValue(x,rounding);cov_1a3c56ytxf().s[14]++;y=roundValue(y,rounding);cov_1a3c56ytxf().s[15]++;x=clipValue(x,chartInstance.scales[state.xAxisID].min,chartInstance.scales[state.xAxisID].max);cov_1a3c56ytxf().s[16]++;y=clipValue(y,chartInstance.scales[state.yAxisID].min,chartInstance.scales[state.yAxisID].max);cov_1a3c56ytxf().s[17]++;if(state.floatingBar){cov_1a3c56ytxf().b[8][0]++;// x contains the new value for one end of the floating bar
  // dataPoint contains the old interval [left, right] of the floating bar
  // calculate difference between the new value and both sides
  // the side with the smallest difference from the new value was the one that was dragged
  // return an interval with new value on the dragged side and old value on the other side
  var newVal=(cov_1a3c56ytxf().s[18]++,void 0);// choose the right variable based on the orientation of the graph (vertical, horizontal)
  cov_1a3c56ytxf().s[19]++;if(((cov_1a3c56ytxf().b[11][0]++,(_e=chartInstance.config.options)===null)||(cov_1a3c56ytxf().b[11][1]++,_e===void 0)?(cov_1a3c56ytxf().b[10][0]++,void 0):(cov_1a3c56ytxf().b[10][1]++,_e.indexAxis))==="y"){cov_1a3c56ytxf().b[9][0]++;cov_1a3c56ytxf().s[20]++;newVal=x;}else {cov_1a3c56ytxf().b[9][1]++;cov_1a3c56ytxf().s[21]++;newVal=y;}var diffFromLeft=(cov_1a3c56ytxf().s[22]++,Math.abs(newVal-dataPoint[0]));var diffFromRight=(cov_1a3c56ytxf().s[23]++,Math.abs(newVal-dataPoint[1]));cov_1a3c56ytxf().s[24]++;if(diffFromLeft<=diffFromRight){cov_1a3c56ytxf().b[12][0]++;cov_1a3c56ytxf().s[25]++;dataPoint[0]=newVal;}else {cov_1a3c56ytxf().b[12][1]++;cov_1a3c56ytxf().s[26]++;dataPoint[1]=newVal;}cov_1a3c56ytxf().s[27]++;return dataPoint;}else {cov_1a3c56ytxf().b[8][1]++;}cov_1a3c56ytxf().s[28]++;if((cov_1a3c56ytxf().b[14][0]++,dataPoint.x!==undefined)&&(cov_1a3c56ytxf().b[14][1]++,!xAxisDraggingDisabled)){cov_1a3c56ytxf().b[13][0]++;cov_1a3c56ytxf().s[29]++;dataPoint.x=x;}else {cov_1a3c56ytxf().b[13][1]++;}cov_1a3c56ytxf().s[30]++;if(dataPoint.y!==undefined){cov_1a3c56ytxf().b[15][0]++;cov_1a3c56ytxf().s[31]++;if(!yAxisDraggingDisabled){cov_1a3c56ytxf().b[16][0]++;cov_1a3c56ytxf().s[32]++;dataPoint.y=y;}else {cov_1a3c56ytxf().b[16][1]++;}cov_1a3c56ytxf().s[33]++;return dataPoint;}else {cov_1a3c56ytxf().b[15][1]++;cov_1a3c56ytxf().s[34]++;if(((cov_1a3c56ytxf().b[19][0]++,(_f=chartInstance.config.options)===null)||(cov_1a3c56ytxf().b[19][1]++,_f===void 0)?(cov_1a3c56ytxf().b[18][0]++,void 0):(cov_1a3c56ytxf().b[18][1]++,_f.indexAxis))==="y"){cov_1a3c56ytxf().b[17][0]++;cov_1a3c56ytxf().s[35]++;if(!xAxisDraggingDisabled){cov_1a3c56ytxf().b[20][0]++;cov_1a3c56ytxf().s[36]++;return x;}else {cov_1a3c56ytxf().b[20][1]++;cov_1a3c56ytxf().s[37]++;return dataPoint;}}else {cov_1a3c56ytxf().b[17][1]++;cov_1a3c56ytxf().s[38]++;if(!yAxisDraggingDisabled){cov_1a3c56ytxf().b[21][0]++;cov_1a3c56ytxf().s[39]++;return y;}else {cov_1a3c56ytxf().b[21][1]++;cov_1a3c56ytxf().s[40]++;return dataPoint;}}}}

  function cov_1t7lcadnqd(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/calc/index.ts";var hash="118c6ab048d429ca2a7f25c51b56a69370a0ba6f";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/calc/index.ts",statementMap:{},fnMap:{},branchMap:{},s:{},f:{},b:{},inputSourceMap:{version:3,sources:["../../../../src/util/calc/index.ts"],sourcesContent:["export * from \"./radialLinear\";\nexport * from \"./cartesian\";\nexport * from \"./clipValue\";\n"],names:[],mappings:"AAAA,cAAc,gBAAgB,CAAC;AAC/B,cAAc,aAAa,CAAC;AAC5B,cAAc,aAAa,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"118c6ab048d429ca2a7f25c51b56a69370a0ba6f"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_1t7lcadnqd=function(){return actualCoverage;};}return actualCoverage;}cov_1t7lcadnqd();

  function cov_fvsk1bz(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/applyMagnet.ts";var hash="153852b6bb72fbf3de6bb7878d1ceb0ef4c441eb";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/applyMagnet.ts",statementMap:{"0":{start:{line:10,column:24},end:{line:10,column:163}},"1":{start:{line:11,column:4},end:{line:24,column:5}},"2":{start:{line:12,column:21},end:{line:12,column:103}},"3":{start:{line:13,column:8},end:{line:19,column:9}},"4":{start:{line:14,column:23},end:{line:14,column:76}},"5":{start:{line:15,column:12},end:{line:15,column:35}},"6":{start:{line:16,column:12},end:{line:16,column:73}},"7":{start:{line:17,column:12},end:{line:17,column:41}},"8":{start:{line:18,column:12},end:{line:18,column:24}},"9":{start:{line:20,column:8},end:{line:20,column:20}},"10":{start:{line:23,column:8},end:{line:23,column:69}}},fnMap:{"0":{name:"applyMagnet",decl:{start:{line:8,column:16},end:{line:8,column:27}},loc:{start:{line:8,column:64},end:{line:25,column:1}},line:8}},branchMap:{"0":{loc:{start:{line:10,column:24},end:{line:10,column:163}},type:"cond-expr",locations:[{start:{line:10,column:143},end:{line:10,column:149}},{start:{line:10,column:152},end:{line:10,column:163}}],line:10},"1":{loc:{start:{line:10,column:24},end:{line:10,column:140}},type:"binary-expr",locations:[{start:{line:10,column:24},end:{line:10,column:123}},{start:{line:10,column:127},end:{line:10,column:140}}],line:10},"2":{loc:{start:{line:10,column:30},end:{line:10,column:113}},type:"cond-expr",locations:[{start:{line:10,column:94},end:{line:10,column:100}},{start:{line:10,column:103},end:{line:10,column:113}}],line:10},"3":{loc:{start:{line:10,column:30},end:{line:10,column:91}},type:"binary-expr",locations:[{start:{line:10,column:30},end:{line:10,column:74}},{start:{line:10,column:78},end:{line:10,column:91}}],line:10},"4":{loc:{start:{line:11,column:4},end:{line:24,column:5}},type:"if",locations:[{start:{line:11,column:4},end:{line:24,column:5}},{start:{line:22,column:9},end:{line:24,column:5}}],line:11},"5":{loc:{start:{line:11,column:8},end:{line:11,column:90}},type:"cond-expr",locations:[{start:{line:11,column:61},end:{line:11,column:67}},{start:{line:11,column:70},end:{line:11,column:90}}],line:11},"6":{loc:{start:{line:11,column:8},end:{line:11,column:58}},type:"binary-expr",locations:[{start:{line:11,column:8},end:{line:11,column:30}},{start:{line:11,column:34},end:{line:11,column:58}}],line:11},"7":{loc:{start:{line:12,column:21},end:{line:12,column:103}},type:"cond-expr",locations:[{start:{line:12,column:74},end:{line:12,column:80}},{start:{line:12,column:83},end:{line:12,column:103}}],line:12},"8":{loc:{start:{line:12,column:21},end:{line:12,column:71}},type:"binary-expr",locations:[{start:{line:12,column:21},end:{line:12,column:43}},{start:{line:12,column:47},end:{line:12,column:71}}],line:12},"9":{loc:{start:{line:13,column:8},end:{line:19,column:9}},type:"if",locations:[{start:{line:13,column:8},end:{line:19,column:9}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:13}},s:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0},f:{"0":0},b:{"0":[0,0],"1":[0,0],"2":[0,0],"3":[0,0],"4":[0,0],"5":[0,0],"6":[0,0],"7":[0,0],"8":[0,0],"9":[0,0]},inputSourceMap:{version:3,sources:["../../../src/util/applyMagnet.ts"],sourcesContent:["import { Chart, ChartType } from \"chart.js\";\n\nimport { ChartDataItemType, OptionalPluginConfiguration } from \"../types\";\n\n/**\n * Updates values to the nearest values\n * @param chartInstance the chart instance\n * @param datasetIndex the dataset index\n * @param index the data point index\n * @returns value after applying magnet or unchanged if not magnet is configured\n */\nexport function applyMagnet<TType extends ChartType>(\n\tchartInstance: Chart<TType>,\n\tdatasetIndex: number,\n\tindex: number,\n): ChartDataItemType<TType> {\n\tconst pluginOptions = chartInstance.config.options?.plugins\n\t\t?.dragData as OptionalPluginConfiguration<TType>;\n\n\tif (pluginOptions?.magnet) {\n\t\tconst magnet = pluginOptions?.magnet;\n\n\t\tif (typeof magnet.to === \"function\") {\n\t\t\tlet data = chartInstance.data.datasets[datasetIndex].data[index];\n\t\t\tdata = magnet.to(data);\n\n\t\t\tchartInstance.data.datasets[datasetIndex].data[index] = data;\n\n\t\t\tchartInstance.update(\"none\");\n\n\t\t\treturn data;\n\t\t}\n\n\t\treturn null;\n\t} else {\n\t\treturn chartInstance.data.datasets[datasetIndex].data[index];\n\t}\n}\n"],names:[],mappings:"AAIA;;;;;;GAMG;AACH,MAAM,UAAU,WAAW,CAC1B,aAA2B,EAC3B,YAAoB,EACpB,KAAa;;IAEb,IAAM,aAAa,GAAG,MAAA,MAAA,aAAa,CAAC,MAAM,CAAC,OAAO,0CAAE,OAAO,0CACxD,QAA8C,CAAC;IAElD,IAAI,aAAa,aAAb,aAAa,uBAAb,aAAa,CAAE,MAAM,EAAE,CAAC;QAC3B,IAAM,MAAM,GAAG,aAAa,aAAb,aAAa,uBAAb,aAAa,CAAE,MAAM,CAAC;QAErC,IAAI,OAAO,MAAM,CAAC,EAAE,KAAK,UAAU,EAAE,CAAC;YACrC,IAAI,IAAI,GAAG,aAAa,CAAC,IAAI,CAAC,QAAQ,CAAC,YAAY,CAAC,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC;YACjE,IAAI,GAAG,MAAM,CAAC,EAAE,CAAC,IAAI,CAAC,CAAC;YAEvB,aAAa,CAAC,IAAI,CAAC,QAAQ,CAAC,YAAY,CAAC,CAAC,IAAI,CAAC,KAAK,CAAC,GAAG,IAAI,CAAC;YAE7D,aAAa,CAAC,MAAM,CAAC,MAAM,CAAC,CAAC;YAE7B,OAAO,IAAI,CAAC;QACb,CAAC;QAED,OAAO,IAAI,CAAC;IACb,CAAC;SAAM,CAAC;QACP,OAAO,aAAa,CAAC,IAAI,CAAC,QAAQ,CAAC,YAAY,CAAC,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC;IAC9D,CAAC;AACF,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"153852b6bb72fbf3de6bb7878d1ceb0ef4c441eb"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_fvsk1bz=function(){return actualCoverage;};}return actualCoverage;}cov_fvsk1bz();/**
   * Updates values to the nearest values
   * @param chartInstance the chart instance
   * @param datasetIndex the dataset index
   * @param index the data point index
   * @returns value after applying magnet or unchanged if not magnet is configured
   */function applyMagnet(chartInstance,datasetIndex,index){cov_fvsk1bz().f[0]++;var _a,_b;var pluginOptions=(cov_fvsk1bz().s[0]++,(cov_fvsk1bz().b[1][0]++,(_b=(cov_fvsk1bz().b[3][0]++,(_a=chartInstance.config.options)===null)||(cov_fvsk1bz().b[3][1]++,_a===void 0)?(cov_fvsk1bz().b[2][0]++,void 0):(cov_fvsk1bz().b[2][1]++,_a.plugins))===null)||(cov_fvsk1bz().b[1][1]++,_b===void 0)?(cov_fvsk1bz().b[0][0]++,void 0):(cov_fvsk1bz().b[0][1]++,_b.dragData));cov_fvsk1bz().s[1]++;if((cov_fvsk1bz().b[6][0]++,pluginOptions===null)||(cov_fvsk1bz().b[6][1]++,pluginOptions===void 0)?(cov_fvsk1bz().b[5][0]++,void 0):(cov_fvsk1bz().b[5][1]++,pluginOptions.magnet)){cov_fvsk1bz().b[4][0]++;var magnet=(cov_fvsk1bz().s[2]++,(cov_fvsk1bz().b[8][0]++,pluginOptions===null)||(cov_fvsk1bz().b[8][1]++,pluginOptions===void 0)?(cov_fvsk1bz().b[7][0]++,void 0):(cov_fvsk1bz().b[7][1]++,pluginOptions.magnet));cov_fvsk1bz().s[3]++;if(typeof magnet.to==="function"){cov_fvsk1bz().b[9][0]++;var data=(cov_fvsk1bz().s[4]++,chartInstance.data.datasets[datasetIndex].data[index]);cov_fvsk1bz().s[5]++;data=magnet.to(data);cov_fvsk1bz().s[6]++;chartInstance.data.datasets[datasetIndex].data[index]=data;cov_fvsk1bz().s[7]++;chartInstance.update("none");cov_fvsk1bz().s[8]++;return data;}else {cov_fvsk1bz().b[9][1]++;}cov_fvsk1bz().s[9]++;return null;}else {cov_fvsk1bz().b[4][1]++;cov_fvsk1bz().s[10]++;return chartInstance.data.datasets[datasetIndex].data[index];}}

  function cov_1ljpymw0m1(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/checkDraggingConfiguration.ts";var hash="3e836b8ed6ac1d861650c815add84e61709a8783";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/checkDraggingConfiguration.ts",statementMap:{"0":{start:{line:4,column:4},end:{line:4,column:94}},"1":{start:{line:4,column:28},end:{line:4,column:92}},"2":{start:{line:5,column:4},end:{line:12,column:10}},"3":{start:{line:6,column:8},end:{line:12,column:10}},"4":{start:{line:13,column:18},end:{line:13,column:59}},"5":{start:{line:15,column:32},end:{line:15,column:183}},"6":{start:{line:17,column:34},end:{line:17,column:85}},"7":{start:{line:19,column:43},end:{line:19,column:243}},"8":{start:{line:21,column:32},end:{line:21,column:36}},"9":{start:{line:22,column:4},end:{line:28,column:5}},"10":{start:{line:27,column:8},end:{line:27,column:38}},"11":{start:{line:30,column:32},end:{line:32,column:220}},"12":{start:{line:34,column:36},end:{line:36,column:17}},"13":{start:{line:37,column:4},end:{line:43,column:6}}},fnMap:{"0":{name:"checkDraggingConfiguration",decl:{start:{line:2,column:16},end:{line:2,column:42}},loc:{start:{line:2,column:95},end:{line:44,column:1}},line:2}},branchMap:{"0":{loc:{start:{line:4,column:4},end:{line:4,column:94}},type:"if",locations:[{start:{line:4,column:4},end:{line:4,column:94}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:4},"1":{loc:{start:{line:5,column:4},end:{line:12,column:10}},type:"if",locations:[{start:{line:5,column:4},end:{line:12,column:10}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:5},"2":{loc:{start:{line:15,column:33},end:{line:15,column:172}},type:"cond-expr",locations:[{start:{line:15,column:152},end:{line:15,column:158}},{start:{line:15,column:161},end:{line:15,column:172}}],line:15},"3":{loc:{start:{line:15,column:33},end:{line:15,column:149}},type:"binary-expr",locations:[{start:{line:15,column:33},end:{line:15,column:132}},{start:{line:15,column:136},end:{line:15,column:149}}],line:15},"4":{loc:{start:{line:15,column:39},end:{line:15,column:122}},type:"cond-expr",locations:[{start:{line:15,column:103},end:{line:15,column:109}},{start:{line:15,column:112},end:{line:15,column:122}}],line:15},"5":{loc:{start:{line:15,column:39},end:{line:15,column:100}},type:"binary-expr",locations:[{start:{line:15,column:39},end:{line:15,column:83}},{start:{line:15,column:87},end:{line:15,column:100}}],line:15},"6":{loc:{start:{line:17,column:34},end:{line:17,column:85}},type:"binary-expr",locations:[{start:{line:17,column:34},end:{line:17,column:55}},{start:{line:17,column:59},end:{line:17,column:85}}],line:17},"7":{loc:{start:{line:19,column:43},end:{line:19,column:243}},type:"cond-expr",locations:[{start:{line:19,column:223},end:{line:19,column:229}},{start:{line:19,column:232},end:{line:19,column:243}}],line:19},"8":{loc:{start:{line:19,column:43},end:{line:19,column:220}},type:"binary-expr",locations:[{start:{line:19,column:43},end:{line:19,column:203}},{start:{line:19,column:207},end:{line:19,column:220}}],line:19},"9":{loc:{start:{line:19,column:49},end:{line:19,column:193}},type:"cond-expr",locations:[{start:{line:19,column:167},end:{line:19,column:173}},{start:{line:19,column:176},end:{line:19,column:193}}],line:19},"10":{loc:{start:{line:19,column:49},end:{line:19,column:164}},type:"binary-expr",locations:[{start:{line:19,column:49},end:{line:19,column:147}},{start:{line:19,column:151},end:{line:19,column:164}}],line:19},"11":{loc:{start:{line:19,column:55},end:{line:19,column:137}},type:"cond-expr",locations:[{start:{line:19,column:119},end:{line:19,column:125}},{start:{line:19,column:128},end:{line:19,column:137}}],line:19},"12":{loc:{start:{line:19,column:55},end:{line:19,column:116}},type:"binary-expr",locations:[{start:{line:19,column:55},end:{line:19,column:99}},{start:{line:19,column:103},end:{line:19,column:116}}],line:19},"13":{loc:{start:{line:22,column:4},end:{line:28,column:5}},type:"if",locations:[{start:{line:22,column:4},end:{line:28,column:5}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:22},"14":{loc:{start:{line:22,column:8},end:{line:26,column:60}},type:"binary-expr",locations:[{start:{line:22,column:8},end:{line:22,column:32}},{start:{line:23,column:9},end:{line:23,column:50}},{start:{line:25,column:13},end:{line:25,column:216}},{start:{line:26,column:16},end:{line:26,column:58}}],line:22},"15":{loc:{start:{line:25,column:14},end:{line:25,column:206}},type:"cond-expr",locations:[{start:{line:25,column:189},end:{line:25,column:195}},{start:{line:25,column:198},end:{line:25,column:206}}],line:25},"16":{loc:{start:{line:25,column:14},end:{line:25,column:186}},type:"binary-expr",locations:[{start:{line:25,column:14},end:{line:25,column:169}},{start:{line:25,column:173},end:{line:25,column:186}}],line:25},"17":{loc:{start:{line:25,column:20},end:{line:25,column:159}},type:"cond-expr",locations:[{start:{line:25,column:139},end:{line:25,column:145}},{start:{line:25,column:148},end:{line:25,column:159}}],line:25},"18":{loc:{start:{line:25,column:20},end:{line:25,column:136}},type:"binary-expr",locations:[{start:{line:25,column:20},end:{line:25,column:119}},{start:{line:25,column:123},end:{line:25,column:136}}],line:25},"19":{loc:{start:{line:25,column:26},end:{line:25,column:109}},type:"cond-expr",locations:[{start:{line:25,column:90},end:{line:25,column:96}},{start:{line:25,column:99},end:{line:25,column:109}}],line:25},"20":{loc:{start:{line:25,column:26},end:{line:25,column:87}},type:"binary-expr",locations:[{start:{line:25,column:26},end:{line:25,column:70}},{start:{line:25,column:74},end:{line:25,column:87}}],line:25},"21":{loc:{start:{line:30,column:32},end:{line:32,column:220}},type:"binary-expr",locations:[{start:{line:30,column:32},end:{line:30,column:55}},{start:{line:31,column:8},end:{line:31,column:212}},{start:{line:32,column:8},end:{line:32,column:220}}],line:30},"22":{loc:{start:{line:31,column:9},end:{line:31,column:201}},type:"cond-expr",locations:[{start:{line:31,column:184},end:{line:31,column:190}},{start:{line:31,column:193},end:{line:31,column:201}}],line:31},"23":{loc:{start:{line:31,column:9},end:{line:31,column:181}},type:"binary-expr",locations:[{start:{line:31,column:9},end:{line:31,column:164}},{start:{line:31,column:168},end:{line:31,column:181}}],line:31},"24":{loc:{start:{line:31,column:15},end:{line:31,column:154}},type:"cond-expr",locations:[{start:{line:31,column:134},end:{line:31,column:140}},{start:{line:31,column:143},end:{line:31,column:154}}],line:31},"25":{loc:{start:{line:31,column:15},end:{line:31,column:131}},type:"binary-expr",locations:[{start:{line:31,column:15},end:{line:31,column:114}},{start:{line:31,column:118},end:{line:31,column:131}}],line:31},"26":{loc:{start:{line:31,column:21},end:{line:31,column:104}},type:"cond-expr",locations:[{start:{line:31,column:85},end:{line:31,column:91}},{start:{line:31,column:94},end:{line:31,column:104}}],line:31},"27":{loc:{start:{line:31,column:21},end:{line:31,column:82}},type:"binary-expr",locations:[{start:{line:31,column:21},end:{line:31,column:65}},{start:{line:31,column:69},end:{line:31,column:82}}],line:31},"28":{loc:{start:{line:32,column:9},end:{line:32,column:209}},type:"cond-expr",locations:[{start:{line:32,column:189},end:{line:32,column:195}},{start:{line:32,column:198},end:{line:32,column:209}}],line:32},"29":{loc:{start:{line:32,column:9},end:{line:32,column:186}},type:"binary-expr",locations:[{start:{line:32,column:9},end:{line:32,column:169}},{start:{line:32,column:173},end:{line:32,column:186}}],line:32},"30":{loc:{start:{line:32,column:15},end:{line:32,column:159}},type:"cond-expr",locations:[{start:{line:32,column:133},end:{line:32,column:139}},{start:{line:32,column:142},end:{line:32,column:159}}],line:32},"31":{loc:{start:{line:32,column:15},end:{line:32,column:130}},type:"binary-expr",locations:[{start:{line:32,column:15},end:{line:32,column:113}},{start:{line:32,column:117},end:{line:32,column:130}}],line:32},"32":{loc:{start:{line:32,column:21},end:{line:32,column:103}},type:"cond-expr",locations:[{start:{line:32,column:85},end:{line:32,column:91}},{start:{line:32,column:94},end:{line:32,column:103}}],line:32},"33":{loc:{start:{line:32,column:21},end:{line:32,column:82}},type:"binary-expr",locations:[{start:{line:32,column:21},end:{line:32,column:65}},{start:{line:32,column:69},end:{line:32,column:82}}],line:32},"34":{loc:{start:{line:34,column:36},end:{line:36,column:17}},type:"binary-expr",locations:[{start:{line:34,column:36},end:{line:34,column:59}},{start:{line:35,column:8},end:{line:36,column:17}}],line:34},"35":{loc:{start:{line:35,column:9},end:{line:35,column:93}},type:"cond-expr",locations:[{start:{line:35,column:73},end:{line:35,column:79}},{start:{line:35,column:82},end:{line:35,column:93}}],line:35},"36":{loc:{start:{line:35,column:9},end:{line:35,column:70}},type:"binary-expr",locations:[{start:{line:35,column:9},end:{line:35,column:53}},{start:{line:35,column:57},end:{line:35,column:70}}],line:35}},s:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0},f:{"0":0},b:{"0":[0,0],"1":[0,0],"2":[0,0],"3":[0,0],"4":[0,0],"5":[0,0],"6":[0,0],"7":[0,0],"8":[0,0],"9":[0,0],"10":[0,0],"11":[0,0],"12":[0,0],"13":[0,0],"14":[0,0,0,0],"15":[0,0],"16":[0,0],"17":[0,0],"18":[0,0],"19":[0,0],"20":[0,0],"21":[0,0,0],"22":[0,0],"23":[0,0],"24":[0,0],"25":[0,0],"26":[0,0],"27":[0,0],"28":[0,0],"29":[0,0],"30":[0,0],"31":[0,0],"32":[0,0],"33":[0,0],"34":[0,0],"35":[0,0],"36":[0,0]},inputSourceMap:{version:3,sources:["../../../src/util/checkDraggingConfiguration.ts"],sourcesContent:["import type { BubbleDataPoint, ChartType, Point } from \"chart.js\";\nimport { Chart } from \"chart.js\";\n\nimport ChartJSDragDataPlugin from \"../plugin\";\nimport { DragDataState } from \"../types\";\nimport { OptionalPluginConfiguration } from \"../types/Configuration\";\nimport { DraggingConfiguration } from \"../types/DraggingConfiguration\";\n\nexport function checkDraggingConfiguration<TType extends ChartType>(\n\tchartInstance: Chart<TType>,\n\tdatasetIndex: number,\n\tdataPointIndex: number,\n\tstate: DragDataState | undefined = ChartJSDragDataPlugin.statesStore.get(\n\t\tchartInstance.id,\n\t),\n): DraggingConfiguration {\n\tif (!state)\n\t\treturn {\n\t\t\tchartDraggingDisabled: true,\n\t\t\tdatasetDraggingDisabled: true,\n\t\t\txAxisDraggingDisabled: true,\n\t\t\tyAxisDraggingDisabled: true,\n\t\t\tdataPointDraggingDisabled: true,\n\t\t};\n\n\tconst dataset = chartInstance.data.datasets[datasetIndex];\n\n\t/** per-chart option */\n\tconst chartDraggingDisabled =\n\t\tchartInstance.config.options?.plugins?.dragData === false;\n\n\t/** per-dataset option */\n\tconst datasetDraggingDisabled =\n\t\tchartDraggingDisabled || dataset.dragData === false;\n\n\t/** x-axis option (per-axis); dragging on the x-axis is disabled by default */\n\tconst _xAxisDraggingPerAxisOptionValue =\n\t\tchartInstance.config.options?.scales?.[state.xAxisID]?.dragData;\n\n\t/** x-axis option (per-axis); dragging on the x-axis is disabled by default */\n\tlet xAxisDraggingDisabled = true;\n\n\tif (\n\t\t!datasetDraggingDisabled &&\n\t\t(_xAxisDraggingPerAxisOptionValue === true || // finally, dragging can be enabled on the x-axis by the plugin options,\n\t\t\t// unless it's explicitly disabled in x-axis options\n\t\t\t((\n\t\t\t\tchartInstance.config.options?.plugins\n\t\t\t\t\t?.dragData as OptionalPluginConfiguration<TType>\n\t\t\t)?.dragX === true &&\n\t\t\t\t_xAxisDraggingPerAxisOptionValue !== false))\n\t) {\n\t\txAxisDraggingDisabled = false;\n\t}\n\n\t/** y-axis option (per-axis); dragging on the y-axis is enabled by default */\n\tconst yAxisDraggingDisabled =\n\t\tdatasetDraggingDisabled ||\n\t\t(\n\t\t\tchartInstance.config.options?.plugins\n\t\t\t\t?.dragData as OptionalPluginConfiguration<TType>\n\t\t)?.dragY === false ||\n\t\tchartInstance.config.options?.scales?.[state.yAxisID]?.dragData === false;\n\n\t/** per-data-point option */\n\tconst dataPointDraggingDisabled =\n\t\tdatasetDraggingDisabled ||\n\t\t(dataset.data[dataPointIndex] as Point | BubbleDataPoint)?.dragData ===\n\t\t\tfalse;\n\n\treturn {\n\t\tchartDraggingDisabled,\n\t\tdatasetDraggingDisabled,\n\t\txAxisDraggingDisabled,\n\t\tyAxisDraggingDisabled,\n\t\tdataPointDraggingDisabled,\n\t};\n}\n"],names:[],mappings:"AAGA,OAAO,qBAAqB,MAAM,WAAW,CAAC;AAK9C,MAAM,UAAU,0BAA0B,CACzC,aAA2B,EAC3B,YAAoB,EACpB,cAAsB,EACtB,KAEC;;IAFD,sBAAA,EAAA,QAAmC,qBAAqB,CAAC,WAAW,CAAC,GAAG,CACvE,aAAa,CAAC,EAAE,CAChB;IAED,IAAI,CAAC,KAAK;QACT,OAAO;YACN,qBAAqB,EAAE,IAAI;YAC3B,uBAAuB,EAAE,IAAI;YAC7B,qBAAqB,EAAE,IAAI;YAC3B,qBAAqB,EAAE,IAAI;YAC3B,yBAAyB,EAAE,IAAI;SAC/B,CAAC;IAEH,IAAM,OAAO,GAAG,aAAa,CAAC,IAAI,CAAC,QAAQ,CAAC,YAAY,CAAC,CAAC;IAE1D,uBAAuB;IACvB,IAAM,qBAAqB,GAC1B,CAAA,MAAA,MAAA,aAAa,CAAC,MAAM,CAAC,OAAO,0CAAE,OAAO,0CAAE,QAAQ,MAAK,KAAK,CAAC;IAE3D,yBAAyB;IACzB,IAAM,uBAAuB,GAC5B,qBAAqB,IAAI,OAAO,CAAC,QAAQ,KAAK,KAAK,CAAC;IAErD,8EAA8E;IAC9E,IAAM,gCAAgC,GACrC,MAAA,MAAA,MAAA,aAAa,CAAC,MAAM,CAAC,OAAO,0CAAE,MAAM,0CAAG,KAAK,CAAC,OAAO,CAAC,0CAAE,QAAQ,CAAC;IAEjE,8EAA8E;IAC9E,IAAI,qBAAqB,GAAG,IAAI,CAAC;IAEjC,IACC,CAAC,uBAAuB;QACxB,CAAC,gCAAgC,KAAK,IAAI,IAAI,wEAAwE;YACrH,oDAAoD;YACpD,CAAC,CAAA,MACA,MAAA,MAAA,aAAa,CAAC,MAAM,CAAC,OAAO,0CAAE,OAAO,0CAClC,QACH,0CAAE,KAAK,MAAK,IAAI;gBAChB,gCAAgC,KAAK,KAAK,CAAC,CAAC,EAC7C,CAAC;QACF,qBAAqB,GAAG,KAAK,CAAC;IAC/B,CAAC;IAED,6EAA6E;IAC7E,IAAM,qBAAqB,GAC1B,uBAAuB;QACvB,CAAA,MACC,MAAA,MAAA,aAAa,CAAC,MAAM,CAAC,OAAO,0CAAE,OAAO,0CAClC,QACH,0CAAE,KAAK,MAAK,KAAK;QAClB,CAAA,MAAA,MAAA,MAAA,aAAa,CAAC,MAAM,CAAC,OAAO,0CAAE,MAAM,0CAAG,KAAK,CAAC,OAAO,CAAC,0CAAE,QAAQ,MAAK,KAAK,CAAC;IAE3E,4BAA4B;IAC5B,IAAM,yBAAyB,GAC9B,uBAAuB;QACvB,CAAA,MAAC,OAAO,CAAC,IAAI,CAAC,cAAc,CAA6B,0CAAE,QAAQ;YAClE,KAAK,CAAC;IAER,OAAO;QACN,qBAAqB,uBAAA;QACrB,uBAAuB,yBAAA;QACvB,qBAAqB,uBAAA;QACrB,qBAAqB,uBAAA;QACrB,yBAAyB,2BAAA;KACzB,CAAC;AACH,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"3e836b8ed6ac1d861650c815add84e61709a8783"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_1ljpymw0m1=function(){return actualCoverage;};}return actualCoverage;}cov_1ljpymw0m1();function checkDraggingConfiguration(chartInstance,datasetIndex,dataPointIndex,state){cov_1ljpymw0m1().f[0]++;var _a,_b,_c,_d,_e,_f,_g,_h,_j,_k,_l,_m,_o,_p,_q;cov_1ljpymw0m1().s[0]++;if(state===void 0){cov_1ljpymw0m1().b[0][0]++;cov_1ljpymw0m1().s[1]++;state=ChartJSDragDataPlugin.statesStore.get(chartInstance.id);}else {cov_1ljpymw0m1().b[0][1]++;}cov_1ljpymw0m1().s[2]++;if(!state){cov_1ljpymw0m1().b[1][0]++;cov_1ljpymw0m1().s[3]++;return {chartDraggingDisabled:true,datasetDraggingDisabled:true,xAxisDraggingDisabled:true,yAxisDraggingDisabled:true,dataPointDraggingDisabled:true};}else {cov_1ljpymw0m1().b[1][1]++;}var dataset=(cov_1ljpymw0m1().s[4]++,chartInstance.data.datasets[datasetIndex]);/** per-chart option */var chartDraggingDisabled=(cov_1ljpymw0m1().s[5]++,((cov_1ljpymw0m1().b[3][0]++,(_b=(cov_1ljpymw0m1().b[5][0]++,(_a=chartInstance.config.options)===null)||(cov_1ljpymw0m1().b[5][1]++,_a===void 0)?(cov_1ljpymw0m1().b[4][0]++,void 0):(cov_1ljpymw0m1().b[4][1]++,_a.plugins))===null)||(cov_1ljpymw0m1().b[3][1]++,_b===void 0)?(cov_1ljpymw0m1().b[2][0]++,void 0):(cov_1ljpymw0m1().b[2][1]++,_b.dragData))===false);/** per-dataset option */var datasetDraggingDisabled=(cov_1ljpymw0m1().s[6]++,(cov_1ljpymw0m1().b[6][0]++,chartDraggingDisabled)||(cov_1ljpymw0m1().b[6][1]++,dataset.dragData===false));/** x-axis option (per-axis); dragging on the x-axis is disabled by default */var _xAxisDraggingPerAxisOptionValue=(cov_1ljpymw0m1().s[7]++,(cov_1ljpymw0m1().b[8][0]++,(_e=(cov_1ljpymw0m1().b[10][0]++,(_d=(cov_1ljpymw0m1().b[12][0]++,(_c=chartInstance.config.options)===null)||(cov_1ljpymw0m1().b[12][1]++,_c===void 0)?(cov_1ljpymw0m1().b[11][0]++,void 0):(cov_1ljpymw0m1().b[11][1]++,_c.scales))===null)||(cov_1ljpymw0m1().b[10][1]++,_d===void 0)?(cov_1ljpymw0m1().b[9][0]++,void 0):(cov_1ljpymw0m1().b[9][1]++,_d[state.xAxisID]))===null)||(cov_1ljpymw0m1().b[8][1]++,_e===void 0)?(cov_1ljpymw0m1().b[7][0]++,void 0):(cov_1ljpymw0m1().b[7][1]++,_e.dragData));/** x-axis option (per-axis); dragging on the x-axis is disabled by default */var xAxisDraggingDisabled=(cov_1ljpymw0m1().s[8]++,true);cov_1ljpymw0m1().s[9]++;if((cov_1ljpymw0m1().b[14][0]++,!datasetDraggingDisabled)&&((cov_1ljpymw0m1().b[14][1]++,_xAxisDraggingPerAxisOptionValue===true)||// finally, dragging can be enabled on the x-axis by the plugin options,
  // unless it's explicitly disabled in x-axis options
  (cov_1ljpymw0m1().b[14][2]++,((cov_1ljpymw0m1().b[16][0]++,(_h=(cov_1ljpymw0m1().b[18][0]++,(_g=(cov_1ljpymw0m1().b[20][0]++,(_f=chartInstance.config.options)===null)||(cov_1ljpymw0m1().b[20][1]++,_f===void 0)?(cov_1ljpymw0m1().b[19][0]++,void 0):(cov_1ljpymw0m1().b[19][1]++,_f.plugins))===null)||(cov_1ljpymw0m1().b[18][1]++,_g===void 0)?(cov_1ljpymw0m1().b[17][0]++,void 0):(cov_1ljpymw0m1().b[17][1]++,_g.dragData))===null)||(cov_1ljpymw0m1().b[16][1]++,_h===void 0)?(cov_1ljpymw0m1().b[15][0]++,void 0):(cov_1ljpymw0m1().b[15][1]++,_h.dragX))===true)&&(cov_1ljpymw0m1().b[14][3]++,_xAxisDraggingPerAxisOptionValue!==false))){cov_1ljpymw0m1().b[13][0]++;cov_1ljpymw0m1().s[10]++;xAxisDraggingDisabled=false;}else {cov_1ljpymw0m1().b[13][1]++;}/** y-axis option (per-axis); dragging on the y-axis is enabled by default */var yAxisDraggingDisabled=(cov_1ljpymw0m1().s[11]++,(cov_1ljpymw0m1().b[21][0]++,datasetDraggingDisabled)||(cov_1ljpymw0m1().b[21][1]++,((cov_1ljpymw0m1().b[23][0]++,(_l=(cov_1ljpymw0m1().b[25][0]++,(_k=(cov_1ljpymw0m1().b[27][0]++,(_j=chartInstance.config.options)===null)||(cov_1ljpymw0m1().b[27][1]++,_j===void 0)?(cov_1ljpymw0m1().b[26][0]++,void 0):(cov_1ljpymw0m1().b[26][1]++,_j.plugins))===null)||(cov_1ljpymw0m1().b[25][1]++,_k===void 0)?(cov_1ljpymw0m1().b[24][0]++,void 0):(cov_1ljpymw0m1().b[24][1]++,_k.dragData))===null)||(cov_1ljpymw0m1().b[23][1]++,_l===void 0)?(cov_1ljpymw0m1().b[22][0]++,void 0):(cov_1ljpymw0m1().b[22][1]++,_l.dragY))===false)||(cov_1ljpymw0m1().b[21][2]++,((cov_1ljpymw0m1().b[29][0]++,(_p=(cov_1ljpymw0m1().b[31][0]++,(_o=(cov_1ljpymw0m1().b[33][0]++,(_m=chartInstance.config.options)===null)||(cov_1ljpymw0m1().b[33][1]++,_m===void 0)?(cov_1ljpymw0m1().b[32][0]++,void 0):(cov_1ljpymw0m1().b[32][1]++,_m.scales))===null)||(cov_1ljpymw0m1().b[31][1]++,_o===void 0)?(cov_1ljpymw0m1().b[30][0]++,void 0):(cov_1ljpymw0m1().b[30][1]++,_o[state.yAxisID]))===null)||(cov_1ljpymw0m1().b[29][1]++,_p===void 0)?(cov_1ljpymw0m1().b[28][0]++,void 0):(cov_1ljpymw0m1().b[28][1]++,_p.dragData))===false));/** per-data-point option */var dataPointDraggingDisabled=(cov_1ljpymw0m1().s[12]++,(cov_1ljpymw0m1().b[34][0]++,datasetDraggingDisabled)||(cov_1ljpymw0m1().b[34][1]++,((cov_1ljpymw0m1().b[36][0]++,(_q=dataset.data[dataPointIndex])===null)||(cov_1ljpymw0m1().b[36][1]++,_q===void 0)?(cov_1ljpymw0m1().b[35][0]++,void 0):(cov_1ljpymw0m1().b[35][1]++,_q.dragData))===false));cov_1ljpymw0m1().s[13]++;return {chartDraggingDisabled:chartDraggingDisabled,datasetDraggingDisabled:datasetDraggingDisabled,xAxisDraggingDisabled:xAxisDraggingDisabled,yAxisDraggingDisabled:yAxisDraggingDisabled,dataPointDraggingDisabled:dataPointDraggingDisabled};}

  function cov_6czysyw9p(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/dragEndCallback.ts";var hash="8a89d312a1dc79e0f422a20c5cbd465f38d74da9";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/dragEndCallback.ts",statementMap:{"0":{start:{line:5,column:4},end:{line:5,column:94}},"1":{start:{line:5,column:28},end:{line:5,column:92}},"2":{start:{line:6,column:4},end:{line:7,column:15}},"3":{start:{line:7,column:8},end:{line:7,column:15}},"4":{start:{line:8,column:19},end:{line:8,column:208}},"5":{start:{line:9,column:4},end:{line:9,column:31}},"6":{start:{line:10,column:4},end:{line:10,column:29}},"7":{start:{line:12,column:4},end:{line:16,column:5}},"8":{start:{line:13,column:8},end:{line:14,column:32}},"9":{start:{line:15,column:8},end:{line:15,column:37}},"10":{start:{line:17,column:4},end:{line:22,column:5}},"11":{start:{line:18,column:27},end:{line:18,column:53}},"12":{start:{line:19,column:20},end:{line:19,column:39}},"13":{start:{line:20,column:20},end:{line:20,column:67}},"14":{start:{line:21,column:8},end:{line:21,column:59}}},fnMap:{"0":{name:"dragEndCallback",decl:{start:{line:3,column:16},end:{line:3,column:31}},loc:{start:{line:3,column:61},end:{line:23,column:1}},line:3}},branchMap:{"0":{loc:{start:{line:5,column:4},end:{line:5,column:94}},type:"if",locations:[{start:{line:5,column:4},end:{line:5,column:94}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:5},"1":{loc:{start:{line:6,column:4},end:{line:7,column:15}},type:"if",locations:[{start:{line:6,column:4},end:{line:7,column:15}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:6},"2":{loc:{start:{line:8,column:19},end:{line:8,column:208}},type:"cond-expr",locations:[{start:{line:8,column:187},end:{line:8,column:193}},{start:{line:8,column:196},end:{line:8,column:208}}],line:8},"3":{loc:{start:{line:8,column:19},end:{line:8,column:184}},type:"binary-expr",locations:[{start:{line:8,column:19},end:{line:8,column:167}},{start:{line:8,column:171},end:{line:8,column:184}}],line:8},"4":{loc:{start:{line:8,column:25},end:{line:8,column:157}},type:"cond-expr",locations:[{start:{line:8,column:137},end:{line:8,column:143}},{start:{line:8,column:146},end:{line:8,column:157}}],line:8},"5":{loc:{start:{line:8,column:25},end:{line:8,column:134}},type:"binary-expr",locations:[{start:{line:8,column:25},end:{line:8,column:117}},{start:{line:8,column:121},end:{line:8,column:134}}],line:8},"6":{loc:{start:{line:8,column:31},end:{line:8,column:107}},type:"cond-expr",locations:[{start:{line:8,column:88},end:{line:8,column:94}},{start:{line:8,column:97},end:{line:8,column:107}}],line:8},"7":{loc:{start:{line:8,column:31},end:{line:8,column:85}},type:"binary-expr",locations:[{start:{line:8,column:31},end:{line:8,column:68}},{start:{line:8,column:72},end:{line:8,column:85}}],line:8},"8":{loc:{start:{line:12,column:4},end:{line:16,column:5}},type:"if",locations:[{start:{line:12,column:4},end:{line:16,column:5}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:12},"9":{loc:{start:{line:12,column:8},end:{line:12,column:146}},type:"cond-expr",locations:[{start:{line:12,column:127},end:{line:12,column:133}},{start:{line:12,column:136},end:{line:12,column:146}}],line:12},"10":{loc:{start:{line:12,column:8},end:{line:12,column:124}},type:"binary-expr",locations:[{start:{line:12,column:8},end:{line:12,column:107}},{start:{line:12,column:111},end:{line:12,column:124}}],line:12},"11":{loc:{start:{line:12,column:14},end:{line:12,column:97}},type:"cond-expr",locations:[{start:{line:12,column:78},end:{line:12,column:84}},{start:{line:12,column:87},end:{line:12,column:97}}],line:12},"12":{loc:{start:{line:12,column:14},end:{line:12,column:75}},type:"binary-expr",locations:[{start:{line:12,column:14},end:{line:12,column:58}},{start:{line:12,column:62},end:{line:12,column:75}}],line:12},"13":{loc:{start:{line:17,column:4},end:{line:22,column:5}},type:"if",locations:[{start:{line:17,column:4},end:{line:22,column:5}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:17},"14":{loc:{start:{line:17,column:8},end:{line:17,column:55}},type:"binary-expr",locations:[{start:{line:17,column:8},end:{line:17,column:38}},{start:{line:17,column:42},end:{line:17,column:55}}],line:17}},s:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0},f:{"0":0},b:{"0":[0,0],"1":[0,0],"2":[0,0],"3":[0,0],"4":[0,0],"5":[0,0],"6":[0,0],"7":[0,0],"8":[0,0],"9":[0,0],"10":[0,0],"11":[0,0],"12":[0,0],"13":[0,0],"14":[0,0]},inputSourceMap:{version:3,sources:["../../../src/util/dragEndCallback.ts"],sourcesContent:["import type { ChartType } from \"chart.js\";\nimport { Chart } from \"chart.js\";\n\nimport ChartJSDragDataPlugin from \"../plugin\";\nimport {\n\tDragDataEvent,\n\tDragDataState,\n\tOptionalPluginConfiguration,\n} from \"../types\";\nimport { applyMagnet } from \"./applyMagnet\";\n\nexport function dragEndCallback<TType extends ChartType>(\n\tevent: DragDataEvent,\n\tchartInstance: Chart<TType>,\n\tstate: DragDataState | undefined = ChartJSDragDataPlugin.statesStore.get(\n\t\tchartInstance.id,\n\t),\n) {\n\tif (!state) return;\n\n\tconst callback = (\n\t\tchartInstance.options?.plugins\n\t\t\t?.dragData as OptionalPluginConfiguration<TType>\n\t)?.onDragEnd;\n\n\tstate.curIndex = undefined;\n\tstate.isDragging = false;\n\n\t// re-enable the tooltip animation\n\tif (chartInstance.config.options?.plugins?.tooltip) {\n\t\tchartInstance.config.options.plugins.tooltip.animation =\n\t\t\tstate.eventSettings;\n\t\tchartInstance.update(\"none\");\n\t}\n\n\tif (typeof callback === \"function\" && state.element) {\n\t\tconst datasetIndex = state.element.datasetIndex;\n\t\tconst index = state.element.index;\n\n\t\tlet value = applyMagnet(chartInstance, datasetIndex, index);\n\n\t\treturn callback(event, datasetIndex, index, value);\n\t}\n}\n"],names:[],mappings:"AAGA,OAAO,qBAAqB,MAAM,WAAW,CAAC;AAM9C,OAAO,EAAE,WAAW,EAAE,MAAM,eAAe,CAAC;AAE5C,MAAM,UAAU,eAAe,CAC9B,KAAoB,EACpB,aAA2B,EAC3B,KAEC;;IAFD,sBAAA,EAAA,QAAmC,qBAAqB,CAAC,WAAW,CAAC,GAAG,CACvE,aAAa,CAAC,EAAE,CAChB;IAED,IAAI,CAAC,KAAK;QAAE,OAAO;IAEnB,IAAM,QAAQ,GAAG,MAChB,MAAA,MAAA,aAAa,CAAC,OAAO,0CAAE,OAAO,0CAC3B,QACH,0CAAE,SAAS,CAAC;IAEb,KAAK,CAAC,QAAQ,GAAG,SAAS,CAAC;IAC3B,KAAK,CAAC,UAAU,GAAG,KAAK,CAAC;IAEzB,kCAAkC;IAClC,IAAI,MAAA,MAAA,aAAa,CAAC,MAAM,CAAC,OAAO,0CAAE,OAAO,0CAAE,OAAO,EAAE,CAAC;QACpD,aAAa,CAAC,MAAM,CAAC,OAAO,CAAC,OAAO,CAAC,OAAO,CAAC,SAAS;YACrD,KAAK,CAAC,aAAa,CAAC;QACrB,aAAa,CAAC,MAAM,CAAC,MAAM,CAAC,CAAC;IAC9B,CAAC;IAED,IAAI,OAAO,QAAQ,KAAK,UAAU,IAAI,KAAK,CAAC,OAAO,EAAE,CAAC;QACrD,IAAM,YAAY,GAAG,KAAK,CAAC,OAAO,CAAC,YAAY,CAAC;QAChD,IAAM,KAAK,GAAG,KAAK,CAAC,OAAO,CAAC,KAAK,CAAC;QAElC,IAAI,KAAK,GAAG,WAAW,CAAC,aAAa,EAAE,YAAY,EAAE,KAAK,CAAC,CAAC;QAE5D,OAAO,QAAQ,CAAC,KAAK,EAAE,YAAY,EAAE,KAAK,EAAE,KAAK,CAAC,CAAC;IACpD,CAAC;AACF,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"8a89d312a1dc79e0f422a20c5cbd465f38d74da9"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_6czysyw9p=function(){return actualCoverage;};}return actualCoverage;}cov_6czysyw9p();function dragEndCallback(event,chartInstance,state){cov_6czysyw9p().f[0]++;var _a,_b,_c,_d,_e;cov_6czysyw9p().s[0]++;if(state===void 0){cov_6czysyw9p().b[0][0]++;cov_6czysyw9p().s[1]++;state=ChartJSDragDataPlugin.statesStore.get(chartInstance.id);}else {cov_6czysyw9p().b[0][1]++;}cov_6czysyw9p().s[2]++;if(!state){cov_6czysyw9p().b[1][0]++;cov_6czysyw9p().s[3]++;return;}else {cov_6czysyw9p().b[1][1]++;}var callback=(cov_6czysyw9p().s[4]++,(cov_6czysyw9p().b[3][0]++,(_c=(cov_6czysyw9p().b[5][0]++,(_b=(cov_6czysyw9p().b[7][0]++,(_a=chartInstance.options)===null)||(cov_6czysyw9p().b[7][1]++,_a===void 0)?(cov_6czysyw9p().b[6][0]++,void 0):(cov_6czysyw9p().b[6][1]++,_a.plugins))===null)||(cov_6czysyw9p().b[5][1]++,_b===void 0)?(cov_6czysyw9p().b[4][0]++,void 0):(cov_6czysyw9p().b[4][1]++,_b.dragData))===null)||(cov_6czysyw9p().b[3][1]++,_c===void 0)?(cov_6czysyw9p().b[2][0]++,void 0):(cov_6czysyw9p().b[2][1]++,_c.onDragEnd));cov_6czysyw9p().s[5]++;state.curIndex=undefined;cov_6czysyw9p().s[6]++;state.isDragging=false;// re-enable the tooltip animation
  cov_6czysyw9p().s[7]++;if((cov_6czysyw9p().b[10][0]++,(_e=(cov_6czysyw9p().b[12][0]++,(_d=chartInstance.config.options)===null)||(cov_6czysyw9p().b[12][1]++,_d===void 0)?(cov_6czysyw9p().b[11][0]++,void 0):(cov_6czysyw9p().b[11][1]++,_d.plugins))===null)||(cov_6czysyw9p().b[10][1]++,_e===void 0)?(cov_6czysyw9p().b[9][0]++,void 0):(cov_6czysyw9p().b[9][1]++,_e.tooltip)){cov_6czysyw9p().b[8][0]++;cov_6czysyw9p().s[8]++;chartInstance.config.options.plugins.tooltip.animation=state.eventSettings;cov_6czysyw9p().s[9]++;chartInstance.update("none");}else {cov_6czysyw9p().b[8][1]++;}cov_6czysyw9p().s[10]++;if((cov_6czysyw9p().b[14][0]++,typeof callback==="function")&&(cov_6czysyw9p().b[14][1]++,state.element)){cov_6czysyw9p().b[13][0]++;var datasetIndex=(cov_6czysyw9p().s[11]++,state.element.datasetIndex);var index=(cov_6czysyw9p().s[12]++,state.element.index);var value=(cov_6czysyw9p().s[13]++,applyMagnet(chartInstance,datasetIndex,index));cov_6czysyw9p().s[14]++;return callback(event,datasetIndex,index,value);}else {cov_6czysyw9p().b[13][1]++;}}

  function cov_17t316qmmr(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/getElement.ts";var hash="7ca2722dc2a3e82bc596c799191abdb491a454cb";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/getElement.ts",statementMap:{"0":{start:{line:7,column:4},end:{line:7,column:94}},"1":{start:{line:7,column:28},end:{line:7,column:92}},"2":{start:{line:8,column:19},end:{line:8,column:210}},"3":{start:{line:9,column:4},end:{line:10,column:15}},"4":{start:{line:10,column:8},end:{line:10,column:15}},"5":{start:{line:11,column:21},end:{line:11,column:210}},"6":{start:{line:11,column:228},end:{line:13,column:5}},"7":{start:{line:14,column:4},end:{line:14,column:104}},"8":{start:{line:15,column:4},end:{line:68,column:5}},"9":{start:{line:16,column:27},end:{line:16,column:53}},"10":{start:{line:17,column:20},end:{line:17,column:39}},"11":{start:{line:19,column:8},end:{line:20,column:175}},"12":{start:{line:22,column:8},end:{line:23,column:208}},"13":{start:{line:24,column:22},end:{line:24,column:63}},"14":{start:{line:25,column:26},end:{line:25,column:68}},"15":{start:{line:26,column:23},end:{line:26,column:42}},"16":{start:{line:28,column:8},end:{line:28,column:44}},"17":{start:{line:29,column:8},end:{line:29,column:44}},"18":{start:{line:30,column:8},end:{line:30,column:44}},"19":{start:{line:31,column:36},end:{line:31,column:98}},"20":{start:{line:31,column:126},end:{line:31,column:171}},"21":{start:{line:31,column:197},end:{line:31,column:240}},"22":{start:{line:31,column:266},end:{line:31,column:309}},"23":{start:{line:31,column:339},end:{line:31,column:386}},"24":{start:{line:33,column:8},end:{line:39,column:9}},"25":{start:{line:37,column:12},end:{line:37,column:33}},"26":{start:{line:38,column:12},end:{line:38,column:19}},"27":{start:{line:40,column:8},end:{line:53,column:9}},"28":{start:{line:42,column:12},end:{line:43,column:266}},"29":{start:{line:45,column:30},end:{line:45,column:68}},"30":{start:{line:46,column:12},end:{line:49,column:44}},"31":{start:{line:50,column:28},end:{line:50,column:81}},"32":{start:{line:51,column:25},end:{line:51,column:101}},"33":{start:{line:52,column:12},end:{line:52,column:48}},"34":{start:{line:55,column:37},end:{line:55,column:235}},"35":{start:{line:56,column:8},end:{line:62,column:9}},"36":{start:{line:58,column:12},end:{line:58,column:106}},"37":{start:{line:59,column:12},end:{line:59,column:114}},"38":{start:{line:60,column:12},end:{line:60,column:122}},"39":{start:{line:61,column:12},end:{line:61,column:75}},"40":{start:{line:63,column:8},end:{line:67,column:9}},"41":{start:{line:64,column:12},end:{line:66,column:13}},"42":{start:{line:65,column:16},end:{line:65,column:37}}},fnMap:{"0":{name:"getElement",decl:{start:{line:4,column:16},end:{line:4,column:26}},loc:{start:{line:4,column:56},end:{line:69,column:1}},line:4}},branchMap:{"0":{loc:{start:{line:7,column:4},end:{line:7,column:94}},type:"if",locations:[{start:{line:7,column:4},end:{line:7,column:94}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:7},"1":{loc:{start:{line:8,column:19},end:{line:8,column:210}},type:"cond-expr",locations:[{start:{line:8,column:187},end:{line:8,column:193}},{start:{line:8,column:196},end:{line:8,column:210}}],line:8},"2":{loc:{start:{line:8,column:19},end:{line:8,column:184}},type:"binary-expr",locations:[{start:{line:8,column:19},end:{line:8,column:167}},{start:{line:8,column:171},end:{line:8,column:184}}],line:8},"3":{loc:{start:{line:8,column:25},end:{line:8,column:157}},type:"cond-expr",locations:[{start:{line:8,column:137},end:{line:8,column:143}},{start:{line:8,column:146},end:{line:8,column:157}}],line:8},"4":{loc:{start:{line:8,column:25},end:{line:8,column:134}},type:"binary-expr",locations:[{start:{line:8,column:25},end:{line:8,column:117}},{start:{line:8,column:121},end:{line:8,column:134}}],line:8},"5":{loc:{start:{line:8,column:31},end:{line:8,column:107}},type:"cond-expr",locations:[{start:{line:8,column:88},end:{line:8,column:94}},{start:{line:8,column:97},end:{line:8,column:107}}],line:8},"6":{loc:{start:{line:8,column:31},end:{line:8,column:85}},type:"binary-expr",locations:[{start:{line:8,column:31},end:{line:8,column:68}},{start:{line:8,column:72},end:{line:8,column:85}}],line:8},"7":{loc:{start:{line:9,column:4},end:{line:10,column:15}},type:"if",locations:[{start:{line:9,column:4},end:{line:10,column:15}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:9},"8":{loc:{start:{line:11,column:21},end:{line:11,column:210}},type:"cond-expr",locations:[{start:{line:11,column:196},end:{line:11,column:198}},{start:{line:11,column:201},end:{line:11,column:210}}],line:11},"9":{loc:{start:{line:11,column:21},end:{line:11,column:193}},type:"binary-expr",locations:[{start:{line:11,column:21},end:{line:11,column:176}},{start:{line:11,column:180},end:{line:11,column:193}}],line:11},"10":{loc:{start:{line:11,column:27},end:{line:11,column:166}},type:"cond-expr",locations:[{start:{line:11,column:150},end:{line:11,column:156}},{start:{line:11,column:159},end:{line:11,column:166}}],line:11},"11":{loc:{start:{line:11,column:27},end:{line:11,column:147}},type:"binary-expr",locations:[{start:{line:11,column:27},end:{line:11,column:130}},{start:{line:11,column:134},end:{line:11,column:147}}],line:11},"12":{loc:{start:{line:11,column:33},end:{line:11,column:120}},type:"cond-expr",locations:[{start:{line:11,column:97},end:{line:11,column:103}},{start:{line:11,column:106},end:{line:11,column:120}}],line:11},"13":{loc:{start:{line:11,column:33},end:{line:11,column:94}},type:"binary-expr",locations:[{start:{line:11,column:33},end:{line:11,column:77}},{start:{line:11,column:81},end:{line:11,column:94}}],line:11},"14":{loc:{start:{line:11,column:228},end:{line:13,column:5}},type:"cond-expr",locations:[{start:{line:11,column:351},end:{line:11,column:353}},{start:{line:11,column:356},end:{line:13,column:5}}],line:11},"15":{loc:{start:{line:11,column:228},end:{line:11,column:348}},type:"binary-expr",locations:[{start:{line:11,column:228},end:{line:11,column:331}},{start:{line:11,column:335},end:{line:11,column:348}}],line:11},"16":{loc:{start:{line:11,column:234},end:{line:11,column:321}},type:"cond-expr",locations:[{start:{line:11,column:298},end:{line:11,column:304}},{start:{line:11,column:307},end:{line:11,column:321}}],line:11},"17":{loc:{start:{line:11,column:234},end:{line:11,column:295}},type:"binary-expr",locations:[{start:{line:11,column:234},end:{line:11,column:278}},{start:{line:11,column:282},end:{line:11,column:295}}],line:11},"18":{loc:{start:{line:15,column:4},end:{line:68,column:5}},type:"if",locations:[{start:{line:15,column:4},end:{line:68,column:5}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:15},"19":{loc:{start:{line:20,column:12},end:{line:20,column:174}},type:"cond-expr",locations:[{start:{line:20,column:160},end:{line:20,column:162}},{start:{line:20,column:165},end:{line:20,column:174}}],line:20},"20":{loc:{start:{line:20,column:12},end:{line:20,column:157}},type:"binary-expr",locations:[{start:{line:20,column:12},end:{line:20,column:140}},{start:{line:20,column:144},end:{line:20,column:157}}],line:20},"21":{loc:{start:{line:20,column:18},end:{line:20,column:130}},type:"cond-expr",locations:[{start:{line:20,column:79},end:{line:20,column:81}},{start:{line:20,column:84},end:{line:20,column:130}}],line:20},"22":{loc:{start:{line:20,column:18},end:{line:20,column:76}},type:"binary-expr",locations:[{start:{line:20,column:18},end:{line:20,column:59}},{start:{line:20,column:63},end:{line:20,column:76}}],line:20},"23":{loc:{start:{line:23,column:12},end:{line:23,column:207}},type:"cond-expr",locations:[{start:{line:23,column:186},end:{line:23,column:192}},{start:{line:23,column:195},end:{line:23,column:207}}],line:23},"24":{loc:{start:{line:23,column:12},end:{line:23,column:183}},type:"binary-expr",locations:[{start:{line:23,column:12},end:{line:23,column:166}},{start:{line:23,column:170},end:{line:23,column:183}}],line:23},"25":{loc:{start:{line:23,column:18},end:{line:23,column:156}},type:"cond-expr",locations:[{start:{line:23,column:137},end:{line:23,column:143}},{start:{line:23,column:146},end:{line:23,column:156}}],line:23},"26":{loc:{start:{line:23,column:18},end:{line:23,column:134}},type:"binary-expr",locations:[{start:{line:23,column:18},end:{line:23,column:117}},{start:{line:23,column:121},end:{line:23,column:134}}],line:23},"27":{loc:{start:{line:23,column:24},end:{line:23,column:107}},type:"cond-expr",locations:[{start:{line:23,column:88},end:{line:23,column:94}},{start:{line:23,column:97},end:{line:23,column:107}}],line:23},"28":{loc:{start:{line:23,column:24},end:{line:23,column:85}},type:"binary-expr",locations:[{start:{line:23,column:24},end:{line:23,column:68}},{start:{line:23,column:72},end:{line:23,column:85}}],line:23},"29":{loc:{start:{line:33,column:8},end:{line:39,column:9}},type:"if",locations:[{start:{line:33,column:8},end:{line:39,column:9}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:33},"30":{loc:{start:{line:33,column:12},end:{line:36,column:37}},type:"binary-expr",locations:[{start:{line:33,column:12},end:{line:33,column:35}},{start:{line:35,column:13},end:{line:35,column:34}},{start:{line:35,column:38},end:{line:35,column:59}},{start:{line:36,column:12},end:{line:36,column:37}}],line:33},"31":{loc:{start:{line:40,column:8},end:{line:53,column:9}},type:"if",locations:[{start:{line:40,column:8},end:{line:53,column:9}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:40},"32":{loc:{start:{line:43,column:16},end:{line:43,column:265}},type:"cond-expr",locations:[{start:{line:43,column:251},end:{line:43,column:253}},{start:{line:43,column:256},end:{line:43,column:265}}],line:43},"33":{loc:{start:{line:43,column:16},end:{line:43,column:248}},type:"binary-expr",locations:[{start:{line:43,column:16},end:{line:43,column:231}},{start:{line:43,column:235},end:{line:43,column:248}}],line:43},"34":{loc:{start:{line:43,column:22},end:{line:43,column:221}},type:"cond-expr",locations:[{start:{line:43,column:202},end:{line:43,column:208}},{start:{line:43,column:211},end:{line:43,column:221}}],line:43},"35":{loc:{start:{line:43,column:22},end:{line:43,column:199}},type:"binary-expr",locations:[{start:{line:43,column:22},end:{line:43,column:182}},{start:{line:43,column:186},end:{line:43,column:199}}],line:43},"36":{loc:{start:{line:43,column:28},end:{line:43,column:172}},type:"cond-expr",locations:[{start:{line:43,column:146},end:{line:43,column:152}},{start:{line:43,column:155},end:{line:43,column:172}}],line:43},"37":{loc:{start:{line:43,column:28},end:{line:43,column:143}},type:"binary-expr",locations:[{start:{line:43,column:28},end:{line:43,column:126}},{start:{line:43,column:130},end:{line:43,column:143}}],line:43},"38":{loc:{start:{line:43,column:34},end:{line:43,column:116}},type:"cond-expr",locations:[{start:{line:43,column:98},end:{line:43,column:104}},{start:{line:43,column:107},end:{line:43,column:116}}],line:43},"39":{loc:{start:{line:43,column:34},end:{line:43,column:95}},type:"binary-expr",locations:[{start:{line:43,column:34},end:{line:43,column:78}},{start:{line:43,column:82},end:{line:43,column:95}}],line:43},"40":{loc:{start:{line:47,column:16},end:{line:49,column:43}},type:"binary-expr",locations:[{start:{line:47,column:16},end:{line:47,column:36}},{start:{line:48,column:20},end:{line:48,column:46}},{start:{line:49,column:20},end:{line:49,column:43}}],line:47},"41":{loc:{start:{line:55,column:37},end:{line:55,column:235}},type:"cond-expr",locations:[{start:{line:55,column:212},end:{line:55,column:218}},{start:{line:55,column:221},end:{line:55,column:235}}],line:55},"42":{loc:{start:{line:55,column:37},end:{line:55,column:209}},type:"binary-expr",locations:[{start:{line:55,column:37},end:{line:55,column:192}},{start:{line:55,column:196},end:{line:55,column:209}}],line:55},"43":{loc:{start:{line:55,column:43},end:{line:55,column:182}},type:"cond-expr",locations:[{start:{line:55,column:162},end:{line:55,column:168}},{start:{line:55,column:171},end:{line:55,column:182}}],line:55},"44":{loc:{start:{line:55,column:43},end:{line:55,column:159}},type:"binary-expr",locations:[{start:{line:55,column:43},end:{line:55,column:142}},{start:{line:55,column:146},end:{line:55,column:159}}],line:55},"45":{loc:{start:{line:55,column:49},end:{line:55,column:132}},type:"cond-expr",locations:[{start:{line:55,column:113},end:{line:55,column:119}},{start:{line:55,column:122},end:{line:55,column:132}}],line:55},"46":{loc:{start:{line:55,column:49},end:{line:55,column:110}},type:"binary-expr",locations:[{start:{line:55,column:49},end:{line:55,column:93}},{start:{line:55,column:97},end:{line:55,column:110}}],line:55},"47":{loc:{start:{line:56,column:8},end:{line:62,column:9}},type:"if",locations:[{start:{line:56,column:8},end:{line:62,column:9}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:56},"48":{loc:{start:{line:56,column:12},end:{line:57,column:43}},type:"binary-expr",locations:[{start:{line:56,column:12},end:{line:56,column:48}},{start:{line:57,column:12},end:{line:57,column:43}}],line:56},"49":{loc:{start:{line:58,column:12},end:{line:58,column:105}},type:"cond-expr",locations:[{start:{line:58,column:83},end:{line:58,column:85}},{start:{line:58,column:89},end:{line:58,column:104}}],line:58},"50":{loc:{start:{line:58,column:12},end:{line:58,column:80}},type:"binary-expr",locations:[{start:{line:58,column:12},end:{line:58,column:63}},{start:{line:58,column:67},end:{line:58,column:80}}],line:58},"51":{loc:{start:{line:59,column:12},end:{line:59,column:113}},type:"cond-expr",locations:[{start:{line:59,column:91},end:{line:59,column:93}},{start:{line:59,column:97},end:{line:59,column:112}}],line:59},"52":{loc:{start:{line:59,column:12},end:{line:59,column:88}},type:"binary-expr",locations:[{start:{line:59,column:12},end:{line:59,column:71}},{start:{line:59,column:75},end:{line:59,column:88}}],line:59},"53":{loc:{start:{line:60,column:12},end:{line:60,column:121}},type:"cond-expr",locations:[{start:{line:60,column:99},end:{line:60,column:101}},{start:{line:60,column:105},end:{line:60,column:120}}],line:60},"54":{loc:{start:{line:60,column:12},end:{line:60,column:96}},type:"binary-expr",locations:[{start:{line:60,column:12},end:{line:60,column:79}},{start:{line:60,column:83},end:{line:60,column:96}}],line:60},"55":{loc:{start:{line:63,column:8},end:{line:67,column:9}},type:"if",locations:[{start:{line:63,column:8},end:{line:67,column:9}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:63},"56":{loc:{start:{line:63,column:12},end:{line:63,column:59}},type:"binary-expr",locations:[{start:{line:63,column:12},end:{line:63,column:42}},{start:{line:63,column:46},end:{line:63,column:59}}],line:63},"57":{loc:{start:{line:64,column:12},end:{line:66,column:13}},type:"if",locations:[{start:{line:64,column:12},end:{line:66,column:13}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:64}},s:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0,"42":0},f:{"0":0},b:{"0":[0,0],"1":[0,0],"2":[0,0],"3":[0,0],"4":[0,0],"5":[0,0],"6":[0,0],"7":[0,0],"8":[0,0],"9":[0,0],"10":[0,0],"11":[0,0],"12":[0,0],"13":[0,0],"14":[0,0],"15":[0,0],"16":[0,0],"17":[0,0],"18":[0,0],"19":[0,0],"20":[0,0],"21":[0,0],"22":[0,0],"23":[0,0],"24":[0,0],"25":[0,0],"26":[0,0],"27":[0,0],"28":[0,0],"29":[0,0],"30":[0,0,0,0],"31":[0,0],"32":[0,0],"33":[0,0],"34":[0,0],"35":[0,0],"36":[0,0],"37":[0,0],"38":[0,0],"39":[0,0],"40":[0,0,0],"41":[0,0],"42":[0,0],"43":[0,0],"44":[0,0],"45":[0,0],"46":[0,0],"47":[0,0],"48":[0,0],"49":[0,0],"50":[0,0],"51":[0,0],"52":[0,0],"53":[0,0],"54":[0,0],"55":[0,0],"56":[0,0],"57":[0,0]},inputSourceMap:{version:3,sources:["../../../src/util/getElement.ts"],sourcesContent:["import type {\n\tCartesianScaleOptions,\n\tChartConfiguration,\n\tChartType,\n} from \"chart.js\";\nimport { Chart } from \"chart.js\";\n\nimport ChartJSDragDataPlugin from \"../plugin\";\nimport {\n\tDragDataEvent,\n\tDragDataState,\n\tOptionalPluginConfiguration,\n} from \"../types\";\nimport { checkDraggingConfiguration } from \"../util/checkDraggingConfiguration\";\nimport { calcCartesian } from \"./calc\";\n\nexport function getElement<TType extends ChartType>(\n\tevent: DragDataEvent,\n\tchartInstance: Chart<TType>,\n\tstate: DragDataState | undefined = ChartJSDragDataPlugin.statesStore.get(\n\t\tchartInstance.id,\n\t),\n) {\n\tconst callback = (\n\t\tchartInstance.options?.plugins\n\t\t\t?.dragData as OptionalPluginConfiguration<TType>\n\t)?.onDragStart;\n\n\tif (!state) return;\n\n\tconst searchMode =\n\t\t\tchartInstance.config.options?.interaction?.mode ?? \"nearest\",\n\t\tsearchOptions = chartInstance.config.options?.interaction ?? {\n\t\t\tintersect: true,\n\t\t};\n\n\tstate.element = chartInstance.getElementsAtEventForMode(\n\t\tevent,\n\t\tsearchMode,\n\t\tsearchOptions,\n\t\tfalse,\n\t)[0];\n\n\tif (state.element) {\n\t\tlet datasetIndex = state.element.datasetIndex;\n\t\tlet index = state.element.index;\n\n\t\t// note: type may be absent if config is ChartConfigurationCustomTypesPerDataset, in which case we pull this value from the dataset\n\t\tstate.type =\n\t\t\t(chartInstance.config as ChartConfiguration<TType>).type ??\n\t\t\tchartInstance.data.datasets[datasetIndex].type ??\n\t\t\tundefined;\n\n\t\t// save element settings\n\t\tstate.eventSettings =\n\t\t\tchartInstance.config.options?.plugins?.tooltip?.animation;\n\n\t\tconst dataset = chartInstance.data.datasets[datasetIndex];\n\t\tconst datasetMeta = chartInstance.getDatasetMeta(datasetIndex);\n\t\tlet curValue = dataset.data[index];\n\t\t// get the id of the datasets scale\n\t\tstate.xAxisID = datasetMeta.xAxisID!;\n\t\tstate.yAxisID = datasetMeta.yAxisID!;\n\t\tstate.rAxisID = datasetMeta.rAxisID!;\n\n\t\tconst draggingConfiguration = checkDraggingConfiguration(\n\t\t\t\tchartInstance,\n\t\t\t\tdatasetIndex,\n\t\t\t\tindex,\n\t\t\t),\n\t\t\t{\n\t\t\t\tdatasetDraggingDisabled,\n\t\t\t\txAxisDraggingDisabled,\n\t\t\t\tyAxisDraggingDisabled,\n\t\t\t\tdataPointDraggingDisabled,\n\t\t\t} = draggingConfiguration;\n\n\t\t// check if dragging the dataset or datapoint is prohibited\n\t\tif (\n\t\t\tdatasetDraggingDisabled ||\n\t\t\t// dragging disabled on all scales\n\t\t\t(xAxisDraggingDisabled && yAxisDraggingDisabled) ||\n\t\t\tdataPointDraggingDisabled\n\t\t) {\n\t\t\tstate.element = null;\n\t\t\treturn;\n\t\t}\n\n\t\tif (state.type === \"bar\") {\n\t\t\t// note: stacked may be missing in RadialLinearScaleOptions\n\t\t\tstate.stacked =\n\t\t\t\t(\n\t\t\t\t\tchartInstance.config.options?.scales?.[\n\t\t\t\t\t\tstate.xAxisID\n\t\t\t\t\t] as CartesianScaleOptions\n\t\t\t\t)?.stacked ?? undefined;\n\n\t\t\t// if a bar has a data point that is an array of length 2, it's a floating bar\n\t\t\tconst samplePoint = chartInstance.data.datasets[0].data[0];\n\t\t\tstate.floatingBar =\n\t\t\t\tsamplePoint !== null &&\n\t\t\t\tArray.isArray(samplePoint) &&\n\t\t\t\tsamplePoint.length >= 2;\n\n\t\t\tlet dataPoint = chartInstance.data.datasets[datasetIndex].data[index]!;\n\t\t\tlet newPos = calcCartesian(\n\t\t\t\tevent,\n\t\t\t\tchartInstance,\n\t\t\t\tdataPoint,\n\t\t\t\tdraggingConfiguration,\n\t\t\t\tstate,\n\t\t\t);\n\t\t\tstate.initValue = (newPos as number) - (curValue as number);\n\t\t}\n\n\t\t// disable the tooltip animation\n\t\tconst showTooltipOptionValue = (\n\t\t\tchartInstance.config.options?.plugins\n\t\t\t\t?.dragData as OptionalPluginConfiguration<TType>\n\t\t)?.showTooltip;\n\t\tif (\n\t\t\tshowTooltipOptionValue === undefined ||\n\t\t\tshowTooltipOptionValue === true\n\t\t) {\n\t\t\tchartInstance.config.options ??= {} as any;\n\t\t\tchartInstance.config.options!.plugins ??= {} as any;\n\t\t\tchartInstance.config.options!.plugins!.tooltip ??= {} as any;\n\n\t\t\tchartInstance.config.options!.plugins!.tooltip!.animation = false;\n\t\t}\n\n\t\tif (typeof callback === \"function\" && state.element) {\n\t\t\tif (callback(event, datasetIndex, index, curValue) === false) {\n\t\t\t\tstate.element = null;\n\t\t\t}\n\t\t}\n\t}\n}\n"],names:[],mappings:"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",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"7ca2722dc2a3e82bc596c799191abdb491a454cb"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_17t316qmmr=function(){return actualCoverage;};}return actualCoverage;}cov_17t316qmmr();function getElement(event,chartInstance,state){cov_17t316qmmr().f[0]++;var _a,_b,_c,_d,_e,_f,_g,_h,_j,_k,_l,_m,_o,_p,_q,_r,_s,_t,_u,_v,_w,_x,_y;var _z,_0,_1;cov_17t316qmmr().s[0]++;if(state===void 0){cov_17t316qmmr().b[0][0]++;cov_17t316qmmr().s[1]++;state=ChartJSDragDataPlugin.statesStore.get(chartInstance.id);}else {cov_17t316qmmr().b[0][1]++;}var callback=(cov_17t316qmmr().s[2]++,(cov_17t316qmmr().b[2][0]++,(_c=(cov_17t316qmmr().b[4][0]++,(_b=(cov_17t316qmmr().b[6][0]++,(_a=chartInstance.options)===null)||(cov_17t316qmmr().b[6][1]++,_a===void 0)?(cov_17t316qmmr().b[5][0]++,void 0):(cov_17t316qmmr().b[5][1]++,_a.plugins))===null)||(cov_17t316qmmr().b[4][1]++,_b===void 0)?(cov_17t316qmmr().b[3][0]++,void 0):(cov_17t316qmmr().b[3][1]++,_b.dragData))===null)||(cov_17t316qmmr().b[2][1]++,_c===void 0)?(cov_17t316qmmr().b[1][0]++,void 0):(cov_17t316qmmr().b[1][1]++,_c.onDragStart));cov_17t316qmmr().s[3]++;if(!state){cov_17t316qmmr().b[7][0]++;cov_17t316qmmr().s[4]++;return;}else {cov_17t316qmmr().b[7][1]++;}var searchMode=(cov_17t316qmmr().s[5]++,(cov_17t316qmmr().b[9][0]++,(_f=(cov_17t316qmmr().b[11][0]++,(_e=(cov_17t316qmmr().b[13][0]++,(_d=chartInstance.config.options)===null)||(cov_17t316qmmr().b[13][1]++,_d===void 0)?(cov_17t316qmmr().b[12][0]++,void 0):(cov_17t316qmmr().b[12][1]++,_d.interaction))===null)||(cov_17t316qmmr().b[11][1]++,_e===void 0)?(cov_17t316qmmr().b[10][0]++,void 0):(cov_17t316qmmr().b[10][1]++,_e.mode))!==null)&&(cov_17t316qmmr().b[9][1]++,_f!==void 0)?(cov_17t316qmmr().b[8][0]++,_f):(cov_17t316qmmr().b[8][1]++,"nearest")),searchOptions=(cov_17t316qmmr().s[6]++,(cov_17t316qmmr().b[15][0]++,(_h=(cov_17t316qmmr().b[17][0]++,(_g=chartInstance.config.options)===null)||(cov_17t316qmmr().b[17][1]++,_g===void 0)?(cov_17t316qmmr().b[16][0]++,void 0):(cov_17t316qmmr().b[16][1]++,_g.interaction))!==null)&&(cov_17t316qmmr().b[15][1]++,_h!==void 0)?(cov_17t316qmmr().b[14][0]++,_h):(cov_17t316qmmr().b[14][1]++,{intersect:true}));cov_17t316qmmr().s[7]++;state.element=chartInstance.getElementsAtEventForMode(event,searchMode,searchOptions,false)[0];cov_17t316qmmr().s[8]++;if(state.element){cov_17t316qmmr().b[18][0]++;var datasetIndex=(cov_17t316qmmr().s[9]++,state.element.datasetIndex);var index=(cov_17t316qmmr().s[10]++,state.element.index);// note: type may be absent if config is ChartConfigurationCustomTypesPerDataset, in which case we pull this value from the dataset
  cov_17t316qmmr().s[11]++;state.type=(cov_17t316qmmr().b[20][0]++,(_k=(cov_17t316qmmr().b[22][0]++,(_j=chartInstance.config.type)!==null)&&(cov_17t316qmmr().b[22][1]++,_j!==void 0)?(cov_17t316qmmr().b[21][0]++,_j):(cov_17t316qmmr().b[21][1]++,chartInstance.data.datasets[datasetIndex].type))!==null)&&(cov_17t316qmmr().b[20][1]++,_k!==void 0)?(cov_17t316qmmr().b[19][0]++,_k):(cov_17t316qmmr().b[19][1]++,undefined);// save element settings
  cov_17t316qmmr().s[12]++;state.eventSettings=(cov_17t316qmmr().b[24][0]++,(_o=(cov_17t316qmmr().b[26][0]++,(_m=(cov_17t316qmmr().b[28][0]++,(_l=chartInstance.config.options)===null)||(cov_17t316qmmr().b[28][1]++,_l===void 0)?(cov_17t316qmmr().b[27][0]++,void 0):(cov_17t316qmmr().b[27][1]++,_l.plugins))===null)||(cov_17t316qmmr().b[26][1]++,_m===void 0)?(cov_17t316qmmr().b[25][0]++,void 0):(cov_17t316qmmr().b[25][1]++,_m.tooltip))===null)||(cov_17t316qmmr().b[24][1]++,_o===void 0)?(cov_17t316qmmr().b[23][0]++,void 0):(cov_17t316qmmr().b[23][1]++,_o.animation);var dataset=(cov_17t316qmmr().s[13]++,chartInstance.data.datasets[datasetIndex]);var datasetMeta=(cov_17t316qmmr().s[14]++,chartInstance.getDatasetMeta(datasetIndex));var curValue=(cov_17t316qmmr().s[15]++,dataset.data[index]);// get the id of the datasets scale
  cov_17t316qmmr().s[16]++;state.xAxisID=datasetMeta.xAxisID;cov_17t316qmmr().s[17]++;state.yAxisID=datasetMeta.yAxisID;cov_17t316qmmr().s[18]++;state.rAxisID=datasetMeta.rAxisID;var draggingConfiguration=(cov_17t316qmmr().s[19]++,checkDraggingConfiguration(chartInstance,datasetIndex,index)),datasetDraggingDisabled=(cov_17t316qmmr().s[20]++,draggingConfiguration.datasetDraggingDisabled),xAxisDraggingDisabled=(cov_17t316qmmr().s[21]++,draggingConfiguration.xAxisDraggingDisabled),yAxisDraggingDisabled=(cov_17t316qmmr().s[22]++,draggingConfiguration.yAxisDraggingDisabled),dataPointDraggingDisabled=(cov_17t316qmmr().s[23]++,draggingConfiguration.dataPointDraggingDisabled);// check if dragging the dataset or datapoint is prohibited
  cov_17t316qmmr().s[24]++;if((cov_17t316qmmr().b[30][0]++,datasetDraggingDisabled)||// dragging disabled on all scales
  (cov_17t316qmmr().b[30][1]++,xAxisDraggingDisabled)&&(cov_17t316qmmr().b[30][2]++,yAxisDraggingDisabled)||(cov_17t316qmmr().b[30][3]++,dataPointDraggingDisabled)){cov_17t316qmmr().b[29][0]++;cov_17t316qmmr().s[25]++;state.element=null;cov_17t316qmmr().s[26]++;return;}else {cov_17t316qmmr().b[29][1]++;}cov_17t316qmmr().s[27]++;if(state.type==="bar"){cov_17t316qmmr().b[31][0]++;cov_17t316qmmr().s[28]++;// note: stacked may be missing in RadialLinearScaleOptions
  state.stacked=(cov_17t316qmmr().b[33][0]++,(_s=(cov_17t316qmmr().b[35][0]++,(_r=(cov_17t316qmmr().b[37][0]++,(_q=(cov_17t316qmmr().b[39][0]++,(_p=chartInstance.config.options)===null)||(cov_17t316qmmr().b[39][1]++,_p===void 0)?(cov_17t316qmmr().b[38][0]++,void 0):(cov_17t316qmmr().b[38][1]++,_p.scales))===null)||(cov_17t316qmmr().b[37][1]++,_q===void 0)?(cov_17t316qmmr().b[36][0]++,void 0):(cov_17t316qmmr().b[36][1]++,_q[state.xAxisID]))===null)||(cov_17t316qmmr().b[35][1]++,_r===void 0)?(cov_17t316qmmr().b[34][0]++,void 0):(cov_17t316qmmr().b[34][1]++,_r.stacked))!==null)&&(cov_17t316qmmr().b[33][1]++,_s!==void 0)?(cov_17t316qmmr().b[32][0]++,_s):(cov_17t316qmmr().b[32][1]++,undefined);// if a bar has a data point that is an array of length 2, it's a floating bar
  var samplePoint=(cov_17t316qmmr().s[29]++,chartInstance.data.datasets[0].data[0]);cov_17t316qmmr().s[30]++;state.floatingBar=(cov_17t316qmmr().b[40][0]++,samplePoint!==null)&&(cov_17t316qmmr().b[40][1]++,Array.isArray(samplePoint))&&(cov_17t316qmmr().b[40][2]++,samplePoint.length>=2);var dataPoint=(cov_17t316qmmr().s[31]++,chartInstance.data.datasets[datasetIndex].data[index]);var newPos=(cov_17t316qmmr().s[32]++,calcCartesian(event,chartInstance,dataPoint,draggingConfiguration,state));cov_17t316qmmr().s[33]++;state.initValue=newPos-curValue;}else {cov_17t316qmmr().b[31][1]++;}// disable the tooltip animation
  var showTooltipOptionValue=(cov_17t316qmmr().s[34]++,(cov_17t316qmmr().b[42][0]++,(_v=(cov_17t316qmmr().b[44][0]++,(_u=(cov_17t316qmmr().b[46][0]++,(_t=chartInstance.config.options)===null)||(cov_17t316qmmr().b[46][1]++,_t===void 0)?(cov_17t316qmmr().b[45][0]++,void 0):(cov_17t316qmmr().b[45][1]++,_t.plugins))===null)||(cov_17t316qmmr().b[44][1]++,_u===void 0)?(cov_17t316qmmr().b[43][0]++,void 0):(cov_17t316qmmr().b[43][1]++,_u.dragData))===null)||(cov_17t316qmmr().b[42][1]++,_v===void 0)?(cov_17t316qmmr().b[41][0]++,void 0):(cov_17t316qmmr().b[41][1]++,_v.showTooltip));cov_17t316qmmr().s[35]++;if((cov_17t316qmmr().b[48][0]++,showTooltipOptionValue===undefined)||(cov_17t316qmmr().b[48][1]++,showTooltipOptionValue===true)){cov_17t316qmmr().b[47][0]++;cov_17t316qmmr().s[36]++;(cov_17t316qmmr().b[50][0]++,(_w=(_z=chartInstance.config).options)!==null)&&(cov_17t316qmmr().b[50][1]++,_w!==void 0)?(cov_17t316qmmr().b[49][0]++,_w):(cov_17t316qmmr().b[49][1]++,_z.options={});cov_17t316qmmr().s[37]++;(cov_17t316qmmr().b[52][0]++,(_x=(_0=chartInstance.config.options).plugins)!==null)&&(cov_17t316qmmr().b[52][1]++,_x!==void 0)?(cov_17t316qmmr().b[51][0]++,_x):(cov_17t316qmmr().b[51][1]++,_0.plugins={});cov_17t316qmmr().s[38]++;(cov_17t316qmmr().b[54][0]++,(_y=(_1=chartInstance.config.options.plugins).tooltip)!==null)&&(cov_17t316qmmr().b[54][1]++,_y!==void 0)?(cov_17t316qmmr().b[53][0]++,_y):(cov_17t316qmmr().b[53][1]++,_1.tooltip={});cov_17t316qmmr().s[39]++;chartInstance.config.options.plugins.tooltip.animation=false;}else {cov_17t316qmmr().b[47][1]++;}cov_17t316qmmr().s[40]++;if((cov_17t316qmmr().b[56][0]++,typeof callback==="function")&&(cov_17t316qmmr().b[56][1]++,state.element)){cov_17t316qmmr().b[55][0]++;cov_17t316qmmr().s[41]++;if(callback(event,datasetIndex,index,curValue)===false){cov_17t316qmmr().b[57][0]++;cov_17t316qmmr().s[42]++;state.element=null;}else {cov_17t316qmmr().b[57][1]++;}}else {cov_17t316qmmr().b[55][1]++;}}else {cov_17t316qmmr().b[18][1]++;}}

  function cov_r9mvpzvyj(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/updateData.ts";var hash="87a38de6c7773ebcff6981c9a4e20c617496f8c9";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/updateData.ts",statementMap:{"0":{start:{line:7,column:4},end:{line:7,column:94}},"1":{start:{line:7,column:28},end:{line:7,column:92}},"2":{start:{line:8,column:4},end:{line:8,column:34}},"3":{start:{line:9,column:4},end:{line:10,column:15}},"4":{start:{line:10,column:8},end:{line:10,column:15}},"5":{start:{line:11,column:24},end:{line:11,column:156}},"6":{start:{line:12,column:19},end:{line:12,column:101}},"7":{start:{line:13,column:4},end:{line:57,column:5}},"8":{start:{line:14,column:8},end:{line:14,column:59}},"9":{start:{line:15,column:8},end:{line:15,column:45}},"10":{start:{line:16,column:8},end:{line:16,column:32}},"11":{start:{line:17,column:24},end:{line:17,column:95}},"12":{start:{line:18,column:36},end:{line:18,column:116}},"13":{start:{line:19,column:8},end:{line:28,column:9}},"14":{start:{line:20,column:12},end:{line:20,column:101}},"15":{start:{line:22,column:13},end:{line:28,column:9}},"16":{start:{line:23,column:28},end:{line:23,column:104}},"17":{start:{line:24,column:12},end:{line:24,column:147}},"18":{start:{line:27,column:12},end:{line:27,column:101}},"19":{start:{line:30,column:8},end:{line:47,column:9}},"20":{start:{line:35,column:27},end:{line:35,column:122}},"21":{start:{line:36,column:12},end:{line:46,column:13}},"22":{start:{line:37,column:16},end:{line:37,column:76}},"23":{start:{line:39,column:16},end:{line:39,column:41}},"24":{start:{line:40,column:16},end:{line:40,column:37}},"25":{start:{line:42,column:16},end:{line:42,column:52}},"26":{start:{line:44,column:16},end:{line:44,column:45}},"27":{start:{line:45,column:16},end:{line:45,column:23}},"28":{start:{line:48,column:22},end:{line:51,column:18}},"29":{start:{line:52,column:8},end:{line:56,column:9}},"30":{start:{line:53,column:12},end:{line:54,column:26}},"31":{start:{line:55,column:12},end:{line:55,column:41}},"32":{start:{line:61,column:17},end:{line:61,column:34}},"33":{start:{line:62,column:17},end:{line:62,column:34}},"34":{start:{line:63,column:15},end:{line:63,column:54}},"35":{start:{line:64,column:15},end:{line:64,column:54}},"36":{start:{line:65,column:15},end:{line:65,column:29}},"37":{start:{line:66,column:23},end:{line:66,column:42}},"38":{start:{line:67,column:4},end:{line:82,column:7}},"39":{start:{line:68,column:8},end:{line:71,column:25}},"40":{start:{line:71,column:12},end:{line:71,column:25}},"41":{start:{line:72,column:21},end:{line:72,column:33}},"42":{start:{line:73,column:8},end:{line:81,column:11}},"43":{start:{line:74,column:21},end:{line:74,column:53}},"44":{start:{line:75,column:21},end:{line:75,column:53}},"45":{start:{line:76,column:21},end:{line:76,column:28}},"46":{start:{line:77,column:21},end:{line:77,column:30}},"47":{start:{line:78,column:21},end:{line:78,column:30}},"48":{start:{line:79,column:23},end:{line:79,column:51}},"49":{start:{line:80,column:12},end:{line:80,column:36}}},fnMap:{"0":{name:"updateData",decl:{start:{line:5,column:16},end:{line:5,column:26}},loc:{start:{line:5,column:56},end:{line:58,column:1}},line:5},"1":{name:"checkBubbleCollisionPixelSpace",decl:{start:{line:60,column:9},end:{line:60,column:39}},loc:{start:{line:60,column:87},end:{line:83,column:1}},line:60},"2":{name:"(anonymous_2)",decl:{start:{line:67,column:29},end:{line:67,column:30}},loc:{start:{line:67,column:51},end:{line:82,column:5}},line:67},"3":{name:"(anonymous_3)",decl:{start:{line:73,column:27},end:{line:73,column:28}},loc:{start:{line:73,column:44},end:{line:81,column:9}},line:73}},branchMap:{"0":{loc:{start:{line:7,column:4},end:{line:7,column:94}},type:"if",locations:[{start:{line:7,column:4},end:{line:7,column:94}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:7},"1":{loc:{start:{line:9,column:4},end:{line:10,column:15}},type:"if",locations:[{start:{line:9,column:4},end:{line:10,column:15}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:9},"2":{loc:{start:{line:11,column:24},end:{line:11,column:156}},type:"cond-expr",locations:[{start:{line:11,column:136},end:{line:11,column:142}},{start:{line:11,column:145},end:{line:11,column:156}}],line:11},"3":{loc:{start:{line:11,column:24},end:{line:11,column:133}},type:"binary-expr",locations:[{start:{line:11,column:24},end:{line:11,column:116}},{start:{line:11,column:120},end:{line:11,column:133}}],line:11},"4":{loc:{start:{line:11,column:30},end:{line:11,column:106}},type:"cond-expr",locations:[{start:{line:11,column:87},end:{line:11,column:93}},{start:{line:11,column:96},end:{line:11,column:106}}],line:11},"5":{loc:{start:{line:11,column:30},end:{line:11,column:84}},type:"binary-expr",locations:[{start:{line:11,column:30},end:{line:11,column:67}},{start:{line:11,column:71},end:{line:11,column:84}}],line:11},"6":{loc:{start:{line:12,column:19},end:{line:12,column:101}},type:"cond-expr",locations:[{start:{line:12,column:72},end:{line:12,column:78}},{start:{line:12,column:81},end:{line:12,column:101}}],line:12},"7":{loc:{start:{line:12,column:19},end:{line:12,column:69}},type:"binary-expr",locations:[{start:{line:12,column:19},end:{line:12,column:41}},{start:{line:12,column:45},end:{line:12,column:69}}],line:12},"8":{loc:{start:{line:13,column:4},end:{line:57,column:5}},type:"if",locations:[{start:{line:13,column:4},end:{line:57,column:5}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:13},"9":{loc:{start:{line:19,column:8},end:{line:28,column:9}},type:"if",locations:[{start:{line:19,column:8},end:{line:28,column:9}},{start:{line:22,column:13},end:{line:28,column:9}}],line:19},"10":{loc:{start:{line:19,column:12},end:{line:19,column:64}},type:"binary-expr",locations:[{start:{line:19,column:12},end:{line:19,column:34}},{start:{line:19,column:38},end:{line:19,column:64}}],line:19},"11":{loc:{start:{line:22,column:13},end:{line:28,column:9}},type:"if",locations:[{start:{line:22,column:13},end:{line:28,column:9}},{start:{line:26,column:13},end:{line:28,column:9}}],line:22},"12":{loc:{start:{line:24,column:64},end:{line:24,column:145}},type:"cond-expr",locations:[{start:{line:24,column:117},end:{line:24,column:123}},{start:{line:24,column:126},end:{line:24,column:145}}],line:24},"13":{loc:{start:{line:24,column:64},end:{line:24,column:114}},type:"binary-expr",locations:[{start:{line:24,column:64},end:{line:24,column:86}},{start:{line:24,column:90},end:{line:24,column:114}}],line:24},"14":{loc:{start:{line:30,column:8},end:{line:47,column:9}},type:"if",locations:[{start:{line:30,column:8},end:{line:47,column:9}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:30},"15":{loc:{start:{line:30,column:12},end:{line:34,column:28}},type:"binary-expr",locations:[{start:{line:30,column:12},end:{line:30,column:50}},{start:{line:31,column:12},end:{line:31,column:41}},{start:{line:32,column:12},end:{line:32,column:28}},{start:{line:33,column:12},end:{line:33,column:28}},{start:{line:34,column:12},end:{line:34,column:28}}],line:30},"16":{loc:{start:{line:36,column:12},end:{line:46,column:13}},type:"if",locations:[{start:{line:36,column:12},end:{line:46,column:13}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:36},"17":{loc:{start:{line:48,column:22},end:{line:51,column:18}},type:"cond-expr",locations:[{start:{line:49,column:14},end:{line:50,column:21}},{start:{line:51,column:14},end:{line:51,column:18}}],line:48},"18":{loc:{start:{line:52,column:8},end:{line:56,column:9}},type:"if",locations:[{start:{line:52,column:8},end:{line:56,column:9}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:52},"19":{loc:{start:{line:68,column:8},end:{line:71,column:25}},type:"if",locations:[{start:{line:68,column:8},end:{line:71,column:25}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:68},"20":{loc:{start:{line:68,column:12},end:{line:70,column:37}},type:"binary-expr",locations:[{start:{line:68,column:12},end:{line:68,column:30}},{start:{line:69,column:12},end:{line:69,column:38}},{start:{line:70,column:12},end:{line:70,column:37}}],line:68}},s:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0,"42":0,"43":0,"44":0,"45":0,"46":0,"47":0,"48":0,"49":0},f:{"0":0,"1":0,"2":0,"3":0},b:{"0":[0,0],"1":[0,0],"2":[0,0],"3":[0,0],"4":[0,0],"5":[0,0],"6":[0,0],"7":[0,0],"8":[0,0],"9":[0,0],"10":[0,0],"11":[0,0],"12":[0,0],"13":[0,0],"14":[0,0],"15":[0,0,0,0,0],"16":[0,0],"17":[0,0],"18":[0,0],"19":[0,0],"20":[0,0,0]},inputSourceMap:{version:3,sources:["../../../src/util/updateData.ts"],sourcesContent:["// src/util/updateData.ts\nimport type { ChartType } from \"chart.js\";\nimport { Chart } from \"chart.js\";\n\nimport ChartJSDragDataPlugin from \"../plugin\";\nimport {\n\tDragDataEvent,\n\tDragDataState,\n\tOptionalPluginConfiguration,\n} from \"../types\";\nimport { checkDraggingConfiguration } from \"../util/checkDraggingConfiguration\";\nimport { calcCartesian, calcRadialLinear } from \"./calc\";\nimport { roundValue } from \"./roundValue\";\n\nexport function updateData<TType extends ChartType>(\n\tevent: DragDataEvent,\n\tchartInstance: Chart<TType>,\n\tstate: DragDataState | undefined = ChartJSDragDataPlugin.statesStore.get(\n\t\tchartInstance.id,\n\t),\n) {\n\tconsole.log(\"draga data run\");\n\tif (!state) return;\n\n\tconst pluginOptions = chartInstance.options?.plugins\n\t\t?.dragData as OptionalPluginConfiguration<TType>;\n\tconst callback = pluginOptions?.onDrag;\n\n\tif (state.element) {\n\t\tstate.curDatasetIndex = state.element.datasetIndex;\n\t\tstate.curIndex = state.element.index;\n\t\tstate.isDragging = true;\n\n\t\tlet dataPoint =\n\t\t\tchartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex]!;\n\n\t\tconst draggingConfiguration = checkDraggingConfiguration(\n\t\t\tchartInstance,\n\t\t\tstate.curDatasetIndex,\n\t\t\tstate.curIndex,\n\t\t);\n\n\t\tif (state.type === \"radar\" || state.type === \"polarArea\") {\n\t\t\tdataPoint = calcRadialLinear(\n\t\t\t\tevent,\n\t\t\t\tchartInstance,\n\t\t\t\tstate.curIndex,\n\t\t\t\tstate.rAxisID,\n\t\t\t\tstate,\n\t\t\t);\n\t\t} else if (state.stacked) {\n\t\t\tlet cursorPos = calcCartesian(\n\t\t\t\tevent,\n\t\t\t\tchartInstance,\n\t\t\t\tdataPoint,\n\t\t\t\tdraggingConfiguration,\n\t\t\t\tstate,\n\t\t\t);\n\t\t\tdataPoint = roundValue(\n\t\t\t\t(cursorPos as number) - state.initValue,\n\t\t\t\tpluginOptions?.round,\n\t\t\t);\n\t\t} else {\n\t\t\tdataPoint = calcCartesian(\n\t\t\t\tevent,\n\t\t\t\tchartInstance,\n\t\t\t\tdataPoint,\n\t\t\t\tdraggingConfiguration,\n\t\t\t\tstate,\n\t\t\t);\n\t\t}\n\n\t\t// \u2705 Collision check for bubble charts in pixel space\n\t\tif (\n\t\t\t(chartInstance.config as any).type === \"bubble\" &&\n\t\t\ttypeof dataPoint === \"object\" &&\n\t\t\t\"x\" in dataPoint &&\n\t\t\t\"y\" in dataPoint &&\n\t\t\t\"r\" in dataPoint\n\t\t) {\n\t\t\tconst collided = checkBubbleCollisionPixelSpace(\n\t\t\t\tchartInstance,\n\t\t\t\tstate.curDatasetIndex,\n\t\t\t\tstate.curIndex,\n\t\t\t\tdataPoint,\n\t\t\t);\n\n\t\t\tif (collided) {\n\t\t\t\tconsole.warn(\"\uD83D\uDEAB Bubble collision detected. Drag blocked.\");\n\n\t\t\t\t// \uD83D\uDC47 Cancel dragging state\n\t\t\t\tstate.isDragging = false;\n\t\t\t\tstate.element = null;\n\n\t\t\t\t// \uD83D\uDC47 Remove any active elements (visually unselect the point)\n\t\t\t\tchartInstance.setActiveElements([]);\n\n\t\t\t\t// \uD83D\uDC47 Force an update to reflect UI change\n\t\t\t\tchartInstance.update(\"none\");\n\n\t\t\t\treturn;\n\t\t\t}\n\t\t}\n\n\t\tconst allowed =\n\t\t\ttypeof callback === \"function\"\n\t\t\t\t? callback(event, state.curDatasetIndex, state.curIndex, dataPoint) !==\n\t\t\t\t\tfalse\n\t\t\t\t: true;\n\n\t\tif (allowed) {\n\t\t\tchartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex] =\n\t\t\t\tdataPoint;\n\t\t\tchartInstance.update(\"none\");\n\t\t}\n\t}\n}\n\n// \u2705 Collision checker (pixel-based)\nfunction checkBubbleCollisionPixelSpace(\n\tchart: Chart,\n\tdatasetIndex: number,\n\tpointIndex: number,\n\tnewDataPoint: { x: number; y: number; r: number },\n): boolean {\n\tconst xScale = chart.scales[\"x\"];\n\tconst yScale = chart.scales[\"y\"];\n\n\tconst newX = xScale.getPixelForValue(newDataPoint.x);\n\tconst newY = yScale.getPixelForValue(newDataPoint.y);\n\tconst newR = newDataPoint.r;\n\tconst finalDataset = chart.data.datasets;\n\n\treturn finalDataset.some((dataset, i) => {\n\t\tif (\n\t\t\ti === datasetIndex ||\n\t\t\t!chart.isDatasetVisible(i) ||\n\t\t\tdataset.type !== \"bubble\"\n\t\t)\n\t\t\treturn false;\n\n\t\tconst points = dataset.data as { x: number; y: number; r: number }[];\n\t\treturn points.some((point) => {\n\t\t\tconst px = xScale.getPixelForValue(point.x);\n\t\t\tconst py = yScale.getPixelForValue(point.y);\n\t\t\tconst pr = point.r;\n\t\t\tconst dx = newX - px;\n\t\t\tconst dy = newY - py;\n\t\t\tconst dist = Math.sqrt(dx * dx + dy * dy);\n\n\t\t\treturn dist < newR + pr;\n\t\t});\n\t});\n}\n"],names:[],mappings:"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",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"87a38de6c7773ebcff6981c9a4e20c617496f8c9"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_r9mvpzvyj=function(){return actualCoverage;};}return actualCoverage;}cov_r9mvpzvyj();function updateData(event,chartInstance,state){cov_r9mvpzvyj().f[0]++;var _a,_b;cov_r9mvpzvyj().s[0]++;if(state===void 0){cov_r9mvpzvyj().b[0][0]++;cov_r9mvpzvyj().s[1]++;state=ChartJSDragDataPlugin.statesStore.get(chartInstance.id);}else {cov_r9mvpzvyj().b[0][1]++;}cov_r9mvpzvyj().s[2]++;console.log("draga data run");cov_r9mvpzvyj().s[3]++;if(!state){cov_r9mvpzvyj().b[1][0]++;cov_r9mvpzvyj().s[4]++;return;}else {cov_r9mvpzvyj().b[1][1]++;}var pluginOptions=(cov_r9mvpzvyj().s[5]++,(cov_r9mvpzvyj().b[3][0]++,(_b=(cov_r9mvpzvyj().b[5][0]++,(_a=chartInstance.options)===null)||(cov_r9mvpzvyj().b[5][1]++,_a===void 0)?(cov_r9mvpzvyj().b[4][0]++,void 0):(cov_r9mvpzvyj().b[4][1]++,_a.plugins))===null)||(cov_r9mvpzvyj().b[3][1]++,_b===void 0)?(cov_r9mvpzvyj().b[2][0]++,void 0):(cov_r9mvpzvyj().b[2][1]++,_b.dragData));var callback=(cov_r9mvpzvyj().s[6]++,(cov_r9mvpzvyj().b[7][0]++,pluginOptions===null)||(cov_r9mvpzvyj().b[7][1]++,pluginOptions===void 0)?(cov_r9mvpzvyj().b[6][0]++,void 0):(cov_r9mvpzvyj().b[6][1]++,pluginOptions.onDrag));cov_r9mvpzvyj().s[7]++;if(state.element){cov_r9mvpzvyj().b[8][0]++;cov_r9mvpzvyj().s[8]++;state.curDatasetIndex=state.element.datasetIndex;cov_r9mvpzvyj().s[9]++;state.curIndex=state.element.index;cov_r9mvpzvyj().s[10]++;state.isDragging=true;var dataPoint=(cov_r9mvpzvyj().s[11]++,chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex]);var draggingConfiguration=(cov_r9mvpzvyj().s[12]++,checkDraggingConfiguration(chartInstance,state.curDatasetIndex,state.curIndex));cov_r9mvpzvyj().s[13]++;if((cov_r9mvpzvyj().b[10][0]++,state.type==="radar")||(cov_r9mvpzvyj().b[10][1]++,state.type==="polarArea")){cov_r9mvpzvyj().b[9][0]++;cov_r9mvpzvyj().s[14]++;dataPoint=calcRadialLinear(event,chartInstance,state.curIndex,state.rAxisID,state);}else {cov_r9mvpzvyj().b[9][1]++;cov_r9mvpzvyj().s[15]++;if(state.stacked){cov_r9mvpzvyj().b[11][0]++;var cursorPos=(cov_r9mvpzvyj().s[16]++,calcCartesian(event,chartInstance,dataPoint,draggingConfiguration,state));cov_r9mvpzvyj().s[17]++;dataPoint=roundValue(cursorPos-state.initValue,(cov_r9mvpzvyj().b[13][0]++,pluginOptions===null)||(cov_r9mvpzvyj().b[13][1]++,pluginOptions===void 0)?(cov_r9mvpzvyj().b[12][0]++,void 0):(cov_r9mvpzvyj().b[12][1]++,pluginOptions.round));}else {cov_r9mvpzvyj().b[11][1]++;cov_r9mvpzvyj().s[18]++;dataPoint=calcCartesian(event,chartInstance,dataPoint,draggingConfiguration,state);}}// ✅ Collision check for bubble charts in pixel space
  cov_r9mvpzvyj().s[19]++;if((cov_r9mvpzvyj().b[15][0]++,chartInstance.config.type==="bubble")&&(cov_r9mvpzvyj().b[15][1]++,typeof dataPoint==="object")&&(cov_r9mvpzvyj().b[15][2]++,"x"in dataPoint)&&(cov_r9mvpzvyj().b[15][3]++,"y"in dataPoint)&&(cov_r9mvpzvyj().b[15][4]++,"r"in dataPoint)){cov_r9mvpzvyj().b[14][0]++;var collided=(cov_r9mvpzvyj().s[20]++,checkBubbleCollisionPixelSpace(chartInstance,state.curDatasetIndex,state.curIndex,dataPoint));cov_r9mvpzvyj().s[21]++;if(collided){cov_r9mvpzvyj().b[16][0]++;cov_r9mvpzvyj().s[22]++;console.warn("🚫 Bubble collision detected. Drag blocked.");// 👇 Cancel dragging state
  cov_r9mvpzvyj().s[23]++;state.isDragging=false;cov_r9mvpzvyj().s[24]++;state.element=null;// 👇 Remove any active elements (visually unselect the point)
  cov_r9mvpzvyj().s[25]++;chartInstance.setActiveElements([]);// 👇 Force an update to reflect UI change
  cov_r9mvpzvyj().s[26]++;chartInstance.update("none");cov_r9mvpzvyj().s[27]++;return;}else {cov_r9mvpzvyj().b[16][1]++;}}else {cov_r9mvpzvyj().b[14][1]++;}var allowed=(cov_r9mvpzvyj().s[28]++,typeof callback==="function"?(cov_r9mvpzvyj().b[17][0]++,callback(event,state.curDatasetIndex,state.curIndex,dataPoint)!==false):(cov_r9mvpzvyj().b[17][1]++,true));cov_r9mvpzvyj().s[29]++;if(allowed){cov_r9mvpzvyj().b[18][0]++;cov_r9mvpzvyj().s[30]++;chartInstance.data.datasets[state.curDatasetIndex].data[state.curIndex]=dataPoint;cov_r9mvpzvyj().s[31]++;chartInstance.update("none");}else {cov_r9mvpzvyj().b[18][1]++;}}else {cov_r9mvpzvyj().b[8][1]++;}}// ✅ Collision checker (pixel-based)
  function checkBubbleCollisionPixelSpace(chart,datasetIndex,pointIndex,newDataPoint){cov_r9mvpzvyj().f[1]++;var xScale=(cov_r9mvpzvyj().s[32]++,chart.scales["x"]);var yScale=(cov_r9mvpzvyj().s[33]++,chart.scales["y"]);var newX=(cov_r9mvpzvyj().s[34]++,xScale.getPixelForValue(newDataPoint.x));var newY=(cov_r9mvpzvyj().s[35]++,yScale.getPixelForValue(newDataPoint.y));var newR=(cov_r9mvpzvyj().s[36]++,newDataPoint.r);var finalDataset=(cov_r9mvpzvyj().s[37]++,chart.data.datasets);cov_r9mvpzvyj().s[38]++;return finalDataset.some(function(dataset,i){cov_r9mvpzvyj().f[2]++;cov_r9mvpzvyj().s[39]++;if((cov_r9mvpzvyj().b[20][0]++,i===datasetIndex)||(cov_r9mvpzvyj().b[20][1]++,!chart.isDatasetVisible(i))||(cov_r9mvpzvyj().b[20][2]++,dataset.type!=="bubble")){cov_r9mvpzvyj().b[19][0]++;cov_r9mvpzvyj().s[40]++;return false;}else {cov_r9mvpzvyj().b[19][1]++;}var points=(cov_r9mvpzvyj().s[41]++,dataset.data);cov_r9mvpzvyj().s[42]++;return points.some(function(point){cov_r9mvpzvyj().f[3]++;var px=(cov_r9mvpzvyj().s[43]++,xScale.getPixelForValue(point.x));var py=(cov_r9mvpzvyj().s[44]++,yScale.getPixelForValue(point.y));var pr=(cov_r9mvpzvyj().s[45]++,point.r);var dx=(cov_r9mvpzvyj().s[46]++,newX-px);var dy=(cov_r9mvpzvyj().s[47]++,newY-py);var dist=(cov_r9mvpzvyj().s[48]++,Math.sqrt(dx*dx+dy*dy));cov_r9mvpzvyj().s[49]++;return dist<newR+pr;});});}

  function cov_1kwgf8n60f(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/index.ts";var hash="8a2e641cbf6d42f6fb28ba9c518203b8289d91d5";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/util/index.ts",statementMap:{},fnMap:{},branchMap:{},s:{},f:{},b:{},inputSourceMap:{version:3,sources:["../../../src/util/index.ts"],sourcesContent:["export * from \"./calc\";\nexport * from \"./applyMagnet\";\nexport * from \"./checkDraggingConfiguration\";\nexport * from \"./cloneDataPoint\";\nexport * from \"./dragEndCallback\";\nexport * from \"./getElement\";\nexport * from \"./roundValue\";\nexport * from \"./updateData\";\n"],names:[],mappings:"AAAA,cAAc,QAAQ,CAAC;AACvB,cAAc,eAAe,CAAC;AAC9B,cAAc,8BAA8B,CAAC;AAC7C,cAAc,kBAAkB,CAAC;AACjC,cAAc,mBAAmB,CAAC;AAClC,cAAc,cAAc,CAAC;AAC7B,cAAc,cAAc,CAAC;AAC7B,cAAc,cAAc,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"8a2e641cbf6d42f6fb28ba9c518203b8289d91d5"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_1kwgf8n60f=function(){return actualCoverage;};}return actualCoverage;}cov_1kwgf8n60f();

  function cov_1wj8m5gykf(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/plugin.ts";var hash="b0c3d6c7ddc1d5788157787571b4c7aa47a543be";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/plugin.ts",statementMap:{"0":{start:{line:5,column:28},end:{line:45,column:1}},"1":{start:{line:9,column:20},end:{line:22,column:9}},"2":{start:{line:23,column:8},end:{line:23,column:71}},"3":{start:{line:24,column:8},end:{line:32,column:12}},"4":{start:{line:27,column:12},end:{line:27,column:72}},"5":{start:{line:29,column:39},end:{line:29,column:99}},"6":{start:{line:31,column:12},end:{line:31,column:77}},"7":{start:{line:36,column:20},end:{line:36,column:75}},"8":{start:{line:37,column:8},end:{line:40,column:9}},"9":{start:{line:38,column:12},end:{line:38,column:90}},"10":{start:{line:39,column:12},end:{line:39,column:25}},"11":{start:{line:43,column:8},end:{line:43,column:67}},"12":{start:{line:48,column:0},end:{line:48,column:38}}},fnMap:{"0":{name:"(anonymous_0)",decl:{start:{line:8,column:15},end:{line:8,column:16}},loc:{start:{line:8,column:40},end:{line:33,column:5}},line:8},"1":{name:"(anonymous_1)",decl:{start:{line:26,column:25},end:{line:26,column:26}},loc:{start:{line:26,column:38},end:{line:28,column:9}},line:26},"2":{name:"(anonymous_2)",decl:{start:{line:29,column:24},end:{line:29,column:25}},loc:{start:{line:29,column:37},end:{line:29,column:101}},line:29},"3":{name:"(anonymous_3)",decl:{start:{line:30,column:23},end:{line:30,column:24}},loc:{start:{line:30,column:36},end:{line:32,column:9}},line:30},"4":{name:"(anonymous_4)",decl:{start:{line:34,column:17},end:{line:34,column:18}},loc:{start:{line:34,column:42},end:{line:41,column:5}},line:34},"5":{name:"(anonymous_5)",decl:{start:{line:42,column:18},end:{line:42,column:19}},loc:{start:{line:42,column:43},end:{line:44,column:5}},line:42}},branchMap:{"0":{loc:{start:{line:37,column:8},end:{line:40,column:9}},type:"if",locations:[{start:{line:37,column:8},end:{line:40,column:9}},{start:{line:undefined,column:undefined},end:{line:undefined,column:undefined}}],line:37},"1":{loc:{start:{line:37,column:12},end:{line:37,column:74}},type:"cond-expr",locations:[{start:{line:37,column:49},end:{line:37,column:55}},{start:{line:37,column:58},end:{line:37,column:74}}],line:37},"2":{loc:{start:{line:37,column:12},end:{line:37,column:46}},type:"binary-expr",locations:[{start:{line:37,column:12},end:{line:37,column:26}},{start:{line:37,column:30},end:{line:37,column:46}}],line:37},"3":{loc:{start:{line:38,column:12},end:{line:38,column:89}},type:"cond-expr",locations:[{start:{line:38,column:69},end:{line:38,column:75}},{start:{line:38,column:78},end:{line:38,column:89}}],line:38},"4":{loc:{start:{line:38,column:12},end:{line:38,column:66}},type:"binary-expr",locations:[{start:{line:38,column:12},end:{line:38,column:49}},{start:{line:38,column:53},end:{line:38,column:66}}],line:38}},s:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0},f:{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0},b:{"0":[0,0],"1":[0,0],"2":[0,0],"3":[0,0],"4":[0,0]},inputSourceMap:{version:3,sources:["../../src/plugin.ts"],sourcesContent:["import { Chart, Plugin as ChartPlugin } from \"chart.js\";\nimport { drag } from \"d3-drag\";\nimport { select } from \"d3-selection\";\n\nimport { DragDataState } from \"./types\";\nimport * as util from \"./util\";\n\nconst ChartJSDragDataPlugin = {\n\tid: \"dragdata\",\n\tstatesStore: new Map<Chart[\"id\"], DragDataState>(),\n\tafterInit(chartInstance) {\n\t\tconst state: DragDataState = {\n\t\t\tcurIndex: undefined,\n\t\t\tcurDatasetIndex: undefined,\n\t\t\telement: null,\n\t\t\teventSettings: false,\n\t\t\tfloatingBar: false,\n\t\t\tinitValue: 0,\n\t\t\txAxisID: \"\",\n\t\t\tyAxisID: \"\",\n\t\t\trAxisID: \"\",\n\t\t\tstacked: false,\n\t\t\ttype: undefined,\n\t\t\tisDragging: false,\n\t\t};\n\n\t\tChartJSDragDataPlugin.statesStore.set(chartInstance.id, state);\n\n\t\tselect(chartInstance.canvas).call(\n\t\t\tdrag<HTMLCanvasElement, unknown>()\n\t\t\t\t.container(chartInstance.canvas)\n\t\t\t\t.on(\"start\", (e) =>\n\t\t\t\t\tutil.getElement(e.sourceEvent, chartInstance, state),\n\t\t\t\t)\n\t\t\t\t.on(\"drag\", (e) => util.updateData(e.sourceEvent, chartInstance, state))\n\t\t\t\t.on(\"end\", (e) =>\n\t\t\t\t\tutil.dragEndCallback(e.sourceEvent, chartInstance, state),\n\t\t\t\t),\n\t\t);\n\t},\n\tbeforeEvent(chartInstance) {\n\t\tconst state = ChartJSDragDataPlugin.statesStore.get(chartInstance.id);\n\n\t\tif (state?.isDragging) {\n\t\t\t(chartInstance.tooltip as any | undefined)?.update();\n\n\t\t\treturn false;\n\t\t}\n\t},\n\tafterDestroy(chartInstance) {\n\t\tChartJSDragDataPlugin.statesStore.delete(chartInstance.id);\n\t},\n} as const satisfies ChartPlugin & Record<string, any>;\n\n// TODO: in a future major release, stop auto-registering the plugin and require users to manually register it\n// see https://chartjs-plugin-datalabels.netlify.app/guide/getting-started.html#registration\nChart.register(ChartJSDragDataPlugin);\n\nexport default ChartJSDragDataPlugin;\n"],names:[],mappings:"AAAA,OAAO,EAAE,KAAK,EAAyB,MAAM,UAAU,CAAC;AACxD,OAAO,EAAE,IAAI,EAAE,MAAM,SAAS,CAAC;AAC/B,OAAO,EAAE,MAAM,EAAE,MAAM,cAAc,CAAC;AAGtC,OAAO,KAAK,IAAI,MAAM,QAAQ,CAAC;AAE/B,IAAM,qBAAqB,GAAG;IAC7B,EAAE,EAAE,UAAU;IACd,WAAW,EAAE,IAAI,GAAG,EAA8B;IAClD,SAAS,YAAC,aAAa;QACtB,IAAM,KAAK,GAAkB;YAC5B,QAAQ,EAAE,SAAS;YACnB,eAAe,EAAE,SAAS;YAC1B,OAAO,EAAE,IAAI;YACb,aAAa,EAAE,KAAK;YACpB,WAAW,EAAE,KAAK;YAClB,SAAS,EAAE,CAAC;YACZ,OAAO,EAAE,EAAE;YACX,OAAO,EAAE,EAAE;YACX,OAAO,EAAE,EAAE;YACX,OAAO,EAAE,KAAK;YACd,IAAI,EAAE,SAAS;YACf,UAAU,EAAE,KAAK;SACjB,CAAC;QAEF,qBAAqB,CAAC,WAAW,CAAC,GAAG,CAAC,aAAa,CAAC,EAAE,EAAE,KAAK,CAAC,CAAC;QAE/D,MAAM,CAAC,aAAa,CAAC,MAAM,CAAC,CAAC,IAAI,CAChC,IAAI,EAA8B;aAChC,SAAS,CAAC,aAAa,CAAC,MAAM,CAAC;aAC/B,EAAE,CAAC,OAAO,EAAE,UAAC,CAAC;YACd,OAAA,IAAI,CAAC,UAAU,CAAC,CAAC,CAAC,WAAW,EAAE,aAAa,EAAE,KAAK,CAAC;QAApD,CAAoD,CACpD;aACA,EAAE,CAAC,MAAM,EAAE,UAAC,CAAC,IAAK,OAAA,IAAI,CAAC,UAAU,CAAC,CAAC,CAAC,WAAW,EAAE,aAAa,EAAE,KAAK,CAAC,EAApD,CAAoD,CAAC;aACvE,EAAE,CAAC,KAAK,EAAE,UAAC,CAAC;YACZ,OAAA,IAAI,CAAC,eAAe,CAAC,CAAC,CAAC,WAAW,EAAE,aAAa,EAAE,KAAK,CAAC;QAAzD,CAAyD,CACzD,CACF,CAAC;IACH,CAAC;IACD,WAAW,YAAC,aAAa;;QACxB,IAAM,KAAK,GAAG,qBAAqB,CAAC,WAAW,CAAC,GAAG,CAAC,aAAa,CAAC,EAAE,CAAC,CAAC;QAEtE,IAAI,KAAK,aAAL,KAAK,uBAAL,KAAK,CAAE,UAAU,EAAE,CAAC;YACvB,MAAC,aAAa,CAAC,OAA2B,0CAAE,MAAM,EAAE,CAAC;YAErD,OAAO,KAAK,CAAC;QACd,CAAC;IACF,CAAC;IACD,YAAY,YAAC,aAAa;QACzB,qBAAqB,CAAC,WAAW,CAAC,MAAM,CAAC,aAAa,CAAC,EAAE,CAAC,CAAC;IAC5D,CAAC;CACoD,CAAC;AAEvD,8GAA8G;AAC9G,4FAA4F;AAC5F,KAAK,CAAC,QAAQ,CAAC,qBAAqB,CAAC,CAAC;AAEtC,eAAe,qBAAqB,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"b0c3d6c7ddc1d5788157787571b4c7aa47a543be"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_1wj8m5gykf=function(){return actualCoverage;};}return actualCoverage;}cov_1wj8m5gykf();var ChartJSDragDataPlugin=(cov_1wj8m5gykf().s[0]++,{id:"dragdata",statesStore:new Map(),afterInit:function(chartInstance){cov_1wj8m5gykf().f[0]++;var state=(cov_1wj8m5gykf().s[1]++,{curIndex:undefined,curDatasetIndex:undefined,element:null,eventSettings:false,floatingBar:false,initValue:0,xAxisID:"",yAxisID:"",rAxisID:"",stacked:false,type:undefined,isDragging:false});cov_1wj8m5gykf().s[2]++;ChartJSDragDataPlugin.statesStore.set(chartInstance.id,state);cov_1wj8m5gykf().s[3]++;select(chartInstance.canvas).call(drag().container(chartInstance.canvas).on("start",function(e){cov_1wj8m5gykf().f[1]++;cov_1wj8m5gykf().s[4]++;return getElement(e.sourceEvent,chartInstance,state);}).on("drag",function(e){cov_1wj8m5gykf().f[2]++;cov_1wj8m5gykf().s[5]++;return updateData(e.sourceEvent,chartInstance,state);}).on("end",function(e){cov_1wj8m5gykf().f[3]++;cov_1wj8m5gykf().s[6]++;return dragEndCallback(e.sourceEvent,chartInstance,state);}));},beforeEvent:function(chartInstance){cov_1wj8m5gykf().f[4]++;var _a;var state=(cov_1wj8m5gykf().s[7]++,ChartJSDragDataPlugin.statesStore.get(chartInstance.id));cov_1wj8m5gykf().s[8]++;if((cov_1wj8m5gykf().b[2][0]++,state===null)||(cov_1wj8m5gykf().b[2][1]++,state===void 0)?(cov_1wj8m5gykf().b[1][0]++,void 0):(cov_1wj8m5gykf().b[1][1]++,state.isDragging)){cov_1wj8m5gykf().b[0][0]++;cov_1wj8m5gykf().s[9]++;(cov_1wj8m5gykf().b[4][0]++,(_a=chartInstance.tooltip)===null)||(cov_1wj8m5gykf().b[4][1]++,_a===void 0)?(cov_1wj8m5gykf().b[3][0]++,void 0):(cov_1wj8m5gykf().b[3][1]++,_a.update());cov_1wj8m5gykf().s[10]++;return false;}else {cov_1wj8m5gykf().b[0][1]++;}},afterDestroy:function(chartInstance){cov_1wj8m5gykf().f[5]++;cov_1wj8m5gykf().s[11]++;ChartJSDragDataPlugin.statesStore.delete(chartInstance.id);}});// TODO: in a future major release, stop auto-registering the plugin and require users to manually register it
  // see https://chartjs-plugin-datalabels.netlify.app/guide/getting-started.html#registration
  cov_1wj8m5gykf().s[12]++;chart_js.Chart.register(ChartJSDragDataPlugin);

  function cov_1pku9fjtso(){var path="/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/index.ts";var hash="69b054af3a4bc6ddafdd51f0c69ceaec547a1fd6";var global=new Function("return this")();var gcv="__coverage__";var coverageData={path:"/Users/anastasioskakouris/Desktop/projects/inlecom/DT4GS/chartjs-plugin-dragdata/src/index.ts",statementMap:{},fnMap:{},branchMap:{},s:{},f:{},b:{},inputSourceMap:{version:3,sources:["../../src/index.ts"],sourcesContent:["import ChartJSDragDataPlugin from \"./plugin\";\n\n// ensure Chart.js type augmentations are bundled\nexport type * from \"./typeAugmentations\";\n\n// export all types\nexport type * from \"./types\";\n\n// export all utility functions\nexport * from \"./util\";\n\nexport default ChartJSDragDataPlugin;\n"],names:[],mappings:"AAAA,OAAO,qBAAqB,MAAM,UAAU,CAAC;AAQ7C,+BAA+B;AAC/B,cAAc,QAAQ,CAAC;AAEvB,eAAe,qBAAqB,CAAC",file:null},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"69b054af3a4bc6ddafdd51f0c69ceaec547a1fd6"};var coverage=global[gcv]||(global[gcv]={});if(!coverage[path]||coverage[path].hash!==hash){coverage[path]=coverageData;}var actualCoverage=coverage[path];{// @ts-ignore
  cov_1pku9fjtso=function(){return actualCoverage;};}return actualCoverage;}cov_1pku9fjtso();

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
