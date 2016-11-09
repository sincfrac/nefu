/*
'nefu' MMORPG-style Web UI Library

Copyright (C) 2016 sincfrac

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/


(function( $ ) {
	$.fn.getUrlArgs = function() {
		var args = [];
		var pair = location.search.substring(1).split('&');
		for(var i=0; pair[i]; i++) {
		    var kv = pair[i].split('=');
		    args[kv[0]]=kv[1];
		}
		return args;
	};

  $.fn.toggleVisibility = function() {
  	var v = this.css('visibility');
  	if (v == 'visible') {
  		this.css('visibility', 'hidden');
  	}
  	else if (v == 'hidden') {
  		this.css('visibility', 'visible');
  	}
  	return this;
  };

  $.fn.nfShow = function() {
		this.addClass('nf-visible');
		var duration = this.data('visible-duration');
		if (duration) {
			setTimeout(function(e) {
				e.removeClass('nf-visible');
			}, duration, this);
		}
		return this;
  };

  $.fn.nfHide = function() {
  	this.removeClass('nf-visible');
  	return this;
  };

  $.fn.nfVisible = function(val) {
  	if (val == true) {
  		return this.nfShow();
  	}
  	else if (val == false) {
  		return this.nfHide();
  	}
  	else {
  		return this.hasClass('nf-visible');
  	}
  };

  $.fn.nfToggle = function() {
  	if (this.hasClass('nf-visible')) {
  		return this.nfHide();
  	}
  	else {
  		return this.nfShow();
  	}
  };

  var _nfPositionProp = function($elm, prop, val, max, force) {
		var cur = $elm[0].style[prop] || $elm.css(prop);
		if (cur) {
			if (cur.endsWith('px')) {
				$elm.css(prop, val+'px');
			}
			else if (cur.endsWith('%')) {
				$elm.css(prop, (val/max*100)+'%');
			}
			return true;
		} else if (force) {
			$elm.css(prop, val+'px');
			return true;
		}
		return false;
  };

  $.fn.nfPosition = function(left, top) {
  	return this.each(function() {
  		var $this = $(this);

			var width = $this.outerWidth(true),
					height = $this.outerHeight(true);
			var parWidth = $this.offsetParent().width(),
					parHeight = $this.offsetParent().height();

			var right  = parWidth - (left + width);
			var bottom = parHeight - (top + height);

			if (!_nfPositionProp($this, 'left', left, parWidth) &&
					!_nfPositionProp($this, 'right', right, parWidth)) {
				_nfPositionProp($this, 'left', left, parWidth, true);
			}
			if (!_nfPositionProp($this, 'top', top, parHeight) &&
					!_nfPositionProp($this, 'bottom', bottom, parHeight)) {
				_nfPositionProp($this, 'top', top, parHeight, true);
			}
  	});
  };

	var convertRelativeProp = function($elm, prop, max) {
		var val = $elm[0].style[prop] || $elm.css(prop);
		if (!val) { return; }
		if (val.endsWith('px')) {
			var rel = (parseInt(val) / max) * 100;
			$elm.css(prop, rel+'%');
		}
	};

  $.fn.convertPositionRelative = function(width, height) {
		return this.each(function() {
			var $elm = $(this);
			convertRelativeProp($elm, 'left', width);
			convertRelativeProp($elm, 'right', width);
			convertRelativeProp($elm, 'top', height);
			convertRelativeProp($elm, 'bottom', height);
		});
  };

  $.fn.visibility = function(val) {
  	if (val == true) {
  		this.css('visibility', 'visible');
  	} else if (val == false) {
  		this.css('visibility', 'hidden');
  	} else {
  		return this.css('visibility') == 'visible';
  	}
  	return this;
  };

  $.shuffle = function(arr) {
		for (var n=arr.length-1; n>=0; n--) {
			var i = Math.floor(Math.random() * n);
			var tmp = arr[n];
			arr[n] = arr[i];
			arr[i] = tmp;
		}
		return arr;
  };

  $.sample = function(arr) {
  	return arr[Math.floor(Math.random()*arr.length)];
  };

  $.nfPreload = function(urls, cbProgress, cbFinish, cbError) {
		// Start preloading resources
		var preloadNum = urls.length;

		function getExtension(filename) {
			var ss = filename.split('.');
			return ss[ss.length-1].toLowerCase();
		}

		function loadImageNext(arr) {
			if (arr.length == 0) {
				if (cbFinish) { cbFinish(); }
				return;
			}
			if (cbProgress) {
				cbProgress(1 - arr.length / preloadNum);
			}
			
			var src = arr.pop();
			var ext = getExtension(src);

			if (ext == 'jpg' || ext == 'png' || ext == 'gif') {
				var tmp = new Image();
				tmp.onload = function() {
					loadImageNext(arr);
				};
				tmp.onerror = function() {
					if (cbError) { cbError(); }
				};
				tmp.src = src;
			}
			else if (ext == 'mp3') {
				loadImageNext(arr);
				/*var tmp = new Audio();
				tmp.autoplay = false;
				tmp.onloadeddata = function() {
					loadImageNext(arr);
				};
				tmp.onerror = function() {
					if (config.preloadError) { config.preloadError(); }
				};
				tmp.src = src;
				tmp.load();*/
			}
		}

		loadImageNext(urls);
	};

	$.nfPlugin = function(pluginName, methods) {
		var _methods = methods;
		var _name = pluginName;
		$.fn[pluginName] = function(m) {
	    if ( _methods[m] ) {
	      return _methods[m].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } else if ( typeof m === 'object' || typeof m === 'function' || ! m ) {
	      return _methods.init.apply( this, arguments );
	    } else {
	      $.error( 'Method ' +  m + ' does not exist on jQuery.' + _name );
	    }
		};
	};

})( jQuery );
