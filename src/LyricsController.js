/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

TKLyricsController.inherits = TKController;
TKLyricsController.synthetizes = ['currentSong', 'previousSongButton', 'nextSongButton'];

/**
 *  @class
 *
 *  <p>A lyrics controller is designed to make it easy to flip through a collection of lyrics. This controller type automatically wires the left and
 *  right keys to navigate between songs, and the author should leverage the {@link TKController#scrollableElement} property to identify the container
 *  for the scrolling lyrics region. Loading of new song content should be done using the {@link #songDidChange} method.</p>
 *
 *  @extends TKController
 *  @since TuneKit 1.0
 *
 *  @param {Object} data A hash of properties to use as this object is initialized.
 */
function TKLyricsController (data) {
  /**
   *  The number of songs that the controller will be flipping through.
   *  @type int
   */
  this.numberOfSongs = 0;
  this.defaultToFirstSong = false;
  this._currentSong = null;
  this._previousSongButton = null;
  this._nextSongButton = null;
  //
  this.callSuper(data);
};

/* ==================== View Processing ==================== */

TKLyricsController.prototype.processView = function () {
  this.callSuper();
  // restore properties that have not been set yet since construction
  this.restoreProperty('previousSongButton');
  this.restoreProperty('nextSongButton');
  this.restoreProperty('currentSong');
  // default to first song
  if (this.defaultToFirstSong && this._currentSong === null) {
    this.currentSong = 0;
  }
};

/* ==================== Keyboard Navigation ==================== */

TKLyricsController.prototype.wantsToHandleKey = function (key) {
  return (key == KEYBOARD_LEFT || key == KEYBOARD_RIGHT) ? true : this.callSuper(key);
};

TKLyricsController.prototype.keyWasPressed = function (key) {
  // default action is move, so wire that up
  TKSpatialNavigationManager.soundToPlay = SOUND_MOVED;
  // left should go to the previous song
  if (key == KEYBOARD_LEFT) {
    this.goToPreviousSong();
  }
  // right should go to the next song
  else if (key == KEYBOARD_RIGHT) {
    this.goToNextSong();
  }
  // let the default behavior happen too
  this.callSuper(key);
};

/* ==================== Previous / Next Buttons ==================== */

/**
 *  @name TKLyricsController.prototype
 *  @property {String} previousSongButton The CSS selector for the element acting as the trigger to navigate to the previous song.
 */
TKLyricsController.prototype.setPreviousSongButton = function (previousSongButton) {
  if (previousSongButton === null || IS_APPLE_TV) {
    return;
  }
  // forget old button
  if (this._previousSongButton) {
    this.removeNavigableElement(this._previousSongButton);
  }
  // process new one
  if (previousSongButton !== null) {
    this._previousSongButton = this.view.querySelector(previousSongButton);
    if (this._previousSongButton !== null) {
      this.addNavigableElement(this._previousSongButton);
    }
  }
};

/**
 *  @name TKLyricsController.prototype
 *  @property {String} nextSongButton The CSS selector for the element acting as the trigger to navigate to the next song.
 */
TKLyricsController.prototype.setNextSongButton = function (nextSongButton) {
  if (nextSongButton === null || IS_APPLE_TV) {
    return;
  }
  // forget old button
  if (this._nextSongButton) {
    this.removeNavigableElement(this._nextSongButton);
  }
  // process new one
  if (nextSongButton !== null) {
    this._nextSongButton = this.view.querySelector(nextSongButton);
    if (this._nextSongButton !== null) {
      this.addNavigableElement(this._nextSongButton);
    }
  }
};

TKLyricsController.prototype.elementWasActivated = function (element) {
  // previous page button pressed
  if (element === this._previousSongButton) {
    this.goToPreviousSong();
  }
  // next page button pressed
  else if (element === this._nextSongButton) {
    this.goToNextSong();
  }
  // fall back to default behavior
  else {
    this.callSuper(element);
  }
};

/* ==================== Page Navigation ==================== */

/**
 *  Shows the previous song.
 */
TKLyricsController.prototype.goToPreviousSong = function () {
  this.currentSong = ((this._currentSong + this.numberOfSongs) - 1) % this.numberOfSongs;
};

/**
 *  Shows the next song.
 */
TKLyricsController.prototype.goToNextSong = function () {
  this.currentSong = (this._currentSong + 1) % this.numberOfSongs;
};

/**
 *  @name TKLyricsController.prototype
 *  @property {int} currentSong The index of the current song. Whenever this value changes, the {@link #songDidChange} method is called.
 */
TKLyricsController.prototype.setCurrentSong = function (song) {
  if (song === null || song < 0 || song >= this.numberOfSongs) {
    return;
  }
  // track what song we're on
  this._currentSong = song;
  // let our instance know that we've moved to a new song
  this.songDidChange(song);
};

/**
 *  Triggered when a new song is displayed by the controller.
 */
TKLyricsController.prototype.songDidChange = function (song) {};

/* ==================== Archival ==================== */

TKLyricsController.prototype.archive = function () {
  var archive = this.callSuper();
  archive.currentSong = this.currentSong;
  return archive;
};

TKClass(TKLyricsController);
