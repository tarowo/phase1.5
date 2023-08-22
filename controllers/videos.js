var videosHelper = {};

videosHelper.goVideo = function (index) {
	if (appData.videos[index].XID) {
		bookletController.play(appData.videos[index]);
	} else if (appData.videos[index].src) {
		bookletController.playNonLibraryContent(appData.videos[index]);
	}
}

var videosController = new TKController({
  id: 'videos',
  backButton : '.back',
  actions : [
    { selector: '.left-arrow',  action: 'previousPage' },
    { selector: '.right-arrow', action: 'nextPage' },

    { selector: '.div1of1', action: function(){ videosHelper.goVideo(0) }  },
    { selector: '.div2of1', action: function(){ videosHelper.goVideo(1) }  },
    { selector: '.div3of1', action: function(){ videosHelper.goVideo(2) }  },
    { selector: '.div4of1', action: function(){ videosHelper.goVideo(3) }  },
    { selector: '.div5of1', action: function(){ videosHelper.goVideo(4) }  },
    { selector: '.div6of1', action: function(){ videosHelper.goVideo(5) }  },

    { selector: '.div1of2', action: function(){ videosHelper.goVideo(6) }  },
    { selector: '.div2of2', action: function(){ videosHelper.goVideo(7) }  },
    { selector: '.div3of2', action: function(){ videosHelper.goVideo(8) }  },
    { selector: '.div4of2', action: function(){ videosHelper.goVideo(9) }  },
    { selector: '.div5of2', action: function(){ videosHelper.goVideo(10) }  },
    { selector: '.div6of2', action: function(){ videosHelper.goVideo(11) }  },

    { selector: '.div1of3', action: function(){ videosHelper.goVideo(12) }  },
    { selector: '.div2of3', action: function(){ videosHelper.goVideo(13) }  },
    { selector: '.div3of3', action: function(){ videosHelper.goVideo(14) }  },
    { selector: '.div4of3', action: function(){ videosHelper.goVideo(15) }  },
    { selector: '.div5of3', action: function(){ videosHelper.goVideo(16) }  },
    { selector: '.div6of3', action: function(){ videosHelper.goVideo(17) }  },
    { selector: '.div7of3', action: function(){ videosHelper.goVideo(18) }  },
    { selector: '.div8of3', action: function(){ videosHelper.goVideo(19) }  },
    { selector: '.div9of3', action: function(){ videosHelper.goVideo(20) }  },
    { selector: '.div10of3', action: function(){ videosHelper.goVideo(21) }  },
    { selector: '.div11of3', action: function(){ videosHelper.goVideo(22) }  },
    { selector: '.div12of3', action: function(){ videosHelper.goVideo(23) }  },
  ],
  currentPage : 0,
	highlightedElement : '.div1of1',
});

videosController.viewDidLoad = function () {
  this.pages = this._view.querySelectorAll('.page');
  this.pagesElements = [];
  for (var i = 0; i < this.pages.length; i++) {
    this.pagesElements.push(this.pages[i].querySelectorAll('.image-fader-videos'));
  }
  videosController.view.querySelector(".left-arrow").style.display = "none";
  videosController.pageNumber = 1;
};

videosController.viewDidAppear = function () {
	bookletController.stopAudioLoop();
	document.getElementById("navigation").style.pointerEvents = 'all';
	
	for (var i=0; i < this.pages.length; i++) {
	  	this.pages[i].style.zIndex = 8000;
	    this.pages[i].addClassName("disableLinks");
	};
	
	this.pages[this.currentPage].style.zIndex = 10000;
	this.pages[this.currentPage].removeClassName("disableLinks");
	
	if( videosController.pageNumber == 1 ){
		var firstElement = videosController.view.querySelector(".div1of1")
		setTimeout(function(){ TKSpatialNavigationManager.sharedManager.highlightElement(firstElement) }, 500 );
  	}

	if( videosController.pageNumber == 2 ){
		var firstElement = videosController.view.querySelector(".div1of2")
		setTimeout(function(){ TKSpatialNavigationManager.sharedManager.highlightElement(firstElement) }, 500 );
  	}

  	if( videosController.pageNumber == 3 ){
		var firstElement = videosController.view.querySelector(".div1of3")
		setTimeout(function(){ TKSpatialNavigationManager.sharedManager.highlightElement(firstElement) }, 500 );
  	}
};



