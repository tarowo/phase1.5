/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

const TKPageSliderControllerContainerCSSClass = 'tk-page-slider-controller-view';

TKPageSliderController.inherits = TKController;
TKPageSliderController.synthetizes = ['slidingViewData', 'pageControlData', 'previousPageButton', 'nextPageButton', 'highlightedPageIndex'];

/**
 *  @class
 *
 *  <p>A page slider controller adds the ability to browse through a collection of elements, often images, with nice and smooth transitions
 *  set up in CSS. Using this controller type, you can easily track when a new page is highlighted or activated. Optionally, you can also
 *  set up a series of indicators giving the user an overview of the number of images and arrows to navigate through elements, the connection
 *  between the various components being automatically handled behind the scenes for you.</p>
 *
 *  @extends TKController
 *  @since TuneKit 1.0
 *
 *  @param {Object} data A hash of properties to use as this object is initialized.
 */
function TKPageSliderController (data) {
  this._previousPageButton = null;
  this._nextPageButton = null;
  /**
   *  Indicates whether the pages managed by the controller are navigable with keys. Defaults to <code>true</code>.
   *  @type bool
   */
  this.highlightsFocusedPage = true;
  /**
   *  Indicates whether navigation of pages is done strictly with paging buttons. Defaults to <code>false</code>, allowing the Apple remote to
   *  be used to navigate between pages.
   *  @type bool
   */
  this.navigatesWithPagingButtonsOnly = false;
  /**
   *  Indicates whether the focused page can get activated. Defaults to <code>true</code>, setting this to <code>false</code> plays the limit sound when
   *  the user attempts to activate the focused page.
   *  @type bool
   */
  this.activatesFocusedPage = true;
  /**
   *  Provides the list of directions that the user can navigate out of the list of pages. By default, this array is empty, meaning that if the
   *  {@link #navigatesWithPagingButtonsOnly} property is set to <code>false</code> and pages can be navigated with arrow keys, then the user will not
   *  be able to move focus out of the pages from either ends. The directions allowed are the <code>TKSpatialNavigationManagerDirection</code> family
   *  of constants.
   *  @type Array
   */
  this.allowedOutwardNavigationDirections = [];
  // set up the sliding view
  /**
   *  The backing sliding view hosting the pages.
   *  @type TKSlidingView
   *  @private
   */
  this.slidingView = new TKSlidingView();
  this.slidingView.ready = false;
  this.slidingView.delegate = this;
  // set up the page control
  /**
   *  The backing page control hosting the page indicators.
   *  @type TKPageControl
   *  @private
   */
  this.pageControl = new TKPageControl();
  this.pageControl.delegate = this;
  //
  this._slidingViewData = null;
  this._pageControlData = null;
  //
  this.callSuper(data);
};

TKPageSliderController.prototype.processView = function () {
  this.callSuper();
  // restore properties that have not been set yet since construction
  this.restoreProperty('previousPageButton');
  this.restoreProperty('nextPageButton');
  this.restoreProperty('slidingViewData');
  this.restoreProperty('pageControlData');
  this.restoreProperty('highlightedPageIndex');
  // wire up actions if we have a previous and next button wired
  // add the sliding view and page control containers
  this.container = this._view.appendChild(document.createElement('div'));
  this.container.addClassName(TKPageSliderControllerContainerCSSClass);
  this.container.appendChild(this.slidingView.element);
  this.container.appendChild(this.pageControl.element);
  // ensure our first page gets told about its being highlighted
  this.pageWasHighlighted(this.highlightedPageIndex);
  this.syncPageButtons();
  // highlight the first page in case we have no explicit highlighted element
  if ((this.highlightedElement === null || !this.highlightedElement.isNavigable()) && this.slidingView.ready && this.highlightsFocusedPage) {
    this.highlightedElement = this.slidingView.activeElement;
  }
};

/**
 *  @name TKPageSliderController.prototype
 *  @property {int} highlightedPageIndex The index of the page currently selected within the collection of pages.
 */
TKPageSliderController.prototype.getHighlightedPageIndex = function () {
  return this.slidingView.activeElementIndex;
};

