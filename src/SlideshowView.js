/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

// ---------------------------------------------------
// A crossfading slideshow view
// ---------------------------------------------------

// data source method names
const TKSlideshowViewNumberOfElements = 'slideshowViewNumberOfElements';
const TKSlideshowViewElementAtIndex = 'slideshowViewElementAtIndex';

const TKSlideshowViewDidShowElementAtIndex = 'slideshowViewDidFocusElementAtIndex';
const TKSlideshowViewDidHideElementAtIndex = 'slideshowViewDidHideElementAtIndex'; // TODO: XXX

// css protocol
const TKSlideshowViewCSSContainerClass = 'slideshow-view';
const TKSlideshowViewCSSElementClass = 'slideshow-view-element';

TKSlideshowView.synthetizes = ['dataSource',
                               'delegate',
                               'activeElementIndex', // the index of the currently displayed element
                               'duration', // time between automatic advance, in ms
                               'fadeDuration', // the time each crossfade will take, in ms
                               'numberOfElements'];

function TKSlideshowView (element) {
  this.callSuper();
  this._activeElementIndex = null;
  this._duration = 3000;
  this._fadeDuration = 1000;
  this._playing = false;
  
  if (element) {
    this.container = element;
  } else {
    // create the element we'll use as a container
    this.container = document.createElement("div");
  }
  this.container.addClassName(TKSlideshowViewCSSContainerClass);
  
  this.currentElement = null;
}

TKSlideshowView.prototype.init = function () {

  if (!this.dataSource ||
      !TKUtils.objectHasMethod(this.dataSource, TKSlideshowViewNumberOfElements) ||
      !TKUtils.objectHasMethod(this.dataSource, TKSlideshowViewElementAtIndex)) {
    return;
  }
  
  this.showElement();
};

TKSlideshowView.prototype.setActiveElementIndex = function (newActiveElementIndex) {
  
  if (newActiveElementIndex >= 0 &&
      newActiveElementIndex < this.numberOfElements &&
      newActiveElementIndex != this._activeElementIndex) {

    // return early if this is the first time we've been set/initialised
    if (this._activeElementIndex === null) {
      this._activeElementIndex = newActiveElementIndex;
      return;
    }

    // call delegate to inform hide of current active element
    if (TKUtils.objectHasMethod(this.delegate, TKSlideshowViewDidHideElementAtIndex)) {
      this.delegate[TKSlideshowViewDidHideElementAtIndex](this, this._activeElementIndex);
    }
    
    this._activeElementIndex = newActiveElementIndex;

    this.showElement();
  }
};

TKSlideshowView.prototype.getNumberOfElements = function () {
  this._numberOfElements = this.dataSource[TKSlideshowViewNumberOfElements](this);
  return this._numberOfElements;
};

TKSlideshowView.prototype.advance = function () {
  if (this._playing) {
    if (this.activeElementIndex < this.numberOfElements - 1) {
      this.activeElementIndex++;
    } else {
      this.activeElementIndex = 0;
    }
    var _this = this;
    setTimeout(function() {
      _this.advance();
    }, this._duration);
  }
};

TKSlideshowView.prototype.play = function () {
  if (!this._playing) {
    this._playing = true;
    var _this = this;
    setTimeout(function() {
      _this.advance();
    }, this._duration);
  }
};

TKSlideshowView.prototype.pause = function () {
  this._playing = false;
};

TKSlideshowView.prototype.reset = function () {
  this._playing = false;
  this.currentElement = null;
};

TKSlideshowView.prototype.showElement = function () {

  var oldElement = this.currentElement;
  
  var el = this.dataSource[TKSlideshowViewElementAtIndex](this, this._activeElementIndex);
  el.addClassName(TKSlideshowViewCSSElementClass);
  el.style.webkitTransitionProperty = "opacity";
  el.style.webkitTransitionDuration = this._fadeDuration + "ms";
  el.style.opacity = 0;
  
  if (oldElement) {
    this.container.insertBefore(el, oldElement);
  } else {
    this.container.appendChild(el);
  }

  // call delegate to inform show of new active element
  if (TKUtils.objectHasMethod(this.delegate, TKSlideshowViewDidShowElementAtIndex)) {
    this.delegate[TKSlideshowViewDidShowElementAtIndex](this, this._activeElementIndex);
  }

  this.currentElement = el;

  var _this = this;
  setTimeout(function() {
    el.style.opacity = 1;
    if (oldElement) {
      // make sure the old element becomes inactive to clicks (it is on top)
      // FIXME: maybe the user wants it to be active - this should be done via a css class
      oldElement.style.pointerEvents = "none";
      oldElement.style.opacity = 0;
      setTimeout(function() {
        // An external controller might have removed the child by now. Check.
        if (_this.container && _this.container.hasChild(oldElement)) {
          _this.container.removeChild(oldElement);
        }
      }, (_this.fadeDuration + 10));
    }
  }, 0);
};


TKClass(TKSlideshowView);

/* ====================== Datasource helper ====================== */

function TKSlideshowViewDataSourceHelper(data) {
  this.data = data;
};

TKSlideshowViewDataSourceHelper.prototype.slideshowViewNumberOfElements = function(view) {
  if (this.data) {
    return this.data.length;
  } else {
    return 0;
  }
};

TKSlideshowViewDataSourceHelper.prototype.slideshowViewElementAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  var source = this.data[index];
  var element = TKUtils.buildElement(source);
  return element;
};

/* ====================== Declarative helper ====================== */

TKSlideshowView.buildSlideshowView = function(element, data) {
  if (TKUtils.objectIsUndefined(data) || !data || data.type != "TKSlideshowView") {
    return null;
  }

  var slideshowView = new TKSlideshowView(element);

  if (!TKUtils.objectIsUndefined(data.elements)) {
    slideshowView.dataSource = new TKSlideshowViewDataSourceHelper(data.elements);
  }

  TKSlideshowView.synthetizes.forEach(function(prop) {
    if (prop != "dataSource" && prop != "delegate") {
      if (!TKUtils.objectIsUndefined(data[prop])) {
        slideshowView[prop] = data[prop];
      }
    }
  });

  return slideshowView;
};

