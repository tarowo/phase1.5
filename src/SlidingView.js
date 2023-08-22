/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

// ---------------------------------------------------
// A two dimensional sliding view
// ---------------------------------------------------

/**
 *  @class
 *  @name TKSlidingViewData
 *  @since TuneKit 1.0
 */

/**
 *  @name TKSlidingViewData.prototype
 *
 *  @property {int} sideElementsVisible The number of elements on each side of the selected page. If the {@link #incrementalLoading} property is set to
 *  <code>true</code>, this specifies the number of elements in the DOM on each side as others beyond that range are removed from the tree. Otherwise, this
 *  specifies the threshold after which elements in either direction from the selected page get the <code>sliding-view-element-hidden</code> CSS class applied.
 *
 *  @property {int} distanceBetweenElements The distance in pixels between the center points of each page, essentially the overall width of each page.
 *
 *  @property {int} sideOffsetBefore Any additional margin in pixels to the left of each page.
 *
 *  @property {int} sideOffsetAfter Any additional margin in pixels to the right of each page.
 *
 *  @property {Array} elements The elements for the sliding view.
 *
 *  @property {bool} incrementalLoading Indicates whether elements in the sliding view's DOM are added and removed gradually as we browse through it, or all
 *  available in one go, which is the default. If you are populating a sliding view with a large amount of content, you should consider setting this property
 *  to <code>true</code> in order to ease memory constraints and enhance performance.
 *
 *  @property {bool} loops Whether we loop through pages. Defaults to <code>false</code>.
 *
 */

// data source method names
const TKSlidingViewNumberOfElements = 'slidingViewNumberOfElements';
const TKSlidingViewElementAtIndex = 'slidingViewElementAtIndex';

// delegate method names
const TKSlidingViewStyleForItemAtIndex = 'slidingViewStyleForItemAtIndex';
const TKSlidingViewDidSelectActiveElement = 'slidingViewDidSelectActiveElement';
const TKSlidingViewDidFocusElementAtIndex = 'slidingViewDidFocusElementAtIndex';
const TKSlidingViewDidBlurElementAtIndex = 'slidingViewDidBlurElementAtIndex';
const TKSlidingViewDidHideElementAtIndex = 'slidingViewDidHideElementAtIndex'; // TODO: XXX
const TKSlidingViewWillUnhideElementAtIndex = 'slidingViewWillUnhideElementAtIndex'; // TODO: XXX

const TKSlidingViewDidHoverElementAtIndex = 'slidingViewDidHoverElementAtIndex';
const TKSlidingViewDidUnhoverElementAtIndex = 'slidingViewDidUnhoverElementAtIndex';

// css protocol
const TKSlidingViewCSSContainerClass = 'sliding-view';
const TKSlidingViewCSSElementClass = 'sliding-view-element';
const TKSlidingViewCSSFocusedClass = 'sliding-view-element-focused';
const TKSlidingViewCSSSideBeforeClass = 'sliding-view-element-before';
const TKSlidingViewCSSSideAfterClass = 'sliding-view-element-after';
const TKSlidingViewCSSStagedBeforeClass = 'sliding-view-element-staged-before';
const TKSlidingViewCSSStagedAfterClass = 'sliding-view-element-staged-after';
const TKSlidingViewCSSHiddenClass = 'sliding-view-element-hidden';

// orientations
const TKSlidingViewOrientationHorizontal = 'horizontal';
const TKSlidingViewOrientationVertical = 'vertical';

TKSlidingView.synthetizes = ['dataSource',
                             'delegate',
                             'activeElement',
                             'activeElementIndex', // the index of the middle/focused element
                             'orientation', // whether the view should be horizontal or vertical
                             'interactive', // whether or not this view will listen for mouse events
                             'sideOffsetBefore', // gap between focused element and the elements before it
                             'sideOffsetAfter', // gap between focused element and the elements after it
                             'distanceBetweenElements', // general distance between elements in the layout
                             'sideElementsVisible', // the number of elements that are considered visible before and after the focus
                             'pageControl', // a TKPageControl object that should be linked to this slider (not needed)
                             'incrementalLoading', // whether or not the elements should be added to the view as required
                             'loops', // if true, the sliding view loops continuously
                             'raiseHoverEvents', // if true, the sliding view will use the Hover and Unhover delegate methods
                             'numberOfElements'];

