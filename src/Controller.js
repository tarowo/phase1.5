/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */
 
TKController.inherits = TKObject;
TKController.synthetizes = ['view', 'navigableElements', 'actions', 'outlets', 'scrollable', 'backButton', 'navigatesTo'];

/**
 *  The hash in which we keep references to all controller instantiated throughout the lifecycle of the booklet. Use a controller's {@link #id} to
 *  access the controller for that id.
 *  @type Object
 */
TKController.controllers = {};

/**
 *  The fraction of the scrollable element's width or height that is being scrolled by in order to increment or decrement the scroll offset.
 *  @constant
 *  @type float
 *  @private
 */
const TKControllerScrollIncrementFraction = 0.75;
/**
 *  The time in miliseconds that the scrolling animation lasts.
 *  @constant
 *  @type int
 *  @private
 */
const TKControllerScrollDuration = 500;
/**
 *  The spline used for the scrolling animation.
 *  @constant
 *  @type Array
 *  @private
 */
const TKControllerScrollSpline = [0.211196, 0.811224, 0.641221, 0.979592];
const TKControllerScrollDirectionUp = 0;
const TKControllerScrollDirectionDown = 1;
const TKControllerScrollDirectionLeft = 0;
const TKControllerScrollDirectionRight = 1;

/**
 *  @class
 *
 *  <p>The TKController class is the base class for all TuneKit controllers. Controllers are useful objects that control all the core functionalities of
 *  a screen or sub-screen: view-loading, interaction, navigation, etc.</p>
 *
 *  @extends TKObject
 *  @since TuneKit 1.0
 *
 *  @param {Object} data A hash of properties to use as this object is initialized.
 */
function TKController (data) {
  this.callSuper();
  //
  this.propertiesToRestoreOnLoad = [];
  // synthetized property
  this._view = null;
  /**
   *  @name TKController.prototype
   *  @property {Array} navigableElements The complete list of all elements that can be navigated to within this controller and all of its sub-controllers.
   *  The contents of this array should not be directly manipulated, instead use the {@link #addNavigableElement} and {@link #removeNavigableElement} methods.
   */
  this._navigableElements = [];
  /**
   *  The controller directly containing this controller instance, <code>null</code> if the controller is not attached to any yet.
   *  @type TKController
   */
  this.parentController = null;
  // default transition styles for navigation
  this.enforcesCustomTransitions = false; // whether we should use the custom transitions on ATV only
  /**
   *  The animated transition to use for this controller's view when the controller becomes inactive.
   *  @type TKTransitionDefinition
   */
  this.becomesInactiveTransition = TKViewTransitionDissolveOut;
  /**
   *  The animated transition to use for this controller's view when the controller becomes active.
   *  @type TKTransitionDefinition
   */
  this.becomesActiveTransition = TKViewTransitionDissolveIn;
  // default properties
  /**
   *  The unique id for this controller's view. This is the same string that will be used for the {@link #view}'s HTML <code>id</code> attribute, as well
   *  as a key in the {@link TKController.controllers} hash, and thus must be adequate for both uses. The controller's id is used in the view-loading mechanism,
   *  such that if there is an HTML file in the booklet's <code>views/</code> directory that shares the same name, it is that file that is loaded to provide
   *  the view's content.
   *  @type String
   */
  this.id = data.id;
  /**
   *  A DOM element to be used as the view for this controller, which overrides the default view-loading mechanism in case it's set before the view is loaded.
   *  @type Element
   *  @private
   */
  this.explicitView = null;
  /**
   *  The name of the template to be used to create the view's content. If there is an HTML file in the <code>templates/</code> directory with that name, the
   *  view is loaded by cloning the content of that file and replacing the ID with that provided by the {@link #id} property.
   *  @type String
   */
  this.template = null;
  /**
   *  A list of image URIs to preload.
   *  @type Array
   */
  this.preloads = [];
  this._navigatesTo = null;
  this._actions = null;
  this._outlets = null;
  this._scrollable = null;
  this._backButton = null;
  /**
   *  The highlighted element within that controller. This is only unique to the view managed by this controller, and not to the entire booklet or even any
   *  controllers that might be contained within this controller.
   *  @type Element
   *  @private
   */
  this.highlightedElement = null;
  /**
   *  Indicates that the view has not appeared on screen yet.
   *  @type bool
   *  @private
   */
  this.viewNeverAppeared = true;
  /**
   *  Indicates that the view was fully processed.
   *  @type bool
   *  @private
   */
  this.viewWasProcessed = false;
  /**
   *  The CSS selector for the default scrollable element. If this value is non-<code>null</code> then the up and down keys scroll the element specified
   *  by the selector.
   *  @type String
   */
  this.scrollableElement = null;
  /**
   *  The animator managing the currently scrolling element.
   *  @type TKAnimator
   *  @private
   */
  this.animator = new TKAnimator(TKControllerScrollDuration, null, TKControllerScrollSpline);
  this.upScrollData = {
    direction: TKControllerScrollDirectionUp,
    animator: this.animator
  }
  this.downScrollData = {
    direction: TKControllerScrollDirectionDown,
    animator: this.animator
  }
  // copy properties
  this.copyNonSynthetizedProperties(data);
  // register controller
  TKController.controllers[this.id] = this;
};

