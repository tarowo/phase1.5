/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

// XXX: this should be set dynamically as needed
const ARCHIVES_AND_RESTORES = false;
 
var bookletController = new TKObject();

bookletController.init = function () {
  // stop current playback
  window.iTunes.stop();
  
  // set up audio loop
  this.startAudioLoop();
  
  // determine play position if this a movie
  if (appData.feature.XID){
    appData.feature.trackObj = this.getTrack(appData.feature);
    if (appData.feature.trackObj && appData.feature.trackObj.bookmark != 0){
      this.dispatchDisplayUpdates();
    }
  }
  
  // add event listeners
  window.addEventListener("play", this, false);
  window.addEventListener("pause", this, false);
  window.addEventListener("videoclosed", this, false);
  window.addEventListener("unload", this, false);

  // check if we have an archive to restore from
  this.restoreFromJSON();

  // create our navigation controller and add the home controller as the root controller
  this.navigation = new TKNavigationController({
    id : 'navigation',
    rootController : homeController,
    delegate : this
  });
};

bookletController.archiveToJSON = function () {
  if (!ARCHIVES_AND_RESTORES) {
    return;
  }
  //
  var archive = {
    controllers: {}
  };
  // first, get the navigation stack of controllers
  var controllers_stack_IDs = [];
  for (var i = 0; i < this.navigation.controllers.length; i++) {
    controllers_stack_IDs.push(this.navigation.controllers[i].id);
  }
  archive.navigationStack = controllers_stack_IDs;
  // then archive all known controllers that aren't the navigation stack
  for (var i in TKController.controllers) {
    if (i == 'navigation') {
      continue;
    }
    archive.controllers[i] = TKController.controllers[i].archive();
  }
  // archive is complete, now save it to disk
  window.localStorage.archive = JSON.stringify(archive);
};

bookletController.restoreFromJSON = function () {
  if (!ARCHIVES_AND_RESTORES) {
    return;
  }
  // check if we have an archive to restore from
  var json_archive = window.localStorage.archive;
  if (json_archive === undefined) {
    return;
  }
  // parse the JSON archive into a JS object that we track at all times
  this.archive = JSON.parse(json_archive);
};

bookletController.handleEvent = function(event) {
  switch (event.type) {
    case "play":
      // video has started to play - stop the audio loop
      this.stopAudioLoop();
      //this.dispatchDisplayUpdates();
      break;
    case "pause":
      // video has paused
      //this.dispatchDisplayUpdates();
      break;
    case "videoclosed":
      // video has stopped - restart audio loop
      this.startAudioLoop();
      this.dispatchDisplayUpdates();
      // stub to check what chapter we are on for sticky chapters
      debug(iTunes.currentChapter);
      break;
    case "unload":
      // archive our state
      this.archiveToJSON();
      break;
    default:
      debug("Unknown event type in bookletController : " + event.type);
  }
};

bookletController.startAudioLoop = function() {

  // if the loop exists already, we're being asked to resume
  // check if we're set to do so, and if not, exit without starting playback
  if (this.audioLoop && appData.audioLoop && !appData.audioLoop.loop) {
    this.audioLoop.pause();
    this.audioLoop.volume = 0;
    return;
  }
  
  // create the loop if it doesn't exist yet
  if (appData.audioLoop && !this.audioLoop) {
    this.audioLoop = new Audio();
    this.audioLoop.src = appData.audioLoop.src;
    // make sure this background audio is never displayed
    this.audioLoop.style.display = "none";
    // add it to the document so that iTunes will notice it is there
    document.body.appendChild(this.audioLoop);
    this.audioLoop.volume = 0;
  }
  
  if (this.audioLoop) {
    this.audioLoop.loop = appData.audioLoop.loop;
    this.audioLoop.volume = Math.min(1, window.iTunes.volume);
    this.audioLoop.play();
  }
};

bookletController.stopAudioLoop = function() {
  if (this.audioLoop) {
    this.audioLoop.pause();
    this.audioLoop.loop = false;
    this.audioLoop.currentTime = 0; // reset to beginning
  }
};

bookletController.playbackHasStarted = function (){
  return (this.trackBookmark(appData.feature) == 0) ? false : true;    
}

bookletController.play = function (trackObj) {
  var track = this.getTrack(trackObj);
  
  if (track != null){
    iTunes.stop();
    track.play();
  }
};

bookletController.playFeature = function (){
  bookletController.play(appData.feature);
};

bookletController.resumeFeature = function(){
  bookletController.playFeature();
};

bookletController.playChapter = function (index){
  iTunes.stop();
  if (appData.feature.trackObj != null){
    appData.feature.trackObj.play({startChapterIndex : index});
  }
};

bookletController.getChapter = function (){
  if (appData.feature.trackObj && appData.feature.trackObj.chapters){
    if ((iTunes.currentChapter == 0 && appData.feature.trackObj.bookmark != 0) || IS_APPLE_TV){
      var estimatedChapter = Math.floor((appData.feature.trackObj.bookmark /  appData.feature.trackObj.duration) *  appData.feature.trackObj.chapters.length);
      var actualChapter = -1;

      if ((appData.feature.trackObj.chapters[estimatedChapter].startOffsetTime / 1000) == appData.feature.trackObj.bookmark){
      } else if ((appData.feature.trackObj.chapters[estimatedChapter].startOffsetTime / 1000) < appData.feature.trackObj.bookmark){
        while (estimatedChapter < appData.feature.trackObj.chapters.length && (appData.feature.trackObj.chapters[estimatedChapter].startOffsetTime / 1000) < appData.feature.trackObj.bookmark){
          estimatedChapter++;
        }
      } else if ((appData.feature.trackObj.chapters[estimatedChapter].startOffsetTime / 1000) > appData.feature.trackObj.bookmark){
        while (estimatedChapter >= 0 && (appData.feature.trackObj.chapters[estimatedChapter].startOffsetTime / 1000) > appData.feature.trackObj.bookmark){
          estimatedChapter--;
        }
      }
      actualChapter = estimatedChapter;
      debug("GET CHAPTER: estimating: " + actualChapter);
      return actualChapter;
    } else {
      debug("GET CHAPTER: itunes query: " + iTunes.currentChapter);
      return iTunes.currentChapter;
    }
  } else {
    return -1;
  }
}

