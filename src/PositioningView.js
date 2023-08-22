/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

// ---------------------------------------------------
// A two dimensional view with absolutely positioned elements
// ---------------------------------------------------

// data source method names
const TKPositioningViewNumberOfElements = 'positioningViewNumberOfElements';
const TKPositioningViewElementAtIndex = 'positioningViewElementAtIndex';
const TKPositioningViewPositionAtIndex = 'positioningViewPositionAtIndex';  // expects {x: y:} to be returned
const TKPositioningViewViewportPositionAtIndex = 'positioningViewViewportPositionAtIndex';  // expects {x: y:} to be returned
const TKPositioningViewViewportScaleAtIndex = 'positioningViewViewportScaleAtIndex';  // expects a float returned

// delegate method names
const TKPositioningViewDidSelectActiveElement = 'positioningViewDidSelectActiveElement';
const TKPositioningViewDidFocusElementAtIndex = 'positioningViewDidFocusElementAtIndex';
const TKPositioningViewDidBlurElementAtIndex = 'positioningViewDidBlurElementAtIndex';
const TKPositioningViewDidHideElementAtIndex = 'positioningViewDidHideElementAtIndex'; // TODO: XXX
const TKPositioningViewWillUnhideElementAtIndex = 'positioningViewWillUnhideElementAtIndex'; // TODO: XXX

// css protocol
const TKPositioningViewCSSRootClass = 'positioning-view';
const TKPositioningViewCSSContainerClass = 'positioning-view-container';
const TKPositioningViewCSSElementClass = 'positioning-view-element';

const TKPositioningViewCSSFocusedClass = 'positioning-view-element-focused';
const TKPositioningViewCSSBeforeClass = 'positioning-view-element-before';
const TKPositioningViewCSSAfterClass = 'positioning-view-element-after';
const TKPositioningViewCSSHiddenClass = 'positioning-view-element-hidden';

TKPositioningView.synthetizes = ['dataSource',
                                 'delegate',
                                 'activeElementIndex', // the index of the middle/focused element
                                 'nonActiveElementsVisible', // the number of elements that are considered visible before and after the active element
                                 'pageControl', // a TKPageControl object that should be linked to this positioner (not needed)
                                 'interactive', // whether the view allows click to focus
                                 'incrementalLoading', // whether or not to load elements incrementally
                                 'numberOfElements'];

function TKPositioningView (element) {
  this.callSuper();
  // these defaults look ok for elements about 180 square
  this._activeElementIndex = 0;
  this._nonActiveElementsVisible = 1;
  this._pageControl = null;
  this._interactive = false;
  this._incrementalLoading = false;
  
  this._elements = [];
  
  if (element) {
    this.element = element;
  } else {
    // create the element we'll use as root
    this.element = document.createElement("div");
  }
  this.element.addClassName(TKPositioningViewCSSRootClass);
  
  // create the positioner
  this.container = document.createElement("div");
  this.container.addClassName(TKPositioningViewCSSContainerClass);
  this.element.appendChild(this.container);
}

TKPositioningView.prototype.init = function () {

  if (!this.dataSource ||
      !TKUtils.objectHasMethod(this.dataSource, TKPositioningViewNumberOfElements) ||
      !TKUtils.objectHasMethod(this.dataSource, TKPositioningViewElementAtIndex) ||
      !TKUtils.objectHasMethod(this.dataSource, TKPositioningViewPositionAtIndex) ||
      !TKUtils.objectHasMethod(this.dataSource, TKPositioningViewViewportPositionAtIndex) ||
      !TKUtils.objectHasMethod(this.dataSource, TKPositioningViewViewportScaleAtIndex)) {
    debug("TKPositioningView: dataSource does not exist or does not have correct methods");
    return;
  }

  var numElements = this.numberOfElements;

  if (this._incrementalLoading) {
    // add enough to be visible
    this.bufferElements();
  } else {
    for (var i=0; i < numElements; i++) {
      var el = this.dataSource[TKPositioningViewElementAtIndex](this, i);
      el.addClassName(TKPositioningViewCSSElementClass);
      el._positioningViewIndex = i;
      el._needsAppending = true;
      this._elements[i] = el;
      if (this._interactive) {
        el.addEventListener("click", this, false);
      }
      var position = this.dataSource[TKPositioningViewPositionAtIndex](this, i);
      var translate = "translate3d(" + position.x + "px, " + position.y + "px, 0)";
      el.style.webkitTransform = translate;
      this.container.appendChild(el);
    }
  }
  
  this.positionContainer();
  this.applyClassesToElements();

};

