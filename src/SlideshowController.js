/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

const TKSlideshowControllerContainerCSSClass = 'tk-slideshow-controller-view';

TKSlideshowController.inherits = TKController;
TKSlideshowController.synthetizes = ['slidingViewData', 'togglePlaybackButton', 'playing', 'currentSlideIndex', 'numberOfSlides', 'previousSlideButton', 'nextSlideButton'];

/**
 *  @class
 *
 *  <p>A slideshow controller plays through a collection of slides, also allowing to control the playback state and position of the slideshow. Control
 *  buttons are easily wired and remote-based navigation is completely automated.</p>
 *
 *  @extends TKController
 *  @since TuneKit 1.0
 *
 *  @param {Object} data A hash of properties to use as this object is initialized.
 */
function TKSlideshowController (data) {
  // public properties
  this._slidingViewData = null;
  this._togglePlaybackButton = null;
  this._previousSlideButton = null;
  this._nextSlideButton = null;
  this._playing = null;
  /**
   *  Indicates whether the slideshow loops through for constant playback. Defaults to <code>true</code>.
   *  @type bool
   */
  this.loops = true;
  /**
   *  Indicates the duration in milliseconds each slide remains on screen.
   *  @type int
   */
  this.interval = 3000;
  this.timer = null;
  this.willNeedToResume = true;
  // set up the sliding view
  this.slidingView = new TKSlidingView();
  this.slidingView.ready = false;
  this.slidingView.delegate = this;
  //
  this.callSuper(data);
};

/* ==================== View Processing ==================== */

TKSlideshowController.prototype.processView = function () {
  this.callSuper();
  // restore properties that have not been set yet since construction
  this.restoreProperty('slidingViewData');
  this.restoreProperty('previousSlideButton');
  this.restoreProperty('nextSlideButton');
  this.restoreProperty('togglePlaybackButton');
  this.restoreProperty('currentSlideIndex');
  this.restoreProperty('playing');
  // add the sliding view and slide control containers
  this.container = this._view.appendChild(document.createElement('div'));
  this.container.addClassName(TKSlideshowControllerContainerCSSClass);
  this.container.appendChild(this.slidingView.element);
  // ensure our first slide gets told about its being highlighted
  this.slideDidChange(this.currentSlideIndex);
  // start playing by default
  if (this._playing === null) {
    this.willNeedToResume = true;
  }
};

TKSlideshowController.prototype._viewDidAppear = function () {
  if (this.willNeedToResume) {
    this.playing = true;
  }
};

TKSlideshowController.prototype._viewWillDisappear = function () {
  this.willNeedToResume = this.playing;
  this.playing = false;
};

/* ==================== Synthetized Properties ==================== */

/**
 *  @name TKSlideshowController.prototype
 *  @property {bool} playing Indicates the current playback state of the slideshow, defaults to <code>true</code>.
 */
TKSlideshowController.prototype.setPlaying = function (playing) {
  if (this._playing == playing) {
    return;
  }
  // pause
  if (!playing) {
    window.clearTimeout(this.timer);
  }
  // resume
  else {
    this.rewindTimer();
  }
  // remember ivar
  this._playing = playing;
  // inform the playback state changed
  this.playbackStateDidChange();
};

/**
 *  @name TKSlideshowController.prototype
 *  @property {int} numberOfSlides Indicates how many slides total are in the slideshow.
 */
TKSlideshowController.prototype.getNumberOfSlides = function () {
  return (!this.slidingView.ready) ? 0 : this.slidingView.numberOfElements;
};

/**
 *  @name TKSlideshowController.prototype
 *  @property {int} currentSlideIndex Indicates the index of the current slide.
 */
TKSlideshowController.prototype.getCurrentSlideIndex = function () {
  return this.slidingView.activeElementIndex;
};

