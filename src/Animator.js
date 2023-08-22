/*
 *  Copyright © 2009 Apple Inc. All rights reserved.
 */

/* ==================== Constants ==================== */

const TKAnimatorLinearType = 0;
const TKAnimatorSplinesType = 1;
const TKAnimatorInvalidArgsException = 2;

const TKAnimatorAnimationDidIterate = 'animationDidIterate';
const TKAnimatorAnimationDidEnd = 'animationDidEnd';

/* ==================== TKAnimator ==================== */

function TKAnimator (duration, delegate, spline) {
  // check validity of arguments number
  // if (arguments.length != 2 && arguments.length != 3 && arguments.length != 7) {  
  //   throw TKAnimatorInvalidArgsException;
  //   return false;
  // }
  // init some base properties
  this.ready = false;
  this.animating = false;
  this.timer = null;
  // handle arguments
  this.duration = duration; // ms
  this.delegate = delegate;
  // check we have the required delegation method
  // if (!TKUtils.objectHasMethod(this.delegate, TKAnimatorAnimationDidIterate)) {
  //   return;
  // }
  // handle splines arguments, if available
  if (arguments.length >= 3) {
    this.type = TKAnimatorSplinesType;
    this.x1 = spline[0];
    this.y1 = spline[1];
    this.x2 = spline[2];
    this.y2 = spline[3];
    this.init();
  }
  else { // linear animation
    this.type = TKAnimatorLinearType;
  }
  this.ready = true;
};

TKAnimator.prototype.init = function () {
  // calculate the polynomial coefficients
  this.cx = 3 * this.x1;
  this.bx = 3 * (this.x2 - this.x1) - this.cx;
  this.ax = 1 - this.cx - this.bx;
  this.cy = 3 * this.y1;
  this.by = 3 * (this.y2 - this.y1) - this.cy;
  this.ay = 1 - this.cy - this.by;
  // compute points
  var numberOfPoints = (this.duration / 1000) * 240;
  this.curve = new Array(numberOfPoints);
  var dt = 1.0 / ( numberOfPoints - 1 );
  for (var i = 0; i < numberOfPoints; i++) {
    var t = i * dt;
    this.curve[i] = {
      x : (this.ax * Math.pow(t, 3)) + (this.bx * Math.pow(t, 2)) + (this.cx * t),
      y : (this.ay * Math.pow(t, 3)) + (this.by * Math.pow(t, 2)) + (this.cy * t)
    };
  }
};

TKAnimator.prototype.start = function () {
  if (!this.ready) {
    var _this = this;
    this.timer = setTimeout(function () { _this.start() }, 0);
    return;
  }
  this.animating = true;
  this.lastIndex = 0;
  this.startTime = (new Date()).getTime();
  this.iterate();
};

TKAnimator.prototype.stop = function () {
  this.animating = false;
  clearTimeout(this.timer);
};

TKAnimator.prototype.iterate = function () {
  var ellapsedTime = (new Date()).getTime() - this.startTime;
  if (ellapsedTime < this.duration) {
    var x = ellapsedTime / this.duration;
    // handle splines case
    if (this.type == TKAnimatorSplinesType) {
      var y = 0;
      for (var i = this.lastIndex; i < this.curve.length; i++) {
        var point = this.curve[i];
        if (point.x >= x && i > 0) {
          var previous_point = this.curve[i - 1];
          if ((x - previous_point.x) < (point.x - x)) {
            this.lastIndex = i - 1;
            y = previous_point.y;
          }
          else {
            this.lastIndex = i;
            y = point.y;
          }
          break;
        }
      }
    }
    this.delegate[TKAnimatorAnimationDidIterate]((this.type == TKAnimatorSplinesType) ? y : x);
    var _this = this;
    this.timer = setTimeout(function () { _this.iterate() }, 0);
  }
  else {
    this.delegate[TKAnimatorAnimationDidIterate](1);
    if (TKUtils.objectHasMethod(this.delegate, TKAnimatorAnimationDidEnd)) {
      this.delegate[TKAnimatorAnimationDidEnd]();
    }
    this.animating = false;    
  }
};

/* ==================== CLASS CREATION ==================== */

TKClass(TKAnimator);
