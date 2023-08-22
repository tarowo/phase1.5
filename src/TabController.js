/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

/**
 *  @class
 *  @name TKTabControllerDelegate
 *  @since TuneKit 1.0
 */

/**
 *  Indicates that a new controller is becoming the tab controller's selected controller and is about to become visible on screen.
 *
 *  @name tabControllerWillShowController
 *  @function
 *
 *  @param {TKTabController} tabController The tab controller.
 *  @param {TKController} controller The controller that is about to be shown by the tab controller.
 *  @memberOf TKTabControllerDelegate.prototype
 */
const TKTabControllerWillShowController = 'tabControllerWillShowController';  
/**
 *  Indicates that a new controller has become the tab controller's selected controller and is fully visible on screen.
 *
 *  @name tabControllerDidShowController
 *  @function
 *
 *  @param {TKTabController} tabController The tab controller.
 *  @param {TKController} controller The controller that is being shown by the tab controller.
 *  @memberOf TKTabControllerDelegate.prototype
 */
const TKTabControllerDidShowController = 'tabControllerDidShowController';  

/**
 *  The CSS class name applied to an element acting as a tab once it is the selected tab.
 *  @constant
 *  @type String
 */
const TKTabControllerSelectedCSSClass = 'tk-tab-selected';

TKTabController.inherits = TKController;
TKTabController.synthetizes = ['selectedController', 'selectedIndex', 'tabsSelector'];

/**
 *  @class
 *
 *  <p>A tab controller allows to bind a series of elements within the view, the tabs, to display each a given controller, the tab controller only
 *  allowing a single tab to be selected at once. Tabs are specified using the {@link #tabsSelector} CSS selector, and a controller for each tab needs to be
 *  stored in the {@link #controllers} array. By implementing the {@link TKTabControllerDelegate} protocol, a tab controller's {@link #delegate} can track as
 *  the user navigates between tabs. At any given time, the {@link #selectedController} property allows to find out which of the controllers is currently
 *  selected.</p>
 *
 *  @extends TKController
 *  @since TuneKit 1.0
 *
 *  @param {Object} data A hash of properties to use as this object is initialized.
 */
function TKTabController (data) {
  this._tabsSelector = null;
  this._selectedController = null;
  /**
   *  The controllers managed by this tab controller, ordered in the same way as the elements matched by {@link #tabsSelector} are.
   *  @type Array
   */
  this.controllers = [];
  this.tabs = [];
  /**
   *  The delegate for this tab controller, an object implementing the {@link TKTabControllerDelegate} protocol.
   *  @type Object
   */
  this.delegate = null;
  this.previousController = null;
  //
  this.busy = false;
  //
  this.callSuper(data);
};

/* ==================== Additional View Processing ==================== */

TKTabController.prototype.processView = function () {
  this.callSuper();
  //
  this.host = this._view.appendChild(document.createElement('div'));
  this.host.addClassName('tk-tab-contents');
  // restore properties that have not been set yet since construction
  this.restoreProperty('tabsSelector');
  this.restoreProperty('selectedIndex');
};

/* ==================== Synthetized Properties ==================== */

/**
 *  @name TKTabController.prototype
 *  @property {String} tabsSelector A CSS selector matching the elements within the controller's view that should act as triggers to display the matching 
 *  controller in the {@link #controllers} array.
 */
TKTabController.prototype.setTabsSelector = function (tabsSelector) {
  if (tabsSelector === null) {
    return;
  }
  // forget the old tabs
  for (var i = 0; i < this.tabs.length; i++) {
    var element = this.tabs[i];
    element._tabIndex = undefined;
    element._controller = undefined;
    this.removeNavigableElement(element);
  }
  // get the new tabs
  this._tabsSelector = tabsSelector;
  this.tabs = this._view.querySelectorAll(this._tabsSelector);
  // nothing to do if we don't have tabs
  if (this.tabs.length < 1) {
    return;
  }
  for (var i = 0; i < this.tabs.length; i++) {
    var tab = this.tabs[i];
    tab._tabIndex = i;
    tab._controller = this;
    this.addNavigableElement(tab);
  }
  // reset to the first tab, unless we have an archived one
  var archived_index = this.getArchivedProperty('selectedIndex');
  this.selectedIndex = (archived_index === undefined || archived_index < 0) ? 0 : archived_index;
};

/* ==================== Keyboard Handling ==================== */

TKTabController.prototype.getNavigableElements = function () {
  return this._navigableElements.concat(this.selectedController.navigableElements);
};

TKTabController.prototype.handleEvent = function (event) {
  this.callSuper(event);
  //
  if (event.currentTarget._tabIndex !== undefined) {
    if (event.type == 'highlight') {
      this.selectedIndex = event.currentTarget._tabIndex;
    }
  }
};

