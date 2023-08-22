/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

/**
 *  @class
 *  @name TKTransitionDelegate
 *  @since TuneKit 1.0
 */

/**
 *  Invoked when a transition has completed.
 *
 *  @name transitionDidComplete
 *  @function
 *
 *  @param {TKTransition} theTransition The transition that just completed.
 *  @memberOf TKTransitionDelegate.prototype
 */

const TKTransitionDidCompleteDelegate = 'transitionDidComplete';

const TKTransitionDefaults = {
  duration  : 0.5,
  delay     : 0,
  removesTargetUponCompletion : false,
  revertsToOriginalValues : false
};

const TKTransitionStyles = ['-webkit-transition-property', '-webkit-transition-duration', '-webkit-transition-timing-function', '-webkit-transition-delay', '-webkit-transition'];

/* ==================== TKTransition ==================== */

/**
 *  @class
 *
 *  <p>The TKTransition class allows to create a synchronized change of one or more property values on a
 *  {@link Element} instance or any DOM element.</p>
 *
 *  <p>First, the user sets the {@link #target} for the transition,
 *  identifying the target element, and second the set of {@link #properties}, in the form of an <code>Array</code>
 *  of CSS properties for the element. Then the {@link #to} and optional
 *  {@link #from} value arrays are provided to define what values will be used for the transition. Each item in the
 *  {@link #from} and {@link #to} arrays matches the item at the same index in the {@link #properties} array, and the same
 *  applies to the {@link #duration} property, which can also be a single value shared for all transitioned properties.</p>
 *
 *  <p>Finally, once the properties on the transition are all set, the {@link #start} method must be called so that the
 *  transition is started. Note that it is possible to group transitions within a {@link TKTransaction} and set a default
 *  set of transition properties within a transaction using the {@link TKTransaction.defaults} static property.</p>
 *  
 *  <p>The following example shows how to make a transition that fades an element in as it animates from the right side of the screen:</p>
 *
<pre class="example">
new TKTransition({
  target : anElement,
  properties : ['opacity', '-webkit-transform'];
  from : [0, 'translate(320px, 0)'],
  to : [1, 'translate(0, 0)']
  duration : 0.5;
}).start();
</pre>
 *
 *  <p>Note that properties of a {@link TKTransition} object can be passed as a batch to the {@link TKTransition} constructor
 *  as an anonymous object. This also allows reuse of a set of parameters across several transitions. Also, a set of pre-baked
 *  transitions exist can be easily applied to an element with the {@link Element#applyTransition} method.</p>
 *
 *  @since TuneKit 1.0
 */
function TKTransition (params) {
  // set up defaults
  /**
   *  The transition target.
   *  @type Element 
   */
  this.target = null;
  /**
   *  The set of properties that will be transitioned. The properties are CSS properties of the targeted <code>Element</code>.
   *  @type Array 
   */
  this.properties = null;
  /**
   *  The set of durations in seconds, each duration matching a property in the {@link #properties} array.
   *  Note that it's possible to specify a single value instead of an array to use the same duration for 
   *  all properties.
   *  @type Object 
   */
  this.duration = null;
  /**
   *  The set of delays in seconds, each delay matching a property in the {@link #properties} array.
   *  Note that it's possible to specify a single delay instead of an array to use the same delay for 
   *  all properties.
   *  @type Object 
   */
  this.delay = null;
  /**
   *  Optional list of values to start the transition from. Each value in this array must match the property
   *  at the same index in the {@link #properties} array.
   *  @type Array
   */
  this.from = null;
  /**
   *  Required list of values to transition to. Each value in this array must match the property
   *  at the same index in the {@link #properties} array.
   *  @type Array
   */
  this.to = null;
  /**
   *  The set of timing functions, each timing function matching a property in the {@link #properties}
   *  array. Note that it's possible to specify a single timing function instead of an array to use the
   *  same timing function for all properties.
   *  @type Object 
   */
  this.timingFunction = null;
  /**
   *  The delegate object that implements the {@link TKTransitionDelegate} protocol.
   *  @type Object
   */
  this.delegate = null;
  /**
   *  Indicates whether the target needs to be removed once the transition completes. Defaults to <code>false</code>.
   *  @type bool
   */
  this.removesTargetUponCompletion = null;
  /**
   *  Indicates whether the target needs to reset the property that are transitioned to their original values
   *  once the transition completes. Defaults to <code>false</code>.
   *  @type bool
   */
  this.revertsToOriginalValues = null;
  //
  this.defaultsApplied = false;
  this.archivedStyles = null;
  this.archivedValues = [];
  // import params
  TKUtils.copyPropertiesFromSourceToTarget(params, this);
};

/* ==================== Dealing with defaults ==================== */

TKTransition.prototype.applyDefaults = function () {
  if (this.defaultsApplied) {
    return;
  }
  //
  for (var i in TKTransitionDefaults) {
    if (this[i] === null) {
      this[i] = TKTransitionDefaults[i];
    }
  }
  //
  this.defaultsApplied = true;
};

/* ==================== Archiving the transition styles ==================== */

TKTransition.prototype.getTargetStyle = function () {
  // if (this.target.style === null) {
  //   this.target.setAttribute('style', 'foo: bar');
  // }
  return this.target.style;
};

