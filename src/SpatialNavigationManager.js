/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

/* ==================== TKSpatialNavigationManager ==================== */

/**
 *  Indicates whether the spatial navigation manager is enabled, which currently is only the case on Apple TV, or within Safari for development purposes.
 *  @constant
 *  @type bool
 */
const TKSpatialNavigationManagerEnabled = (window.iTunes === undefined || window.iTunes.platform == 'AppleTV') ? true : (parseInt(window.iTunes.version, 0) < 9);

/**
 *  The CSS class name applied to an element when it is highlighted by the spatial navigation manager.
 *  @constant
 *  @type String
 */
const TKSpatialNavigationManagerHighlightCSSClass = 'tk-highlighted';
/**
 *  The CSS class name an element should have in order to be ignored by the spatial navigation manager.
 *  @constant
 *  @type String
 */
const TKSpatialNavigationManagerInactiveCSSClass = 'tk-inactive';

/**
 *  The up direction.
 *  @constant
 *  @type int
 */
const TKSpatialNavigationManagerDirectionUp = KEYBOARD_UP;
/**
 *  The right direction.
 *  @constant
 *  @type int
 */
const TKSpatialNavigationManagerDirectionRight = KEYBOARD_RIGHT;
/**
 *  The down direction.
 *  @constant
 *  @type int
 */
const TKSpatialNavigationManagerDirectionDown = KEYBOARD_DOWN;
/**
 *  The left direction.
 *  @constant
 *  @type int
 */
const TKSpatialNavigationManagerDirectionLeft = KEYBOARD_LEFT;
/**
 *  The list of keys the spatial navigation manager knows how to handle.
 *  @constant
 *  @type int
 *  @private
 */
const TKSpatialNavigationManagerKnownKeys = [KEYBOARD_UP, KEYBOARD_RIGHT, KEYBOARD_DOWN, KEYBOARD_LEFT, KEYBOARD_BACKSPACE, KEYBOARD_RETURN];

/**
 *  The number of controllers that are currently busy, when for instance performing a transition that should not be interrupted. When this variable is more than
 *  <code>0</code>, key handling by the spatial navigation manager is suspended.
 *  @type int
 */
TKSpatialNavigationManager.busyControllers = 0;
/**
 *  The identifier for the sound to play for the current event loop.
 *  @type int
 */
TKSpatialNavigationManager.soundToPlay = null;

/* ==================== Creating the shared instance lazily ==================== */

/**
 *  @name TKSpatialNavigationManager
 *  @property {TKSpatialNavigationManager} sharedManager The shared instance of the spatial navigation manager. TuneKit automatically creates a single instance
 *  of the {@link TKSpatialNavigationManager} class as needed, and developers should never have to create an instance themselves, instead using this property
 *  to retrieve the shared instance.
 */
TKSpatialNavigationManager._sharedManager = null;
TKSpatialNavigationManager.__defineGetter__('sharedManager', function () {
  if (this._sharedManager === null) {
    this._sharedManager = new TKSpatialNavigationManager();
  }
  return this._sharedManager;
});

/* ==================== Constructor ==================== */

TKSpatialNavigationManager.inherits = TKObject;
TKSpatialNavigationManager.includes = [TKEventTriage];
TKSpatialNavigationManager.synthetizes = ['managedController'];

/**
 *  @class
 *
 *  <p>The spatial navigation manager is a special controller type that sits behind the scenes and handles much of the keyboard interaction in order
 *  to provide navigation between navigable elements of the {@link #managedController}. By default, navigation between navigable elements is automatic and
 *  performed based on the location and metrics of each elements. The elements' metrics are those set by CSS and a controller is free to provide custom
 *  metrics for elements as it sees fit by implementing the {@link TKController#customMetricsForElement} method. Additionally, the automatic navigation
 *  can be completely bypassed should the managed controller provide a custom element to navigate to with the
 *  {@link TKController#preferredElementToHighlightInDirection} method.</p>
 *
 *  @extends TKObject
 *  @since TuneKit 1.0
 */
