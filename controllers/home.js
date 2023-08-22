var homeHelper = {};

homeHelper.visualizer = function(){
	if(!IS_APPLE_TV){
		TKNavigationController.sharedNavigation.pushController(vizController);
	}
	var playlist = bookletController.buildPlaylist(appData.songs);
    playlist.play();
}

homeHelper.roomPanDone = function(event){
	if( homeHelper.videoJump == true ){
		homeHelper.videoJump = false;
		homeHelper.goDark();
	}
}

homeHelper.goRight = function() {
  homeController.side = 'right';
  homeController.room.style.backgroundPositionX = '-1194px';
  homeController.room.style.webkitTransitionDelay = '0ms';

  homeController.btn_1.style.visibility = 'hidden';
  homeController.btn_2.style.visibility = 'hidden';
  homeController.btn_3.style.visibility = 'hidden';
  homeController.btn_5.style.visibility = 'hidden';
 
  homeController.btn_4.style.visibility = 'visible';
  homeController.btn_6.style.visibility = 'visible';
  homeController.btn_7.style.visibility = 'visible';
  homeController.btn_8.style.visibility = 'visible';

  homeController.forward.style.visibility = 'hidden';
  homeController.backward.style.visibility = 'visible'; 

  homeController.remote.style.webkitTransitionDelay = '500ms';
  homeController.remote.style.visibility = 'visible';
  homeController.remote.style.top = '0px';
  homeController.remote.addEventListener("webkitTransitionEnd", homeHelper.roomPanDone );
  homeController.bubbles.style.visibility = 'visible';

  if (window.iTunes.platform == "Windows" || window.iTunes.platform == "Mac" || window.iTunes.platform == "Emulator") {
	homeController.animations.style.left = '-1196px';
	homeController.animations.style.webkitTransitionDelay = '0ms';
  }
  else 
  {
	homeController.animations.style.visibility = 'hidden';
  }
  setTimeout(function(){ TKSpatialNavigationManager.sharedManager.highlightElement(homeController.btn_4) }, 1500 );
};

homeHelper.goLeft = function() {
	
  homeController.side = 'left';
  this.room.style.backgroundPositionX = '0px';
  this.room.style.webkitTransitionDelay = '500ms';

  this.btn_1.style.visibility = 'visible';
  this.btn_2.style.visibility = 'visible';
  this.btn_3.style.visibility = 'visible';
  this.btn_5.style.visibility = 'visible';

  this.btn_4.style.visibility = 'hidden';
  this.btn_6.style.visibility = 'hidden';
  this.btn_7.style.visibility = 'hidden';
  this.btn_8.style.visibility = 'hidden';

  this.backward.style.visibility = 'hidden'; 
  this.forward.style.visibility = 'visible'; 

  this.remote.style.webkitTransitionDelay = '0ms';
  this.remote.style.visibility = 'hidden';
  this.remote.style.top = '-597px';

  this.bubbles.style.visibility = 'hidden';

  if (window.iTunes.platform == "Windows" || window.iTunes.platform == "Mac" || window.iTunes.platform == "Emulator") {
	this.animations.style.left = '0px';
	this.animations.style.webkitTransitionDelay = '500ms';
  } else  {
	this.animations.style.visibility = 'visible';
  }
  setTimeout(function(){ TKSpatialNavigationManager.sharedManager.highlightElement(homeController.btn_1) }, 1500 );
};

homeHelper.goDark = function() {
	document.getElementById("navigation").style.pointerEvents = 'none';
	homeController.navigation.style.webkitTransitionDelay = '0s';
	homeController.navigation.style.webkitTransform = 'translateY(0px)';
   	if (window.iTunes.platform == "Windows" || window.iTunes.platform == "Mac" || window.iTunes.platform == "Emulator") {
   		homeController.dark.addEventListener('webkitAnimationIteration', homeHelper.swapDark, false);
		homeController.dark.style.visibility = 'visible';
 	} else  {
	    TKNavigationController.sharedNavigation.pushController(videosController);
	}
};