videosController.previousPage = function () {
  var previous_page = this.pages[this.currentPage];
  this.currentPage = (this.currentPage + this.pages.length - 1) % this.pages.length;
  var next_page = this.pages[this.currentPage];

  for (var i=0; i < this.pages.length; i++) {
  	this.pages[i].style.zIndex = 8000;
    this.pages[i].addClassName("disableLinks");
  };

  this.pages[this.currentPage].style.zIndex = 10000;
  this.pages[this.currentPage].removeClassName("disableLinks");

  if( videosController.pageNumber == 2 ){
	var firstElement = videosController.view.querySelector(".div1of1")
	setTimeout(function(){ TKSpatialNavigationManager.sharedManager.highlightElement(firstElement) }, 500 );
	videosController.view.querySelector(".left-arrow").style.display = "none";
  }

  if( videosController.pageNumber == 3 ){
	var firstElement = videosController.view.querySelector(".div1of2")
	setTimeout(function(){ TKSpatialNavigationManager.sharedManager.highlightElement(firstElement) }, 500 );
  }

  videosController.view.querySelector(".right-arrow").style.display = "block";
  videosController.pageNumber--;

  TKTransaction.begin();
  previous_page.applyTransition({ properties : ['opacity'], to : ['0'] });
  next_page.applyTransition({ properties : ['opacity'], from : ['0'], to : ['1'] });
  TKTransaction.commit();
};

videosController.nextPage = function () {
  var previous_page = this.pages[this.currentPage];
  this.currentPage = (this.currentPage + 1) % this.pages.length;
  var next_page = this.pages[this.currentPage];

  for (var i=0; i < this.pages.length; i++) {
  	this.pages[i].style.zIndex = 8000;
	this.pages[i].addClassName("disableLinks");
  };
  
  this.pages[this.currentPage].style.zIndex = 10000;
  this.pages[this.currentPage].removeClassName("disableLinks");

  if( videosController.pageNumber == 2 ){
	var firstElement = videosController.view.querySelector(".div1of3")
	setTimeout(function(){ TKSpatialNavigationManager.sharedManager.highlightElement(firstElement) }, 500 );
	videosController.view.querySelector(".right-arrow").style.display = "none";
  }

  if( videosController.pageNumber == 1 ){
	var firstElement = videosController.view.querySelector(".div1of2")
	setTimeout(function(){ TKSpatialNavigationManager.sharedManager.highlightElement(firstElement) }, 500 );
  }

  videosController.view.querySelector(".left-arrow").style.display = "block";
  videosController.pageNumber++;

  TKTransaction.begin();
  previous_page.applyTransition({ properties : ['opacity'], to : ['0'] });
  next_page.applyTransition({ properties : ['opacity'], from : ['0'], to : ['1'] });
  TKTransaction.commit();
};

videosController.preferredElementToHighlightInDirection = function (currentElement, direction) {
	var element = undefined;
 	if (currentElement === videosController.view.querySelector(".div1of1") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div2of1") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div3of1") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div1of2") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div2of2") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div3of2") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div1of3") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div2of3") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div3of3") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div4of3") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div5of3") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div6of3") && direction == KEYBOARD_UP) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div1of1") && direction == KEYBOARD_LEFT) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div1of2") && direction == KEYBOARD_LEFT) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div1of3") && direction == KEYBOARD_LEFT) {
		element = currentElement;
	} else if (currentElement === videosController.view.querySelector(".div7of3") && direction == KEYBOARD_LEFT) {
		element = currentElement;
	} else if (currentElement == this.view.querySelector(".div4of1") && direction == KEYBOARD_LEFT){
	  return null
	} else if (currentElement == this.view.querySelector(".left-arrow") && direction == KEYBOARD_LEFT){ 
	  return null
	}
	return element;  
};