TKPageSliderController.prototype.setHighlightedPageIndex = function (index) {
  if (index === null) {
    return;
  }
  // apply to the sliding view if it's ready
  if (this.slidingView.ready) {
    this.slidingView.activeElementIndex = index;
    if (this.highlightedElement.hasClassName(TKSlidingViewCSSElementClass)) {
      this.registerNavigablePages();
      this.highlightedElement = this.slidingView.activeElement;
    }
  }
};

/**
 *  @name TKPageSliderController.prototype
 *  @property {String} previousPageButton A CSS selector matching a button to be used as the button to decrement the {@link #highlightedPageIndex}.
 */
TKPageSliderController.prototype.setPreviousPageButton = function (previousPageButton) {
  if (previousPageButton === null) {
    return;
  }
  // forget old button
  if (this._previousPageButton) {
    this.removeNavigableElement(this._previousPageButton);
  }
  // process new one
  if (previousPageButton !== null) {
    this._previousPageButton = this.view.querySelector(previousPageButton);
    if (this._previousPageButton !== null) {
      if (IS_APPLE_TV && !this.navigatesWithPagingButtonsOnly) {
        this._previousPageButton.style.display = 'none';
      }
      else {
        this.addNavigableElement(this._previousPageButton);
      }
    }
  }
};

/**
 *  @name TKPageSliderController.prototype
 *  @property {String} nextPageButton A CSS selector matching a button to be used as the button to increment the {@link #highlightedPageIndex}.
 */
TKPageSliderController.prototype.setNextPageButton = function (nextPageButton) {
  if (nextPageButton === null) {
    return;
  }
  // forget old button
  if (this._nextPageButton) {
    this.removeNavigableElement(this._nextPageButton);
  }
  // process new one
  if (nextPageButton !== null) {
    this._nextPageButton = this.view.querySelector(nextPageButton);
    if (this._nextPageButton !== null) {
      if (IS_APPLE_TV && !this.navigatesWithPagingButtonsOnly) {
        this._nextPageButton.style.display = 'none';
      }
      else {
        this.addNavigableElement(this._nextPageButton);
      }
    }
  }
};

/**
 *  @name TKPageSliderController.prototype
 *  @property {TKSlidingViewData} slidingViewData The set of properties used to set up the contents of the page slider.
 */
TKPageSliderController.prototype.setSlidingViewData = function (data) {
  if (data === null) {
    return;
  }
  // set up the data source if we have .elements on the data object
  if (!TKUtils.objectIsUndefined(data.elements)) {
    this.slidingView.dataSource = new TKSlidingViewDataSourceHelper(data.elements);
    delete data.element;
  }
  // see if we have some intersting bits to pass through
  var archived_page_index = this.getArchivedProperty('highlightedPageIndex');
  if (archived_page_index !== undefined) {
    data.activeElementIndex = archived_page_index;
  }
  // copy properties
  TKUtils.copyPropertiesFromSourceToTarget(data, this.slidingView);
  // init our view
  this.slidingView.init();
  //
  this.slidingView.ready = true;
  //
  this.syncPageButtons();
  // add the currently focused element to the list of keyboard elements and highlight it
  if (this.highlightsFocusedPage) {
    this.registerNavigablePages();
    this.highlightedElement = this.slidingView.activeElement;
    if (this.viewWasProcessed) {
      TKSpatialNavigationManager.sharedManager.highlightElement(this.slidingView.activeElement);
    }
  }
};

/**
 *  @name TKPageSliderController.prototype
 *  @property {TKPageControlData} pageControlData The set of properties used to set up the contents of the optional page indicators.
 */
TKPageSliderController.prototype.setPageControlData = function (data) {
  if (data === null) {
    return;
  }
  // set up the data source
  this.pageControl.dataSource = new TKPageControlDataSourceHelper(data);
  // copy properties
  TKUtils.copyPropertiesFromSourceToTarget(data, this.pageControl);
  // init our control
  this.pageControl.init();
  // get the current page from the sliding view if we have it set only after
  if (this.slidingView.ready) {
    this.pageControl.currentPage = this.highlightedPageIndex;
  }
};

/* ==================== Event Handling ==================== */

