/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

/**
 *  @class
 *  @name TKNavigationControllerDelegate
 *  @since TuneKit 1.0
 */

/**
 *  Indicates that a new controller is becoming the top controller and is about to become visible on screen.
 *
 *  @name navigationControllerWillShowController
 *  @function
 *
 *  @param {TKNavigationController} navigationController The navigation controller.
 *  @param {TKController} controller The controller that is about to be shown by the navigation controller.
 *  @memberOf TKNavigationControllerDelegate.prototype
 */
const TKNavigationControllerWillShowController = 'navigationControllerWillShowController';  
/**
 *  Indicates that a new controller has become the top controller and is fully visible on screen.
 *
 *  @name navigationControllerDidShowController
 *  @function
 *
 *  @param {TKNavigationController} navigationController The navigation controller.
 *  @param {TKController} controller The controller that is has been shown by the navigation controller.
 *  @memberOf TKNavigationControllerDelegate.prototype
 */
const TKNavigationControllerDidShowController = 'navigationControllerDidShowController';  

TKNavigationController.inherits = TKController;
TKNavigationController.synthetizes = ['topController'];

/**
 *  @property {TKNavigationController} sharedNavigation The shared instance of the navigation controller. TuneKit automatically creates a single instance
 *  of the {@link TKNavigationController} class as needed, and developers should never have to create an instance themselves, instead using this property
 *  to retrieve the shared instance.
 */
TKNavigationController.sharedNavigation = null;

/**
 *  @class
 *
 *  <p>The spatial navigation manager is a pre-insantiated singleton controller that handles the logic for all navigation between controllers. The currently
 *  showing controller is the {@link #topController}, and is the last item of the {@link #controllers} array, which traces the complete navigation history
 *  from the home controller onwards. By implementing the {@link TKNavigationControllerDelegate} protocol, the navigation controller's {@link #delegate} can
 *  track as the user navigates between controllers. While the {@link TKController#navigatesTo} property should be sufficient to alloe developers to specify
 *  what action triggers a navigation to a given controller, the {@link #pushController} and {@link #popController} methods also allow a programmatic
 *  interaction with the navigation controller.</p>
 *
 *  @extends TKController
 *  @since TuneKit 1.0
 *
 *  @param {Object} data A hash of properties to use as this object is initialized.
 */
function TKNavigationController (data) {
  /**
   *  The list of controllers in the navigation stack. The controller at the first index is the root-most controller, while the controller at the last index is
   *  the top controller.
   *  @type Array
   */
  this.controllers = [];
  /**
   *  The delegate for this navigation controller, an object implementing the {@link TKNavigationControllerDelegate} protocol.
   *  @type Object
   */
  this.delegate = data.delegate || null;
  this.rootController = data.rootController || null;
  this.previousController = null;
  //
  this.busy = false;
  //
  this.callSuper(data);
  // see if we have a stack to restore
  if (bookletController.archive !== undefined) {
    var stack = bookletController.archive.navigationStack;
    var restored_controllers = [];
    for (var i = 0; i < stack.length; i++) {
      var controller = TKController.controllers[stack[i]];
      restored_controllers.push(controller);
      controller.loadView();
    }
    // push the last controller
    this.pushController(restored_controllers[restored_controllers.length - 1]);
    // and fake the controllers stack
    this.controllers = restored_controllers;
  }
  // see if we have a root set up
  else if (this.rootController !== null) {
    this.pushController(this.rootController);
  }
  //
  TKNavigationController.sharedNavigation = this;
};

/* ==================== Controllers ==================== */

/**
 *  @name TKNavigationController.prototype
 *  @property {TKController} topController The controller at the top of the navigation stack of {@link #controllers}.
 */
TKNavigationController.prototype.getTopController = function () {
  return (this.controllers.length > 0) ? this.controllers[this.controllers.length - 1] : null;
};

/**
 *  Pushes a new controller to the top of the navigation stack, triggering an animated transition of the new top controller using its
 *  {@link TKController.becomesActiveTransition} property and the {@link TKController.becomesInactiveTransition} property of the previous {@link #topController}
 *  @param {TKController} controller The controller to push onto the navigation stack.
 */
