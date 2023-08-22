/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

TKPositioningController.inherits = TKController;
TKPositioningController.synthetizes = ['positioningViewData'];

function TKPositioningController (data) {
  this.previousButton = null;
  this.nextButton = null;
  this.movesWithElementHighlight = true;
  // set up the positioning view
  this.positioningView = new TKPositioningView();
  this.positioningView.delegate = this;
  this.positioningView.ready = false;
  // set up default pointers for arrows
  this._previousButton = null;
  this._nextButton = null;
  //
  this.callSuper(data);
};

TKPositioningController.prototype.processView = function () {
  this.callSuper();
  // wire up actions if we have a previous and next button wired
  if (this.previousButton !== null) {
    this._previousButton = this.view.querySelector(this.previousButton);
    if (this._previousButton !== null) {
      this._previousButton.addEventListener('click', this, false);
      this.addNavigableElement(this._previousButton);
    }
  }
  if (this.nextButton !== null) {
    this._nextButton = this.view.querySelector(this.nextButton);
    if (this._nextButton !== null) {
      this._nextButton.addEventListener('click', this, false);
      this.addNavigableElement(this._nextButton);
    }
  }
  // ensure our first page gets told about its being highlighted
  this.syncPageButtons();
  // highlight the first page in case we have no explicit highlighted element
  if (this.highlightedElement === null && this.positioningView.ready && this.movesWithElementHighlight) {
    this.highlightedElement = this.positioningView._elements[this.positioningView.activeElementIndex];
  }
};

TKPositioningController.prototype.setPositioningViewData = function (data) {
  // set up the data source if we have .elements on the data object
  if (!TKUtils.objectIsUndefined(data.elements)) {
    this.positioningView.dataSource = new TKPositioningViewDataSourceHelper(data.elements);
    // FIXME: huh?
    //delete data.element;
  }
  // copy properties
  TKUtils.copyPropertiesFromSourceToTarget(data, this.positioningView);
  // init our view
  this.positioningView.init();
  this.syncPageButtons();
  //
  if (this.movesWithElementHighlight) {
    for (var i = 0; i < this.positioningView._elements.length; i++) {
      var element = this.positioningView._elements[i];
      element.addEventListener('focus', this, false);
      this.addNavigableElement(element);
    }
  }
  //
  this.positioningView.ready = true;
  // add the currently focused element to the list of keyboard elements and highlight it
  // if we're not directly a child of the navigation controller
  if (this.viewWasProcessed && this.movesWithElementHighlight && this.parentController === TKNavigationController.sharedNavigation) {
    TKSpatialNavigationManager.sharedManager.highlightElement(this.positioningView._elements[this.positioningView.activeElementIndex]);
  }
  //
  this._view.appendChild(this.positioningView.element);
};

TKPositioningController.prototype.syncPageButtons = function () {
  if (this._previousButton !== null) {
    this._previousButton[(this.positioningView.activeElementIndex <= 0 ? 'add' : 'remove') + 'ClassName']('inactive');
  }
  if (this._nextButton !== null) {
    this._nextButton[(this.positioningView.activeElementIndex >= this.positioningView.numberOfElements - 1 ? 'add' : 'remove') + 'ClassName']('inactive');
  }
};


/* ==================== Event Handling ==================== */

TKPositioningController.prototype.elementWasActivated = function (element) {
  // see if we hit one of the previous / next buttons
  if (event.currentTarget === this._previousButton) {
    this.positioningView.activeElementIndex--;
    TKSpatialNavigationManager.soundToPlay = (this.positioningView.activeElementIndex > 0) ? SOUND_MOVED : SOUND_LIMIT;
  }
  else if (event.currentTarget === this._nextButton) {
    this.positioningView.activeElementIndex++;
    TKSpatialNavigationManager.soundToPlay = (this.positioningView.activeElementIndex < this.positioningView.numberOfElements - 1) ? SOUND_MOVED : SOUND_LIMIT;
  }
  // focused element in the positioning view
  else if (element.hasClassName(TKPositioningViewCSSFocusedClass)) {
    // we only need to trigger selection on activation when running on Apple TV
    if (IS_APPLE_TV) {
      this.elementWasSelected(this.positioningView.activeElementIndex);
    }
  }
  else {
    this.callSuper(element);
  }
};

TKPositioningController.prototype.handleEvent = function (event) {
  this.callSuper(event);
  //
  if (event.currentTarget._positioningViewIndex !== undefined) {
    if (event.type == 'highlight') {
      this.positioningView.activeElementIndex = event.currentTarget._positioningViewIndex;
    }
  }
};

/* ==================== TKPositioningView Protocol ==================== */

TKPositioningController.prototype.positioningViewDidFocusElementAtIndex = function (view, index) {
  // update the states of previous and next buttons
  this.syncPageButtons();
};

TKPositioningController.prototype.positioningViewDidBlurElementAtIndex = function (view, index) {};

TKPositioningController.prototype.positioningViewDidSelectActiveElement = function (view, index) {
  this.elementWasSelected(index);
};

// placeholders to be over-riden by instance
TKPositioningController.prototype.elementWasSelected = function (index) {};

TKClass(TKPositioningController);