// private method meant to be over-ridden by a controller sub-classes to provide a custom element
// to highlight, returning null means there's nothing custom to report
TKPageSliderController.prototype._preferredElementToHighlightInDirection = function (currentElement, direction) {
  var can_exit_in_direction = (this.allowedOutwardNavigationDirections.indexOf(direction) != -1);
  var element = this.callSuper(currentElement, direction);
  if (!this.navigatesWithPagingButtonsOnly && currentElement.hasClassName(TKSlidingViewCSSElementClass)) {
    if (direction == KEYBOARD_LEFT) {
      if (this.slidingView.activeElementIndex <= 0 && !this.slidingView.loops) {
        if (!can_exit_in_direction) {
          element = null;
        }
      }
      else {
        element = this.slidingView.getElementAtIndex((this.slidingView.activeElementIndex + this.slidingView.numberOfElements - 1) % this.slidingView.numberOfElements);
      }
    }
    else if (direction == KEYBOARD_RIGHT) {
      if (this.slidingView.activeElementIndex >= this.slidingView.numberOfElements - 1 && !this.slidingView.loops) {
        if (!can_exit_in_direction) {
          element = null;
        }
      }
      else {
        element = this.slidingView.getElementAtIndex((this.slidingView.activeElementIndex + 1) % this.slidingView.numberOfElements);
      }
    }
  }
  return element;
};

TKPageSliderController.prototype.elementWasActivated = function (element) {
  // previous page button pressed
  if (element === this._previousPageButton) {
    var can_navigate = (this.slidingView.activeElementIndex > 0 || this.slidingView.loops);
    TKSpatialNavigationManager.soundToPlay = (can_navigate) ? SOUND_MOVED : SOUND_LIMIT;
    if (can_navigate) {
      this.unregisterNavigablePages();
    }
    this.slidingView.activeElementIndex--;
  }
  // next page button pressed
  else if (element === this._nextPageButton) {
    var can_navigate = (this.slidingView.activeElementIndex < this.slidingView.numberOfElements - 1 || this.slidingView.loops);
    TKSpatialNavigationManager.soundToPlay = (can_navigate) ? SOUND_MOVED : SOUND_LIMIT;
    if (can_navigate) {
      this.unregisterNavigablePages();
    }
    this.slidingView.activeElementIndex++;
  }
  // focused element in the sliding view
  else if (element.hasClassName(TKSlidingViewCSSFocusedClass)) {
    if (this.activatesFocusedPage) {
      this.pageWasSelected(this.slidingView.activeElementIndex);
    }
    else {
      TKSpatialNavigationManager.soundToPlay = SOUND_LIMIT;
    }
  }
  // fall back to default behavior
  else {
    this.callSuper(element);
  }
};

TKPageSliderController.prototype.elementWasHighlighted = function (element, previouslyHighlightedElement) {
  if (element.hasClassName(TKSlidingViewCSSElementClass)) {
    this.slidingView.activeElementIndex = element._slidingViewIndex;
    // track navigation on all elements if we're getting highlight for the first time
    if (previouslyHighlightedElement !== null &&
        (!previouslyHighlightedElement.hasClassName(TKSlidingViewCSSElementClass) ||
        previouslyHighlightedElement._controller !== this)) {
      this.registerNavigablePages();
    }
  }
};

TKPageSliderController.prototype.elementWasUnhighlighted = function (element, nextHighlightedElement) {
  // are we focusing an element outside of our sliding view?
  if (element.hasClassName(TKSlidingViewCSSElementClass) &&
      (!nextHighlightedElement.hasClassName(TKSlidingViewCSSElementClass) ||
      nextHighlightedElement._controller !== this)) {
    // make all the other elements non-navigable
    this.unregisterNavigablePages();
    // save for the active one
    this.addNavigableElement(this.slidingView.activeElement);
  }
};

TKPageSliderController.prototype.syncPageButtons = function () {
  // nothing to do if the sliding view is looping
  if (this.slidingView.loops || !this.isViewLoaded()) {
    return;
  }
  // check if the previous page button needs hiding
  if (this._previousPageButton instanceof Element) {
    this._previousPageButton[(this.slidingView.activeElementIndex <= 0 ? 'add' : 'remove') + 'ClassName']('inactive');
  }
  // check if the next page button needs hiding
  if (this._nextPageButton instanceof Element) {
    this._nextPageButton[(this.slidingView.activeElementIndex >= this.slidingView.numberOfElements - 1 ? 'add' : 'remove') + 'ClassName']('inactive');
  }
};