/**
 *  A utility method to get the controller from an Object that is either the {@link TKController#id} of a controller or a controller directly.
 *
 *  @param {Object} stringOrControllerReference Either the {@link TKController#id} of a controller or a controller directly
 *  @returns {TKController} The controller.
 */
TKController.resolveController = function (stringOrControllerReference) {
  return (TKUtils.objectIsString(stringOrControllerReference)) ? TKController.controllers[stringOrControllerReference] : stringOrControllerReference;
};

/**
 *  A utility method to copy all properties from another object onto the controller, ignoring any property that is synthetized.
 *
 *  @param {Object} properties An object containing a set of properties to be copied across to the receiver.
 *  @private
 */
TKController.prototype.copyNonSynthetizedProperties = function (properties) {
  for (var property in properties) {
    // don't copy synthetized properties but track them for later
    if (this.__lookupSetter__(property)) {
      this.propertiesToRestoreOnLoad[property] = properties[property];
      continue;
    }
    this[property] = properties[property];
  }
};

/* ==================== Managing the View ==================== */

TKController.prototype.getView = function () {
  // create the view if it's not set yet
  if (this._view === null) {
    this.loadView();
  }
  return this._view;
};

TKController.prototype.setView = function (view) {
  this.explicitView = view;
};

TKController.prototype.loadView = function () {
  this.viewNeverAppeared = false;
  // first, check if we have an element already defined
  var view;
  if (this.explicitView !== null) {
    view = this.explicitView;
    // check if node is already in the document
    this.viewNeverAppeared = !TKUtils.isNodeChildOfOtherNode(view, document);
  }
  // check if our view already exists in the DOM
  else {
    view = document.getElementById(this.id);
  }
  // if not, load it from the views directory
  if (view === null) {
    this.viewNeverAppeared = true;
    view = this.loadFragment('views', this.id);
    // there was no such view available, try and see if we have a template available
    if (view === null) {
      if (this.template !== null) {
        view = this.loadFragment('templates', this.template);
      }
      // no template, just create an empty <div> then
      if (view === null) {
        view = document.createElement('div');
      }
    }
  }
  // make sure we know when the view is added to the document if it
  // wasn't part of the DOM already
  if (this.viewNeverAppeared) {
    view.addEventListener('DOMNodeInsertedIntoDocument', this, false);
  }
  // set up the correct id on our view
  view.id = this.id;
  // link the view to our controller
  view._controller = this;
  // and remember our view
  this._view = view;
  // let our object perform more setup code
  this.viewDidLoad();
  // do post-loading processing
  this.processView();
  //
  this.viewWasProcessed = true;
};

TKController.prototype.loadFragment = function (directory, id) {
  var imported_fragment = null;
  //
  var request = new XMLHttpRequest();
  var failed = false;
  request.open('GET', directory + '/' + id + '.html', false);
  try {
    request.send();
  } catch (err) {
    // iTunes will throw an error if the request doesn't exist
    // when using the booklet:// scheme
    // Mark the error here so we can take the FAIL path below, which
    // is actually what we want.
    failed = true;
  }
  // everything went well
  // XXX: we should do more work to differentitate between http:// and file:// URLs here
  if (!failed && ((request.status <= 0 && request.responseText !== '') || request.status == 200)) {
    // XXX: this is way dirty
    var loaded_fragment = document.implementation.createHTMLDocument();
    loaded_fragment.write(request.responseText);
    imported_fragment = document.importNode(loaded_fragment.getElementById(id), true);
  }
  return imported_fragment;
};