function TKSpatialNavigationManager () {
  this.callSuper();
  //
  this._managedController = null;
  /**
   *  The complete list of all elements that can be navigated to within this controller and all of its sub-controllers.
   *  @type Array
   */
  this.navigableElements = [];
  this.highlightedElement = null;
  this.previousNavigation = null;
  // register for keyboard events if we're running outside of the iTunes app
  if (TKSpatialNavigationManagerEnabled) {
    window.addEventListener('keydown', this, true);
  }
};

/**
 *  @name TKSpatialNavigationManager.prototype
 *  @property managedController The managed controller is the controller that the spatial navigation manager queries for navigable elements
 *  and any customization of the otherwise automated navigation. Developers should not assign this property directly as the navigation controller takes care of
 *  that as the user navigates through controllers.
 *  @type TKController
 */
TKSpatialNavigationManager.prototype.setManagedController = function (controller) {
  this._managedController = controller;
  this.navigableElements = controller.navigableElements;
  this.previousNavigation = null;
  // is this the first time we're managing this controller?
  if (controller._wasAlreadyManagedBySpatialNavigationManager === undefined) {
    // see if it had an archived highlighted element
    var archived_index = controller.getArchivedProperty('highlightedElementIndex');
    if (archived_index !== undefined) {
      var archived_element = controller.navigableElements[archived_index];
      if (archived_element instanceof Element) {
        controller.highlightedElement = archived_element;
      }
    }
    // track that we've managed it before
    controller._wasAlreadyManagedBySpatialNavigationManager = true;
  }
  // reset the highlighted element to be nothing
  this.highlightedElement = null;
  // if we have a preferred or recorded highlighted element, highlight that
  if (controller.highlightedElement !== null) {
    this.highlightElement(controller.highlightedElement);
  }
  // otherwise default to the top-most element
  else {
    this.highlightTopElement();
  }
};

TKSpatialNavigationManager.prototype.registerController = function (controller) {
  var elements = controller.navigableElements;
  for (var i = 0; i < elements.length; i++) {
    this.addNavigableElement(elements[i]);
  }
};

TKSpatialNavigationManager.prototype.unregisterController = function (controller) {
  var elements = controller.navigableElements;
  for (var i = 0; i < elements.length; i++) {
    this.removeNavigableElement(elements[i]);
  }
};

TKSpatialNavigationManager.prototype.addNavigableElement = function (element) {
  // nothing to do if the new element is not rooted in the managed hierarchy or we already know it
  if (!element._controller.isDescendentOfController(this._managedController) ||
      this.navigableElements.indexOf(element) > -1) {
    return;
  }
  // and keep track of it
  this.navigableElements.push(element);
};

TKSpatialNavigationManager.prototype.removeNavigableElement = function (element) {
  // find the index for this element
  var index = this.navigableElements.indexOf(element);
  if (index < 0) {
    return;
  }
  // remove elements from the tracking arrays
  this.navigableElements.splice(index, 1);
};

/* ==================== Keyboard Navigation ==================== */