TKPageSliderController.prototype.registerNavigablePages = function () {
  if (this.navigatesWithPagingButtonsOnly) {
    this.addNavigableElement(this.slidingView.activeElement);
  }
  else {
    var elements = this.slidingView.element.querySelectorAll('.' + TKSlidingViewCSSElementClass);
    for (var i = 0; i < elements.length; i++) {
      this.addNavigableElement(elements[i]);
    }
  }
};

TKPageSliderController.prototype.unregisterNavigablePages = function () {
  var elements = this.slidingView.element.querySelectorAll('.' + TKSlidingViewCSSElementClass);
  for (var i = 0; i < elements.length; i++) {
    this.removeNavigableElement(elements[i]);
  }
};

/* ==================== TKSlidingView Protocol ==================== */

TKPageSliderController.prototype.slidingViewDidFocusElementAtIndex = function (view, index) {
  if (this.highlightsFocusedPage && this.slidingView.ready) {
    if (this.highlightedElement.hasClassName(TKSlidingViewCSSElementClass)) {
      this.registerNavigablePages();
    }
    else {
      this.unregisterNavigablePages();
      this.addNavigableElement(this.slidingView.activeElement);
    }
    // make sure the element has focus
    if (this.viewWasProcessed) {
      TKSpatialNavigationManager.sharedManager.highlightElement(this.slidingView.activeElement);
    }
  }
  //
  this.pageControl.currentPage = index;
  this.pageWasHighlighted(index);
  // update the states of previous and next buttons
  this.syncPageButtons();
};

TKPageSliderController.prototype.slidingViewDidBlurElementAtIndex = function (view, index) {
  if (this.highlightsFocusedPage) {
    this.unregisterNavigablePages();
  }
};

TKPageSliderController.prototype.slidingViewDidSelectActiveElement = function (view, index) {
  this.pageWasSelected(index);
};

TKPageSliderController.prototype.slidingViewStyleForItemAtIndex = function (view, index) {
  return this.styleForPageAtIndex(index);
};

TKPageSliderController.prototype.slidingViewDidHoverElementAtIndex = function (view, index) {
  this.pageWasHovered(index);
};

TKPageSliderController.prototype.slidingViewDidUnhoverElementAtIndex = function (view, index) {
  this.pageWasUnhovered(index);
};

/* ==================== Placeholder Methods ==================== */

/**
 *  Triggered as the {@link #highlightedPageIndex} property has changed when a new page became focused.
 *
 *  @param {int} index The index of the newly focused page
 */
TKPageSliderController.prototype.pageWasHighlighted = function (index) {};

/**
 *  Triggered as the focused page was selected by the user, either from clicking on the page or using the play/pause remote key.
 *
 *  @param {int} index The index of the activated page
 */
TKPageSliderController.prototype.pageWasSelected = function (index) {};

TKPageSliderController.prototype.pageWasHovered = function (index) {};

TKPageSliderController.prototype.pageWasUnhovered = function (index) {};

/**
 *  This method allows to provide custom style rules for a page programatically any time the {@link #highlightedPageIndex} property changes. The values in this
 *  array are expected to be individual two-value arrays, where the first index holds the CSS property name, and the second index its value.
 *
 *  @param {Array} index The index of the page for which we are trying to obtain custom styles.
 */
TKPageSliderController.prototype.styleForPageAtIndex = function (index) {
  return [];
};

/* ==================== TKPageControl Protocol ==================== */

TKPageSliderController.prototype.pageControlDidUpdateCurrentPage = function (control, newPageIndex) {
  this.slidingView.activeElementIndex = newPageIndex;
  this.pageControl.updateCurrentPageDisplay();
};

/* ==================== Archival ==================== */

TKPageSliderController.prototype.archive = function () {
  var archive = this.callSuper();
  archive.highlightedPageIndex = this.highlightedPageIndex;
  return archive;
};

TKClass(TKPageSliderController);