TKSlideshowController.prototype.setCurrentSlideIndex = function (index) {
  if (index === null || !this.slidingView.ready) {
    return;
  }
  // out of range
  if (index < 0 || index >= this.numberOfSlides) {
    return;
  }
  // update the slideshow index
  this.slidingView.activeElementIndex = index;
  // update timers if we're running
  if (this.playing) {
    // cancel the previous timer in case we still had one running
    window.clearTimeout(this.timer);
    // rewind it, and set playback to false in case we can't rewind any further
    if (!this.rewindTimer()) {
      this.playing = false;
    }
  }
};

/**
 *  @name TKSlideshowController.prototype
 *  @property {String} togglePlaybackButton A CSS selector matching a button to be used as the button to control the playback state.
 */
TKSlideshowController.prototype.setTogglePlaybackButton = function (togglePlaybackButton) {
  if (togglePlaybackButton === null) {
    return;
  }
  // forget old button
  if (this._togglePlaybackButton) {
    this._togglePlaybackButton.removeEventListener('click', this, false);
  }
  // process new one
  this._togglePlaybackButton = this.view.querySelector(togglePlaybackButton);
  if (this._togglePlaybackButton !== null) {
    if (IS_APPLE_TV) {
      this._togglePlaybackButton.style.display = 'none';
    }
    else {
      this._togglePlaybackButton.addEventListener('click', this, false);
    }
  }
};

/**
 *  @name TKSlideshowController.prototype
 *  @property {String} previousSlideButton A CSS selector matching a button to be used as the button to decrement the {@link #currentSlideIndex}.
 */
TKSlideshowController.prototype.setPreviousSlideButton = function (previousSlideButton) {
  if (previousSlideButton === null) {
    return;
  }
  // forget old button
  if (this._previousSlideButton) {
    this._previousSlideButton.removeEventListener('click', this, false);
  }
  // process new one
  this._previousSlideButton = this.view.querySelector(previousSlideButton);
  if (this._previousSlideButton !== null) {
    if (IS_APPLE_TV) {
      this._previousSlideButton.style.display = 'none';
    }
    else {
      this._previousSlideButton.addEventListener('click', this, false);
    }
  }
};

/**
 *  @name TKSlideshowController.prototype
 *  @property {String} nextSlideButton A CSS selector matching a button to be used as the button to increment the {@link #currentSlideIndex}.
 */
TKSlideshowController.prototype.setNextSlideButton = function (nextSlideButton) {
  if (nextSlideButton === null) {
    return;
  }
  // forget old button
  if (this._nextSlideButton) {
    this._nextSlideButton.removeEventListener('click', this, false);
  }
  // process new one
  this._nextSlideButton = this.view.querySelector(nextSlideButton);
  if (this._nextSlideButton !== null) {
    if (IS_APPLE_TV) {
      this._nextSlideButton.style.display = 'none';
    }
    else {
      this._nextSlideButton.addEventListener('click', this, false);
    }
  }
};

/**
 *  @name TKSlideshowController.prototype
 *  @property {TKSlidingViewData} slidingViewData The set of properties used to set up the contents of the page slider.
 */
TKSlideshowController.prototype.setSlidingViewData = function (data) {
  if (data === null) {
    return;
  }
  // set up the data source if we have .elements on the data object
  if (!TKUtils.objectIsUndefined(data.elements)) {
    this.slidingView.dataSource = new TKSlidingViewDataSourceHelper(data.elements);
    delete data.element;
  }
  // see if we have some intersting bits to pass through
  var archived_slide_index = this.getArchivedProperty('currentSlideIndex');
  if (archived_slide_index !== undefined) {
    data.activeElementIndex = archived_slide_index;
  }
  // copy properties
  TKUtils.copyPropertiesFromSourceToTarget(data, this.slidingView);
  // init our view
  this.slidingView.init();
  //
  this.slidingView.ready = true;
};

/* ==================== Previous / Next Slide ==================== */

TKSlideshowController.prototype.attemptToGoToPreviousSlide = function () {
  if (!this.loops && this.currentSlideIndex <= 0) {
    TKSpatialNavigationManager.soundToPlay = SOUND_LIMIT;
  }
  else {
    this.goToPreviousSlide();
  }
};

