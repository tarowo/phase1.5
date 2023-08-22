var storyHelper = {};

storyHelper.pageForward = function(){
	if( bookController.turnOK == true ){
		bookController.turnOK = false;
		storyController.view.querySelector(".buttons").style.pointerEvents = "none";
		storyController.view.querySelector(".buttons > .left-arrow").style.display = "block";
	
		if( storyController.page <= 10 ){
			storyController.direction = "forward";
			storyController.count = storyController.page * 8;
			storyController.last = 8 + ( storyController.page * 8 );
			storyController.page++;
			storyController.iterate();
			if( storyController.page == 11 ){
				storyController.view.querySelector(".right-arrow").style.display = "none";
			}
		}
	}
}

storyHelper.pageBackward = function(){
	if( bookController.turnOK == true ){
		bookController.turnOK = false;
		storyController.view.querySelector(".buttons").style.pointerEvents = "none";
		storyController.view.querySelector(".buttons > .right-arrow").style.display = "block";
	
		if( storyController.page >= 0){
			storyController.direction = "backward";
			storyController.count = storyController.page * 8;
			storyController.last =  ( storyController.page * 8 ) - 8;
			storyController.page--;
			storyController.iterate();
		}
		if( storyController.page == 0 ){
			storyController.view.querySelector(".left-arrow").style.display = "none";
		}
	}
}

var storyController = new TKController({
  id: 'story',
  backButton: '.back',
  actions : [
	{ selector: '.right-arrow', action: storyHelper.pageForward },
	{ selector: '.left-arrow', action: storyHelper.pageBackward },
  ],
  highlightedElement: '.right-arrow',
});

storyController.viewDidLoad = function () { 
	bookController.turnOK = true;
	storyController.page = 0;
	storyController.count = 0;
	storyController.last = 0;
	storyController.large = false;
	storyController.direction = "forward";
	storyController.view.querySelector(".left-arrow").style.display = "none";
	storyController.view.querySelector(".page").src = "images/story/Book_000" + storyController.count + ".jpg";
};

storyController.iterate = function() {
	storyController.view.querySelector(".page").src = "images/story/Book_000" + storyController.count + ".jpg";
	
	if( storyController.direction == "forward" ){
		storyController.count++;
	}else{
		storyController.count--;
	}
	
	if( storyController.direction == "forward" ){
		if( storyController.last != (storyController.count-1) ){
			storyController.t =  setTimeout(storyController.iterate, 100 );
		}else{
			setTimeout(function(){ 
				storyController.view.querySelector(".buttons").style.pointerEvents = ""
				bookController.turnOK = true 
				}, 1000 );
		}
	}else{
		if( storyController.last != (storyController.count+1) ){
			storyController.t =  setTimeout(storyController.iterate, 100 );
		}else{
			setTimeout(function(){ 
				storyController.view.querySelector(".buttons").style.pointerEvents = "" 
				bookController.turnOK = true
				}, 1000 );
		}
	}
}

storyController.preferredElementToHighlightInDirection = function (currentElement, direction) {
	var element = undefined;

	if( direction == 39 ){
		if( storyController.page <= 10 ){
			storyHelper.pageForward();
		}
	}

	if( direction == 37 ){
		if( storyController.page > 0 ){
			storyHelper.pageBackward();
		}
	}

  return element;
};