function TKSlidingView (element) {
  this.callSuper();
  // these defaults look ok for elements about 180 square
  this._activeElementIndex = 0;
  this._orientation = TKSlidingViewOrientationHorizontal;
  this._interactive = true;
  this._sideOffsetBefore = 160;
  this._sideOffsetAfter = 160;
  this._distanceBetweenElements = 25;
  this._sideElementsVisible = 4;
  this._pageControl = null;
  this._incrementalLoading = false;
  this._loops = false;
  this._raiseHoverEvents = false;
  
  this._elements = [];
  
  if (element) {
    this.element = element;
  } else {
    // create the element we'll use as a container
    this.element = document.createElement("div");
  }
  this.element.addClassName(TKSlidingViewCSSContainerClass);
}

TKSlidingView.prototype.init = function () {

  if (!this.dataSource ||
      !TKUtils.objectHasMethod(this.dataSource, TKSlidingViewNumberOfElements) ||
      !TKUtils.objectHasMethod(this.dataSource, TKSlidingViewElementAtIndex)) {
    return;
  }

  var numElements = this.numberOfElements;

  if (this._incrementalLoading) {
    // add enough to be visible
    this.bufferElements();
  } else {
    // add all the elements
    for (var i=0; i < numElements; i++) {
      var el = this.dataSource[TKSlidingViewElementAtIndex](this, i);
      el.addClassName(TKSlidingViewCSSElementClass);
      el._needsAppending = true;
      this._elements[i] = el;
      el._slidingViewIndex = i;
      if (this._interactive) {
        el.addEventListener("click", this, false);
      }
      if (this._raiseHoverEvents) {
        el.addEventListener("mouseover", this, false);
        el.addEventListener("mouseout", this, false);
      }
    }
  }
  
  this.layout(true);
};

TKSlidingView.prototype.setPageControl = function (newPageControl) {
  this._pageControl = newPageControl;
  this._pageControl.deferCurrentPageDisplay = true;
  this._pageControl.delegate = this;
  this._pageControl.currentPage = this._activeElementIndex;
};

TKSlidingView.prototype.getActiveElement = function () {
  return this._elements[this._activeElementIndex];
};

TKSlidingView.prototype.setActiveElementIndex = function (newActiveElementIndex) {
  
  if ((this._loops || (newActiveElementIndex >= 0 && newActiveElementIndex < this.numberOfElements)) &&
      newActiveElementIndex != this._activeElementIndex) {

    var needsForcedLayout = (this._activeElementIndex === undefined);

    // call delegate to inform blur of current active element
    if (!needsForcedLayout && TKUtils.objectHasMethod(this.delegate, TKSlidingViewDidBlurElementAtIndex)) {
      this.delegate[TKSlidingViewDidBlurElementAtIndex](this, this._activeElementIndex);
    }

    if (newActiveElementIndex < 0) {
      this._activeElementIndex = (this.numberOfElements + newActiveElementIndex) % this.numberOfElements;
    } else {
      this._activeElementIndex = newActiveElementIndex % this.numberOfElements;
    }

    // if there is a page control, tell it to update
    if (this._pageControl) {
      this._pageControl.currentPage = newActiveElementIndex;
    }
    
    this.bufferElements();
    this.layout(needsForcedLayout);

    // call delegate to inform focus of new active element
    // this needs to be done at the very end so we're use any code depending on
    // .activeElement actually works since we need elements buffered
    if (TKUtils.objectHasMethod(this.delegate, TKSlidingViewDidFocusElementAtIndex)) {
      this.delegate[TKSlidingViewDidFocusElementAtIndex](this, this._activeElementIndex);
    }
  }
};

