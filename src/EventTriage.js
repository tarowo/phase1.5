/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */
 
var TKEventTriage = {};

TKEventTriage.handleEvent = function (event) {
  // first call the super class method that we may be overriding otherwise
  if (this instanceof TKObject) {
    this.callSuper(event);
  }
  //
  var type = event.type;
  var methodName = 'handle' + type.charAt(0).toUpperCase() + type.substr(1);
  if (TKUtils.objectHasMethod(this, methodName)) {
    this[methodName](event);
  }
};

TKUtils.setupDisplayNames(TKEventTriage, 'TKEventTriage');