/**
 *  This method is called once the view has been loaded and allows the controller to post-process it.
 */
TKController.prototype.processView = function () {
  var view = this._view;
  // restore properties that have not been set yet since construction
  this.restoreProperty('navigatesTo');
  this.restoreProperty('actions');
  this.restoreProperty('outlets');
  this.restoreProperty('backButton');
  this.restoreProperty('scrollable');
  // process highlightedElement
  if (this.highlightedElement !== null && !(this.highlightedElement instanceof Element)) {
    this.highlightedElement =  this._view.querySelector(this.highlightedElement);
  }
  // process links
  var links = view.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    this.addNavigableElement(links[i]);
  }
  // process assets to pre-load
  for (var i = 0; i < this.preloads.length; i++) {
    new Image().src = this.preloads[i];
  }
};

TKController.prototype.restoreProperty = function (property) {
  var value = this.propertiesToRestoreOnLoad[property];
  if (value !== undefined && this['_' + property] === null) {
    this[property] = value;
  }
};

TKController.prototype.getArchivedProperty = function (property) {
  var archived_value;
  try {
    var archived_value = bookletController.archive.controllers[this.id][property];
  }
  catch (e) {}
  return archived_value;
};

/**
 *  Indicates whether the view the controller manages was loaded yet.
 *
 *  @returns {bool} Whether the view was loaded yet.
 */
TKController.prototype.isViewLoaded = function () {
  return (this._view !== null);
};

/* ==================== Dealing with the various properties ==================== */

/**
 *  @name TKController.prototype
 *  @property {Array} navigatesTo A list of objects defining elements to act as anchors to navigate to other controllers. Each object in the array is an
 *  ad-hoc object with <code>selector</code> and <code>controller</code> properties. The <code>selector</code> is a string describing a CSS selector used
 *  to match the element within the {@link #view} that will act as an anchor to navigate to the controller. The <code>controller</code> is either a string matching
 *  the {@link #id} of an existing controller or an reference to a {@link TKController}.
 */
TKController.prototype.setNavigatesTo = function (navigatesTo) {
  if (navigatesTo === null) {
    return;
  }
  // unregister the previous elements if we have any
  if (this._navigatesTo !== null) {
    for (var i = 0; i < this._navigatesTo.length; i++) {
      var element = this._navigatesTo[i];
      element._navigationData = undefined;
      this.removeNavigableElement(element);
    }
  }
  // register the new elements
  this._navigatesTo = [];
  for (var i = 0; i < navigatesTo.length; i++) {
    var item = navigatesTo[i];
    var element = this._view.querySelector(item.selector);
    if (element) {
      element._navigationData = item;
      this._navigatesTo.push(element);
      this.addNavigableElement(element);
    }
  }
};

/**
 *  @name TKController.prototype
 *  @property {Array} actions A list of objects defining elements to act as anchors to trigger a JavaScript callback. Each object in the array is an
 *  ad-hoc object with <code>selector</code>, <code>action</code> and, optionally, <code>arguments</code> properties. The <code>selector</code> is a
 *  string describing a CSS selector used to match the element within the {@link #view} that will act as a trigger for the action. The <code>action</code>
 *  specifies the function to call when the action is triggered, which is either a string matching the name of a method on this controller instance or
 *  a direct reference to a function. Optionally, the <code>arguments</code> property can be specified in order to provide a list of arguments to be passed
 *  to the callback when the action is triggered.
 */
TKController.prototype.setActions = function (actions) {
  if (actions === null || this._actions === actions) {
    return;
  }
  // unregister the previous elements if we have any
  if (this._actions !== null) {
    for (var i = 0; i < this._actions.length; i++) {
      var element = this._actions[i];
      element._actionData = undefined;
      this.removeNavigableElement(element);
    }
  }
  // register the new elements
  this._actions = [];
  for (var i = 0; i < actions.length; i++) {
    var item = actions[i];
    var element = this._view.querySelector(item.selector);
    if (element) {
      element._actionData = item;
      this._actions.push(element);
      this.addNavigableElement(element);
    }
  }
};