TKNavigationController.prototype.pushController = function (controller) {
  // do nothing if we're busy
  if (this.busy) {
    return;
  }
  //
  TKTransaction.begin();
  // get pointers to object we'll manipulate
  var previous_controller = this.topController;
  var next_view = controller.view;
  // fire delegate saying we're moving to a new controller
  if (TKUtils.objectHasMethod(this.delegate, TKNavigationControllerWillShowController)) {
    this.delegate[TKNavigationControllerWillShowController](this, controller);
  }
  // put the controller in our array
  this.controllers.push(controller);
  // notify of upcoming change
  if (previous_controller !== null) {
    previous_controller._viewWillDisappear();
    previous_controller.viewWillDisappear();
  }
  controller._viewWillAppear();
  controller.viewWillAppear();
  // add it to the tree
  this.view.appendChild(controller.view);
  //
  if (previous_controller !== null) {
    this.transitionToController(previous_controller, controller);
  }
  else {
    this.busy = true;
    this.transitionDidComplete();
    TKSpatialNavigationManager.sharedManager.managedController = controller;
  }
  //
  TKTransaction.commit();
};

/**
 *  Pops the top {@link #topController} off the navigation stack, triggering an animated transition of the new top controller using its
 *  {@link TKController.becomesActiveTransition} property and the {@link TKController.becomesInactiveTransition} property of the previous {@link #topController}
 */
TKNavigationController.prototype.popController = function () {
  // do nothing if we're busy or if there's nothing to pop
  if (this.busy || this.controllers.length < 2) {
    return;
  }
  TKTransaction.begin();
  // fire delegate saying we're moving to a new controller
  if (TKUtils.objectHasMethod(this.delegate, TKNavigationControllerWillShowController)) {
    this.delegate[TKNavigationControllerWillShowController](this, this.controllers[this.controllers.length - 2]);
  }
  // update stack
  var previous_controller = this.controllers.pop();
  var top_controller = this.topController;
  // notify of upcoming change
  previous_controller._viewWillDisappear();
  previous_controller.viewWillDisappear();
  top_controller._viewWillAppear();
  top_controller.viewWillAppear();
  // add it to the tree
  this.view.appendChild(top_controller.view);
  // transition
  this.transitionToController(previous_controller, top_controller);
  //
  TKTransaction.commit();
};

/* ==================== Transition ==================== */

TKNavigationController.prototype.transitionToController = function (previous_controller, top_controller) {
  // mark that a transition is now in progress
  this.busy = true;
  // record some parameters that we will need at the end of the transition
  this.previousController = previous_controller;
  // figure out transitions
  if (previous_controller !== null) {
    if (IS_APPLE_TV && !previous_controller.enforcesCustomTransitions) {
      previous_controller.becomesInactiveTransition = TKViewTransitionDissolveOut;
    }
    previous_controller.view.applyTransition(previous_controller.becomesInactiveTransition, false);
  }
  if (IS_APPLE_TV && !top_controller.enforcesCustomTransitions) {
    top_controller.becomesActiveTransition = TKViewTransitionDissolveIn;
  }
  var top_controller_transition = top_controller.becomesActiveTransition;
  top_controller_transition.delegate = this;
  top_controller.view.applyTransition(top_controller_transition, false);
  //
  TKSpatialNavigationManager.sharedManager.managedController = top_controller;
  // track that we're moving from screen to screen
  window.dispatchEvent(TKUtils.createEvent('cursorwait', null));
};

TKNavigationController.prototype.transitionDidComplete = function (transition) {
  if (!this.busy) {
    return;
  }
  var top_controller = this.topController;
  // remove the old screen
  if (this.previousController !== null) {
    this.view.removeChild(this.previousController.view);
    this.previousController._viewDidDisappear();
    this.previousController.viewDidDisappear();
  }
  // notify of completed change
  top_controller._viewDidAppear();
  top_controller.viewDidAppear();
  // fire delegate saying we've moved to a new controller
  if (TKUtils.objectHasMethod(this.delegate, TKNavigationControllerDidShowController)) {
    this.delegate[TKNavigationControllerDidShowController](this, top_controller);
  }
  //
  this.busy = false;
  // pre-load screens that we can navigate to from here
  // for (var i = 0; i < top_controller.navigatesTo.length; i++) {
  //   var navigation_data = top_controller.navigatesTo[i];
  //   // pointer to the controller
  //   var controller = navigation_data.controller;
  //   // if it's a string, try to find it in the controllers hash
  //   if (TKUtils.objectIsString(controller)) {
  //     controller = TKController.controllers[controller];
  //   }
  //   // skip if we have an undefined object
  //   if (controller === undefined) {
  //     continue;
  //   }
  //   // otherwise, load it if it's not been loaded before
  //   if (controller._view === null) {
  //     controller.loadView();
  //   }
  // }
  // done moving from screen to screen
  window.dispatchEvent(TKUtils.createEvent('cursornormal', null));
};

TKClass(TKNavigationController);