TKPositioningView.prototype.setPageControl = function (newPageControl) {
  this._pageControl = newPageControl;
  this._pageControl.deferCurrentPageDisplay = true;
  this._pageControl.delegate = this;
  this._pageControl.currentPage = this._activeElementIndex;
};

TKPositioningView.prototype.setActiveElementIndex = function (newActiveElementIndex) {
  if (newActiveElementIndex >= 0 &&
      newActiveElementIndex < this.numberOfElements &&
      newActiveElementIndex != this._activeElementIndex) {

    // call delegate to inform blur of current active element
    if (TKUtils.objectHasMethod(this.delegate, TKPositioningViewDidBlurElementAtIndex)) {
      this.delegate[TKPositioningViewDidBlurElementAtIndex](this, this._activeElementIndex);
    }
    
    this._activeElementIndex = newActiveElementIndex;

    // call delegate to inform focus of new active element
    if (TKUtils.objectHasMethod(this.delegate, TKPositioningViewDidFocusElementAtIndex)) {
      this.delegate[TKPositioningViewDidFocusElementAtIndex](this, this._activeElementIndex);
    }

    // if there is a page control, tell it to update
    if (this._pageControl) {
      this._pageControl.currentPage = newActiveElementIndex;
    }

    this.bufferElements();
    this.positionContainer();
    this.applyClassesToElements();
  }
};

TKPositioningView.prototype.getNumberOfElements = function () {
  return this.dataSource[TKPositioningViewNumberOfElements](this);
};

// this method loads the elements that are necessary for
// display, and removes the ones that are not needed
TKPositioningView.prototype.bufferElements = function () {
  if (this._incrementalLoading) {
    var numElements = this.numberOfElements;
    for (var i=0; i < numElements; i++) {
      var offset = this._activeElementIndex - i;
      var absOffset = Math.abs(offset);
      if (absOffset <= this._nonActiveElementsVisible) {
        if (!this._elements[i]) {
          var el = this.dataSource[TKPositioningViewElementAtIndex](this, i);
          el.addClassName(TKPositioningViewCSSElementClass);
          el._positioningViewIndex = i;
          el._needsAppending = true;
          this._elements[i] = el;
          if (this._interactive) {
            el.addEventListener("click", this, false);
          }
          var position = this.dataSource[TKPositioningViewPositionAtIndex](this, i);
          var translate = "translate3d(" + position.x + "px, " + position.y + "px, 0)";
          el.style.webkitTransform = translate;
          this.container.appendChild(el);
        }
      } else {
        // element isn't needed
        if (this._elements[i]) {
          this.container.removeChild(this._elements[i]);
          this._elements[i] = null;
        }
      }
    }
  }
};

TKPositioningView.prototype.positionElements = function () {
  var numElements = this.numberOfElements;

  for (var i=0; i < numElements; i++) {
    
    var element = this._elements[i];

    if (!element) {
      // only layout elements we need to
      continue;
    }

    var position = this.dataSource[TKPositioningViewPositionAtIndex](this, i);
    var translate = "translate3d(" + position.x + "px, " + position.y + "px, 0)";
    element.style.webkitTransform = translate;
  }
};

TKPositioningView.prototype.positionContainer = function () {
  var position = this.dataSource[TKPositioningViewPositionAtIndex](this, this._activeElementIndex);
  var viewport = this.dataSource[TKPositioningViewViewportPositionAtIndex](this, this._activeElementIndex);
  var scale = this.dataSource[TKPositioningViewViewportScaleAtIndex](this, this._activeElementIndex);
  var transform = " scale(" + scale + ") translate3d(" + (-viewport.x - position.x) + "px, " + (-viewport.y - position.y) + "px, 0)";
  this.container.style.webkitTransform = transform;
};

TKPositioningView.prototype.applyClassesToElements = function () {
  var numElements = this.numberOfElements;
  for (var i=0; i < numElements; i++) {
    var element = this._elements[i];

    if (!element) {
      // only layout elements we need to
      continue;
    }

    var offset = this._activeElementIndex - i;
    var absOffset = Math.abs(offset);
    
    if (offset == 0) {
      this.applyClasses(element, TKPositioningViewCSSFocusedClass);
    } else if (absOffset > this._nonActiveElementsVisible) {
      this.applyClasses(element, TKPositioningViewCSSHiddenClass);
    } else if (offset > 0) {
      this.applyClasses(element, TKPositioningViewCSSAfterClass);
    } else {
      this.applyClasses(element, TKPositioningViewCSSBeforeClass);
    }
  }
};

