/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

// ---------------------------------------------------
// A menu grid implementation
// ---------------------------------------------------

// data source method names
const TKGridViewNumberOfElements = 'gridViewNumberOfElements';
const TKGridViewElementAtIndex = 'gridViewElementAtIndex';
const TKGridViewHighlightElement = 'gridViewHighlightElement';

// delegate method names
const TKGridViewDidFocusElementAtIndex = 'gridViewDidFocusElementAtIndex';
const TKGridViewDidBlurElementAtIndex = 'gridViewDidBlurElementAtIndex';

// css protocol
const TKGridViewCSSClass = 'grid-view';
const TKGridViewCSSContainerClass = 'grid-view-container';
const TKGridViewCSSElementClass = 'grid-view-element';
const TKGridViewCSSHighlightClass = 'grid-view-highlight-element';
const TKGridViewCSSFocusedClass = 'grid-view-element-focused';

// fill order
// This defines the way the elements are inserted into the grid, and
// also the direction in which they will overflow
const TKGridViewFillOrderColumnFirst = 'gridViewFillOrderColumnFirst';
const TKGridViewFillOrderRowFirst = 'gridViewFillOrderRowFirst';

TKGridView.synthetizes = ['dataSource', 'delegate',
                          'activeElementIndex', 
                          'numRows', 'numColumns',
                          'elementWidth', 'elementHeight',
                          'visibleRows', 'visibleColumns',
                          'drawHighlightAbove', 'fillOrder'];

function TKGridView (element) {
  this.callSuper();
  //
  this._numRows = 0;
  this._numColumns = 0;
  // these defaults look ok for 4x2 elements 180 square
  this._elementWidth = 200;
  this._elementHeight = 200;
  this._visibleRows = 2;
  this._visibleColumns = 2;
  this._drawHighlightAbove = true;
  this._activeElementIndex = 0;
  this._fillOrder = TKGridViewFillOrderColumnFirst;
  
  this.currentTopRow = 0;
  this.currentRow = 0;
  this.currentLeftColumn = 0;
  this.currentColumn = 0;
  
  if (element) {
    this.element = element;
  } else {
    // create the element we'll use as a container
    this.element = document.createElement("div");
  }
  this.element.addClassName(TKGridViewCSSClass);
}

TKGridView.prototype.init = function () {

  if (!this.dataSource ||
      !TKUtils.objectHasMethod(this.dataSource, TKGridViewNumberOfElements) ||
      !TKUtils.objectHasMethod(this.dataSource, TKGridViewElementAtIndex)) {
    return;
  }

  // create the grid container
  this.gridContainer = document.createElement("div");
  this.gridContainer.addClassName(TKGridViewCSSContainerClass);
  this.element.appendChild(this.gridContainer);

  var numElements = this.dataSource[TKGridViewNumberOfElements](this);

  for (var i=0; i < numElements; i++) {
    var el = this.dataSource[TKGridViewElementAtIndex](this, i);
    el.addClassName(TKGridViewCSSElementClass);
    this.gridContainer.appendChild(el);
  }
  
  // FIXME: this will fail later. Need to clean it up.
  if (TKUtils.objectHasMethod(this.dataSource, TKGridViewHighlightElement)) {
    // add the highlight (last, so it shows above other things)
    el = this.dataSource[TKGridViewHighlightElement](this);
    el.addClassName(TKGridViewCSSHighlightClass);
    if (this._drawHighlightAbove) {
      this.element.appendChild(el);
    } else {
      this.element.insertBefore(el, this.element.firstChild);
    }
  }
  
  this.layout();
};

TKGridView.prototype.setNumRows = function (newNumRows) {
  this._numRows = newNumRows;
  this.layout();
};

TKGridView.prototype.setNumColumns = function (newNumColumns) {
  this._numColumns = newNumColumns;
  this.layout();
};

TKGridView.prototype.setElementWidth = function (newElementWidth) {
  this._elementWidth = newElementWidth;
  this.layout();
};

TKGridView.prototype.setElementHeight = function (newElementHeight) {
  this._elementHeight = newElementHeight;
  this.layout();
};

