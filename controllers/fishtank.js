var fishtankController = new TKController({
  id: 'fishtank',
  actions : [
    { selector: '.tongs', action: function(){ this.tongsRelease() } },
  ],
  navigatesTo : [
	{ selector: '.back', controller: 'home' },
  ],
  highlightedElement : '.tongs',
});


fishtankController.viewDidAppear = function(){
	bookletController.stopAudioLoop();
	fishtankController.startAudio();
	fishtankController.flamFishSounds();
	
	fishtankController.delay = 0;
	fishtankController.bob = 10;
	fishtankController.flamFishAudioCue = 1;
	fishtankController.flamSoundCue = 0;
	fishtankController.flamEatenCue = 0;
	fishtankController.flamSpitCue = 0;
	fishtankController.seeFlamCue = 0;
	
	fishtankController.flam = 20;
	fishtankController.level = 1;
	fishtankController.score = 0;
	fishtankController.backToHole = 0;
	
	var element = fishtankController.view.querySelector('.spam');
	element.style.webkitTransform = "translate(0px, 0px)";
	element.style.opacity = 0;
	fishtankController.spamReady(element);
	
	fishtankController.view.querySelector('.score').innerHTML = " x " + fishtankController.flam;
	fishtankController.view.querySelector('.score2').innerHTML = "<br>Level " + fishtankController.level;
	fishtankController.view.querySelector('.score3').innerHTML = "<br>Score " + fishtankController.score;
	
	fishtankController.t = setTimeout(fishtankController.fishMover, 1000);
	
	setTimeout(function(){
		document.addEventListener("click", fishtankController.tongsRelease )
	}, 1000 );
}

fishtankController.viewDidLoad = function(){
	fishtankController.flam = 20;
	fishtankController.level = 1;
	fishtankController.score = 0;
	fishtankController.backToHole = 0;
	
	fishtankController.tongs = this.view.querySelector('.tongs');
	fishtankController.tongs.src = "images/fishtank/tongs_closed.png";
	fishtankController.tongs.id = "right";
	
	fishtankController.fish_1 = new Fish( this.view.querySelector('.fish1'), 0 );
	fishtankController.fish_2 = new Fish( this.view.querySelector('.fish2'), 1 );
	fishtankController.fish_3 = new Fish( this.view.querySelector('.fish3'), 2 );
	fishtankController.pinky = new Pinky( this.view.querySelector('.pinky') );
};

	
fishtankController.viewDidDisappear = function(){
  bookletController.stopAudioLoop();
  document.body.removeChild(bookletController.audioLoop);

  if (bookletController.audioLoop && appData.audioLoop && !appData.audioLoop.loop) {
    bookletController.audioLoop.pause();
    bookletController.audioLoop.volume = 0;
    return;
  }
    bookletController.audioLoop = new Audio();
	bookletController.audioLoop.src = appData.audioLoop.src;
    bookletController.audioLoop.style.display = "none";
    document.body.appendChild(bookletController.audioLoop);
    bookletController.audioLoop.volume = 0;
  if (bookletController.audioLoop) {
    bookletController.audioLoop.loop = appData.audioLoop.loop;
    bookletController.audioLoop.volume = Math.min(1, window.iTunes.volume);
    bookletController.audioLoop.play();
  }
}

//////////////////
// Action Logic //
//////////////////

fishtankController.pinkySinks = function(){
	var pinkyImage = fishtankController.view.querySelector('.pinky');
	var fish1_y = fishtankController.pinky.returnPos("y", pinkyImage ) + pinkyImage.offsetTop ;
	var fish1_x = fishtankController.pinky.returnPos("x", pinkyImage ) + pinkyImage.offsetLeft ;
	
	if( ( fish1_y < 250 ) && ( fish1_y > 190 ) ){
		if( pinkyImage.style.opacity == 1 ){
			fishtankController.pinky.wkTransform( pinkyImage, fish1_x - pinkyImage.offsetLeft , fish1_y - pinkyImage.offsetTop - 2 );
		}
	}else{
		if( pinkyImage.style.opacity == 1 ){
			fishtankController.backToHole++;
			if( fishtankController.backToHole > 60 ){
				fishtankController.pinky.wkTransform( pinkyImage, 0, 0 );
				fishtankController.backToHole = 0;
			}else{
				fishtankController.bob = fishtankController.bob * -1;
				fishtankController.pinky.wkTransform( pinkyImage, fish1_x - pinkyImage.offsetLeft , fish1_y - pinkyImage.offsetTop + fishtankController.bob );
			}
		}
	}
}