TKTransition.prototype.archiveTransitionStyles = function () {
  // do nothing if we already have archived styles in this run session
  if (this.archivedStyles !== null) {
    return;
  }
  // iterate all TKTransitionStyles and archive them
  this.archivedStyles = [];
  var style = this.getTargetStyle();
  for (var i = 0; i < TKTransitionStyles.length; i++) {
    this.archivedStyles.push(style.getPropertyValue(TKTransitionStyles[i]));
  }
};

TKTransition.prototype.restoreTransitionStyles = function () {
  var style = this.getTargetStyle();
  // iterate all TKTransitionStyles and restore them
  for (var i = 0; i < TKTransitionStyles.length; i++) {
    style.setProperty(TKTransitionStyles[i], this.archivedStyles[i], '');
  }
  // reset archived styles
  this.archivedStyles = null;
};

/* ==================== Archiving the base values ==================== */

TKTransition.prototype.archiveBaseValues = function () {
  // do nothing if we don't need to archive base values
  if (!this.revertsToOriginalValues) {
    return;
  }
  var style = this.getTargetStyle();
  for (var i = 0; i < this.properties.length; i++) {
    this.archivedValues.push(style.getPropertyValue(this.properties[i]));
  }
};

TKTransition.prototype.restoreBaseValues = function () {
  var style = this.getTargetStyle();
  for (var i = 0; i < this.properties.length; i++) {
    style.setProperty(this.properties[i], this.archivedValues[i], null);
  }
};

/* ==================== Starting the transition ==================== */

/**
 *  Starts the transition.
 */
TKTransition.prototype.start = function () {
  // if we have an active transaction, just add to it
  if (TKTransaction.openTransactions > 0) {
    TKTransaction.addTransition(this);
    return;
  }  
  // otherwise, we'll just get it going
  this.applyDefaults();
  if (this.from === null) {
    this.applyToState();
  }
  else {
    this.applyFromState();
    var _this = this;
    setTimeout(function () {
      _this.applyToState();
    }, 0);  
  }
};

/* ==================== Applying the "from" state ==================== */

TKTransition.prototype.applyFromState = function () {
  // do nothing if we have no "from" state specified
  if (this.from === null) {
    return;
  }
  //
  this.applyDefaults();
  this.archiveTransitionStyles();
  var style = this.getTargetStyle();
  style.webkitTransitionDuration = 0;
  for (var i = 0; i < this.properties.length; i++) {
    style.setProperty(this.properties[i], this.from[i], '');
  }
};

/* ==================== Applying the "to" state ==================== */

TKTransition.prototype.applyToState = function () {
  // first, make sure we have defaults applied if some
  // properties are not explicitely set on our transition
  this.applyDefaults();

  // and that we archive the transition styles to be reverted
  this.archiveTransitionStyles();

  // and that we archive the original values
  this.archiveBaseValues();
  
  // now compile the styles needed for this transition
  this.cssProperties = [];
  var transition_styles = [];
  for (var i = 0; i < this.properties.length; i++) {
    var property = this.properties[i];
    // do nothing if we already have an animation defined for this
    if (this.cssProperties.indexOf(property) > -1) {
      continue;
    }
    // else, set up the CSS style for this transition
    var duration = (TKUtils.objectIsArray(this.duration)) ? this.duration[i] : this.duration;
    var timing = (TKUtils.objectIsArray(this.timingFunction)) ? this.timingFunction[i] : this.timingFunction;
    var delay = (TKUtils.objectIsArray(this.delay)) ? this.delay[i] : this.delay;
    transition_styles.push([property, duration + 's', timing, delay + 's'].join(' '));
    // and remember we are animating this property
    this.cssProperties.push(property);
  }

  var style = this.getTargetStyle();
  for (var i = 0; i < this.properties.length; i++) {
    style.setProperty(this.properties[i], this.to[i], '');
  }

  // set up the transition styles
  style.webkitTransition = transition_styles.join(', ');

  // register for events to track transition completions
  this.target.addEventListener('webkitTransitionEnd', this, false);
  this.completedTransitions = 0;
};

/* ==================== Tracking transition completion ==================== */

// XXX: we won't be getting an event for properties that have the same value in the to
// state, so we'll need to do a little work to track css properties that won't really transition
TKTransition.prototype.handleEvent = function (event) {
  // do nothing if that event just bubbled from our target's sub-tree
  if (event.currentTarget !== this.target) {
    return;
  }

  // update the completion counter
  this.completedTransitions++;

  // do nothing if we still have running transitions
  if (this.completedTransitions != this.cssProperties.length) {
    return;
  }

  // the counter reached our properties count, fire up the delegate
  if (TKUtils.objectHasMethod(this.delegate, TKTransitionDidCompleteDelegate)) {
    this.delegate[TKTransitionDidCompleteDelegate](this);
  }

  // remove from the tree if instructed to do so
  if (this.removesTargetUponCompletion) {
    this.target.parentNode.removeChild(this.target);
  }
  // otherwise, restore transition styles
  else {
    this.restoreTransitionStyles();
  }
  
  // restore original values if instructed to do so
  if (this.revertsToOriginalValues) {
    this.restoreBaseValues();
  }
};

TKClass(TKTransition);
