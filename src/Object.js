/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */
 
/* ==================== Constants ==================== */

const TKObjectPropertyChanged = 'handlePropertyChange';

/* ==================== TKObject ==================== */

/**
 *  @class
 *
 *  <p>The TKObject class is the base class for all TuneKit objects and provides a way to receive and trigger
 *  notifications when a JavaScript property changes.</p>
 *
 *  <p>Observing a property on an object is done through the
 *  {@link #addPropertyObserver} method, specifying the property to observe as well as the object that will
 *  receive the notifications of the property change. Likewise, an object can stop observing such changes using
 *  the {@link #removePropertyObserver} method. When a property value changes, the author needs to call the 
 *  {@link #notifyPropertyChange} method so that registered observers will be notified. Note that synthetized
 *  properties will automatically trigger notifications when changed, so in this case, setters need not 
 *  manually call {@link #notifyPropertyChange}.</p>
 *
 *  <p>Finally, TKObject also provides the {@link #callSuper} method to call the superclass's implementation
 *  of an overload method.</p>
 *  
 *  @since TuneKit 1.0
 */
function TKObject () {
  this.observedProperties = {};
};

/* ==================== Method overriding ==================== */

/**
 *  This method calls the object's superclass implementation of the current method
 */
TKObject.prototype.callSuper = function () {
  // figure out what function called us
  var caller = TKObject.prototype.callSuper.caller;
  // if that function is a constructor, we call the parent class's constructor
  if (TKUtils.objectHasMethod(caller, 'inherits')) {
    caller.inherits.apply(this, arguments);
  }
  // otherwise we look at that function name in the parent prototype
  else {
    var parent = caller._class.inherits.prototype;
    var method_name = caller._name;
    if (TKUtils.objectHasMethod(parent, method_name)) {
      return parent[method_name].apply(this, arguments);
    }
  }
};

/* ==================== Observing ==================== */

/**
 *  Indicates whether this object has registered observers for this property
 *
 *  @param {String} propertyName The property that may be observed.
 *
 *  @returns {bool} Whether this object has registered observers for this property
 *  @private
 */
TKObject.prototype.isPropertyObserved = function (propertyName) {
  return !TKUtils.objectIsUndefined(this.observedProperties[propertyName]);
};

/**
 *  Adds an observer for the named property on this object. In case an existing
 *  combination of the observer and property is already registered, this method
 *  is a no-op.
 *
 *  @param {String} propertyName The property to observe.
 *  @param {Object} observer The object that will be notified when the property is changed.
 *  @param {String} methodName The optional method name that will be called on the observer when the property is changed. 
 *  If this property is not provided, the <code>observer</code> must implement the {@link TKPropertyValueChange} protocol.
 */
TKObject.prototype.addPropertyObserver = function (propertyName, observer, methodName) {
  // create the array for this property if it's not already there
  if (!this.isPropertyObserved(propertyName)) {
    this.observedProperties[propertyName] = new Array();
  }
  // do nothing if we already have this observer registered
  else if (this.observedProperties[propertyName].indexOf(observer) > -1) {
    return;
  }
  // now, add the observer to the observer array for this property if valid
  var methodName = methodName || TKObjectPropertyChanged;
  if (TKUtils.objectHasMethod(observer, methodName)) {
    this.observedProperties[propertyName].push({
      observer: observer,
      methodName : methodName
    });
  }
};

/**
 *  Removes the observer for the named property on this object. In case an existing
 *  combination of the observer and property is not already registered, this method
 *  is a no-op.
 *
 *  @param {String} propertyName The observed property.
 *  @param {Object} observer The object that was notified when the property changed.
 *
 *  @returns {bool} Whether an observer was removed
 */
TKObject.prototype.removePropertyObserver = function (propertyName, observer) {
  // do nothing if this property is not observed
  if (!this.isPropertyObserved(propertyName)) {
    return false;
  }
  // now get the observer's index in the array
  var observers = this.observedProperties[propertyName];
  var observer_index = observers.indexOf(observer);
  // remove the observer if it was registered
  if (observer_index > -1) {
    observers.splice(observer_index, 1);
  }
  // let the user know whether we succeeded
  return (observer_index > -1);
};

/**
 *  Triggers a notification that the given property on this object has changed.
 *  For synthesized properties, this is called automatically upon setting the
 *  property. For methods that update an instance variable that is not synthesized,
 *  {@link #notifyPropertyChange} has to be called manually so that observers are notified.
 *
 *  @param {String} propertyName The observed property.
 */
TKObject.prototype.notifyPropertyChange = function (propertyName) {
  // do nothing if this property is not observed
  if (!this.isPropertyObserved(propertyName)) {
    return;
  }
  // now, go through each observer for this property and notify them
  var observers = this.observedProperties[propertyName];
  for (var i = 0; i < observers.length; i++) {
    var observer = observers[i];
    observer.observer[observer.methodName](this, propertyName);
  }
};

/**
 *  Calls a method on this object after a delay, allowing any number of optional extra arguments to be
 *  passed after the first two mandatory ones.
 *
 *  @param {String} methodName The method name to be called.
 *  @param {int} delay The delay in miliseconds.
 *
 *  @returns {int} The timeout that can be used to call <code>clearTimeout</code>.
 */
TKObject.prototype.callMethodNameAfterDelay = function (methodName, delay) {
  var _this = this;
  var args = Array.prototype.slice.call(arguments, 2);
  var generated_function = function () {
    _this[methodName].apply(_this, args);
  };
  generated_function.displayName = TKUtils.createDisplayName(this.constructor.name, methodName);
  return setTimeout(generated_function, delay);
};

/**
 *  @class
 *  @name TKPropertyValueChange
 *  @since TuneKit 1.0
 */

/**
 *  Invoked when a property on an observed object has been changed.
 *
 *  @name handlePropertyChange
 *  @function
 *
 *  @param {Object} observedObject The observed object
 *  @param {String} propertyName The observed property's name as a string
 *  @memberOf TKPropertyValueChange.prototype
 */

TKClass(TKObject, 'TKObject');