fishtankController.fishMover = function(){
	if( fishtankController.delay == 0 ){
		fishtankController.fish_1.iterate( fishtankController.view.querySelector('.fish1') );
		fishtankController.delay++;
	}else if( fishtankController.delay == 1 ){
		fishtankController.fish_1.iterate( fishtankController.view.querySelector('.fish1') );
		fishtankController.fish_2.iterate( fishtankController.view.querySelector('.fish2') );
		fishtankController.view.querySelector('.fish1').style.opacity = 1;
		fishtankController.delay++;
	}else if( fishtankController.delay == 2 ){
		fishtankController.fish_1.iterate( fishtankController.view.querySelector('.fish1') );
		fishtankController.fish_2.iterate( fishtankController.view.querySelector('.fish2') );
		fishtankController.fish_3.iterate( fishtankController.view.querySelector('.fish3') );
		fishtankController.view.querySelector('.fish2').style.opacity = 1;
		fishtankController.delay++;
	}else{
		fishtankController.fish_1.iterate( fishtankController.view.querySelector('.fish1') );
		fishtankController.fish_2.iterate( fishtankController.view.querySelector('.fish2') );
		fishtankController.fish_3.iterate( fishtankController.view.querySelector('.fish3') );
		fishtankController.view.querySelector('.fish3').style.opacity = 1;
	}

	if( fishtankController.tongs.id == 'right' ){
		if( fishtankController.getTongXPos() < 800 ) {
			var newPos = fishtankController.getTongXPos() + 200;
			newPos = ( newPos > 850 ) ? 850 : newPos ;
			fishtankController.tongs.style.webkitTransform = 'translateX(' + newPos + 'px)';
		}else{
			fishtankController.tongs.id = "left";
			fishtankController.tongs.style.webkitTransform = 'translateX(' + ( fishtankController.getTongXPos() - 200 ) + 'px)';
		}
	}else{
		if( fishtankController.getTongXPos() > 100  ) {
			var newPos = fishtankController.getTongXPos() - 200;
			newPos = ( newPos < 0 ) ? 0 : newPos ;
			fishtankController.tongs.style.webkitTransform = 'translateX(' + newPos + 'px)';
		} else {
			fishtankController.tongs.id = "right";
			fishtankController.tongs.style.webkitTransform = 'translateX(' + ( fishtankController.getTongXPos() + 200 ) + 'px)';
		}
	}
	
	fishtankController.pinkySinks();
	fishtankController.flamFishAudioCue++;
	fishtankController.flamFishSounds();
	fishtankController.t = setTimeout(fishtankController.fishMover, 1000);
}

fishtankController.fishFoodFinder = function(fishImage, fishObject){
	var spam = fishtankController.view.querySelector('.spam');
	var spam_x = fishtankController.returnSpamPos("x");
	var spam_y = fishtankController.returnSpamPos("y") + 120;
	
	var fish1_x = fishObject.returnPos("x", fishImage ) + fishImage.offsetLeft ;
	fish1_x = ( fishImage.id == "left" ) ? fish1_x : (fish1_x + fishImage.width) ;
	var fish1_y = fishObject.returnPos("y", fishImage ) + fishImage.offsetTop ;
	var distance = Math.round( Math.sqrt( Math.pow( (fish1_x - spam_x ) ,2) + Math.pow( (fish1_y - spam_y ) , 2) ) );
	
	if( distance <= 100 ){
		fishImage.style.background = "url(images/fishtank/fish_found.gif) no-repeat center center";
		spam.removeEventListener("webkitTransitionEnd", fishtankController.spamIterate );
		spam.style.webkitTransform = "translate(0px, 0px)";
		
		setTimeout( function(spam){
			spam.style.opacity = 0;
		}, 1000, spam );
				
		fishtankController.spamReady(spam);
		fishtankController.flamEaten();
		setTimeout( function(){
			fishtankController.flamSpit();
		}, 1000);
	}else if( distance <= 120 ){
		fishtankController.fishAttractLogic( fishImage, fishObject, 60, fish1_x, "fish" );
	}else if( distance <= ( fishtankController.level * 50 ) ){
		fishtankController.fishAttractLogic( fishImage, fishObject, 100, fish1_x, "fish" );
	}	
}

