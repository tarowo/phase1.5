/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

/**
 *  The keyboard identifier for the backspace key.
 *  @constant
 *  @type int
 */
const KEYBOARD_BACKSPACE = 8;
/**
 *  The keyboard identifier for the left key.
 *  @constant
 *  @type int
 */
const KEYBOARD_LEFT = 37;
/**
 *  The keyboard identifier for the right key.
 *  @constant
 *  @type int
 */
const KEYBOARD_RIGHT = 39;
/**
 *  The keyboard identifier for the up key.
 *  @constant
 *  @type int
 */
const KEYBOARD_UP = 38;
/**
 *  The keyboard identifier for the down key.
 *  @constant
 *  @type int
 */
const KEYBOARD_DOWN = 40;
/**
 *  The keyboard identifier for the return key.
 *  @constant
 *  @type int
 */
const KEYBOARD_RETURN = 13;

/**
 *  Indicates whether TuneKit is running on Apple TV.
 *  @constant
 *  @type bool
 */
const IS_APPLE_TV = (window.iTunes !== undefined && window.iTunes.platform == 'AppleTV');
/**
 *  The Apple TV-specific iTunes system sounds interface.
 *  @constant
 *  @type bool
 *  @private
 */
const ATV_SOUNDS = IS_APPLE_TV ? window.iTunes.getSystemSounds() : null;

/**
 *  The move sound of the Apple TV user interface.
 *  @constant
 *  @type Object
 */
const SOUND_MOVED = IS_APPLE_TV ? ATV_SOUNDS.SystemSoundScrollStart : new Audio('../TuneKit/sounds/SelectionChange.aif');
/**
 *  The selection sound of the Apple TV user interface.
 *  @constant
 *  @type Object
 */
const SOUND_ACTIVATED = IS_APPLE_TV ? ATV_SOUNDS.SystemSoundSelect : new Audio('../TuneKit/sounds/Selection.aif');
/**
 *  The limit sound of the Apple TV user interface.
 *  @constant
 *  @type Object
 */
const SOUND_LIMIT = IS_APPLE_TV ? ATV_SOUNDS.SystemSoundScrollLimit : new Audio('../TuneKit/sounds/Limit.aif');
/**
 *  The exit sound of the Apple TV user interface.
 *  @constant
 *  @type Object
 */
const SOUND_EXIT = IS_APPLE_TV ? ATV_SOUNDS.SystemSoundExit : new Audio('../TuneKit/sounds/Exit.aif');

/**
 *  @class
 *  @name TKUtils
 *
 *  @since TuneKit 1.0
 */
function TKUtils () {
};

/* ==================== SOUNDS ==================== */

/**
 *  Plays a sound.
 *
 *  @param {Object} sound The sound to play, which is either an <code>audio</code> element or an iTunes system sound identifier on Apple TV.
 */
TKUtils.playSound = function (sound) {
  if (IS_APPLE_TV) {
    ATV_SOUNDS.playSystemSound(sound);
  }
  else {
    sound.play();
  }
};

/* ==================== TRANSFORMS SHORTHANDS ==================== */

/**
 *  Prints a <code>translate3d()</code> command that can be used as input for a <code>-webkit-transform</code> property.
 *  
 *  @param {int} tx The x coordinate for the translation.
 *  @param {int} ty The y coordinate for the translation
 *
 *  @returns {String} The <code>translate3d()</code> command
 */
TKUtils.t = function (tx, ty) {
  return 'translate3d(' + tx + 'px, ' + ty + 'px, 0)';
};

/**
 *  Creates a CSS string representation for a number in pixels.
 *  
 *  @param {number} value The value to be converted.
 *
 *  @returns {String} A CSS string representation for <code>value</code> in pixels.
 */
TKUtils.px = function (value) {
  return value + 'px';
};

/* ==================== Array ==================== */

/**
 *  Copies all properties from one object onto another.
 *  
 *  @param {Object} sourceObject The object from which we will copy properties.
 *  @param {Object} targetObject The array onto which we will copy properties.
 */
TKUtils.copyPropertiesFromSourceToTarget = function (source, target) {
  for (var property in source) {
    target[property] = source[property];
  }
};

/* ==================== Delegates ==================== */

/**
 *  Indicates whether an object is a <code>Function</code>.
 *  
 *  @param {Object} object The object purported to be a <code>Function</code>.
 *
 *  @returns {bool} Whether the object is a <code>Function</code>.
 */
TKUtils.objectIsFunction = function (object) {
  return (typeof object == 'function');
};

