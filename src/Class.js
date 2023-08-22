/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

/**
 *  @class
 *
 *  <p>The TKClass function will process a constructor function and set up its inheritance chain, synthetize
 *  a number of its instance properties and mix in additional capabilities based properties defined on
 *  that function. The supported properties are:</p>
 *
 *  <ul>
 *    <li><code>inherits</code> – the superclass</li>
 *    <li><code>includes</code> – an Array of modules to pull in</li>
 *    <li><code>synthetizes</code> – an Array of properties to synthetize</li>
 *  </ul>
 *
 *  <p>For instance, consider the following class declaration:</p>
 *
 *  <pre class="example">
// extends MySuperClass
MyClass.inherits = MySuperClass;

// mixes in the TKEventTriage and TKPropertyTriage modules
MyClass.includes = [TKEventTriage, TKPropertyTriage]; 

// synthetizes the .foo and .bar properties
MyClass.synthetizes = ['foo', 'bar'];

function MyClass () {
  // constructor code goes here
};

// process properties set up on the MyClass constructor
TKClass(MyClass);
 *  </pre>
 *
 *  <p>Synthetization is fully automated as long as the class that wishes to offer synthetized properties follows
 *  the following rules:</p>
 *
 *  <ul>
 *    <li>say the class wishes to synthetize the property <code>.foo</code></li>
 *    <li>if the class chooses to define a getter method, it must be defined as <code>getFoo</code> on its <code>prototype</code>
 *    <li>if the class chooses to define a setter method, it must be defined as <code>setFoo</code> on its <code>prototype</code>
 *    <li>the class must define an instance variable <code>._foo</code> which is the internal object that the class is responsible to update if either a setter is specified</li>
 *  </ul>
 *
 *  <p>So our previous class declaration could be extended as follows:</p>
 *
 *  <pre class="example">
function MyClass () {
  this._foo = '';
};

// custom setter for .foo, the getter is not specified
// and TKClass() will automatically create it
MyClass.prototype.setFoo = function (newFooValue) {
  this._foo = newFooValue;
};

// custom getter for .foo, the setter is not specified
// and TKClass() will automatically create it
MyClass.prototype.getBar = function (newFooValue) {
  return 'Hello ' + this._foo;
};
 *  </pre>
 *
 *  @since TuneKit 1.0
 *
 *  @constructor
 *  @param theClass {Object} The class.
 */

function TKClass (theClass) {
  // check out if we have inheritance set up, otherwise, make TKObject the default superclass
  if (TKUtils.objectIsUndefined(theClass.inherits) && theClass !== TKObject) {
    theClass.inherits = TKObject;
  }
  
  // check out if we have mixins
  if (theClass.includes) {
    TKClass.mixin(theClass.prototype, theClass.includes);
  }

  // synthetizes properties defined locally
  var properties = (theClass.synthetizes) ? theClass.synthetizes : [];
  // now synthetize
  for (var i = 0; i < properties.length; i++) {
    TKClass.synthetizeProperty(theClass.prototype, properties[i], true);
  }

  // synthetizes properties by compiling them up the inheritance chain
  var aClass = theClass;
  var properties = [];
  while (aClass.inherits) {
    aClass = aClass.inherits;
    if (aClass.synthetizes) {
      properties = aClass.synthetizes.concat(properties);
    }            
  }
  // now synthetize
  for (var i = 0; i < properties.length; i++) {
    TKClass.synthetizeProperty(theClass.prototype, properties[i], false);
  }

  // go through each method and save its name as a custom property
  // that we'll use later in TKObject.callSuper()
  for (var i in theClass.prototype) {
    // make sure we don't touch properties that were synthetized
    if (theClass.prototype.__lookupGetter__(i)) {
      continue;
    }
    var prop = theClass.prototype[i];
    if (TKUtils.objectIsFunction(prop)) {
      prop._class = theClass;
      prop._name = i;
      prop.displayName = TKUtils.createDisplayName(theClass.name, i);
    }
  }

  // inherit from the superclass
  // default to TKObject if nothing is specified
  if (theClass !== TKObject) {
    theClass.prototype.__proto__ = theClass.inherits.prototype;
  }
};

TKClass.synthetizeProperty = function (object, propertyName, isPropertyInherited) {
  var camel_ready = propertyName.charAt(0).toUpperCase() + propertyName.substr(1);
  var getter_name = 'get' + camel_ready;
  var setter_name = 'set' + camel_ready;
  // check on function availability
  var has_getter = TKUtils.objectHasMethod(object, getter_name);
  var has_setter = TKUtils.objectHasMethod(object, setter_name);
  
  // if we have neither a getter or a setter, then do nothing
  // unless the property is defined locally
  if (!isPropertyInherited && !(has_getter || has_setter)) {
    return;
  }
  
  // assign the setter function if we have one
  if (has_setter) {
    var specified_setter_function = function (newValue) {
      object[setter_name].call(this, newValue);
      this.notifyPropertyChange(propertyName);
    };
    specified_setter_function.displayName = 'Specified setter for .' + propertyName + ' on ' + object.constructor.name;
    object.__defineSetter__(propertyName, specified_setter_function);
  }
  // otherwise just assign to _propertyName
  else {
    var default_setter_function = function (newValue) {
      this['_' + propertyName] = newValue;
      this.notifyPropertyChange(propertyName);
    };
    default_setter_function.displayName = 'Default setter for .' + propertyName + ' on ' + object.constructor.name;
    object.__defineSetter__(propertyName, default_setter_function);
  }
  
  // assign the getter function if we have one
  if (has_getter) {
    object.__defineGetter__(propertyName, object[getter_name]);
  }
  // otherwise just return _propertyName
  else {
    var default_getter_function = function () {
      return this['_' + propertyName];
    };
    default_getter_function.displayName = 'Default getter for .' + propertyName + ' on ' + object.constructor.name;
    object.__defineGetter__(propertyName, default_getter_function);
  }
};

TKClass.mixin = function (target, sources) {
  for (var i = 0; i < sources.length; i++) {
    TKUtils.copyPropertiesFromSourceToTarget(sources[i], target);
  }
};

TKUtils.setupDisplayNames(TKClass, 'TKClass');