homeHelper.swapDark = function(event) {
	
	if ( homeController.timer < 12)	{
		homeController.timer++;
		event.currentTarget.style.background = 'url(images/home/dark/'+ homeController.timer +'.jpg)';
	} else {
		homeController.video_shell = document.createElement("div");
		homeController.video_shell.id = 'video_shell';
		home.appendChild(homeController.video_shell);
		homeController.video_intro = document.createElement("video");
		homeController.video_intro.id = 'video_intro';
		homeController.video_intro.src = "images/home/video_intro.mov"; 
		homeController.video_intro.loop = false;
		homeController.video_intro.autoplay = true;
		homeController.video_shell.appendChild(homeController.video_intro);
		homeController.video_intro.load();
		event.currentTarget.removeEventListener('webkitAnimationIteration', homeHelper.swapDark, false);	
	    homeController.video_intro.addEventListener('ended', homeHelper.goVideo );
	}
}

homeHelper.goVideo = function(event) {
	if ( document.getElementById('video_shell')) {
		home.removeChild(homeController.video_shell);
	}
	TKNavigationController.sharedNavigation.pushController(videosController);
}

homeHelper.jumpToVideo = function(){
	homeController.navigation.style.webkitTransitionDelay = '0s';
	homeController.navigation.style.webkitTransform = 'translateY(0px)';
	
	document.getElementById("navigation").style.pointerEvents = 'none';
	
	if( homeController.side == 'right' ){
		homeHelper.goDark();
	}else{
		homeHelper.videoJump = true;
		homeHelper.goRight();
	}
}

homeHelper.activePirate = function(event){
	event.currentTarget.src = "images/home/pirate.gif?" + Math.random();
}

homeHelper.disactivePirate = function(event){
	event.currentTarget.src = "images/home/pirateStill.gif";
}


var homeController = new TKController({
  id: 'home',
  actions : [
    { selector: '.hotspots > .btn_1', action: homeHelper.visualizer },
    { selector: '.buttons > .forward', action: homeHelper.goRight },
    { selector: '.buttons > .backward', action: homeHelper.goLeft },
    { selector: '.hotspots > .btn_4', action: homeHelper.goDark },
	{ selector: '.hotspots > .btn_8', action: function(){ bookletController.playNonLibraryContent( appData.extra[0].items[0] ) } },
	{ selector: '.navigation > .videos', action: homeHelper.jumpToVideo },
  ],
  navigatesTo : [
    { selector: '.hotspots > .btn_2', controller: 'music' },
    { selector: '.hotspots > .btn_3', controller: 'photos' },
    { selector: '.hotspots > .btn_5', controller: 'book' },
    { selector: '.hotspots > .btn_6', controller: 'story' },
    { selector: '.hotspots > .btn_7', controller: 'instructions' },
    { selector: '.navigation > .songs', controller: 'music' },
	{ selector: '.navigation > .credits', controller: 'book' },
    { selector: '.navigation > .photos', controller: 'photos' },
    { selector: '.navigation > .book', controller: 'book' },
    { selector: '.navigation > .story', controller: 'story' },
	{ selector: '.navigation > .game', controller: 'instructions' },
	{ selector: '.navigation > .download', controller: 'onlineextras' }
  ],
  outlets : [
    { name: 'room', selector: '.room' },
    { name: 'forward', selector: '.forward' },
    { name: 'backward', selector: '.backward' },
    { name: 'dark', selector: '.dark' },
    { name: 'remote', selector: '.remote' },
    { name: 'eye', selector: '.eye' },
    { name: 'animations', selector: '.animations' },
    { name: 'bubbles_timer', selector: '.room > .bubbles > .bubbles_timer' },
	{ name: 'bubbles', selector: '.room > .bubbles' },
    { name: 'btn_1', selector: '.hotspots > .btn_1' },
    { name: 'btn_2', selector: '.hotspots > .btn_2' },
	{ name: 'btn_3', selector: '.hotspots > .btn_3' },
	{ name: 'btn_4', selector: '.hotspots > .btn_4' },
	{ name: 'btn_5', selector: '.hotspots > .btn_5' },
	{ name: 'btn_6', selector: '.hotspots > .btn_6' },
	{ name: 'btn_7', selector: '.hotspots > .btn_7' },
	{ name: 'btn_8', selector: '.hotspots > .btn_8' },
	{ name: 'navigation', selector: '.room > .navigation' },
  ],
  highlightedElement : '#btn_1',
});