fishtankController.pinkyGetsCaught = function(image, object, xpos, ypos){
	object.wkTransform( image, xpos, ypos);
}

fishtankController.rangeFinder = function(event){
	var spam = fishtankController.view.querySelector('.spam');
	var pinky = fishtankController.view.querySelector('.pinky');
	var spam_x = fishtankController.returnSpamPos("x");
	var spam_y = fishtankController.returnSpamPos("y") + 120;

	fishtankController.fishFoodFinder(fishtankController.view.querySelector('.fish1') , fishtankController.fish_1 );
	fishtankController.fishFoodFinder(fishtankController.view.querySelector('.fish2') , fishtankController.fish_2 );
	fishtankController.fishFoodFinder(fishtankController.view.querySelector('.fish3') , fishtankController.fish_3 );
	
	var pinky_x = fishtankController.pinky.returnPos("x", fishtankController.view.querySelector('.pinky') ) + 950 ;
	pinky_x = ( pinky.id == "left" ) ? pinky_x : (pinky_x + 137) ;
	var pinky_y = fishtankController.pinky.returnPos("y", fishtankController.view.querySelector('.pinky') ) + 630 ;
	var distance = Math.round( Math.sqrt( Math.pow( (pinky_x - spam_x ) ,2) + Math.pow( (pinky_y - spam_y ) , 2) ) );
	
	if( distance <= 50 ){
		fishtankController.backToHole = 0;
		fishtankController.flamEaten();
		pinky.style.background = "url(images/fishtank/pinky_found.gif) no-repeat center center";
		spam.removeEventListener("webkitTransitionEnd", fishtankController.spamIterate );
		spam.style.webkitTransform = "translate(0px, 0px)";
		spam.style.opacity = 0;
		spam.style.display = 'none';
		fishtankController.spamReady(spam);
		pinky.style.background = "transparent";
		
		if( pinky_y < 200 ){
			/*******************************************/
			/********* PINKY GETS CAUGHT ***************/
			/*******************************************/
			fishtankController.score = (fishtankController.score + ( fishtankController.flam * 100 * fishtankController.level) ) ;
			fishtankController.flam = 20;
			fishtankController.level++;
			fishtankController.view.querySelector('.score').innerHTML = " x " + fishtankController.flam;
			fishtankController.view.querySelector('.score2').innerHTML = "<br>Level " + fishtankController.level;
			fishtankController.view.querySelector('.score3').innerHTML = "<br>Score " + fishtankController.score;
			
			fishtankController.pinky.caught = "true";
			pinky.style.opacity = 0
			fishtankController.pinkyGetsCaught( pinky , fishtankController.pinky, pinky_x - 950, pinky_y - 630 - 300);
		}
	}else if( distance <= 120 ){
		fishtankController.fishAttractLogic( pinky, fishtankController.pinky, 60, pinky_x, "pinky" );
	}else if( distance <= 300 ){
		fishtankController.fishAttractLogic( pinky, fishtankController.pinky, 100, pinky_x, "pinky" );
	}
	
}

fishtankController.fishAttractLogic = function(fish, fishobject, magnetism, fish_x, file){
	fishtankController.seeFlam();
	var spam_x = fishtankController.returnSpamPos("x");
	var spam_y = fishtankController.returnSpamPos("y") + 120;
	
	if( fish.id == "left" ) {
		if( fishtankController.returnSpamPos("x") > (fish_x + 137) ){
			fish.src = "images/fishtank/"+file+"_leftright.gif";
			fish.id = "right";
			fishobject.wkTransform( fish, spam_x - 950 - 130, spam_y - 630 + magnetism);
		}else{
			fishobject.wkTransform( fish, spam_x - 950, spam_y - 630 + magnetism);
		}
	}
	if( fish.id == "right" ) {
		if( fishtankController.returnSpamPos("x") < (fish_x - 137) ){
			fish.src = "images/fishtank/"+file+"_rightleft.gif";
			fish.id = "left";
			fishobject.wkTransform( fish, spam_x - 950, spam_y - 630 + magnetism);
		}else{
			fishobject.wkTransform( fish, spam_x - 950 - 130, spam_y - 630 + magnetism);
		}
	}
	fish.style.background = "url(images/fishtank/"+file+"_found_" + fish.id + ".gif) no-repeat center center";
	setTimeout( function(fish){
		fish.style.background = "transparent";
	}, 2000, fish);
};