TKSpatialNavigationManager.prototype.handleKeydown = function (event) {

  var key = event.keyCode;

  // check if our controller knows what it's doing and let it take over in case it does
  if (this._managedController.wantsToHandleKey(key)) {
    // prevent default actions
    event.stopPropagation();
    event.preventDefault();
    // have the controller do what it think is best in this case
    this._managedController.keyWasPressed(key);
    return;
  }

  // reset the sound
  TKSpatialNavigationManager.soundToPlay = null;

  // check we know about this key, otherwise, do nothing
  if (TKSpatialNavigationManagerKnownKeys.indexOf(key) == -1) {
    return;
  }

  var navigation = TKNavigationController.sharedNavigation;
  // first, check if we're hitting the back button on the home screen, in which case
  // we don't want to do anything and let the User Agent do what's right to exit
  if (event.keyCode == KEYBOARD_BACKSPACE && navigation.topController === homeController) {
    return;
  }
  
  // before we go any further, prevent the default action from happening
  event.stopPropagation();
  event.preventDefault();
  
  // check if we're busy doing other things
  if (TKSpatialNavigationManager.busyControllers > 0) {
    return;
  }
  // see if we pressed esc. so we can pop to previous controller
  if (event.keyCode == KEYBOARD_BACKSPACE) {
    var top_controller = navigation.topController;
    if (top_controller !== homeController) {
      // at any rate, play the exit sound
      TKUtils.playSound(SOUND_EXIT);
      // see if the top controller has a custom place to navigate to with the back button
      if (top_controller.backButton instanceof Element && top_controller.backButton._navigationData !== undefined) {
        navigation.pushController(TKController.resolveController(top_controller.backButton._navigationData.controller));
      }
      // otherwise, just pop the controller
      else {
        navigation.popController();
      }
    }
  }
  // check if we want to activate an element
  else if (key == KEYBOARD_RETURN) {
    if (this.highlightedElement !== null) {
      var success = this.highlightedElement._controller.elementWasActivated(this.highlightedElement);
      TKUtils.playSound(TKSpatialNavigationManager.soundToPlay === null ? SOUND_ACTIVATED : TKSpatialNavigationManager.soundToPlay);
    }
    else {
      TKUtils.playSound(SOUND_LIMIT);
    }
  }
  // keyboard nav
  else {
    var key_index = TKSpatialNavigationManagerKnownKeys.indexOf(key);
    // do nothing if we don't have any highlightable elements or don't know about this navigation direction
    if (this.navigableElements.length == 0 || key_index == -1) {
      TKUtils.playSound(SOUND_LIMIT);
      return;
    }
    // figure the index of the element to highlight
    var index = this.nearestElementIndexInDirection(key);

    // get a pointer to the controller of the previous item if we have one
    if (this.highlightedElement !== null) {
      var previous_controller = this.highlightedElement._controller;

      // see if we're being provided custom navigation by the controller instance
      var provided_preferred_element = false;
      var preferred_highlighted_element = previous_controller.preferredElementToHighlightInDirection(this.highlightedElement, key);
      // try again with the private method meant to be implemented by the sub-class
      if (preferred_highlighted_element === undefined) {
        preferred_highlighted_element = previous_controller._preferredElementToHighlightInDirection(this.highlightedElement, key);
      }
      // we explicitly do not want to highlight anything
      if (preferred_highlighted_element === null) {
        index = -1;
      }
      else if (preferred_highlighted_element !== undefined) {
        var preferred_highlight_index = this.navigableElements.indexOf(preferred_highlighted_element);
        // if this element is in our navigation list and is ready to be navigated to
        if (preferred_highlight_index >= 0 && this.isElementAtIndexNavigable(preferred_highlight_index)) {
          index = preferred_highlight_index;
          provided_preferred_element = true;
        }
      }

      // stop right there if we have no useful index
      if (index == -1) {
        TKUtils.playSound(SOUND_LIMIT);
        return;
      }
    }

    // get a pointer to the controller of the item we consider highlighting now
    var next_controller = this.navigableElements[index]._controller;

    // we're moving out of a tab controller into one controller managed by that tab controller
    // in which case we want to highlight the first item in that controller based on its orientation
    if (previous_controller instanceof TKTabController &&
        this.highlightedElement._tabIndex !== undefined &&
        next_controller.parentController === previous_controller) {
      index = this.navigableElements.indexOf(next_controller.highlightedElement || next_controller.navigableElements[0]);
    }
    // we're moving back to a tab element from an element managed by a controller
    // that is itself managed by the very tab controller we're focusing, so let's highlight
    // the element that is selected in that tab controller
    else if (next_controller instanceof TKTabController &&
             this.navigableElements[index]._tabIndex !== undefined &&
             previous_controller.parentController === next_controller) {
      index = this.navigableElements.indexOf(next_controller.tabs[next_controller.selectedIndex]);
    }
    // check if we were doing the reverse operation to the last one
    else if (!provided_preferred_element && this.previousNavigation !== null && key_index == (this.previousNavigation.keyIndex + 2) % 4) {
      var previous_element_index = this.navigableElements.indexOf(this.previousNavigation.element);
      if (previous_element_index > -1 && this.isElementAtIndexNavigable(previous_element_index)) {
        index = previous_element_index;
      }
    }
    
    // get a pointer to the next element to highlight
    var next_highlighted_element = (index >= 0 && index < this.navigableElements.length) ? this.navigableElements[index] : null;
    
    // only highlight if we know what element to highlight
    if (next_highlighted_element !== null && next_highlighted_element.isNavigable()) {
      // track the interaction so we can go back to it
      if (this.highlightedElement !== null) {
        this.previousNavigation = {
          element: this.highlightedElement,
          keyIndex : key_index
        };
      }
      this.highlightElement(next_highlighted_element);
      TKUtils.playSound(SOUND_MOVED);
    }
    else {
      TKUtils.playSound(SOUND_LIMIT);
    }
  }
};

