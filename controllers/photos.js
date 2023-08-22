var photosController = new TKPageSliderController({
  id: 'photos',
  previousPageButton : '.left-arrow',
  nextPageButton : '.right-arrow',
  backButton: '.back',
  highlightedElement: '.right-arrow',
  activatesFocusedPage : false
});

photosController.viewDidLoad = function () {
  this.slidingViewData = {
    orientation: TKSlidingViewOrientationHorizontal,
    activeElementIndex: 0,
    sideElementsVisible: 1,
    distanceBetweenElements: 1600,
    sideOffsetBefore: 0,
    sideOffsetAfter: 0,
    elements: this.createPhotos(),
    loops: true,   
    incrementalLoading : true
  };
};

photosController.createPhotos = function () {
  var elements = [];
  for (var i = 1; i <= appData.numberOfPhotos; i++) {
    var padded_index = (i < 10) ? '0' + i : i;
    var url = 'images/photos/photo_' + padded_index + '.jpg';
    elements.push({ 
      type: 'container',
      children: [ {type: 'image', src: url } ]
    });
  }
  return elements;
};

photosController.slidingViewDidFocusElementAtIndex = function (view, index) {
	var left = photosController.view.querySelector(".left-arrow");
	var right = photosController.view.querySelector(".right-arrow");
	var counter = photosController.view.querySelector(".counter");
	index++;
	var padded_index = (index < 10) ? '0' + index : index;
	counter.src = "images/photos/counter_"+padded_index+".png";
}