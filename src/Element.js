/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

/**
 *  @class
 *  @name Element
 *  @description Extensions to the DOM Core <a href="http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-745549614"><code>Element</code></a> interface.
 *  @since TuneKit 1.0
 */

/* ==================== Element Extensions ==================== */

/**
 *  Indicates whether the element has a given class name within its <code>class</code> attribute.
 *
 *  @param {String} className The CSS class name.
 *  @returns {bool} Whether the element has this class name within its <code>class</code> attribute.
 *  @memberOf Element.prototype
 */
Element.prototype.hasClassName = function (className) {
  return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(this.className);
};

/**
 *  Adds the given class name to the element's <code>class</code> attribute if it's not already there.
 *
 *  @param {String} className The CSS class name.
 *  @memberOf Element.prototype
 */
Element.prototype.addClassName = function (className) {
  if (!this.hasClassName(className)) {
    this.className = [this.className, className].join(' ');
  }
};

/**
 *  Removes the given class name from the element's <code>class</code> attribute if it's there.
 *
 *  @param {String} className The CSS class name.
 *  @memberOf Element.prototype
 */
Element.prototype.removeClassName = function (className) {
  if (this.hasClassName(className)) {
    var curClasses = this.className;
    this.className = curClasses.replace(new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)', 'g'), ' ');
  }
};

/**
 *  Adds the given class name to the element's <code>class</code> attribute if it's not there, or removes it if it's already set.
 *
 *  @param {String} className The CSS class name.
 *  @memberOf Element.prototype
 */
Element.prototype.toggleClassName = function (className) {
  this[this.hasClassName(className) ? 'removeClassName' : 'addClassName'](className);
};

/**
 *  Removes all the children from an element.
 *
 *  @memberOf Element.prototype
 */
// XXX: should this be on Node?
Element.prototype.removeAllChildren = function () {
  while (this.firstChild) {
    this.removeChild(this.firstChild);
  }
};

/**
 *  Returns true if the element has the given child node
 *  FIXME: should this be on Node?
 *
 *  @param {Element} child The child to search for
 *  @memberOf Element.prototype
 */
Element.prototype.hasChild = function (child) {
  for (var i=0; i < this.childNodes.length; i++) {
    if (this.childNodes[i] === child) {
      return true;
    }
  }
  return false;
};

/**
 *  Applies a transition definition to the element, allowing the transition to be reversed. If this method is called
 *  within a {@link TKTransaction}, the transition will only be commited when the transaction is completed.
 *
 *  @param {TKTransitionDefinition} transitionDefinition The transition applied to the element.
 *  @param {bool} reversed Indicates whether the transition is to be applied in reverse.
 */
Element.prototype.applyTransition = function (definition, reversed) {
  // nothing to do if we have no definition
  if (definition === null) {
    return;
  }
  // create a TKTransition from the definition
  var transition = new TKTransition(definition);
  // this view will be the target
  transition.target = this;
  // revert from / to values as instructed
  if (reversed) {
    var from = transition.from;
    transition.from = transition.to;
    transition.to = from;
  }
  // set up base properties, if any
  if (definition.base) {
    for (var i = 0; i < definition.base.length; i += 2) {
      this.style.setProperty(definition.base[i], definition.base[i+1], '');
    }
  }
  // start the transition
  transition.start();
};

Element.prototype.getBounds = function () {
  return TKRect.rectFromClientRect(this.getBoundingClientRect());
};

Element.prototype.isNavigable = function () {
  var is_navigable = false;
  if (this._controller !== undefined && this._controller !== null && this._controller.navigableElements.indexOf(this) !== -1) {
    var style = window.getComputedStyle(this);
    is_navigable = (
      style.display != 'none' && style.visibility != 'hidden' &&
      !this.hasClassName(TKSpatialNavigationManagerInactiveCSSClass)
    );
  }
  return is_navigable;
};

TKUtils.setupDisplayNames(Element, 'Element');