homeController.videoDone = function(event){
	setTimeout(function(){ 
		homeController.view.style.opacity = 1; 
		homeController.navigation.style.webkitTransform = 'translateY(-76px)';
		}, 1000 );
}

homeController.checkMousePos = function(event){
	var posY = event.y - document.getElementById("navigation").offsetTop;
	var posX = event.x - document.getElementById("navigation").offsetLeft;
	if( posY > 600 ){
		homeController.navigation.style.webkitTransform = 'translateY(-76px)';
	}else{
		homeController.navigation.style.webkitTransform = 'translateY(0px)';
	}
	var astigmatismX;
	var astigmatismY;
	if( (posX - 335) < 0 ){
		astigmatismX = 50;
	}else{
		astigmatismX = 100;
	}
	if( (posY - 501) < 0 ){
		astigmatismY = 100;
	}else{
		astigmatismY = 20;
	}
	homeController.view.querySelector(".room > .animations > .eye").style.webkitTransform = "translate(" + ((posX - 335)/astigmatismX) + "px, " + ((posY - 501)/astigmatismY) + "px)" ;
}

homeController.clickclack = function(event){
	//homeController.eyeballSound();
	event.currentTarget.src = "images/home/balls.gif?" + Math.random();
}

homeController.clickclackDone = function(event){
	//homeController.eyeballSound();
	event.currentTarget.src = "images/home/ballsDone.gif";
}

homeController.viewDidLoad = function () {
	homeController.eyeballCue = 0;
	homeController.eyeSoundReady = true;
	
	if(! IS_APPLE_TV ){
		setTimeout( function(){
			homeController.view.style.opacity = 1; 
			document.getElementById("home").addEventListener("mousemove", homeController.checkMousePos );
			homeController.view.querySelector(".balls").addEventListener("mouseover", homeController.clickclack ); 
			homeController.view.querySelector(".balls").addEventListener("mouseout", homeController.clickclackDone ); 
			homeController.view.querySelector(".room > .animations > .pirate").addEventListener("mouseover", homeHelper.activePirate ); 
			homeController.view.querySelector(".room > .animations > .pirate").addEventListener("mouseout", homeHelper.disactivePirate );
		}, 2000 );
	}else{
		homeController.view.style.opacity = 1;
	}

	setTimeout( function(){ bookletController.playNonLibraryContent( appData.extra[0].items[1] ) }, 0);	
	homeController.side = 'left';
}

homeController.viewDidAppear = function () {
	bookletController.startAudioLoop();
	clearTimeout(vizController.t);
	clearTimeout(fishtankController.t);
	if( homeController.side == 'right' ){
		homeController.navigation.style.webkitTransform = 'translateY(-76px)';
	}
	
	homeController.timer = 1;
	
	this.dark.style.visibility = 'hidden';
	this.dark.style.background = 'url(images/home/dark/1.jpg)';
	
	if ( homeController.side == 'left') {
		this.btn_1.style.visibility = 'visible';
		this.btn_2.style.visibility = 'visible';
		this.btn_3.style.visibility = 'visible';
		this.btn_5.style.visibility = 'visible';

		this.btn_4.style.visibility = 'hidden';
		this.btn_6.style.visibility = 'hidden';
		this.btn_7.style.visibility = 'hidden';
		this.btn_8.style.visibility = 'hidden';
		this.bubbles.style.visibility = 'hidden';
	} else	{
		this.btn_1.style.visibility = 'hidden';
		this.btn_2.style.visibility = 'hidden';
  		this.btn_3.style.visibility = 'hidden';
		this.btn_5.style.visibility = 'hidden';

		this.btn_4.style.visibility = 'visible';
		this.btn_6.style.visibility = 'visible';
		this.btn_7.style.visibility = 'visible';
		this.btn_8.style.visibility = 'visible';
		this.bubbles.style.visibility = 'visible';
	}
	this.bubbles_timer.addEventListener( 'webkitAnimationIteration' , homeController.sendBubble, false );
}