/**
 *  @name TKController.prototype
 *  @property {Array} outlets A list of objects defining elements to which we want to create an automatic reference on the controller instance. Each object in
 *  the array has a <code>selector</code> and a <code>name</code> property. The <code>selector</code> is a string describing a CSS selector used to match the   
 *  element within the {@link #view} to which we want to create a reference. The <code>name</code> specifies the name of the JavaScript property that will be holding 
 *  that reference on the controller instance.
 */
TKController.prototype.setOutlets = function (outlets) {
  if (outlets === null) {
    return;
  }
  // unregister the previous outlets if we have any
  if (this._outlets !== null) {
    for (var i = 0; i < this._outlets.length; i++) {
      this[this._outlets[i]] = undefined;
    }
  }
  // register the new outlets
  for (var i = 0; i < outlets.length; i++) {
    var item = outlets[i];
    this[item.name] = this._view.querySelector(item.selector);
  }
  this._outlets = outlets;
};

/**
 *  @name TKController.prototype
 *  @property {String} backButton A CSS selector that matches an element in the {@link #view} that acts as the back button.
 */
TKController.prototype.setBackButton = function (backButton) {
  if (backButton === null) {
    return;
  }
  // forget the old back button if we have one
  if (this._backButton !== null) {
    this._backButton._backButton = undefined;
    // restore display type on ATV
    if (IS_APPLE_TV) {
      this._backButton.style.display = this._backButton._previousDisplayStyle;
    }
    this.removeNavigableElement(this._backButton);
  }
  // set up the new one
  if (backButton !== null) {
    var element = this._view.querySelector(backButton);
    element._backButton = true;
    // hide it on ATV
    if (IS_APPLE_TV) {
      element._previousDisplayStyle = element.style.display;
      element.style.display = 'none';
    }
    this.addNavigableElement(element);
    this._backButton = element;
  }
};

/* ==================== Notification Methods ==================== */

/**
 *  This method is called when the view has been fully loaded but not yet processed. Override this method in order to customize the content of the view.
 */
TKController.prototype.viewDidLoad = function () {};
TKController.prototype.viewDidUnload = function () {};

TKController.prototype._viewWillAppear = function () {};
/**
 *  This method is called when the view managed by this controller is about to appear on screen, probably after an animated transition.
 */
TKController.prototype.viewWillAppear = function () {};

TKController.prototype._viewDidAppear = function () {};
/**
 *  This method is called when the view managed by this controller appeared on screen, probably after an animated transition.
 */
TKController.prototype.viewDidAppear = function () {};

TKController.prototype._viewWillDisappear = function () {};
/**
 *  This method is called when the view managed by this controller is about to disappear from the screen, probably after an animated transition.
 */
TKController.prototype.viewWillDisappear = function () {};

TKController.prototype._viewDidDisappear = function () {};
/**
 *  This method is called when the view managed by this controller has disappeared from the screen, probably after an animated transition.
 */
TKController.prototype.viewDidDisappear = function () {};

/* ==================== Event Handling ==================== */

/**
 *  Entry point for all event handling, since <code>TKController</code> implements the DOM <code>EventListener</code> protocol. This method may be subclassed
 *  but it is important to call the superclass's implementation of this method as essential event routing happens there.
 *
 *  @param {Event} event The event.
 */
TKController.prototype.handleEvent = function (event) {
  switch (event.type) {
    case 'click' : 
      this.elementWasActivated(event.currentTarget);
      break;
    case 'highlight' : 
      this.elementWasHighlighted(event.currentTarget, event.relatedTarget);
      break;
    case 'unhighlight' : 
      this.elementWasUnhighlighted(event.currentTarget, event.relatedTarget);
      break;
    case 'mouseover' : 
      this.elementWasHovered(event.currentTarget);
      break;
    case 'mouseout' : 
      this.elementWasUnhovered(event.currentTarget);
      break;
    case 'DOMNodeInsertedIntoDocument' : 
      this.viewWasInsertedIntoDocument(event);
      break;
  }
};

/**
 *  Triggered when an element is activated by the user, no matter what the host's input methods are as TuneKit abstracts the interaction that yields
 *  an element's activation. This method may be subclassed but it is important to call the superclass's implementation of this method as navigation anchors,
 *  actions, etc. are handled in that method directly.
 *
 *  @param {Element} element The element that was just activated.
 */
