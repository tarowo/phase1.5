var musicController = new TKLyricsController({
  id: 'music',
  preloads : [ 
	'images/music/song_01.png', 
	'images/music/song_02.png', 
	'images/music/song_03.png', 
	'images/music/song_04.png', 
	'images/music/song_05_01.png', 
	'images/music/song_05_02.png', 
	'images/music/song_06_01.png', 
	'images/music/song_06_02.png', 
	'images/music/song_07.png', 
	'images/music/song_08.png', 
	'images/music/song_09.png', 
	'images/music/song_10.png', 
	'images/music/song_11.png', 
	'images/music/song_12_01.png', 
	'images/music/song_12_02.png', 
	'images/music/song_13.png', 
	'images/music/song_14.png', 
	'images/music/song_15.png', 
	'images/music/song_16.png', 
	'images/music/song_17.png', 
	'images/music/song_18.png', 
  ],
  navigatesTo : [
    { selector: '.navigation > .photos', controller: 'photos' },
    { selector: '.navigation > .videos', controller: 'videos' },
    { selector: '.navigation > .book', controller: 'book' },
    { selector: '.navigation > .story', controller: 'story' }
  ],
  outlets : [
    { name: 'container', selector: '.lyrics-container' },
    { name: 'up', selector: '.up' },
    { name: 'down', selector: '.down' },
  ],
  backButton: '.back',
  highlightedElement: '.play',
  scrollableElement : '.lyrics-scrollcontainer',
  numberOfSongs: appData.songs.length,
  previousSongButton: '.left-arrow',
  nextSongButton: '.right-arrow'
});

musicController.viewDidLoad = function () {
	musicController.first = true;
	musicController.selected = '01';
	
	var songActions = [];
	
	for (var i = 0; i < appData.songs.length; i++) {
		
	  var padded_index = (i < 9) ? '0' + (i+1) : (i+1);
	  songActions.push({
	    selector: '#song' + padded_index,
	    action: 'jumpToSong',
	    arguments: [i]
	  });
	}
	
	songActions.push({
	    selector: '.songlist > .up',
	    action: 'goUp'
	  });
	
	songActions.push({
	    selector: '.songlist > .down',
	    action: 'goDown'
	  });
	
	songActions.push({
	    selector: '.buttons > .play',
	    action: 'playCurrentSong'
	  });

	this.actions = songActions;
}

musicController.viewDidAppear = function () {
	if (musicController.first)	{
		musicController.showWithSongAtIndex(0);
		musicController.first = false;
	}
}

musicController.songDidChange = function (songIndex) {
  musicController.songNumber = songIndex ;
  this.container.textContent = '';
  this.container.scrollTop = 0;
  var padded_index = (songIndex < 9) ? '0' + (songIndex+1) : (songIndex+1);
  document.getElementById('song'+musicController.selected).removeClassName('tk-highlighted');
  musicController.selected = padded_index;
  document.getElementById('song'+musicController.selected).addClassName('tk-highlighted');

  document.querySelector('.lyrics-photo').style.background = 'url(images/music/photos/songphoto_'+padded_index+'.jpg)';
  document.querySelector('.whitesquare').style.display = appData.songs[songIndex].scroll ;

  if ( Number(musicController.selected) > 9 )  {
	document.querySelector('.thelist').style.top = '-160px';
  } else {
	document.querySelector('.thelist').style.top = '0px';
  }

  if( appData.songs[songIndex].ls == 1)  {
	this.container.appendChild(document.createElement('img')).src = 'images/music/song_' + padded_index + '.png';
  } else {
	for (var i=1; i < appData.songs[songIndex].ls + 1; i++) {
		this.container.appendChild(document.createElement('img')).src = 'images/music/song_' + padded_index + '_0'+i+'.png';
	};
  }

};

musicController.showWithSongAtIndex = function (index) {
  bookletController.navigation.pushController(this);
  this.currentSong = index;
};

musicController.jumpToSong = function (index) {
  this.currentSong = index;
};

musicController.playCurrentSong = function () {
	bookletController.play(appData.songs[this.currentSong]);
};

musicController.goUp = function () {
	document.querySelector('.thelist').style.top = '0px';
	document.getElementById('song'+musicController.selected).addClassName('tk-highlighted');
};

musicController.goDown = function () {
	document.querySelector('.thelist').style.top = '-160px';
	document.getElementById('song'+musicController.selected).addClassName('tk-highlighted');
};