TKPositioningView.prototype.applyClasses = function (element, className) {
  element.removeClassName(TKPositioningViewCSSFocusedClass);
  element.removeClassName(TKPositioningViewCSSBeforeClass);
  element.removeClassName(TKPositioningViewCSSAfterClass);
  element.removeClassName(TKPositioningViewCSSHiddenClass);
  
  element.addClassName(className);
};

TKPositioningView.prototype.handleEvent = function (event) {
  switch (event.type) {
    case "click":
      this.handleClick(event);
      break;
    default:
      debug("unhandled event type in TKPositioningView: " + event.type);
  }
};

TKPositioningView.prototype.handleClick = function (event) {
  // The event.target should have an _positioningViewIndex property. If
  // not, then go up to parent
  var target = event.target;
  while (target && TKUtils.objectIsUndefined(target._positioningViewIndex)) {
    target = target.parentNode;
  }
  if (!target) {
    return;
  }
  if (target._positioningViewIndex == this._activeElementIndex) {
    if (TKUtils.objectHasMethod(this.delegate, TKPositioningViewDidSelectActiveElement)) {
      this.delegate[TKPositioningViewDidSelectActiveElement](this, this._activeElementIndex);
    }
  } else {
    this.activeElementIndex = target._positioningViewIndex;
  }
};

// delegate for page control
TKPositioningView.prototype.pageControlDidUpdateCurrentPage = function (control, newPageIndex) {
  if (control === this._pageControl) {
    this.activeElementIndex = newPageIndex;
    this._pageControl.updateCurrentPageDisplay();
  }
};


TKClass(TKPositioningView);

/* ====================== Datasource helper ====================== */

function TKPositioningViewDataSourceHelper(data, incrementalLoading) {
  this.data = data;
  this.incrementalLoading = incrementalLoading;
  this.elements = [];
  this.positions = [];
  this.viewportPositions = [];
  this.viewportScales = [];
};

TKPositioningViewDataSourceHelper.prototype.positioningViewNumberOfElements = function(view) {
  if (this.data) {
    return this.data.length;
  } else {
    return 0;
  }
};

TKPositioningViewDataSourceHelper.prototype.positioningViewElementAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  var element = this.elements[index];
  if (!element) {
    var source = this.data[index];
    element = TKUtils.buildElement(source.element);
  }
  if (!this.incrementalLoading) {
    this.elements[index] = element;
  }
  return element;
};

TKPositioningViewDataSourceHelper.prototype.positioningViewPositionAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  if (!this.positions[index]) {
    var source = this.data[index];
    this.positions[index] = { x: source.x, y: source.y };
  }
  return this.positions[index];
};

TKPositioningViewDataSourceHelper.prototype.positioningViewViewportPositionAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  if (!this.viewportPositions[index]) {
    var source = this.data[index];
    this.viewportPositions[index] = { };
    this.viewportPositions[index].x = (TKUtils.objectIsUndefined(source.viewportx)) ? 0 : source.viewportx;
    this.viewportPositions[index].y = (TKUtils.objectIsUndefined(source.viewporty)) ? 0 : source.viewporty;
  }
  return this.viewportPositions[index];
};

TKPositioningViewDataSourceHelper.prototype.positioningViewViewportScaleAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  if (!this.viewportScales[index]) {
    var source = this.data[index];
    this.viewportScales[index] = (TKUtils.objectIsUndefined(source.scale)) ? 1 : source.scale;
  }
  return this.viewportScales[index];
};

/* ====================== Declarative helper ====================== */

TKPositioningView.buildPositioningView = function(element, data) {
  if (TKUtils.objectIsUndefined(data) || !data || data.type != "TKPositioningView") {
    return null;
  }

  var positioningView = new TKPositioningView(element);

  if (!TKUtils.objectIsUndefined(data.elements)) {
    positioningView.dataSource = new TKPositioningViewDataSourceHelper(data.elements, data.incrementalLoading);
  }

  TKPositioningView.synthetizes.forEach(function(prop) {
    if (prop != "dataSource" && prop != "delegate") {
      if (!TKUtils.objectIsUndefined(data[prop])) {
        positioningView[prop] = data[prop];
      }
    }
  });

  return positioningView;
};