TKTabController.prototype.elementWasActivated = function (element) {
  this.callSuper(element);
  // tab was activated
  if (element._tabIndex !== undefined) {
    // highlight in case we weren't already
    if (this.highlightedElement !== element) {
      TKSpatialNavigationManager.sharedManager.highlightElement(element);
    }
    // notify we were activated
    else {
      this.tabAtIndexWasActivated(element._tabIndex);
    }
  }
};

/**
 *  Indicates that a new tab has been activated at the given index.
 *
 *  @param {int} index The index for the tab that was just activated.
 */
TKTabController.prototype.tabAtIndexWasActivated = function (index) {};

/* ==================== Controllers ==================== */

/**
 *  @name TKTabController.prototype
 *  @property {int} selectedIndex The index of the selected tab.
 */
TKTabController.prototype.getSelectedIndex = function () {
  return (this._selectedController === null) ? -1 : this.controllers.indexOf(this._selectedController);
};

TKTabController.prototype.setSelectedIndex = function (index) {
  var selected_index = this.selectedIndex;
  if (index !== selected_index && index >= 0 && index < this.controllers.length) {
    // move to the new controller
    this.selectedController = this.controllers[index];
  }
};

/**
 *  @name TKTabController.prototype
 *  @property {TKController} selectedController The selected controller.
 */
TKTabController.prototype.setSelectedController = function (controller) {
  var selected_index = this.controllers.indexOf(controller);
  // do nothing if we don't know about such a controller, or we're already on this controller
  if (controller === this._selectedController || selected_index == -1) {
    return;
  }
  // clean up before starting a new transition
  if (this.busy) {
    this.transitionDidComplete(null);
  }
  //
  TKTransaction.begin();
  // mark that a transition is now in progress
  this.busy = true;
  // get pointers to object we'll manipulate
  var previous_controller = this._selectedController;
  var next_view = controller.view;
  // fire delegate saying we're moving to a new controller
  if (TKUtils.objectHasMethod(this.delegate, TKTabControllerWillShowController)) {
    this.delegate[TKTabControllerWillShowController](this, controller);
  }
  // track this is our newly selected controller
  this._selectedController = controller;
  // notify of upcoming change and update tabs styling
  if (previous_controller !== null) {
    previous_controller._viewWillDisappear();
    previous_controller.viewWillDisappear();
  }
  controller._viewWillAppear();
  controller.viewWillAppear();
  // add it to the tree
  this.host.appendChild(controller.view);
  // transition
  var manager = TKSpatialNavigationManager.sharedManager;
  if (previous_controller !== null) {
    // unregister the old controller
    previous_controller.parentController = null;
    manager.unregisterController(previous_controller);
    // remove the selected CSS class from the previous tab, if any
    this.tabs[this.controllers.indexOf(previous_controller)].removeClassName(TKTabControllerSelectedCSSClass);
    this.transitionToController(previous_controller, controller);
  }
  else {
    this.busy = true;
    this.transitionDidComplete();
    // highlight the element
    if (this.highlightedElement === null) {
      this.highlightedElement = this.tabs[this.selectedIndex]
    }
  }
  // add the selected CSS class to the new controller's tab
  this.tabs[selected_index].addClassName(TKTabControllerSelectedCSSClass)
  // also ensure that element has highlight
  manager.highlightElement(this.tabs[selected_index]);
  // and that the new controller is registered for navigation
  controller.parentController = this;
  manager.registerController(controller);
  //
  TKTransaction.commit();
};

/* ==================== Transition ==================== */

TKTabController.prototype.transitionToController = function (previous_controller, top_controller) {
  // record some parameters that we will need at the end of the transition
  this.previousController = previous_controller;
  // figure out transitions
  if (previous_controller !== null) {
    previous_controller.view.applyTransition(previous_controller.becomesInactiveTransition, false);
  }
  var top_controller_transition = top_controller.becomesActiveTransition;
  top_controller_transition.delegate = this;
  top_controller.view.applyTransition(top_controller_transition, false);
};

TKTabController.prototype.transitionDidComplete = function (transition) {
  // update the highlightable items and notify of completed change
  if (this.previousController !== null) {
    if (this.previousController.view.parentNode === this.host) {
      this.host.removeChild(this.previousController.view);
    }
    this.previousController._viewDidDisappear();
    this.previousController.viewDidDisappear();
  }
  this._selectedController._viewDidAppear();
  this._selectedController.viewDidAppear();
  // fire delegate saying we've moved to a new controller
  if (TKUtils.objectHasMethod(this.delegate, TKTabControllerDidShowController)) {
    this.delegate[TKTabControllerDidShowController](this, this._selectedController);
  }
  // not busy anymore
  this.busy = false;
};

/* ==================== Archival ==================== */

TKTabController.prototype.archive = function () {
  var archive = this.callSuper();
  archive.selectedIndex = this.selectedIndex;
  return archive;
};

TKClass(TKTabController);
