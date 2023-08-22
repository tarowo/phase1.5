/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

// ---------------------------------------------------
// A page control implementation
// ---------------------------------------------------

/**
 *  @class
 *  @name TKPageControlData
 *  @since TuneKit 1.0
 */

/**
 *  @name TKPageControlData.prototype
 *
 *  @property {int} distanceBetweenPageIndicators The distance in pixels between the center points of each indicator, essentially the overall
 *  width of each indicator.
 *
 *  @property {bool} showPageElements Indicates whether individual elements for each page should be shown, or only the pill. Defaults to <code>false</code.
 *
 *  @property {Element} indicatorElement The element to be used for the active element indicator.
 *
 *  @property {Element} pageElement The template element to be used to represent each of the pages.
 *
 *  @property {bool} incrementalJumpsOnly Indicates whether only interactive jumps of one page at a time are allowed.
 *
 *  @property {bool} allowsDragging Indicates whether dragging is allowed.
 *
 */

// data source method names
const TKPageControlIndicatorElement = 'pageControlIndicatorElement';
const TKPageControlPageElement = 'pageControlPageElement';

// delegate method names
const TKPageControlDidUpdateCurrentPage = 'pageControlDidUpdateCurrentPage';

// css protocol
const TKPageControlCSSClass = 'page-control';
const TKPageControlCSSIndicatorElementClass = 'page-control-indicator-element';
const TKPageControlCSSPageElementClass = 'page-control-page-element';

// TODO: orientations

TKPageControl.synthetizes = ['dataSource',
                             'delegate',
                             'interactive', // whether or not this view will listen for mouse events
                             'currentPage', // the index of the current page
                             'numPages', // the number of pages
                             'distanceBetweenPageIndicators', // the distance between the page ticks - FIXME: this is the wrong term
                             'showPageElements', // whether or not to show the page indicators
                             'incrementalJumpsOnly', // if true, the page control only allows interactive jumps of one page at a time
                             'allowsDragging', // if true, the pages control allows dragging
                             'uniqueClass', // adds a unique class name to each page indicator element
                             'deferCurrentPageDisplay']; // whether or not to update the display as soon as currentPage changes - needed for syncing with an external control when interactive

function TKPageControl (element) {
  this.callSuper();
  //
  this._interactive = true;
  this._currentPage = 0;
  this._numPages = 1;
  this._distanceBetweenPageIndicators = 50;
  this._showPageElements = true;
  this._incrementalJumpsOnly = true;
  this._allowsDragging = false;
  this._deferCurrentPageDisplay = false;
  this._uniqueClass = false;
  
  if (element) {
    this.element = element;
  } else {
    // create the element we'll use as a container
    this.element = document.createElement("div");
  }
  this.element.addClassName(TKPageControlCSSClass);
}

TKPageControl.prototype.init = function () {

  if (!this.dataSource ||
      !TKUtils.objectHasMethod(this.dataSource, TKPageControlIndicatorElement) ||
      (this._showPageElements && !TKUtils.objectHasMethod(this.dataSource, TKPageControlPageElement))) {
    return;
  }

  // add page elements if needed
  if (this.showPageElements) {
    // get the page element
    var pageElement = this.dataSource[TKPageControlPageElement](this);
    for (var i=0; i < this._numPages; i++) {
      var el = pageElement.cloneNode();
      el.addClassName(TKPageControlCSSPageElementClass);
      if (this._uniqueClass) el.addClassName('thumb-' + i);
      el.style.webkitTransform = "translate(" + (i * this._distanceBetweenPageIndicators) + "px, 0px)";
      el._pageControlIndex = i;
      this.element.appendChild(el);
    }
  }
  
  // add indicator element
  var indicatorElement = this.dataSource[TKPageControlIndicatorElement](this);
  indicatorElement.addClassName(TKPageControlCSSIndicatorElementClass);
  indicatorElement.style.webkitTransform = "translate(" + (this._currentPage * this._distanceBetweenPageIndicators) + "px, 0px)";
  this.element.appendChild(indicatorElement);
  
  if (this._interactive) {
    if (this._allowsDragging) {
      this.element.addEventListener("mousedown", this, false);
    } else {
      this.element.addEventListener("click", this, false);
    }
  }
};

TKPageControl.prototype.setCurrentPage = function (newCurrentPage) {
  if (this._currentPage == newCurrentPage ||
      newCurrentPage < 0 ||
      newCurrentPage >= this._numPages) {
    return;
  }
  
  this._currentPage = newCurrentPage;
  
  if (TKUtils.objectHasMethod(this.delegate, TKPageControlDidUpdateCurrentPage)) {
    this.delegate[TKPageControlDidUpdateCurrentPage](this, this._currentPage);
  }
  
  if (!this._deferCurrentPageDisplay) {
    this.updateCurrentPageDisplay();
  }
};