TKSlidingView.prototype.getNumberOfElements = function () {
  if (this.dataSource) {
    return this.dataSource[TKSlidingViewNumberOfElements](this);
  } else {
    return 0;
  }
};

TKSlidingView.prototype.getElementAtIndex = function (index) {
  return this._elements[index];
};

// this method loads the elements that are necessary for
// display, and removes the ones that are not needed
TKSlidingView.prototype.bufferElements = function () {
  if (this._incrementalLoading) {
    var numElements = this.numberOfElements;
    for (var i=0; i < numElements; i++) {
      var offset = this._activeElementIndex - i;
      var absOffset = Math.abs(offset);
      if (this._loops) {
        // FIXME: check this! doesn't seem right
        var offset2 = offset + ((offset < 0) ? numElements : -numElements);
        var absOffset2 = Math.abs(offset2);
        if (absOffset2 <= this._sideElementsVisible) {
          offset = offset2;
          absOffset = absOffset2;
        }
      }
      if (absOffset <= this._sideElementsVisible) {
        if (!this._elements[i]) {
          var el = this.dataSource[TKSlidingViewElementAtIndex](this, i);
          el.addClassName(TKSlidingViewCSSElementClass);
          el._needsAppending = true;
          this._elements[i] = el;
          el._slidingViewIndex = i;
          if (this._interactive) {
            el.addEventListener("click", this, false);
          }
          if (this._raiseHoverEvents) {
            el.addEventListener("mouseover", this, false);
            el.addEventListener("mouseout", this, false);
          }
          
        }
      } else {
        // element isn't needed
        if (this._elements[i]) {
          this.element.removeChild(this._elements[i]);
          this._elements[i] = null;
        }
      }
    }
  }
};