/**
 *  Indicates whether an object is <code>undefined</code>.
 *  
 *  @param {Object} object The object purported to be <code>undefined</code>.
 *
 *  @returns {bool} Whether the object is <code>undefined</code>.
 */
TKUtils.objectIsUndefined = function (object) {
  return (object === undefined);
};

/**
 *  Indicates whether an object is a string literal or a <code>String</code> instance.
 *  
 *  @param {Object} object The object purported to be a string literal or a <code>String</code> instance.
 *
 *  @returns {bool} Whether the object is a string literal or a <code>String</code> instance.
 */
TKUtils.objectIsString = function (object) {
  return (typeof object == 'string' || object instanceof String);
};

/**
 *  Indicates whether an object is an <code>Array</code>.
 *  
 *  @param {Object} object The object purported to be an <code>Array</code>.
 *
 *  @returns {bool} Whether the object is an <code>Array</code>.
 */
TKUtils.objectIsArray = function (object) {
  return (object instanceof Array);
};

/**
 *  Indicates whether an object implements a given method, useful to check if a delegate
 *  object implements a given delegate method.
 *  
 *  @param {Object} object The object purported to implement a given method.
 *  @param {String} methodNameAsString The method name as a <code>String</code>.
 *
 *  @returns {bool} Whether the object implements the given method.
 */
TKUtils.objectHasMethod = function (object, methodNameAsString) {
  return (  object !== null &&
            !this.objectIsUndefined(object) &&
            !this.objectIsUndefined(object[methodNameAsString]) &&
            this.objectIsFunction(object[methodNameAsString])
         );
};

/* ==================== INIT ==================== */

/**
 *  Sets up the .displayNames for all functions defined on the specified class, including its prototype.
 *  
 *  @param {Object} class The class.
 *  @param {String} className The class name as a string, in case it can not be derived from <code>class</code>. Optional.
 */
TKUtils.setupDisplayNames = function (object, className) {
  var class_name = className || object.name;
  for (var i in object) {
    // make sure we don't touch properties that were synthetized
    if (object.__lookupGetter__(i)) {
      continue;
    }
    var prop = object[i];
    if (TKUtils.objectIsFunction(prop)) {
      prop.displayName = TKUtils.createDisplayName(class_name, i);
    }
  }
  for (var i in object.prototype) {
    // make sure we don't touch properties that were synthetized
    if (object.prototype.__lookupGetter__(i)) {
      continue;
    }
    var prop = object.prototype[i];
    if (TKUtils.objectIsFunction(prop)) {
      prop.displayName = TKUtils.createDisplayName(class_name, i);
    }
  }
};

TKUtils.createDisplayName = function (className, methodName) {
  return className + '.' + methodName + '()';
};

TKUtils.buildElement = function (elementData) {
  // nothing to do if we don't have useful data
  if (!elementData || !elementData.type) {
    return null;
  }
  //
  var element = null;
  switch (elementData.type) {
    case "emptyDiv":
      element = document.createElement("div");
      break;
    case "container":
      element = document.createElement("div");
      for (var i=0; i < elementData.children.length; i++) {
        element.appendChild(TKUtils.buildElement(elementData.children[i]));
      }
      break;
    case "image":
      element = document.createElement("img");
      element.src = elementData.src;
      break;
    case "text":
      element = document.createElement("div");
      var p = document.createElement("p");
      p.innerText = elementData.text;
      element.appendChild(p);
      break;
    default:
      element = document.createElement(elementData.type);
      element.innerHTML = elementData.content;
  }
  // add optional id 
  if (elementData.id) {
    element.id = elementData.id;
  }
  // add optional class 
  if (elementData.className) {
    element.className = elementData.className;
  }
  
  // wrap in optional link
  if (elementData.link){
    var subElement = element;
    element = document.createElement("a");
    element.href = elementData.link;
    element.target = "_blank";
    element.appendChild(subElement);
  }
  
  return element;
};

/**
 *  Creates a DOM event.
 *
 *  @param {String} eventType The event type.
 *  @param {Element} relatedTarget The optional related target for this event.
 *
 *  @returns {Event} The event.
 */
TKUtils.createEvent = function (eventType, relatedTarget) {
  var event = document.createEvent('Event');
  event.initEvent(eventType, true, true);
  event.relatedTarget = relatedTarget;
  return event;
};

/**
 *  Indicates whether a node is in some other node's subtree.
 *
 *  @param {Node} childNode The alleged child node.
 *  @param {Node} allegedParentNode The alleged parent node.
 *
 *  @returns {bool} Whether <code>childNode</code> is a child of <code>allegedParentNode</code>.
 */
