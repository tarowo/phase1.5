/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

// ---------------------------------------------------
// A two dimensional view with absolutely positioned elements
// ---------------------------------------------------

// data source method names
const TKComicViewNumberOfPanels = 'comicViewNumberOfPanels';
const TKComicViewPanelPositionAtIndex = 'comicViewPanelPositionAtIndex';  // expects {x: y:} to be returned
const TKComicViewPanelScaleAtIndex = 'comicViewPanelScaleAtIndex';  // expects a float returned

const TKComicViewPanelImageAtIndex = 'comicViewPanelImageAtIndex';
const TKComicViewPanelImagePositionAtIndex = 'comicViewPanelImagePositionAtIndex';  // expects {x: y:} to be returned

const TKComicViewPanelBubbleAtIndex = 'comicViewPanelBubbleAtIndex';
const TKComicViewPanelBubblePositionAtIndex = 'comicViewPanelBubblePositionAtIndex';  // expects {x: y:} to be returned

// delegate method names
const TKComicViewDidShowPanelAtIndex = 'comicViewDidShowPanelAtIndex';

// css protocol
const TKComicViewCSSRootClass = 'comic-view';
const TKComicViewCSSContainerClass = 'comic-view-container';
const TKComicViewCSSPanelClass = 'comic-view-panel';

const TKComicViewCSSPanelImageClass = 'comic-view-panel-image';
const TKComicViewCSSPanelBubbleClass = 'comic-view-panel-bubble';

const TKComicViewCSSCurrentClass = 'comic-view-panel-current';
const TKComicViewCSSNextClass = 'comic-view-panel-next';
const TKComicViewCSSPreviousClass = 'comic-view-panel-previous';

TKComicView.synthetizes = ['dataSource',
                           'delegate',
                           'currentPanelIndex',
                           'nextPanelOpacity',  // float [0,1]
                           'previousPanelOpacity', // float [0,1]
                           'transitionDuration', // in milliseconds
                           'numberOfPanels'];

function TKComicView (element) {
  this.callSuper();
  this._currentPanelIndex = 0;
  this._nextPanelOpacity = 0.5;
  this._previousPanelOpacity = 0.5;
  this._transitionDuration = 500;
  
  if (element) {
    this.element = element;
  } else {
    // create the element we'll use as root
    this.element = document.createElement("div");
  }
  this.element.addClassName(TKComicViewCSSRootClass);
  
  // create the positioner
  this.container = document.createElement("div");
  this.container.style.webkitTransitionProperty = "-webkit-transform";
  this.container.style.webkitTransitionDuration = this._transitionDuration + "ms";
  this.container.addClassName(TKComicViewCSSContainerClass);
  this.element.appendChild(this.container);
  
  this.currentPanel = null;
  this.nextPanel = null;
  this.previousPanel = null;
}

TKComicView.prototype.init = function () {

  if (!this.dataSource ||
      !TKUtils.objectHasMethod(this.dataSource, TKComicViewNumberOfPanels) ||
      !TKUtils.objectHasMethod(this.dataSource, TKComicViewPanelPositionAtIndex) ||
      !TKUtils.objectHasMethod(this.dataSource, TKComicViewPanelScaleAtIndex) ||
      !TKUtils.objectHasMethod(this.dataSource, TKComicViewPanelImageAtIndex) ||
      !TKUtils.objectHasMethod(this.dataSource, TKComicViewPanelImagePositionAtIndex) ||
      !TKUtils.objectHasMethod(this.dataSource, TKComicViewPanelBubbleAtIndex) ||
      !TKUtils.objectHasMethod(this.dataSource, TKComicViewPanelBubblePositionAtIndex)) {
    debug("TKComicView: dataSource does not exist or does not have correct methods");
    return;
  }

  this.moveToPanel(this._currentPanelIndex);
};

TKComicView.prototype.setTransitionDuration = function (newTransitionDuration) {
  this._transitionDuration = newTransitionDuration;
  if (this.container) {
    this.container.style.webkitTransitionDuration = this._transitionDuration + "ms";
  }
};