TKSlidingView.prototype.layout = function (forceLayout) {
  var numElements = this.numberOfElements;

  for (var i=0; i < numElements; i++) {
    var offset = this._activeElementIndex - i;
    var absOffset = Math.abs(offset);
    if (this._loops) {
      // FIXME: check this! doesn't seem right
      var offset2 = offset + ((offset < 0) ? numElements : -numElements);
      var absOffset2 = Math.abs(offset2);
      if (absOffset2 <= this._sideElementsVisible) {
        offset = offset2;
        absOffset = absOffset2;
      }
    }

    var element = this._elements[i];

    if (!element) {
      // only layout elements we need to
      continue;
    }

    // loaded elements might not yet have been added to the document
    // this makes them appear in the right place
    if (element._needsAppending) {
      this.element.appendChild(element);
      element._needsAppending = false;
    }

    // Three cases for layout:
    //    - element is inside (visible)
    //    - element is just outside (one element outside each edge - called "staged")
    //    - element is really outside (we call this "hidden" and inform delegate)

    var transform = null;
    if (absOffset <= this._sideElementsVisible) {
      if (offset > 0) {
        if (this._orientation == TKSlidingViewOrientationHorizontal) {
          transform = "translate3d(" + (-1 * (absOffset * this._distanceBetweenElements + this._sideOffsetBefore)) + "px, 0, 0)";
        } else {
          transform = "translate3d(0, " + (-1 * (absOffset * this._distanceBetweenElements + this._sideOffsetBefore)) + "px, 0)";
        }
        this.applySlidingClass(element, TKSlidingViewCSSSideBeforeClass);
      } else if (offset < 0) {
        if (this._orientation == TKSlidingViewOrientationHorizontal) {
          transform = "translate3d(" + (absOffset * this._distanceBetweenElements + this._sideOffsetAfter) + "px, 0, 0)";
        } else {
          transform = "translate3d(0, " + (absOffset * this._distanceBetweenElements + this._sideOffsetAfter) + "px, 0)";
        }
        this.applySlidingClass(element, TKSlidingViewCSSSideAfterClass);
      } else {
        transform = "translate3d(0, 0, 0)";
        this.applySlidingClass(element, TKSlidingViewCSSFocusedClass);
      }
      element.style.webkitTransform = transform;
      element.style.opacity = 1;
    } else if (absOffset == (this._sideElementsVisible + 1)) {
      // FIXME: this is wrong!! should be staged classes - worried this will break things if I fix it
      if (offset > 0) {
        if (this._orientation == TKSlidingViewOrientationHorizontal) {
          transform = "translate3d(" + (-1 * (absOffset * this._distanceBetweenElements + this._sideOffsetBefore)) + "px, 0, 0)";
        } else {
          transform = "translate3d(0, " + (-1 * (absOffset * this._distanceBetweenElements + this._sideOffsetBefore)) + "px, 0)";
        }
        this.applySlidingClass(element, TKSlidingViewCSSSideBeforeClass);
      } else {
        if (this._orientation == TKSlidingViewOrientationHorizontal) {
          transform = "translate3d(" + (absOffset * this._distanceBetweenElements + this._sideOffsetAfter) + "px, 0, 0)";
        } else {
          transform = "translate3d(0, " + (absOffset * this._distanceBetweenElements + this._sideOffsetAfter) + "px, 0)";
        }
        this.applySlidingClass(element, TKSlidingViewCSSSideAfterClass);
      }
      element.style.webkitTransform = transform;
      element.style.opacity = 0;
    } else if (absOffset > this._sideElementsVisible || forceLayout) {
      if (offset > 0) {
        if (this._orientation == TKSlidingViewOrientationHorizontal) {
          transform = "translate3d(" + (-1 * (absOffset * this._distanceBetweenElements + this._sideOffsetBefore)) + "px, 0, 0)";
        } else {
          transform = "translate3d(0, " + (-1 * (absOffset * this._distanceBetweenElements + this._sideOffsetBefore)) + "px, 0)";
        }
      } else {
        if (this._orientation == TKSlidingViewOrientationHorizontal) {
          transform = "translate3d(" + (absOffset * this._distanceBetweenElements + this._sideOffsetAfter) + "px, 0, 0)";
        } else {
          transform = "translate3d(0, " + (absOffset * this._distanceBetweenElements + this._sideOffsetAfter) + "px, 0)";
        }
      }
      this.applySlidingClass(element, TKSlidingViewCSSHiddenClass);
      element.style.webkitTransform = transform;
      element.style.opacity = 0;
    }
    // now see if we have any over-ride styles to apply from the delegate
    if (TKUtils.objectHasMethod(this.delegate, TKSlidingViewStyleForItemAtIndex)) {
      override_styles = this.delegate[TKSlidingViewStyleForItemAtIndex](this, i);
      for (var j = 0; j < override_styles.length; j++) {
        var override_style = override_styles[j];
        element.style.setProperty(override_style[0], override_style[1], '');
      }
    }
  }
};

TKSlidingView.prototype.applySlidingClass = function (element, className) {
  element.removeClassName(TKSlidingViewCSSFocusedClass);
  element.removeClassName(TKSlidingViewCSSSideBeforeClass);
  element.removeClassName(TKSlidingViewCSSSideAfterClass);
  element.removeClassName(TKSlidingViewCSSStagedBeforeClass);
  element.removeClassName(TKSlidingViewCSSStagedAfterClass);
  element.removeClassName(TKSlidingViewCSSHiddenClass);
  
  element.addClassName(className);
};

TKSlidingView.prototype.handleEvent = function (event) {
  switch (event.type) {
    case "click":
      this.handleClick(event);
      break;
    case "mouseover":
      this.handleMouseover(event);
      break;
    case "mouseout":
      this.handleMouseout(event);
      break;
    default:
      debug("unhandled event type in TKSlidingView: " + event.type);
  }
};