fishtankController.wkTransform = function(wkTransform, element){
	element.style.webkitTransform = wkTransform;
}

fishtankController.tongsRelease = function() {
	if( fishtankController.inCan != "false" ){
		fishtankController.pinky.wkTransform( fishtankController.view.querySelector('.pinky'), -150, -20);
		fishtankController.inCan = "false";
	}
	
	var theTransform = fishtankController.getTongXPos();
	var spam = fishtankController.view.querySelector('.spam');
	spam.style.display = 'block';
	if( spam.id != 'falling' ) {
		fishtankController.flamDropSound();

		if( fishtankController.flam > 0 ){
			fishtankController.flam--;
			fishtankController.view.querySelector('.score').innerHTML = " x " + fishtankController.flam;
		}else{
			fishtankController.flam = 20;
			fishtankController.level = 1;
			fishtankController.view.querySelector('.score').innerHTML = " x " + fishtankController.flam;
			fishtankController.view.querySelector('.score2').innerHTML = "<br>Level " + fishtankController.level;
		}
		
		spam.style.left = (theTransform + 160) + "px";
		spam.style.top = '120px';
		spam.addEventListener("webkitTransitionEnd", fishtankController.spamIterate );
		fishtankController.tongs.src = "images/fishtank/tongs_opened.gif?" + Math.random();
		spam.id = "falling";
		setTimeout(fishtankController.releaseSpam, Math.random(), spam );
	}
}

fishtankController.releaseSpam = function(element){
	element.style.opacity = 1;
	var spamDelta = fishtankController.returnSpamPos("y") + 25;
	if( spamDelta > 400 ){
		element.style.opacity = 0;
	}
	if( spamDelta > 500 ){
		element.removeEventListener("webkitTransitionEnd", fishtankController.spamIterate );
		element.style.webkitTransform = "translate(0px, 0px)";
		fishtankController.spamReady(element);
	}else{
		element.style.webkitTransform = "translate(0px, "+ spamDelta +"px)";
	}
	
	fishtankController.rangeFinder();
}

fishtankController.spamIterate = function(event){
	setTimeout(fishtankController.releaseSpam, Math.random(), event.currentTarget );
}

fishtankController.getTongXPos = function(){
	var myElement = fishtankController.tongs ;
	var currentTransform = window.getComputedStyle(myElement).webkitTransform;
	var theTransform = new WebKitCSSMatrix(currentTransform).m41;
	return theTransform;
}

fishtankController.spamReady = function(element){
	element.id = "ready";
	fishtankController.tongs.src = "images/fishtank/tongs_closed.png";	
	fishtankController.view.querySelector('.fish1').style.background = "transparent";
	fishtankController.view.querySelector('.fish2').style.background = "transparent";
	fishtankController.view.querySelector('.fish3').style.background = "transparent";
	fishtankController.view.querySelector('.pinky').style.background = "transparent";
}

fishtankController.returnSpamPos = function(_pos){
	var _element = fishtankController.view.querySelector('.spam');
	var currentTransform = window.getComputedStyle( _element ).webkitTransform;
	var theTransform;
	if( _pos == "x"){
		return _element.offsetLeft;
	}else if( _pos == "y"){
		theTransform = new WebKitCSSMatrix(currentTransform).m42;
	}
	theTransform = String(theTransform).replace(/px,*\)*/g,"");
	return Number(theTransform);
}

/////////////////////
// Sound functions //
/////////////////////

fishtankController.seeFlam = function() {
		if( fishtankController.seeFlamCue > 3 ){
			fishtankController.seeFlamCue = 1;
		}else{
			fishtankController.seeFlamCue++;
		}
		fishtankController.seeFlamFX = new Audio();
	    fishtankController.seeFlamFX.src = "audio/fishtank/M_fishnoticingspam"+ fishtankController.seeFlamCue +".mp3";
	    fishtankController.seeFlamFX.style.display = "none";
	    document.body.appendChild(fishtankController.seeFlamFX);
	    fishtankController.seeFlamFX.volume = 0;
	    fishtankController.seeFlamFX.loop = false;
	    fishtankController.seeFlamFX.volume = Math.min(1, window.iTunes.volume);
	    fishtankController.seeFlamFX.play();
	
		setTimeout( function(sound){ 
			document.body.removeChild( sound )
			}, 2000, fishtankController.seeFlamFX );
}