TKComicView.prototype.getNumberOfPanels = function () {
  return this.dataSource[TKComicViewNumberOfPanels](this);
};

TKComicView.prototype.showNextPanel = function () {
  if (this._currentPanelIndex < this.numberOfPanels - 1) {
    this.moveToPanel(this._currentPanelIndex + 1);
  }
};

TKComicView.prototype.showPreviousPanel = function () {
  if (this._currentPanelIndex > 0) {
    this.moveToPanel(this._currentPanelIndex - 1);
  }
};

TKComicView.prototype.loadPanel = function (index) {
  var newPanel = document.createElement("div");
  newPanel.addClassName(TKComicViewCSSPanelClass);
  
  newPanel.style.webkitTransitionProperty = "opacity";
  newPanel.style.webkitTransitionDuration = this._transitionDuration + "ms";
  newPanel.style.opacity = 0;

  var image = this.dataSource[TKComicViewPanelImageAtIndex](this, index);
  image.addClassName(TKComicViewCSSPanelImageClass);
  var position = this.dataSource[TKComicViewPanelImagePositionAtIndex](this, index);
  var translate = "translate(" + position.x + "px, " + position.y + "px)";
  image.style.webkitTransform = translate;
  newPanel.appendChild(image);

  var bubble = this.dataSource[TKComicViewPanelBubbleAtIndex](this, index);
  if (bubble) {
    bubble.addClassName(TKComicViewCSSPanelBubbleClass);
    position = this.dataSource[TKComicViewPanelBubblePositionAtIndex](this, index);
    translate = "translate(" + position.x + "px, " + position.y + "px)";
    bubble.style.webkitTransform = translate;
    newPanel.appendChild(bubble);
  }
  
  return newPanel;
};

TKComicView.prototype.moveToPanel = function (index) {
  // we assume we're only going one step in each direction for now

  var _this = this;
  var forwards = (index >= this._currentPanelIndex);
  var outgoingPanel = this.previousPanel;
  var incomingPanel = this.nextPanel;
  var nextPanelIndexToLoad = index + 1;
  
  if (!forwards) {
    outgoingPanel = this.nextPanel;
    incomingPanel = this.previousPanel;
    nextPanelIndexToLoad = index - 1;
  }
  
  // Step 1. Tell the outgoing panel to fade out. Remove it from the document
  // after it has faded
  if (outgoingPanel) {
    outgoingPanel.style.opacity = 0;
    setTimeout(function() {
      _this.container.removeChild(outgoingPanel);
    }, this._transitionDuration + 20);
  }
  
  // Step 2. Remove the incoming panel from the container (we add it again later)
  if (incomingPanel) {
    this.container.removeChild(incomingPanel);
  }

  // Step 3. Load in the new panel, and insert it at the end of the container
  // with the "next" class and opacity
  var newPanel = this.loadPanel(index);
  newPanel.style.opacity = this._nextPanelOpacity;
  this.container.appendChild(newPanel);

  // Step 3. Tell the current panel to become either "previous" or "next" panel
  if (this.currentPanel) {
    this.currentPanel.style.opacity = forwards ? this._previousPanelOpacity : this._nextPanelOpacity;
  }
  
  // Step 4. Load in the new next panel, and insert it at the start of the container
  var nextPanel = null;
  if (nextPanelIndexToLoad >= 0 && nextPanelIndexToLoad <= this.numberOfPanels - 1) {
    nextPanel = this.loadPanel(nextPanelIndexToLoad);
    this.container.insertBefore(nextPanel, this.container.firstChild);
  }

  // Step 5. Tell the new current panel to fade in completely, and the new next
  // panel to fade up.
  // This needs to be done on a timeout, since we just added it to the document
  setTimeout(function() {
    newPanel.style.opacity = 1;
    if (nextPanel) {
      nextPanel.style.opacity = forwards ? _this.nextPanelOpacity : _this.previousPanelOpacity;
    }
  }, 0);

  // Step 6. Assign all the right references
  if (forwards) {
    this.previousPanel = this.currentPanel;
    this.nextPanel = nextPanel;
  } else {
    this.previousPanel = nextPanel;
    this.nextPanel = this.currentPanel;
  }
  this.currentPanel = newPanel;
  this._currentPanelIndex = index;
  
  // Step 7. Assign classes to elements
  this.applyClass(this.currentPanel, TKComicViewCSSCurrentClass);
  this.applyClass(this.previousPanel, TKComicViewCSSPreviousClass);
  this.applyClass(this.nextPanel, TKComicViewCSSNextClass);
  
  // Step 8. Position the container
  var position = this.dataSource[TKComicViewPanelPositionAtIndex](this, index);
  var scale = this.dataSource[TKComicViewPanelScaleAtIndex](this, index);
  var transform = " scale(" + scale + ") translate(" + (-1 * position.x) + "px, " + (-1 * position.y) + "px)";
  this.container.style.webkitTransform = transform;
  
  // Step 9. Tell the delegate we moved
  if (TKUtils.objectHasMethod(this.delegate, TKComicViewDidShowPanelAtIndex)) {
    this.delegate[TKComicViewDidShowPanelAtIndex](this, index);
  }
};