TKGridView.prototype.setActiveElementIndex = function (newActiveElementIndex) {
  
  if (newActiveElementIndex >= 0 &&
      newActiveElementIndex < this.dataSource[TKGridViewNumberOfElements](this) &&
      newActiveElementIndex != this._activeElementIndex) {

    // call delegate to inform blur of current active element
    if (TKUtils.objectHasMethod(this.delegate, TKGridViewDidBlurElementAtIndex)) {
      this.delegate[TKGridViewDidBlurElementAtIndex](this, this._activeElementIndex);
    }

    // remove focused class from current active element
    var activeElement = this.dataSource[TKGridViewElementAtIndex](this, this._activeElementIndex);
    activeElement.removeClassName(TKGridViewCSSFocusedClass);
    
    this._activeElementIndex = newActiveElementIndex;
    
    // call delegate to inform focus of new active element
    if (TKUtils.objectHasMethod(this.delegate, TKGridViewDidFocusElementAtIndex)) {
      this.delegate[TKGridViewDidFocusElementAtIndex](this, this._activeElementIndex);
    }

    // add focused class to new active element
    activeElement = this.dataSource[TKGridViewElementAtIndex](this, this._activeElementIndex);
    activeElement.addClassName(TKGridViewCSSFocusedClass);

    this.positionContainer();
    this.positionHighlight();
  }
};

TKGridView.prototype.moveLeft = function () {
  if (this.canMoveLeft()) {
    if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
      this.activeElementIndex--;
    } else {
      this.activeElementIndex -= this.numRows;
    }
  }
};

TKGridView.prototype.canMoveLeft = function () {
  if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
    return (this._activeElementIndex > 0 &&
            this._activeElementIndex % this._numColumns != 0);
  } else {
    return (this._activeElementIndex >= this._numRows);
  }
};

TKGridView.prototype.moveRight = function () {
  if (this.canMoveRight()) {
    if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
      this.activeElementIndex++;
    } else {
      this.activeElementIndex += this.numRows;
    }
  }
};

TKGridView.prototype.canMoveRight = function () {
  if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
    return (this._activeElementIndex < (this.dataSource[TKGridViewNumberOfElements](this) - 1) &&
            this._activeElementIndex % this._numColumns != (this._numColumns - 1));
  } else {
    return (this._activeElementIndex < (this.dataSource[TKGridViewNumberOfElements](this) - this._numRows));
  }
};

TKGridView.prototype.moveUp = function () {
  if (this.canMoveUp()) {
    if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
      this.activeElementIndex -= this.numColumns;
    } else {
      this.activeElementIndex--;
    }
  }
};

TKGridView.prototype.canMoveUp = function () {
  if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
    return (this._activeElementIndex >= this._numColumns);
  } else {
    return (this._activeElementIndex > 0 &&
            this._activeElementIndex % this._numRows != 0);
  }
};

TKGridView.prototype.moveDown = function () {
  if (this.canMoveDown()) {
    if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
      this.activeElementIndex += this.numColumns;
    } else {
      this.activeElementIndex++;
    }
  }
};

TKGridView.prototype.canMoveDown = function () {
  if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
    return (this._activeElementIndex < (this.dataSource[TKGridViewNumberOfElements](this) - this._numColumns));
  } else {
    return (this._activeElementIndex < (this.dataSource[TKGridViewNumberOfElements](this) - 1) &&
            this._activeElementIndex % this._numRows != (this._numRows - 1));
  }
};

TKGridView.prototype.layout = function () {
  this.positionCells();
  this.positionContainer();
  this.positionHighlight();
};

TKGridView.prototype.positionCells = function () {
  if (!this.dataSource) {
    return;
  }
  
  var numElements = this.dataSource[TKGridViewNumberOfElements](this);

  for (var i=0; i < numElements; i++) {
    var x = this.gridXForElement(i);
    var y = this.gridYForElement(i);
    this.dataSource[TKGridViewElementAtIndex](this, i).style.webkitTransform = "translate(" + x + "px, " + y + "px)";
  }
};