TKUtils.isNodeChildOfOtherNode = function (childNode, allegedParentNode) {
  var node = childNode.parentNode;
  while (node !== null) {
    if (node === allegedParentNode) {
      return true;
      break;
    }
    node = node.parentNode;
  }
  return false;
};

TKUtils.setupDisplayNames(TKUtils, 'TKUtils');

/* ==================== TKRect ==================== */

/**
 *  The top left corner of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectTopLeftCorner = 0;
/**
 *  The middle point on the top edge of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectMiddleOfTopEdge = 1;
/**
 *  The top right corner of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectTopRightCorner = 2;
/**
 *  The middle point on the right edge of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectMiddleOfRightEdge = 3;
/**
 *  The bottom right corner of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectBottomRightCorner = 4;
/**
 *  The middle point on the bottom edge of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectMiddleOfBottomEdge = 5;
/**
 *  The bottom left corner of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectBottomLeftCorner = 6;
/**
 *  The middle point on the left edge of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectMiddleOfLeftEdge = 7;
/**
 *  The center of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectCenter = 8;
/**
 *  The top edge of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectTopEdge = 9;
/**
 *  The right edge of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectRightEdge = 10;
/**
 *  The bottom edge of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectBottomEdge = 11;
/**
 *  The left edge of a rectangle.
 *  @constant
 *  @type int
 *  @private
 */
const TKRectLeftEdge = 12;

/**
 *  @class
 *
 *  <p>The <code>TKRect</code> provides some utilities to deal with a rectangle data type, allowing to obtain coordinates of the rectangle's points
 *  of interest as {@link TKPoint} objects and its edges as {@link TKSegment} objects, or obtaining a rectangle resulting in the union of several others.</p>
 *
 *  @since TuneKit 1.0
 *
 *  @param {float} x The x coordinate.
 *  @param {float} y The y coordinate.
 *  @param {float} width The width.
 *  @param {float} height The height.
 */
function TKRect (x, y, width, height) {
  /**
   *  The x coordinate.
   *  @type float
   */
  this.x = x || 0;
  /**
   *  The y coordinate.
   *  @type float
   */
  this.y = y || 0;
  /**
   *  The width.
   *  @type float
   */
  this.width = width || 0;
  /**
   *  The height.
   *  @type float
   */
  this.height = height || 0;
};

/**
 *  @private
 *  Provides the coordinates of a given point of interest.
 *
 *  @param {int} index The point of interest.
 *
 *  @returns {TKPoint} The point at the given point of interest.
 */
TKRect.prototype.pointAtPosition = function (index) {
  var point;
  if (index == TKRectTopLeftCorner) {
    point = new TKPoint(this.x, this.y);
  }
  else if (index == TKRectMiddleOfTopEdge) {
    point = new TKPoint(this.x + this.width / 2, this.y);
  }
  else if (index == TKRectTopRightCorner) {
    point = new TKPoint(this.x + this.width, this.y);
  }
  else if (index == TKRectMiddleOfRightEdge) {
    point = new TKPoint(this.x + this.width, this.y + this.height / 2);
  }
  else if (index == TKRectBottomRightCorner) {
    point = new TKPoint(this.x + this.width, this.y + this.height);
  }
  else if (index == TKRectMiddleOfBottomEdge) {
    point = new TKPoint(this.x + this.width / 2, this.y + this.height);
  }
  else if (index == TKRectBottomLeftCorner) {
    point = new TKPoint(this.x, this.y + this.height);
  }
  else if (index == TKRectMiddleOfLeftEdge) {
    point = new TKPoint(this.x, this.y + this.height / 2);
  }
  else if (index == TKRectCenter) {
    point = new TKPoint(this.x + this.width / 2, this.y + this.height / 2);
  }
  return point;
};

/**
 *  @private
 *  Provides the segment for a given edge.
 *
 *  @param {int} index The edge.
 *
 *  @returns {TKSegment} The segment for the given edge.
 */
TKRect.prototype.edge = function (index) {
  var edge;
  if (index == TKRectTopEdge) {
    edge = new TKSegment(this.pointAtPosition(TKRectTopLeftCorner), this.pointAtPosition(TKRectTopRightCorner));
  }
  else if (index == TKRectRightEdge) {
    edge = new TKSegment(this.pointAtPosition(TKRectTopRightCorner), this.pointAtPosition(TKRectBottomRightCorner));
  }
  else if (index == TKRectBottomEdge) {
    edge = new TKSegment(this.pointAtPosition(TKRectBottomLeftCorner), this.pointAtPosition(TKRectBottomRightCorner));
  }
  else if (index == TKRectLeftEdge) {
    edge = new TKSegment(this.pointAtPosition(TKRectTopLeftCorner), this.pointAtPosition(TKRectBottomLeftCorner));
  }
  return edge;
};

