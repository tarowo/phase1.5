var bookHelper = {};

bookHelper.pageForward = function(){
	if( bookController.turnOK == true ){
		bookController.turnOK = false;
		bookController.view.querySelector(".buttons").style.pointerEvents = "none";
		bookController.view.querySelector(".buttons > .left-arrow").style.display = "block";
	
		if( bookController.page <= 12 ){
			bookController.direction = "forward";
			bookController.count = bookController.page * 8;
			bookController.last = 8 + ( bookController.page * 8 );
			bookController.page++;
			bookController.iterate();
			if( bookController.page == 13 ){
				bookController.view.querySelector(".right-arrow").style.display = "none";
			}
		}
	}
}

bookHelper.pageBackward = function(){
	if( bookController.turnOK == true ){
		bookController.turnOK = false;
		bookController.view.querySelector(".buttons").style.pointerEvents = "none";
		bookController.view.querySelector(".buttons > .right-arrow").style.display = "block";
	
		if( bookController.page >= 0){
			bookController.direction = "backward";
			bookController.count = bookController.page * 8;
			bookController.last =  ( bookController.page * 8 ) - 8;
			bookController.page--;
			bookController.iterate();
		}
		if( bookController.page == 0 ){
			bookController.view.querySelector(".left-arrow").style.display = "none";
		}
	}
}

var bookController = new TKController({
  id: 'book',
  actions : [
	{ selector: '.right-arrow', action: bookHelper.pageForward },
	{ selector: '.left-arrow', action: bookHelper.pageBackward },
	{ selector: '.largeImage', action: bookHelper.activate },
  ],
  backButton: '.back',
  highlightedElement: '.right-arrow',
});

bookController.viewDidLoad = function () { 
	bookController.turnOK = true;
	bookController.page = 0;
	bookController.count = 0;
	bookController.last = 0;
	bookController.large = false;
	bookController.direction = "forward";
	bookController.view.querySelector(".left-arrow").style.display = "none";
	bookController.view.querySelector(".page").src = "images/book/Booklet_Rnd2_000" + bookController.count + ".jpg";
};

bookController.iterate = function() {
	bookController.view.querySelector(".page").src = "images/book/Booklet_Rnd2_000" + bookController.count + ".jpg";
	
	if( bookController.direction == "forward" ){
		bookController.count++;
	}else{
		bookController.count--;
	}
	
	if( bookController.direction == "forward" ){
		if( bookController.last != (bookController.count-1) ){
			bookController.t =  setTimeout(bookController.iterate, 100 );
		}else{
			setTimeout(function(){ 
				bookController.view.querySelector(".buttons").style.pointerEvents = ""
				bookController.turnOK = true
				}, 1000 );
		}
	}else{
		if( bookController.last != (bookController.count+1) ){
			bookController.t =  setTimeout(bookController.iterate, 100 );
		}else{
			setTimeout(function(){ 
				bookController.view.querySelector(".buttons").style.pointerEvents = ""
				bookController.turnOK = true
				}, 1000 );
		}
	}
};


bookController.preferredElementToHighlightInDirection = function (currentElement, direction) {
	var element = undefined;
	if( direction == 39 ){
		if( bookController.page <= 12 ){
			bookHelper.pageForward();
		}
	}
	if( direction == 37 ){
		if( bookController.page > 0){
			bookHelper.pageBackward();
		}
	}
	return element;
};