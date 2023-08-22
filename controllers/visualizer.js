var vizController = new TKPageSliderController({
  id: 'visualizer',
  previousPageButton : '.left-arrow',
  nextPageButton : '.right-arrow',
  backButton: '.back',
  highlightedElement: '.right-arrow',
  activatesFocusedPage : false
});

vizController.viewDidLoad = function () {
  this.slidingViewData = {
    orientation: TKSlidingViewOrientationHorizontal,
    activeElementIndex: 0,
    sideElementsVisible: 1,
    distanceBetweenElements: 0,
    sideOffsetBefore: 0,
    sideOffsetAfter: 0,
    elements: this.createPhotos(),
    loops: true,   
    incrementalLoading : true
  };
};

vizController.viewDidAppear = function(){
	bookletController.stopAudioLoop();
	vizController.t = setTimeout(vizController.iterate, 2000);
}

vizController.clearAnimation = function(event){
	event.currentTarget.style.webkitAnimationName = "nil";
}

vizController.iterate = function(){
	vizController.t = setTimeout(vizController.iterate, 4000);
	vizController.slidingView.activeElementIndex++;
}

vizController.createPhotos = function () {
  var elements = [];
  for (var i = 1; i <= appData.numberOfPhotos; i++) {
    var padded_index = (i < 10) ? '0' + i : i;
    var url = 'images/visualizer/slide_' + padded_index + '.jpg';
    elements.push({ 
      type: 'container',
      children: [ {type: 'image', src: url } ]
    });
  }
  return elements;
};

vizController.slidingViewDidFocusElementAtIndex = function (view, index) {
	var left = photosController.view.querySelector(".left-arrow");
	var right = photosController.view.querySelector(".right-arrow");
	var counter = photosController.view.querySelector(".counter");
	index++;
	var padded_index = (index < 10) ? '0' + index : index;
	counter.src = "images/photos/counter_"+padded_index+".png";
}