TKSpatialNavigationManager.prototype.nearestElementIndexInDirection = function (direction) {
  // nothing to do if we don't have a next element
  if (this.highlightedElement === null) {
    if (direction == TKSpatialNavigationManagerDirectionUp) {
      return this.bottomMostIndex();
    }
    else if (direction == TKSpatialNavigationManagerDirectionRight) {
      return this.leftMostIndex();
    }
    else if (direction == TKSpatialNavigationManagerDirectionDown) {
      return this.topMostIndex();
    }
    else if (direction == TKSpatialNavigationManagerDirectionLeft) {
      return this.rightMostIndex();
    }    
  }
  // figure out parameters
  var ref_position, target_edge;
  if (direction == TKSpatialNavigationManagerDirectionUp) {
    ref_position = TKRectMiddleOfTopEdge;
    target_edge = TKRectBottomEdge;
  }
  else if (direction == TKSpatialNavigationManagerDirectionRight) {
    ref_position = TKRectMiddleOfRightEdge;
    target_edge = TKRectLeftEdge;
  }
  else if (direction == TKSpatialNavigationManagerDirectionDown) {
    ref_position = TKRectMiddleOfBottomEdge;
    target_edge = TKRectTopEdge;
  }
  else if (direction == TKSpatialNavigationManagerDirectionLeft) {
    ref_position = TKRectMiddleOfLeftEdge;
    target_edge = TKRectRightEdge;
  }
  // look for the closest element now
  var index = -1;
  var min_d = 10000000;
  var highlight_index = this.navigableElements.indexOf(this.highlightedElement);
  var ref_metrics = this.metricsForElement(this.highlightedElement);
  var ref_point = ref_metrics.pointAtPosition(ref_position);
  var ref_center = ref_metrics.pointAtPosition(TKRectCenter);
  for (var i = 0; i < this.navigableElements.length; i++) {
    // see if we should skip this element
    if (!this.isElementAtIndexNavigable(i)) {
      continue;
    }
    var metrics = this.metricsForElement(this.navigableElements[i]);
    // go to next item if it's not in the right direction or already has highlight
    if ((direction == TKSpatialNavigationManagerDirectionUp && metrics.pointAtPosition(TKRectBottomLeftCorner).y > ref_center.y) ||
        (direction == TKSpatialNavigationManagerDirectionRight && metrics.pointAtPosition(TKRectTopLeftCorner).x < ref_center.x) ||
        (direction == TKSpatialNavigationManagerDirectionDown && metrics.pointAtPosition(TKRectTopLeftCorner).y < ref_center.y) ||
        (direction == TKSpatialNavigationManagerDirectionLeft && metrics.pointAtPosition(TKRectTopRightCorner).x > ref_center.x) ||
        i == highlight_index) {
      continue;
    }
    var d = metrics.edge(target_edge).distanceToPoint(ref_point);
    if (d < min_d) {
      min_d = d;
      index = i;
    }
  }
  // return the index, if any
  return index;
};

TKSpatialNavigationManager.prototype.topMostIndex = function () {
  var index = 0;
  var min_y = 10000;
  for (var i = 0; i < this.navigableElements.length; i++) {
    if (!this.isElementAtIndexNavigable(i)) {
      continue;
    }
    var y = this.metricsForElementAtIndex(i).y;
    if (y < min_y) {
      min_y = y;
      index = i;
    }
  }
  return index;
};