TKPageControl.prototype.updateCurrentPageDisplay = function () {
  var indicatorElement = this.dataSource[TKPageControlIndicatorElement](this);
  indicatorElement.style.webkitTransform = "translate(" + (this._currentPage * this._distanceBetweenPageIndicators) + "px, 0px)";
};

TKPageControl.prototype.handleEvent = function (event) {
  switch (event.type) {
    case "mousedown":
      this.handleDragBegan(event);
      break;
    case "mousemove":
      this.handleDragMove(event);
      break;
    case "mouseup":
      this.handleDragEnded(event);
      break;
    case "click":
      this.handleClick(event);
      break;
    default:
      debug("unhandled event type in TKPageControl: " + event.type);
  }
};

TKPageControl.prototype.setupMouseInteraction = function () {
  // in case we have page elements, let's look at the position of the first element as
  // the minimum x value that we'll use for interactions from then on
  if (this._showPageElements) {
    // get the elements
    var page_elements = this.element.querySelectorAll('.' + TKPageControlCSSPageElementClass);
    var page_element_bounds = page_elements[0].getBounds();
    this.minX = page_element_bounds.x + (page_element_bounds.width - this._distanceBetweenPageIndicators) / 2;
    this.minY = page_element_bounds.y;
  }
  // otherwise, use the bounds of the container
  else {
    this.minX = this.element.getBounds().x;
    this.minY = this.element.getBounds().y;
  }
  // now convert this value into the coordinate system of our element
  var point = window.webkitConvertPointFromPageToNode(this.element, new WebKitPoint(this.minX, this.minY));
  this.minX = point.x;
};

TKPageControl.prototype.pageIndexAtXY = function (x, y) {
  var point = window.webkitConvertPointFromPageToNode(this.element, new WebKitPoint(x, y));
  var page_index = Math.floor((point.x - this.minX) / this._distanceBetweenPageIndicators);
  return Math.max(Math.min(page_index, this._numPages - 1), 0);
};

TKPageControl.prototype.handleClick = function (event) {
  // set up the mouse interaction
  this.setupMouseInteraction();
  // mark that we are interacting
  // XXX: should we really be doing this? This class is not being removed it seems.
  this.element.addClassName("interactive");
  // set the current page based on that right from the get go
  this.currentPage = this.pageIndexAtXY(event.clientX, event.clientY);
};

TKPageControl.prototype.handleDragBegan = function (event) {
  if (!this._allowsDragging) {
    return;
  }
  // ensure we cancel the default web page behavior for a dragging interaction
  event.preventDefault();
  // set up the mouse interaction
  this.setupMouseInteraction();
  // mark that we are interacting
  this.element.addClassName("interactive");
  // set the current page based on that right from the get go
  this.currentPage = this.pageIndexAtXY(event.clientX, event.clientY);
  // track mouse moves
  window.addEventListener("mousemove", this, false);
  window.addEventListener("mouseup", this, false);
};

TKPageControl.prototype.handleDragMove = function (event) {
  // ensure we cancel the default web page behavior for a dragging interaction
  event.preventDefault();
  // update the page
  this.currentPage = this.pageIndexAtXY(event.clientX, event.clientY);
};

TKPageControl.prototype.handleDragEnded = function (event) {
  // ensure we cancel the default web page behavior for a dragging interaction
  event.preventDefault();
  // mark that we are not interacting anymore
  this.element.removeClassName("interactive");
  // stop tracking events
  window.removeEventListener("mousemove", this);
  window.removeEventListener("mouseup", this);
};

TKClass(TKPageControl);

/* ====================== Datasource helper ====================== */

function TKPageControlDataSourceHelper(data) {
  this.data = data;
  this.pageElement = null;
  this.indicatorElement = null;
};

TKPageControlDataSourceHelper.prototype.pageControlPageElement = function(pageControl) {
  if (!this.data) {
    return null;
  }
  if (!this.pageElement) {
    this.pageElement = TKUtils.buildElement(this.data.pageElement);
  }
  return this.pageElement;
};

TKPageControlDataSourceHelper.prototype.pageControlIndicatorElement = function(pageControl) {
  if (!this.data) {
    return null;
  }
  if (!this.indicatorElement) {
    this.indicatorElement = TKUtils.buildElement(this.data.indicatorElement);
  }
  return this.indicatorElement;
};

/* ====================== Declarative helper ====================== */

TKPageControl.buildPageControl = function(element, data) {
  if (TKUtils.objectIsUndefined(data) || !data || data.type != "TKPageControl") {
    return null;
  }

  var pageControl = new TKPageControl(element);

  pageControl.dataSource = new TKPageControlDataSourceHelper(data);

  TKPageControl.synthetizes.forEach(function(prop) {
    if (prop != "dataSource" && prop != "delegate") {
      if (!TKUtils.objectIsUndefined(data[prop])) {
        pageControl[prop] = data[prop];
      }
    }
  });

  return pageControl;
};