fishtankController.flamSpit = function() {
		if( fishtankController.flamSpitCue > 6 ){
			fishtankController.flamSpitCue = 1;
		}else{
			fishtankController.flamSpitCue++;
		}
		fishtankController.flamSpitFX = new Audio();
	    fishtankController.flamSpitFX.src = "audio/fishtank/M_spitout"+ fishtankController.flamSpitCue +".mp3";
	    fishtankController.flamSpitFX.style.display = "none";
	    document.body.appendChild(fishtankController.flamSpitFX);
	    fishtankController.flamSpitFX.volume = 0;
	    fishtankController.flamSpitFX.loop = false;
	    fishtankController.flamSpitFX.volume = Math.min(1, window.iTunes.volume);
	    fishtankController.flamSpitFX.play();
	
		setTimeout( function(sound){ 
			document.body.removeChild( sound )
			}, 2000, fishtankController.flamSpitFX );
}

fishtankController.flamEaten = function() {
		if( fishtankController.flamEatenCue > 7 ){
			fishtankController.flamEatenCue = 1;
		}else{
			fishtankController.flamEatenCue++;
		}
		fishtankController.flamEatenFX = new Audio();
	    fishtankController.flamEatenFX.src = "audio/fishtank/M_fisheat"+ fishtankController.flamEatenCue +".mp3";
	    fishtankController.flamEatenFX.style.display = "none";
	    document.body.appendChild(fishtankController.flamEatenFX);
	    fishtankController.flamEatenFX.volume = 0;
	    fishtankController.flamEatenFX.loop = false;
	    fishtankController.flamEatenFX.volume = Math.min(1, window.iTunes.volume);
	    fishtankController.flamEatenFX.play();
	
		setTimeout( function(sound){ 
			document.body.removeChild( sound )
			}, 2000, fishtankController.flamEatenFX );
}

fishtankController.flamDropSound = function() {
		if( fishtankController.flamSoundCue > 4 ){
			fishtankController.flamSoundCue = 1;
		}else{
			fishtankController.flamSoundCue++;
		}
		fishtankController.flamDropSoundFX = new Audio();
	    fishtankController.flamDropSoundFX.src = "audio/fishtank/M_spamdrop"+ fishtankController.flamSoundCue +".mp3";
	    fishtankController.flamDropSoundFX.style.display = "none";
	    document.body.appendChild(fishtankController.flamDropSoundFX);
	    fishtankController.flamDropSoundFX.volume = 0;
	    fishtankController.flamDropSoundFX.loop = false;
	    fishtankController.flamDropSoundFX.volume = Math.min(1, window.iTunes.volume);
	    fishtankController.flamDropSoundFX.play();
	
		setTimeout( function(sound){ 
			document.body.removeChild( sound )
			}, 2000, fishtankController.flamDropSoundFX );
}

fishtankController.flamFishSounds = function() {
	if( (fishtankController.flamFishAudioCue % 5) == 0 ){
		if( fishtankController.flamFishAudioCue > 85 ){
			fishtankController.flamFishAudioCue = 5;
		}
		fishtankController.audioSoundFX = new Audio();
	    fishtankController.audioSoundFX.src = "audio/fishtank/flam-fish-"+(fishtankController.flamFishAudioCue/10)+".wav";
	    this.audioSoundFX.style.display = "none";
	    document.body.appendChild(fishtankController.audioSoundFX);
	    fishtankController.audioSoundFX.volume = 0;
	    fishtankController.audioSoundFX.loop = false;
	    fishtankController.audioSoundFX.volume = Math.min(1, window.iTunes.volume);
	    fishtankController.audioSoundFX.play();
	
		setTimeout( function(sound){ 
			document.body.removeChild( sound )
			}, 5000, fishtankController.audioSoundFX );
	}
}

fishtankController.startAudio = function(){
  document.body.removeChild(bookletController.audioLoop);

    bookletController.audioLoop = new Audio();
	bookletController.audioLoop.src = "audio/fishtank/loop.mp3";
    bookletController.audioLoop.style.display = "none";
    document.body.appendChild(bookletController.audioLoop);
    bookletController.audioLoop.volume = 0;
  if (bookletController.audioLoop) {
    bookletController.audioLoop.loop = appData.audioLoop.loop;
    bookletController.audioLoop.volume = Math.min(1, window.iTunes.volume);
    bookletController.audioLoop.play();
  }
}