TKSpatialNavigationManager.prototype.rightMostIndex = function () {
  var index = 0;
  var max_x = 0;
  for (var i = 0; i < this.navigableElements.length; i++) {
    if (!this.isElementAtIndexNavigable(i)) {
      continue;
    }
    var x = this.metricsForElementAtIndex(i).pointAtPosition(TKRectTopRightCorner).x;
    if (x > max_x) {
      max_x = x;
      index = i;
    }
  }
  return index;
};

TKSpatialNavigationManager.prototype.bottomMostIndex = function () {
  var index = 0;
  var max_y = 0;
  for (var i = 0; i < this.navigableElements.length; i++) {
    if (!this.isElementAtIndexNavigable(i)) {
      continue;
    }
    var y = this.metricsForElementAtIndex(i).pointAtPosition(TKRectBottomRightCorner).y;
    if (y > max_y) {
      max_y = y;
      index = i;
    }
  }
  return index;
};

TKSpatialNavigationManager.prototype.leftMostIndex = function () {
  var index = 0;
  var min_x = 10000;
  for (var i = 0; i < this.navigableElements.length; i++) {
    if (!this.isElementAtIndexNavigable(i)) {
      continue;
    }
    var y = this.metricsForElementAtIndex(i).x;
    if (y < min_x) {
      min_x = y;
      index = i;
    }
  }
  return index;
};

TKSpatialNavigationManager.prototype.metricsForElement = function (element) {
  return element._controller.customMetricsForElement(element) || element.getBounds();
};

TKSpatialNavigationManager.prototype.metricsForElementAtIndex = function (index) {
  return this.metricsForElement(this.navigableElements[index]);
};

/**
 *  Highlight the top-most element in the list of navigable elements.
 */
TKSpatialNavigationManager.prototype.highlightTopElement = function () {
  // now see if we need to enforce some default element
  if (this.navigableElements.length > 0) {
    this.highlightElement(this.navigableElements[this.topMostIndex()]);
  }
};

/**
 *  Indicates whether a given element is navigable at the provided index in the {@link #navigableElements} array.
 *
 *  @param {Element} element The index for the element in the {@link #navigableElements} array.
 *  @returns {bool} Whether the element can be navigated to.
 */
TKSpatialNavigationManager.prototype.isElementAtIndexNavigable = function (index) {
  return this.navigableElements[index].isNavigable();
};

/* ==================== Highlight Management ==================== */

/**
 *  Highlights a given element if it's part of the {@link #navigableElements} array. When an element receives highlight, a <code>highlight</code> event is 
 *  dispatched to that element, while an <code>unhighlight</code> event is dispatched to the element that previously had highlight.
 *
 *  @param {Element} element The element to highlight.
 */
TKSpatialNavigationManager.prototype.highlightElement = function (element) {
  // nothing to do if we don't really have an element to highlight
  if (!(element instanceof Element)) {
    return;
  }
  // check that this element is navigable, and do nothing if it's not
  var navigation_index = this.navigableElements.indexOf(element);
  if (navigation_index == -1 || !this.isElementAtIndexNavigable(navigation_index)) {
    return;
  }
  //
  if (this.highlightedElement !== null) {
    this.highlightedElement.dispatchEvent(TKUtils.createEvent('unhighlight', element));
    if (TKSpatialNavigationManagerEnabled) {
      this.highlightedElement.removeClassName(TKSpatialNavigationManagerHighlightCSSClass);
    }
  }
  //
  element.dispatchEvent(TKUtils.createEvent('highlight', this.highlightedElement));
  if (TKSpatialNavigationManagerEnabled) {
    element.addClassName(TKSpatialNavigationManagerHighlightCSSClass);
  }
  this.highlightedElement = element;
  // track on its controller that it was the last with highlight
  element._controller.highlightedElement = element;
};

TKClass(TKSpatialNavigationManager);