bookletController.buildPlaylist = function (tracks){
  var tracklistObj = iTunes.createTempPlaylist();
  var tracklist = [];
  
  for (var i = 0; i < tracks.length; i++){
    var track = this.getTrack(tracks[i]);
    if (track != null){
      tracklist.push(track);
    }
  }
  
  tracklistObj.addTracks(tracklist);
  debug("added " + tracklist.length + " of " + tracks.length + " tracks successfully.");
  return tracklistObj;
};

bookletController.buildNonLibraryPlaylist = function (tracks){
  var tracklistObj = iTunes.createTempPlaylist();
  var tracklist = [];
  
  for (var i = 0; i < tracks.length; i++){
    var track = {};
    track.url = "videos/" + tracks[i].src;
    track.title = tracks[i].string;
    track.artist = appData.feature.artist;
    track.album = appData.feature.title;
    debug("adding: " + track.title + " (" + track.url + ")");
    tracklist.push(track);
  }
  
  debug("pushing to tracklistOb");
  tracklistObj.addURLs(tracklist);
  return tracklistObj;
};

bookletController.trackDuration = function (trackObj){
  var track = this.getTrack(trackObj);
  if (track != null){
    debug("querying duration");
    return track.durationAsString;
  } else {
    return "0:00";
  }
};

bookletController.trackNumber = function (trackObj){
  var track = this.getTrack(trackObj);
  if (track != null){
    debug("querying track number");
    return track.trackNumber;
  } else {
    return "0";
  }
};

bookletController.trackBookmark = function (trackObj){
  var track = this.getTrack(trackObj);
  if (track != null){
    debug("querying bookmark");
    return track.bookmark;
  } else {
    return "0";
  }
};

bookletController.getTrack = function (trackObj){
  if (trackObj.XID){
    debug("searching by XID: " + trackObj.XID);
    var iTunesTrack = window.iTunes.findTracksByXID(trackObj.XID);
    if (iTunesTrack.length > 0){
      debug("found by XID");
      return iTunesTrack[0];
    } else {
      debug("XID not found in library");
      return null;
    }
  } else {
    debug("no XID");
    return null;
  }
};

bookletController.playNonLibraryContent = function (trackObj){
  debug("videos/" + trackObj.src);
  debug({title : trackObj.string, artist : appData.feature.artist, album : appData.feature.title});
  window.iTunes.play("videos/" + trackObj.src, {title : trackObj.string, artist : appData.feature.artist, album : appData.feature.title});
};

bookletController.childControllers = [];

bookletController.registerForDisplayUpdates = function (childController) {
  if (this.childControllers.indexOf(childController) == -1) {
    this.childControllers.push(childController);
  }
};

bookletController.dispatchDisplayUpdates = function () {
  for (var i=0; i < this.childControllers.length; i++) {
    if (TKUtils.objectIsFunction(this.childControllers[i].updateDisplay)) {
      this.childControllers[i].updateDisplay();
    }
  }
};

/* ================= iTunes Emulation ======================== */

var iTunesEmulator = {
  volume : 1,
  platform : 'Emulator',
  version : '-1'
};

iTunesEmulator.play = function (mediaLocation) {
  debug("iTunesEmulator - play: " + mediaLocation);
};

iTunesEmulator.stop = function () {
  debug("iTunesEmulator - stop");
};

iTunesEmulator.findTracksByStoreID = function (storeID) {
  debug("iTunesEmulator - findTracksByStoreID: " + storeID);
  return [new ITunesTrackEmulator()];
};

iTunesEmulator.findTracksByXID = function (xID) {
  debug("iTunesEmulator - findTracksByXID: " + xID);
  return [new ITunesTrackEmulator()];
};

iTunesEmulator.createTempPlaylist = function () {
  return {
    tracks: [],
    addTracks: function () {}
  };
};

function ITunesTrackEmulator() {
}

ITunesTrackEmulator.prototype.play = function (params) {
  debug("iTunesTrackEmulator - play: " + params);
  // fake the play event to the window
  var event = document.createEvent("HTMLEvents");
  event.initEvent("play", false, false);
  window.dispatchEvent(event);
  setTimeout(function() {
    debug("iTunesTrackEmulator - coming back from playback");
    event = document.createEvent("HTMLEvents");
    event.initEvent("videoclosed", false, false);
    window.dispatchEvent(event);
  }, 5000);
};

/* ================= Initialisation ======================== */

window.addEventListener('load', function () {
  // override select start
  document.onselectstart = function() { return false; };
  // check for iTunes object, create a dummy if it doesn't exist
  if (!window.iTunes) {
    window.iTunes = iTunesEmulator;
  }
  // init the booklet controller
  bookletController.init();
}, false);
