function Fish(_fish, _delay) {
	var pos = 100 + Math.round( Math.random() * 400 ) ;
	_fish.src = "images/fishtank/fish_right.gif";
	_fish.id = "right";
	this.turned = 0;
	this.i = 1;
	_fish._parent = this;
}

Fish.prototype.init = function(_fish) { 
	var currentTransform = window.getComputedStyle( _fish ).webkitTransform;
	var theTransform;
	theTransform = new WebKitCSSMatrix(currentTransform).m41;
	theTransform = String(theTransform).replace(/px,*\)*/g,"");

	var m = 11 + Number(theTransform);
}

Fish.prototype.iterate = function(element) {	
	element.style.background = "transparent";
	element.style.webkitTransitionDelay = '0s'; 
	var s = Math.round( Math.sin( element._parent.i ) * 100 );
	var r = Math.round( Math.cos( element._parent.i ) * 30 );

	var currentTransform = window.getComputedStyle( element ).webkitTransform;
	var theTransform;
	theTransform = new WebKitCSSMatrix(currentTransform).m41;
	theTransform = String(theTransform).replace(/px,*\)*/g,"");

	if( theTransform > (800 ) ){
		element.style.webkitTransform = "nil";
		element.id = "left";

		if( element._parent.turned <= 0){
			element.src = "images/fishtank/fish_rightleft.gif";
			element._parent.turned = 3;
		}

		element.style.webkitTransformOriginX = "20";
		element.style.webkitTransformOriginY = "50";
		r = r*-1;
	}else if( theTransform < 100 ){
		element.style.webkitTransform = "nil";
		element.id = "right";
		
		if( element._parent.turned <= 0){
			element.src = "images/fishtank/fish_leftright.gif";
			element._parent.turned = 3;
		}
		
		element.style.webkitTransformOriginX = "150";
		element.style.webkitTransformOriginY = "50";
		r = r*-1;
	}else{
		element._parent.turned--;
		if( element.id == "right" ){
			element.src = "images/fishtank/fish_right.gif";
		}else{
			element.src = "images/fishtank/fish_left.gif";
		}
	}
	
	if( element.id == "right" ){
		element._parent.i++;
	}else{
		element._parent.i--;	
	}
	
	var randX = Math.round( Math.random() * 100 ) + 50;
	setTimeout( element._parent.wkTransform, 50, element, (element._parent.i*150), s, r);
}

Fish.prototype.wkTransform = function(element, xpos, ypos, r){
	element.style.webkitTransform = "translate("+ xpos +"px, "+ ypos +"px) rotate("+ r +"deg)";
}

Fish.prototype.returnPos = function(_pos, _element){
	var currentTransform = window.getComputedStyle( _element ).webkitTransform;
	var theTransform;
	if( _pos == "x"){
		theTransform = new WebKitCSSMatrix(currentTransform).m41;
	}else if( _pos == "y"){
		theTransform = new WebKitCSSMatrix(currentTransform).m42;
	}
	theTransform = String(theTransform).replace(/px,*\)*/g,"");
	return Number(theTransform);
}