TKController.prototype.elementWasActivated = function (element) {
  if (element._navigationData !== undefined) {
    // pointer to the controller
    var controller = TKController.resolveController(element._navigationData.controller);
    // error if we have an undefined object
    if (controller === undefined) {
      console.error('TKController.elementWasActivated: trying to push an undefined controller');
      return;
    }
    // otherwise, navigate to it
    TKSpatialNavigationManager.sharedManager.highlightElement(element);
    TKNavigationController.sharedNavigation.pushController(controller);
  }
  else if (element._actionData !== undefined) {
    TKSpatialNavigationManager.sharedManager.highlightElement(element);
    // get the callback for this action
    var callback = element._actionData.action;
    // see if it's a string in which case we need to get the function dynamically
    if (TKUtils.objectIsString(callback) && TKUtils.objectHasMethod(this, callback)) {
      callback = this[element._actionData.action];
    }
    // see if we have custom arguments
    if (TKUtils.objectIsArray(element._actionData.arguments)) {
      callback.apply(this, element._actionData.arguments);
    }
    // otherwise just call the callback
    else {
      callback.apply(this);
    }
  }
  else if (element._backButton !== undefined) {
    TKSpatialNavigationManager.soundToPlay = SOUND_EXIT;
    TKSpatialNavigationManager.sharedManager.highlightElement(element);
    TKNavigationController.sharedNavigation.popController();
  }
  else if (element.localName == 'a' && IS_APPLE_TV) {
    element.dispatchEvent(TKUtils.createEvent('click', null));
  }
  else if (element._scrollableData !== undefined) {
    this.scrollWithData(element._scrollableData);
  }
};

/**
 *  Triggered when an element receives highlight.
 *
 *  @param {Element} element The element that is newly being highlighted.
 *  @param {Element} previouslyHighlightedElement The element that previously was highlighted, or <code>null</code> if there was none.
 */
TKController.prototype.elementWasHighlighted = function (element, previouslyHighlightedElement) {
};

/**
 *  Triggered when an element loses highlight.
 *
 *  @param {Element} element The element that is newly being highlighted.
 *  @param {Element} nextHighlightedElement The element that is going to be highlighted next, or <code>null</code> if there is none.
 */
TKController.prototype.elementWasUnhighlighted = function (element, nextHighlightedElement) {
};

/**
 *  Triggered when an element is hovered, which only happens when a mouse is present.
 *
 *  @param {Element} element The element that is being hovered.
 */
TKController.prototype.elementWasHovered = function (element) {
};

/**
 *  Triggered when an element is not hovered any longer, which only happens when a mouse is present.
 *
 *  @param {Element} element The element that is not hovered any longer.
 */
TKController.prototype.elementWasUnhovered = function (element) {
};

/**
 *  Triggered when the view is first inserted into the document.
 */
TKController.prototype.viewWasInsertedIntoDocument = function () {
  this.viewNeverAppeared = false;
};

/**
 *  Indicates whether the receiver is a descendent of the controller passed as an argument.
 *
 *  @param {TKController} purportedParentController The controller that we assume is a parent controller to the receiver.
 *  @returns {bool} Whether the controller is a descendent of the other controller passed as a parameter.
 */
TKController.prototype.isDescendentOfController = function (purportedParentController) {
  var is_descendent = false;
  var parent = this.parentController;
  while (parent !== null) {
    if (parent === purportedParentController) {
      is_descendent = true;
      break;
    }
    parent = parent.parentController;
  }
  return is_descendent;
};

/* ==================== Keyboard Navigation ==================== */

/**
 *  Adds an element within the controller's view to the list of navigable elements. Any element that is interactive should be registered as navigable, even
 *  when a mouse is available.
 *
 *  @param {Element} element The element we wish to make navigable.
 */
TKController.prototype.addNavigableElement = function (element) {
  // nothing to do if we already know about this element
  if (this._navigableElements.indexOf(element) > -1) {
    return;
  }
  //
  if (!IS_APPLE_TV) {
    element.addEventListener('click', this, false);
  }
  element.addEventListener('highlight', this, false);
  element.addEventListener('unhighlight', this, false);
  element._controller = this;
  //
  this._navigableElements.push(element);
  //
  TKSpatialNavigationManager.sharedManager.addNavigableElement(element);
};

/**
 *  Removes an element within the controller's view from the list of navigable elements.
 *
 *  @param {Element} element The element we wish to remove from the navigable elements list.
 */