/**
 *  Returns a {@link TKRect} from a rectangle returned by the <code>Node.getBoundingClientRect</code> method.
 *
 *  @param {ClientRect} rect The CSS client rectangle.
 *
 *  @returns {TKRect} The equivalent rectangle as a TuneKit data type.
 */
TKRect.rectFromClientRect = function (rect) {
  return new TKRect(rect.left, rect.top, rect.width, rect.height);
};

/**
 *  @private
 *  Returns a {@link TKRect} encompassing the union of a list of other rectangles.
 *
 *  @param {Array} rects The various rectangles we'd like the union of.
 *
 *  @returns {TKRect} The rectangle encompassing the union of a list of the provided rectangles.
 */
TKRect.rectFromUnionOfRects = function (rects) {
  if (rects.length < 1) {
    return new TKRect();
  }
  var union = rects[0];
  var rect;
  for (var i = 1; i < rects.length; i++) {
    rect = rects[i];
    union.x = Math.min(union.x, rect.x);
    union.y = Math.min(union.y, rect.y);
    union.width = Math.max(union.width, rect.x + rect.width);
    union.height = Math.max(union.height, rect.y + rect.height);
  }
  return union;
};

/* ==================== TKPoint ==================== */

/**
 *  @private
 *  @class
 *
 *  <p>The <code>TKPoint</code> provides a TuneKit data type to deal with points in 2D space and some utilities to work with them, such as figuring out
 *  the distance between two points.</p>
 *
 *  @since TuneKit 1.0
 *
 *  @param {float} x The x coordinate.
 *  @param {float} y The y coordinate.
 */
function TKPoint (x, y) {
  /**
   *  The x coordinate.
   *  @type float
   */
  this.x = x || 0;
  /**
   *  The y coordinate.
   *  @type float
   */
  this.y = y || 0;
};

/**
 *  Provides the distance between this point and another.
 *
 *  @param {TKPoint} aPoint The point to which we'd like to figure out the distance.
 *
 *  @returns {float} The distance between the receiver the provided point.
 */
TKPoint.prototype.distanceToPoint = function (aPoint) {
  return Math.sqrt(Math.pow(aPoint.x - this.x, 2) + Math.pow(aPoint.y - this.y, 2));
};

/* ==================== TKSegment ==================== */

/**
 *  @class
 *  @private
 *
 *  <p>The <code>TKSegment</code> provides a TuneKit data type to deal with segments in 2D space and some utilities to work with them, such as figuring out
 *  the shortest distance between a segment and a point.</p>
 *
 *  @since TuneKit 1.0
 *
 *  @param {TKPoint} a The first extremity of the segment.
 *  @param {TKPoint} b The other extremity of the segment.
 */
function TKSegment (a, b) {
  /**
   *  The first extremity of the segment.
   *  @type TKPoint
   */
  this.a = a;
  /**
   *  The other extremity of the segment.
   *  @type TKPoint
   */
  this.b = b;
  this.ab = new TKPoint(b.x - a.x, b.y - a.y);
  /**
   *  The segment's length.
   *  @type float
   */
  this.length = b.distanceToPoint(a);
};

// XXX: this only deals with horizontal and vertical lines
TKSegment.prototype.crossPoint = function (c) {
  return (this.a.y == this.b.y) ? new TKPoint(c.x, this.a.y) : new TKPoint(this.a.x, c.y);
};

/**
 *  Computes the shortest distance between this segment and the given point.
 *
 *  @param {TKPoint} aPoint
 *
 *  @returns {float} The shortest distance between this segment and the given point.
 */
TKSegment.prototype.distanceToPoint = function (aPoint) {
  var d;
  var cross_point = this.crossPoint(aPoint);
  // is it inside the segment?
  if (cross_point.distanceToPoint(this.a) + cross_point.distanceToPoint(this.b) == this.length) {
    d = aPoint.distanceToPoint(cross_point);
  }
  else {
    d = Math.min(aPoint.distanceToPoint(this.a), aPoint.distanceToPoint(this.b));
  }
  return d;
};

/* ================= Debugging ======================== */

var DEBUG = false;

function debug(msg) {
  if (window.DEBUG !== undefined && window.DEBUG) {
    console.log("DEBUG: " + msg);
  }
};