homeController.sendBubble = function (event) {
	var bubble = document.createElement('div');
	var randomPosition = homeController.randomInteger(1, 1280);
	
	if ( randomPosition > 600 )
	{
		bubble.id = 'bubble_2';
	} else {
		bubble.id = 'bubble_1';
	}
	
	var randomBubblePositionX = homeController.randomInteger(1, 211);
	var randomBubblePositionY = homeController.randomInteger(1, 20);
	
	bubble.style.left 	= ''+randomBubblePositionX+'px';
	bubble.style.bottom 	= ''+randomBubblePositionY+'px';
	
	homeController.bubbles.appendChild(bubble);
	bubble.addEventListener('webkitAnimationEnd', homeController.killBubble, false);
}

homeController.killBubble = function (event) {
	homeController.bubbles.removeChild(event.currentTarget);
}

homeController.eyeballSound = function() {
	if( homeController.eyeSoundReady == true ){
		homeController.eyeSoundReady = false;
		if( homeController.eyeballCue > 6 ){
			homeController.eyeballCue = 1;
		}else{
			homeController.eyeballCue++;
		}
		homeController.eyeballFX = new Audio();
	    homeController.eyeballFX.src = "audio/eyeball/eyeball"+ homeController.eyeballCue +".mp3";
	    homeController.eyeballFX.style.display = "none";
	    document.body.appendChild(homeController.eyeballFX);
	    homeController.eyeballFX.volume = 0;
	    homeController.eyeballFX.loop = false;
	    homeController.eyeballFX.volume = Math.min(1, window.iTunes.volume);
	    homeController.eyeballFX.play();
	
		setTimeout( function(sound){ 
			document.body.removeChild( sound );
			homeController.eyeSoundReady = true;
			}, 500, homeController.eyeballFX );
	}
}

homeController.randomInteger = function(low, high) {	
	return low + Math.floor(Math.random() * (high - low));	
}

homeController.preferredElementToHighlightInDirection = function (currentElement, direction) {
	var element = undefined;
 	if (currentElement === btn_1 && direction == KEYBOARD_RIGHT) {
	 element = btn_5;
	 } 
	else if (currentElement === btn_1 && direction == KEYBOARD_LEFT) {
	 element = currentElement;
	 }
 	else if (currentElement === btn_3 && direction == KEYBOARD_RIGHT) {
	 element = btn_2;
	 } 
 	else if (currentElement === btn_2 && direction == KEYBOARD_LEFT) {
	 element = btn_3;
	 }
 	else if (currentElement === btn_2 && direction == KEYBOARD_UP) {
	 element = forward;
	 }    
 	else if (currentElement === forward && direction == KEYBOARD_LEFT) {
 	 element = btn_3;
 	 }
 	else if (currentElement === btn_7 && direction == KEYBOARD_LEFT) {
 	 element = btn_8;
 	 }   
 	else if (currentElement === backward && (direction == KEYBOARD_LEFT || direction == KEYBOARD_UP)) {
 	 element = currentElement;
 	 }
	else if (currentElement === forward && direction == KEYBOARD_UP) {
 	 element = currentElement;
 	 }
	else if (currentElement === btn_2 && direction == KEYBOARD_RIGHT) {
	 element = forward;
	 }
	 return element;  
};