TKSlidingView.prototype.handleClick = function (event) {
  // The event.target should have an _slidingViewIndex property. If
  // not, then go up to parent
  var target = event.target;
  while (target && TKUtils.objectIsUndefined(target._slidingViewIndex)) {
    target = target.parentNode;
  }
  if (!target) {
    return;
  }
  
  if (target._slidingViewIndex == this.activeElementIndex) {
    if (TKUtils.objectHasMethod(this.delegate, TKSlidingViewDidSelectActiveElement)) {
      this.delegate[TKSlidingViewDidSelectActiveElement](this, this._activeElementIndex);
    }
  } else {
    // Check if the click was before or after the focused element.
    if (target._slidingViewIndex < this.activeElementIndex) {
      if (this._loops && target._slidingViewIndex == 0) {
        this.activeElementIndex = 0;
      } else {
        this.activeElementIndex--;
      }
    } else {
      if (this._loops && target._slidingViewIndex == this.numberOfElements - 1) {
        this.activeElementIndex = this.numberOfElements - 1;
      } else {
        this.activeElementIndex++;
      }
    }
  }
};

TKSlidingView.prototype.handleMouseover = function (event) {
  // The event.target should have an _slidingViewIndex property. If
  // not, then go up to parent
  var target = event.target;
  while (target && TKUtils.objectIsUndefined(target._slidingViewIndex)) {
    target = target.parentNode;
  }
  if (!target) {
    return;
  }
  
  if (TKUtils.objectHasMethod(this.delegate, TKSlidingViewDidHoverElementAtIndex)) {
    this.delegate[TKSlidingViewDidHoverElementAtIndex](this, target._slidingViewIndex);
  }
};

TKSlidingView.prototype.handleMouseout = function (event) {
  // The event.target should have an _slidingViewIndex property. If
  // not, then go up to parent
  var target = event.target;
  while (target && TKUtils.objectIsUndefined(target._slidingViewIndex)) {
    target = target.parentNode;
  }
  if (!target) {
    return;
  }
  
  if (TKUtils.objectHasMethod(this.delegate, TKSlidingViewDidUnhoverElementAtIndex)) {
    this.delegate[TKSlidingViewDidUnhoverElementAtIndex](this, target._slidingViewIndex);
  }
};

// delegate for page control
TKSlidingView.prototype.pageControlDidUpdateCurrentPage = function (control, newPageIndex) {
  if (control === this._pageControl) {
    this.activeElementIndex = newPageIndex;
    this._pageControl.updateCurrentPageDisplay();
  }
};


TKClass(TKSlidingView);

/* ====================== Datasource helper ====================== */

function TKSlidingViewDataSourceHelper(data, incrementalLoading) {
  this.data = data;
  this.incrementalLoading = incrementalLoading;
  this.elements = [];
};

TKSlidingViewDataSourceHelper.prototype.slidingViewNumberOfElements = function(view) {
  if (this.data) {
    return this.data.length;
  } else {
    return 0;
  }
};

TKSlidingViewDataSourceHelper.prototype.slidingViewElementAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  var element = this.elements[index];
  if (!element) {
    var source = this.data[index];
    element = TKUtils.buildElement(source);
  }
  if (!this.incrementalLoading) {
    this.elements[index] = element;
  }
  return element;
};

/* ====================== Declarative helper ====================== */

TKSlidingView.buildSlidingView = function(element, data) {
  if (TKUtils.objectIsUndefined(data) || !data || data.type != "TKSlidingView") {
    return null;
  }

  var slidingView = new TKSlidingView(element);
  if (!TKUtils.objectIsUndefined(data.elements)) {
    slidingView.dataSource = new TKSlidingViewDataSourceHelper(data.elements, data.incrementalLoading);
  }

  TKSlidingView.synthetizes.forEach(function(prop) {
    if (prop != "dataSource" && prop != "delegate") {
      if (!TKUtils.objectIsUndefined(data[prop])) {
        slidingView[prop] = data[prop];
      }
    }
  });

  return slidingView;
};

