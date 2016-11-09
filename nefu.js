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






/*
	nfLayer
*/
(function( $ ) {
	$.nfPlugin('nfLayer', 
	{
		init: function() {
			return this.each(function() {
				var $this = $(this);
				// Hide object
				$this.hide().css('visibility', 'visible');

				// Show
				if ($this.hasClass('visible')) {
					$this.nfLayer('show');
				}
			});
		},

		visible: function() {
			return this.css('display') == 'block';
		},

		show: function() {
			return this.each(function() {
				var $this = $(this);
				if ($this.css('display') == 'block') { return; }

				// Show layer container
				$this.show();

				// Show elements
				$this.find('.visible').addClass('nf-visible');

				// delay visible
				$this.find('[data-visible-delay]').each(function() {
					var elm = $(this);
					var delay = elm.data('visible-delay');
					if (delay == 0) {
						elm.nfShow();
					}
					else {
						elm.removeClass('nf-visible');
						setTimeout(function(e) {
							e.nfShow();
						}, delay, elm);
					}
				});

				// Update
				$this.nfLayer('update');

				// Execute handler
				var onStart = $this.data('onstart');
				if (onStart) { eval(onStart); }
			});
		},

		hide: function() {
			return this.each(function() {
				var $this = $(this);
				if (!$this.css('display') == 'none') { return; }

				// Hide container
				$this.hide();

				// Hide elements
				$this.find('.nf-visible').removeClass('nf-visible');

				// Execute handler
				var onEnd = $this.data('onend');
				if (onEnd) { eval(onEnd); }
			});
		},

		update: function() {
			return this.each(function() {
				$this = $(this);
				// Update conditional visible
				$this.find('[data-visible-condition]').each(function() {
					var elm = $(this);
					var cond = elm.data('visible-condition');
					if (eval(cond) == true) {
						elm.addClass('nf-visible');
					}
					else {
						elm.removeClass('nf-visible');
					}
				});

				// Execute handler
				var onUpdate = $this.data('onupdate');
				if (onUpdate) { eval(onUpdate); }
			});
		},

		loadAudio: function() {
			return this.each(function() {
				$(this).find('audio').each(function() {
					this.load();
				});
			});
		},

		playAudio: function() {
			return this.each(function() {
				$(this).find('audio').each(function() {
					var delay = $(this).data('delay') || 0;
					if (delay == 0) {
						this.play();
					}
					else {
						var audio = this;
						setTimeout(function() {
							audio.play();
						}, delay);
					}
				});
			});
		},

		stopAudio: function() {
			return this.each(function() {
				$(this).find('audio').each(function() {
					if (!this.ended) {
						this.pause();
						this.currentTime = 0;
					}
				});
			});
		}

	});
})( jQuery );








function nefuScene() {
	this.layers = [];
	this.visibleElements = [];
}
nefuScene.prototype = {
	_show: function() {
		for (var i=0; i<this.visibleElements.length; i++) {
			this.visibleElements[i].show();
		}
		for (var i=0; i<this.layers.length; i++) {
			this.layers[i].nfLayer('show');
		}
	},

	_hide: function(nextScene) {
		for (var i=0; i<this.layers.length; i++) {
			var layer = this.layers[i];
			if (nextScene.layers.indexOf(layer) < 0) {
				layer.nfLayer('hide');
			}
		}
		for (var i=0; i<this.visibleElements.length; i++) {
			var elm = this.visibleElements[i];
			if (nextScene.visibleElements.indexOf(elm) < 0) {
				elm.hide();
			}
		}
	},

	_loadAudio: function() {
		for (var i=0; i<this.layers.length; i++) {
			this.layers[i].nfLayer('loadAudio');
		}
	},

	_playAudio: function() {
		for (var i=0; i<this.layers.length; i++) {
			this.layers[i].nfLayer('playAudio');
		}
	},

	_stopAudio: function() {
		for (var i=0; i<this.layers.length; i++) {
			this.layers[i].nfLayer('stopAudio');
		}
	},

	_containsLayer: function(layer) {
		return this.layers.indexOf(layer) >= 0;
	},

	_update: function() {
		for (var i=0; i<this.layers.length; i++) {
			this.layers[i].nfLayer('update');
		}
	}
};