TKController.prototype.removeNavigableElement = function (element) {
  // find the index for this element
  var index = this._navigableElements.indexOf(element);
  if (index < 0) {
    return;
  }
  //
  element.removeEventListener('click', this, false);
  element.removeEventListener('highlight', this, false);
  element.removeEventListener('unhighlight', this, false);
  element._controller = undefined;
  // remove elements from the tracking arrays
  this._navigableElements.splice(index, 1);
  //
  TKSpatialNavigationManager.sharedManager.removeNavigableElement(element);
};

/**
 *  Allows to specify custom metrics for an element displayed on screen. This method is called by the spatial navigation manager when determining what the
 *  element to highlight is after the uses presses a directional key on the Apple remote. By default, the CSS metrics for the elements are used, but in
 *  certain cases the author may wish to use different metrics that are more logical for the navigation. Return <code>null</code> in order to specify that
 *  the element has no custom metrics.
 *
 *  @param {Element} element The element which the spatial navigation manager is inspecting.
 *  @returns {TKRect} The custom metrics for the given element.
 */
TKController.prototype.customMetricsForElement = function (element) {
  return null;
};

/**
 *  Allows the controller to provide the spatial navigation manager with a prefered element to highlight, overriding the default behavior of using CSS metrics.
 *  The default implementation returns <code>undefined</code>, which indicates that the automatic behavior should be used, while returning <code>null</code> 
 *  means that there should be no element highlighted in the provided direction.
 *
 *  @param {Element} currentElement The element that is currently highlighted.
 *  @param {int} direction The direction the user is navigation towards.
 *  @returns {Element} The preferred element to highlight in the provided direction.
 */
TKController.prototype.preferredElementToHighlightInDirection = function (currentElement, direction) {
  return undefined;
};

// private method meant to be over-ridden by a controller sub-classes to provide a custom element
// to highlight, returning null means there's nothing custom to report
// XXX: we really need a better mechanism to do this stuff, having a private method for subclasses and one for instances is way dirty
TKController.prototype._preferredElementToHighlightInDirection = function (currentElement, direction) {
  return undefined;
};

/* ==================== Scrolling ==================== */

TKController.prototype.setScrollable = function (scrollable) {
  // remove all scrollable regions if we already had some set up
  if (this._scrollable !== null) {
    for (var i = 0; i < this._scrollable.length; i++) {
      var element = this._scrollable[i];
      element._scrollableData = undefined;
      this.removeNavigableElement(element);
    }
  }
  // process scrollable regions
  this._scrollable = [];
  for (var i = 0; i < scrollable.length; i++) {
    var scrollable_data = scrollable[i];
    // create an animator for this scrollable element
    scrollable_data.animator = new TKAnimator(TKControllerScrollDuration, null, TKControllerScrollSpline);
    // check if we have an up element
    if (scrollable_data.up !== undefined) {
      var up_button = this._view.querySelector(scrollable_data.up);
      up_button._scrollableData = {
        direction: TKControllerScrollDirectionUp,
        target: scrollable_data.target,
        animator: scrollable_data.animator
      };
      this._scrollable.push(up_button);
      this.addNavigableElement(up_button);
    }
    // check if we have a down element
    if (scrollable_data.down !== undefined) {
      var down_button = this._view.querySelector(scrollable_data.down);
      down_button._scrollableData = {
        direction: TKControllerScrollDirectionDown,
        target: scrollable_data.target,
        animator: scrollable_data.animator
      };
      this._scrollable.push(down_button);
      this.addNavigableElement(down_button);
    }
    // check if we have a left element
    if (scrollable_data.left !== undefined) {
      var left_button = this._view.querySelector(scrollable_data.left);
      left_button._scrollableData = {
        direction: TKControllerScrollDirectionLeft,
        target: scrollable_data.target,
        animator: scrollable_data.animator
      };
      this._scrollable.push(left_button);
      this.addNavigableElement(left_button);
    }
    // check if we have a right element
    if (scrollable_data.right !== undefined) {
      var right_button = this._view.querySelector(scrollable_data.right);
      right_button._scrollableData = {
        direction: TKControllerScrollDirectionRight,
        target: scrollable_data.target,
        animator: scrollable_data.animator
      };
      this._scrollable.push(right_button);
      this.addNavigableElement(right_button);
    }
  }
};

