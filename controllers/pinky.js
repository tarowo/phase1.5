function Pinky(_fish) {
	_fish.src = "images/fishtank/pinky_left.gif";
	_fish.id = "left";
	_fish._parent = this;
	setTimeout(this.init, 10, _fish);
}

Pinky.prototype.init = function(_fish) { 
	_fish.addEventListener("webkitTransitionEnd", _fish._parent.iterate );
	_fish.style.webkitTransform = "translate(10px, 0px)";
}

Pinky.prototype.iterate = function(event) {
	if( event.currentTarget._parent.caught == "true" ){
		event.currentTarget._parent.caught = "false";
		setTimeout( event.currentTarget._parent.wkTransform, 50, event.currentTarget, 0, 0 );
		event.currentTarget.id = "left";
		event.currentTarget.src = "images/fishtank/pinky_left.gif";
	}else{
		event.currentTarget.style.opacity = 1;
	}
}

Pinky.prototype.wkTransform = function(element, xpos, ypos){
	element.style.webkitTransform = "translate("+ xpos +"px, "+ ypos +"px)"; 
}

Pinky.prototype.returnPos = function(_pos, _element){
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