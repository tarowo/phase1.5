/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

TKComicController.inherits = TKController;
TKComicController.synthetizes = ['comicViewData'];

function TKComicController (data) {
  // set up the comic view
  this.comicView = new TKComicView();
  this.comicView.delegate = this;
  // set up default pointers for arrows
  this._previousButton = null;
  this._nextButton = null;
  //
  this.callSuper(data);
};

TKComicController.prototype.processView = function () {
  this.callSuper();
  // add the positioning view
  this._view.appendChild(this.comicView.element);
  // wire up actions if we have a previous and next button wired
  if (this.previousButton !== null) {
    this._previousButton = this.view.querySelector(this.previousButton);
    if (this._previousButton !== null) {
      this._previousButton.addEventListener('click', this, false);
    }
  }
  if (this.nextButton !== null) {
    this._nextButton = this.view.querySelector(this.nextButton);
    if (this._nextButton !== null) {
      this._nextButton.addEventListener('click', this, false);
    }
  }
  this.addNavigableElement(this._view);
};

TKComicController.prototype.setComicViewData = function (data) {
  // set up the data source if we have .elements on the data object
  if (!TKUtils.objectIsUndefined(data.elements)) {
    this.comicView.dataSource = new TKComicViewDataSourceHelper(data.elements);
  }
  // copy properties
  TKUtils.copyPropertiesFromSourceToTarget(data, this.comicView);
  // init our view
  this.comicView.init();
  this.syncPageButtons();
};

TKComicController.prototype.syncPageButtons = function () {
  if (this._previousButton !== null) {
    this._previousButton[(this.comicView.currentPanelIndex <= 0 ? 'add' : 'remove') + 'ClassName']('inactive');
  }
  if (this._nextButton !== null) {
    this._nextButton[(this.comicView.currentPanelIndex >= this.comicView.numberOfPanels - 1 ? 'add' : 'remove') + 'ClassName']('inactive');
  }
};

/* ==================== Event Handling ==================== */

TKComicController.prototype.wantsToHandleKeyboardEvent = function (event) {
  return (this.wantsCustomHandlingOfKeyboardEvent(event) || this.callSuper(event));
};

TKComicController.prototype.wantsCustomHandlingOfKeyboardEvent = function (event) {
  return false;
  // FIXME: actually implement this
  var key = event.keyCode;
  return (
    (key == KEYBOARD_LEFT && this.positioningView.activeElementIndex > 0) ||
    (key == KEYBOARD_RIGHT && this.positioningView.activeElementIndex < this.positioningView.numberOfElements - 1)
  );
};

TKComicController.prototype.handleKeydown = function (event) {
  if (!this.wantsCustomHandlingOfKeyboardEvent(event)) {
    this.callSuper(event);
    return;
  }
  switch (event.keyCode) {
    case KEYBOARD_RIGHT:
      this.positioningView.activeElementIndex++;
      break;
    case KEYBOARD_LEFT:
      this.positioningView.activeElementIndex--;
      break;
  }
};

TKComicController.prototype.handleEvent = function (event) {
  this.callSuper(event);
  // see if we hit one of the previous / next buttons
  if (event.currentTarget === this._previousButton) {
    this.comicView.showPreviousPanel();
  }
  else if (event.currentTarget === this._nextButton) {
    this.comicView.showNextPanel();
  }
};

/* ==================== TKComicView Protocol ==================== */

TKComicController.prototype.comicViewDidShowPanelAtIndex = function (view, index) {
  this.panelWasShown(index);
  // update the states of previous and next buttons
  this.syncPageButtons();
};

TKComicController.prototype.panelWasShown = function (index) {};

TKClass(TKComicController);