TKGridView.prototype.positionContainer = function () {
  // if the highlight is outside the current viewable selection
  // then adjust the position of the internal container (ie. scroll)
  var offsetX = 0;
  var offsetY = 0;

  if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
    this.currentColumn = this._activeElementIndex % this._numColumns;
    this.currentRow = Math.floor(this._activeElementIndex / this._numColumns);
    if (this.currentTopRow <= (this.currentRow - this._visibleRows)) {
      this.currentTopRow = this.currentRow - this._visibleRows + 1;
    } else if (this.currentTopRow > this.currentRow) {
      this.currentTopRow = this.currentRow;
    }
    offsetY = this.currentTopRow * this._elementHeight;
  } else {
    this.currentColumn = Math.floor(this._activeElementIndex / this._numRows);
    this.currentRow = this._activeElementIndex % this._numRows;
    if (this.currentLeftColumn <= (this.currentColumn - this._visibleColumns)) {
      this.currentLeftColumn = this.currentColumn - this._visibleColumns + 1;
    } else if (this.currentLeftColumn > this.currentColumn) {
      this.currentLeftColumn = this.currentColumn;
    }
    offsetX = this.currentLeftColumn * this._elementWidth;
  }
  if (this.gridContainer) {
    this.gridContainer.style.webkitTransform = "translate(-" + offsetX + "px, -" + offsetY + "px)";
  }
};

TKGridView.prototype.positionHighlight = function () {
  if (!this.dataSource) {
    return;
  }
  
  var x;
  var y;

  if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
    x = this.gridXForElement(this._activeElementIndex);
    y = (Math.floor(this._activeElementIndex / this._numColumns) - this.currentTopRow) * this._elementHeight;
  } else {
    x = (Math.floor(this._activeElementIndex / this._numRows) - this.currentLeftColumn) * this._elementWidth;
    y = this.gridYForElement(this._activeElementIndex);
  }

  this.dataSource[TKGridViewHighlightElement](this).style.webkitTransform = "translate(" + x + "px, " + y + "px)";
};

TKGridView.prototype.gridXForElement = function (index) {
  if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
    return (index % this._numColumns) * this._elementWidth;
  } else {
    return Math.floor(index / this._numRows) * this._elementWidth;
  }
};

TKGridView.prototype.gridYForElement = function (index) {
  if (this._fillOrder == TKGridViewFillOrderColumnFirst) {
    return Math.floor(index / this._numColumns) * this._elementHeight;
  } else {
    return (index % this._numRows) * this._elementHeight;
  }
};

TKClass(TKGridView);

/* ====================== Datasource helper ====================== */

function TKGridViewDataSourceHelper(data, highlightData) {
  this.data = data;
  this.highlightData = highlightData;
  this.elements = [];
  this.highlight = null;
};

TKGridViewDataSourceHelper.prototype.gridViewNumberOfElements = function(view) {
  if (this.data) {
    return this.data.length;
  } else {
    return 0;
  }
};

TKGridViewDataSourceHelper.prototype.gridViewElementAtIndex = function(view, index) {
  if (!this.data || index >= this.data.length) {
    return null;
  }
  if (!this.elements[index]) {
    var source = this.data[index];
    var element = TKUtils.buildElement(source);
    this.elements[index] = element;
  }
  return this.elements[index];
};

TKGridViewDataSourceHelper.prototype.gridViewHighlightElement = function(view) {
  if (!this.highlightData) {
    return null;
  }
  if (!this.highlight) {
    var element = TKUtils.buildElement(this.highlightData);
    this.highlight = element;
  }
  return this.highlight;
};

/* ====================== Declarative helper ====================== */

TKGridView.buildGridView = function(element, data) {
  if (TKUtils.objectIsUndefined(data) || !data || data.type != "TKGridView") {
    return null;
  }

  var gridView = new TKGridView(element);

  if (!TKUtils.objectIsUndefined(data.elements)) {
    gridView.dataSource = new TKGridViewDataSourceHelper(data.elements, data.highlight);
  }

  TKGridView.synthetizes.forEach(function(prop) {
    if (prop != "dataSource" && prop != "delegate") {
      if (!TKUtils.objectIsUndefined(data[prop])) {
        gridView[prop] = data[prop];
      }
    }
  });

  return gridView;
};