function nefuView(viewElement, config) {
	// Initialize members
	this.curWidth = 0;
	this.curHeight = 0;

	this.scenes = [];
	this.layers = [];

	var view = this;

	var $obj = $(viewElement);
	this.$obj = $obj;

	// Get view parameters
	this.maxWidth  = $obj.width();
	this.maxHeight = $obj.height();

	// Get config
	this.config = $.extend({
		startScene: 'default',
		fullSize: false,
		minWidth: this.maxWidth,
		minHeight: this.maxHeight,
		minScale: 1.0,
		audioEnable: true
	},
	config);

	this.minWidth = this.config.minWidth;
	this.minHeight = this.config.minHeight;
	this.minScale = this.config.minScale;
	this.audioEnable = this.config.audioEnable;


	// Initialize layers
	$obj.find('.nf-layer').each(function() {
		// Create layer
		var $layer = $(this).nfLayer();

		// Register layer
		view.layers.push($layer);

		// Register scenes
		var scenes = $layer.data('scene') ? $layer.data('scene').split(' ') : [];
		for (var i=0; i<scenes.length; i++) {
			view._ensureScene(scenes[i]).layers.push($layer);
		}

		// Convert absolute position to relative
		if (!$layer.hasClass('static')) {
			$layer.children()
				.convertPositionRelative(view.maxWidth, view.maxHeight);
		}
	});

	// Initialize elements shown at specified scenes
	$obj.find('[data-visible-scenes]').each(function(idx) {
		var self = $(this);
		var snames = self.data('visible-scenes').split(' ');
		for (var i=0; i<snames.length; i++) {
			view.scenes[snames[i]].visibleElements.push(self);
		}
		self.hide();
	});

	// Initialize windows
	$obj.find('.nf-window').nfWindow({view: view});

	// Create cover
	this.cover = $('<div class="nf-cover"></div>');
	$obj.append(this.cover);

	// Register resize handler, and do initial resize
	if (this.config.fullSize == true) {
		var funcResize = function() {
			var w = $(window).width(),
					h = $(window).height();
			view.resize(w, h);
		};
		$(window).resize(funcResize);
		funcResize();
	}

	// Go to default scene
	this.changeScene(this.config.startScene);
}
nefuView.prototype = {
	_ensureScene: function(sceneName) {
		if (!(sceneName in this.scenes)) {
			this.scenes[sceneName] = new nefuScene();
		}
		return this.scenes[sceneName];
	},

	resize: function(wWidth, wHeight) {
		if (!wWidth) { wWidth = this.curWidth; }
		if (!wHeight) { wHeight = this.curHeight; }

		// Calculate scale ratio
		var r = Math.min(1, 
			Math.max(this.minScale, 
				Math.min(wWidth / this.minWidth, wHeight / this.minHeight)));

		// Calculate scaled size
		var rWidth = (this.maxWidth * r) | 0;
		var rHeight = (this.maxHeight * r) | 0;
		var rMinWidth = (this.minWidth * r) | 0;
		var rMinHeight = (this.minHeight * r) | 0;

		// Calculate visible rectangle
		var vWidth  = Math.min(rWidth,  Math.max(rMinWidth,  wWidth));
		var vHeight = Math.min(rHeight, Math.max(rMinHeight, wHeight));
		var eLeft = Math.max(0, (rWidth  - vWidth ) / 2);
		var eTop  = Math.max(0, (rHeight - vHeight) / 2);

		// Set properties
		this.viewWidth = vWidth;
		this.viewHeight = vHeight;
		this.scaledWidth = rWidth;
		this.scaledHeight = rHeight;
		this.curWidth = wWidth;
		this.curHeight = wHeight;
		this.curScale = r;
		this.controlOffsetLeft = eLeft;
		this.controlOffsetTop  = eTop;

		// Fix vertical position
		if (wHeight < rMinHeight) {
			this.$obj.css({'margin-top': 0, 'margin-bottom': 0});
		}
		else {
			this.$obj.css({'margin-top': '', 'margin-bottom': ''});
		}

		// Resize view
		this.$obj.width(vWidth)
		         .height(vHeight);

		// Resize visible layers
		for (var i=0; i<this.layers.length; i++) {
			if (this.layers[i].nfLayer('visible')) {
				this.resizeLayer(this.layers[i]);
			}
		}
	},

	resizeLayer: function($layer) {
		if ($layer.hasClass('static')) {
			$layer.css({
				left: 0, 
				top:  0,
				width: '100%',
				height: '100%'
			});
		}
		else {
			$layer.css({
				left: -this.controlOffsetLeft + 'px',
				top:  -this.controlOffsetTop + 'px',
				width: this.scaledWidth + 'px',
				height: this.scaledHeight + 'px'
			});
		}

		$layer.find('.nf-image').css('transform', 'scale('+this.curScale+')');
	},


	fade: function(fadeColor, fadeDuration, funcFadeOpening) {
		if (!fadeDuration) { fadeDuration = 0; }

		var view = this;
		var cover = this.cover;

		cover.css('background-color', fadeColor);

		cover.on('animationend', function() {
			setTimeout(function() {
				cover.off('animationend');

				if (funcFadeOpening) {
					funcFadeOpening();
				}

				setTimeout(function() {
					cover.on('animationend', function() {
						cover.off('animationend')
						     .removeClass('nf-hide');
					});
					cover.removeClass('nf-visible')
					     .addClass('nf-hide');
				},
				fadeDuration);

			},
			16); //wait 1 frame
		});

		cover.addClass('nf-visible');

		return this;
	},


	changeScene: function(sceneName, fadeColor, fadeDuration, funcFadeOpening) {
		var prevScene = this.curScene;
		var nextScene = this.scenes[sceneName];
		var view = this;
		var name = sceneName;

		// Load audios
		if (this.audioEnable) {
			nextScene._loadAudio();
		}

		// Fade
		if (fadeColor) {
			// Do fading
			var opening = funcFadeOpening;
			this.fade(fadeColor, fadeDuration, function() {
				view.changeScene(name, false);
				if (opening) { opening.call(view); }
			});

			return;
		}
		
		// Hide scene
		if (prevScene) {
			prevScene._hide(nextScene, this.audioEnable);
			if (this.audioEnable) {
				prevScene._stopAudio();
			}
		}

		// Show scene
		nextScene._show(this.audioEnable);
		if (this.audioEnable) {
			nextScene._playAudio();
		}

		// Resize
		this.resize();

		// Set properties
		this.curSceneName = sceneName;
		this.curScene = nextScene;

		return this;
	},


	update: function() {
		// Update all visible layers
		for (var i=0; i<this.layers.length; i++) {
			if (this.layers[i].nfLayer('visible')) {
				this.layers[i].nfLayer('update');
			}
		}
	},

	fadeUpdate: function(fadeColor, fadeDuration) {
		var view = this;
		this.fade(fadeColor, fadeDuration, function() {
			view.update();
		});
		return this;
	}
};