TKController.prototype.scrollWithData = function (scrollData) {
  // stop any running animation for this scrollable region
  scrollData.animator.stop();
  // get a pointer to the target element
  var element = this._view.querySelector(scrollData.target);
  // stop right there if there's no such element
  if (!(element instanceof Element)) {
    TKSpatialNavigationManager.soundToPlay = SOUND_LIMIT;
    return;
  }
  // figure out which direction we're scrolling
  var vertical_scrolling = (scrollData.direction == TKControllerScrollDirectionUp || scrollData.direction == TKControllerScrollDirectionDown);
  // get the increment for this scroll
  var increment = element[vertical_scrolling ? 'offsetHeight' : 'offsetWidth'] * TKControllerScrollIncrementFraction;
  // get the start value
  var start_value = element[vertical_scrolling ? 'scrollTop' : 'scrollLeft'];
  // get the target value
  var target_value;
  if (scrollData.direction == TKControllerScrollDirectionUp) {
    target_value = Math.max(element.scrollTop - increment, 0);
  }
  else if (scrollData.direction == TKControllerScrollDirectionDown) {
    target_value = Math.min(element.scrollTop + increment, element.scrollHeight - element.offsetHeight);
  }
  else if (scrollData.direction == TKControllerScrollDirectionLeft) {
    target_value = Math.max(element.scrollLeft - increment, 0);
  }
  else if (scrollData.direction == TKControllerScrollDirectionRight) {
    target_value = Math.min(element.scrollLeft + increment, element.scrollWidth - element.offsetWidth);
  }
  // only run if we have different values
  if (start_value == target_value) {
    TKSpatialNavigationManager.soundToPlay = SOUND_LIMIT;
    return;
  }
  // set the delegate
  scrollData.animator.delegate = {
    animationDidIterate : function (fraction) {
      element[vertical_scrolling ? 'scrollTop' : 'scrollLeft'] = start_value + fraction * (target_value - start_value);
    }
  }
  // start the animation
  scrollData.animator.start();
  // play the move sound since we're scrolling
  TKSpatialNavigationManager.soundToPlay = SOUND_MOVED;
};

TKController.prototype.scrollUp = function () {
  this.upScrollData.target = this.scrollableElement;
  this.scrollWithData(this.upScrollData);
};

TKController.prototype.scrollDown = function () {
  this.downScrollData.target = this.scrollableElement;
  this.scrollWithData(this.downScrollData);
};

/* ==================== Keyboard Navigation ==================== */

/**
 *  Indicates whether the controller is interested in providing event handling for the key with the given identifier. By default, this method returns
 *  <code>false</code>, letting the spatial navigation manager take care of the event in order to perform navigation. In case the method returns 
 *  <code>true</code>, the {@link #keyWasPressed} method is called to let the controller provide its own custom key event handling.
 *
 *  @param {int} key The identifier for the key that was pressed.
 *  @returns {bool} Whether the controller wants to provide its own custom key event handling.
 */
TKController.prototype.wantsToHandleKey = function (key) {
  return (this.scrollableElement !== null && (key == KEYBOARD_UP || key == KEYBOARD_DOWN));
};

/**
 *  Triggered when a key was pressed and the receiver has expressed explicit interest in providing custom key event handling by returning <code>true</code> in
 *  the {@link #wantsToHandleKey} method.
 *
 *  @param {int} key The identifier for the key that was pressed.
 */
TKController.prototype.keyWasPressed = function (key) {
  // up should scroll
  if (key == KEYBOARD_UP) {
    this.scrollUp();
  }
  // down should scroll
  else if (key == KEYBOARD_DOWN) {
    this.scrollDown();
  }
  // done, play the sound
  TKUtils.playSound(TKSpatialNavigationManager.soundToPlay);
};

/* ==================== Archival ==================== */

/**
 *  Called when the booklet's state is being archived. This method needs to return a list of properties reflecting the current state for the receiver.
 *
 *  @returns {Object} The list of properties to archive as a hash-like object.
 *  @private
 */
TKController.prototype.archive = function () {
  var archive = {
    id: this.id
  };
  // see if we can add a highlighted element index
  if (this.highlightedElement !== null) {
    archive.highlightedElementIndex = this.navigableElements.indexOf(this.highlightedElement);
  }
  //
  return archive;
};

TKClass(TKController);