TKSlideshowController.prototype.attemptToGoToNextSlide = function () {
  if (!this.loops && this.currentSlideIndex >= this.numberOfSlides - 1) {
    TKSpatialNavigationManager.soundToPlay = SOUND_LIMIT;
  }
  else {
    this.goToNextSlide();
  }
};

TKSlideshowController.prototype.goToPreviousSlide = function () {
  this.currentSlideIndex = ((this.currentSlideIndex + this.numberOfSlides) - 1) % this.numberOfSlides;
};

TKSlideshowController.prototype.goToNextSlide = function () {
  this.currentSlideIndex = (this.currentSlideIndex + 1) % this.numberOfSlides;
};

TKSlideshowController.prototype.rewindTimer = function () {
  if (this.loops || this.currentSlideIndex < this.numberOfSlides - 1) {
    var _this = this;
    this.timer = window.setTimeout(function () {
      _this.goToNextSlide();
    }, this.interval);
    return true;
  }
  else {
    return false;
  }
};

/* ==================== Keyboard Navigation ==================== */

TKSlideshowController.prototype.wantsToHandleKey = function (key) {
  return (key == KEYBOARD_LEFT || key == KEYBOARD_RIGHT || key == KEYBOARD_RETURN) ? true : this.callSuper(key);
};

TKSlideshowController.prototype.keyWasPressed = function (key) {
  // default action is move, so wire that up
  TKSpatialNavigationManager.soundToPlay = SOUND_MOVED;
  // left should go to the previous slide
  if (key == KEYBOARD_LEFT) {
    this.attemptToGoToPreviousSlide();
  }
  // right should go to the next slide
  else if (key == KEYBOARD_RIGHT) {
    this.attemptToGoToNextSlide();
  }
  // return key should toggle playback
  else if (key == KEYBOARD_RETURN) {
    TKSpatialNavigationManager.soundToPlay = SOUND_ACTIVATED;
    this.playing = !this.playing;
  }
  // let the default behavior happen too
  this.callSuper(key);
};

TKSlideshowController.prototype.elementWasActivated = function (element) {
  // toggle playback button pressed
  if (element === this._togglePlaybackButton) {
    this.playing = !this.playing;
  }
  // previous slide button pressed
  else if (element === this._previousSlideButton) {
    this.attemptToGoToPreviousSlide();
  }
  // next slide button pressed
  else if (element === this._nextSlideButton) {
    this.attemptToGoToNextSlide();
  }
  // fall back to default behavior
  else {
    this.callSuper(element);
  }
};

/* ==================== TKSlidingView Protocol ==================== */

TKSlideshowController.prototype.slidingViewDidFocusElementAtIndex = function (view, index) {
  this.slideDidChange(index);
};

TKSlideshowController.prototype.slidingViewStyleForItemAtIndex = function (view, index) {
  return this.styleForSlideAtIndex(index);
};

/* ==================== Placeholder Methods ==================== */

/**
 *  Triggered when the playback state has changed.
 */
TKSlideshowController.prototype.playbackStateDidChange = function () {};

/**
 *  Triggered when the {@link #currentSlideIndex} property has changed.
 *
 *  @param {int} index The index of the current slide.
 */
TKSlideshowController.prototype.slideDidChange = function (index) {};

/**
 *  This method allows to provide custom style rules for a slide programatically any time the {@link #currentSlideIndex} property changes. The values in this
 *  array are expected to be individual two-value arrays, where the first index holds the CSS property name, and the second index its value.
 *
 *  @param {Array} index The index of the slide for which we are trying to obtain custom styles.
 */
TKSlideshowController.prototype.styleForSlideAtIndex = function (index) {
  return [];
};

/* ==================== Archival ==================== */

TKSlideshowController.prototype.archive = function () {
  var archive = this.callSuper();
  archive.currentSlideIndex = this.currentSlideIndex;
  return archive;
};

TKClass(TKSlideshowController);