TKComicView.prototype.applyClass = function (element, className) {
  if (element) {
    element.removeClassName(TKComicViewCSSCurrentClass);
    element.removeClassName(TKComicViewCSSPreviousClass);
    element.removeClassName(TKComicViewCSSNextClass);
    element.addClassName(className);
  }
};

TKClass(TKComicView);

/* ====================== Datasource helper ====================== */

function TKComicViewDataSourceHelper(data) {
  this.data = data;
};

TKComicViewDataSourceHelper.prototype.comicViewNumberOfPanels = function(view) {
  if (this.data) {
    return this.data.length;
  } else {
    return 0;
  }
};

TKComicViewDataSourceHelper.prototype.comicViewPanelPositionAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  var source = this.data[index];
  return { 
    x: TKUtils.objectIsUndefined(source.x) ? 0 : source.x,
    y: TKUtils.objectIsUndefined(source.y) ? 0 : source.y
  };
};

TKComicViewDataSourceHelper.prototype.comicViewPanelScaleAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  var source = this.data[index];
  return TKUtils.objectIsUndefined(source.scale) ? 1 : source.scale;
};


TKComicViewDataSourceHelper.prototype.comicViewPanelImageAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  var source = this.data[index];
  return TKUtils.buildElement(source.image);
};

TKComicViewDataSourceHelper.prototype.comicViewPanelImagePositionAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  var source = this.data[index];
  return { 
    x: TKUtils.objectIsUndefined(source.image.x) ? 0 : source.image.x,
    y: TKUtils.objectIsUndefined(source.image.y) ? 0 : source.image.y
  };
};

TKComicViewDataSourceHelper.prototype.comicViewPanelBubbleAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  var source = this.data[index];
  if (source.bubble) {
    return TKUtils.buildElement(source.bubble);
  } else {
    return null;
  }
};

TKComicViewDataSourceHelper.prototype.comicViewPanelBubblePositionAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  var source = this.data[index];
  if (source.bubble) {
    return { 
      x: TKUtils.objectIsUndefined(source.bubble.x) ? 0 : source.bubble.x,
      y: TKUtils.objectIsUndefined(source.bubble.y) ? 0 : source.bubble.y
    };
  } else {
    return { x: 0, y: 0};
  }
};

/* ====================== Declarative helper ====================== */

TKComicView.buildComicView = function(element, data) {
  if (TKUtils.objectIsUndefined(data) || !data || data.type != "TKComicView") {
    return null;
  }

  var comicView = new TKComicView(element);

  if (!TKUtils.objectIsUndefined(data.elements)) {
    comicView.dataSource = new TKComicViewDataSourceHelper(data.elements);
  }

  TKComicView.synthetizes.forEach(function(prop) {
    if (prop != "dataSource" && prop != "delegate") {
      if (!TKUtils.objectIsUndefined(data[prop])) {
        comicView[prop] = data[prop];
      }
    }
  });

  return comicView;
};

