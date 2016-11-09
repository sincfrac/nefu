/*
'nefu' MMORPG-style Web UI Library

Copyright (C) 2016 sincfrac

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/


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

				// Convert absolute position to relative
				if (!$this.hasClass('static')) {
					var width = $this.width(),
							height = $this.height();

					$this.children()
						   .convertPositionRelative(width, height);
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
					var $elm = $(this);
					var delay = $elm.data('visible-delay');

					$elm.removeClass('nf-visible');

					// Show
					$.delayApply($elm, function() {	
						this.addClass('nf-visible');
						var duration = this.data('visible-duration');
						if (duration) {
							setTimeout(function(e) {
								e.removeClass('nf-visible');
							}, duration, this);
						}
					}, delay);
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
		}
	});
})( jQuery );








function nefuScene(view) {
	this.view = view;
	this.layers = [];
	this.audios = [];
	this.visibleElements = [];
}
nefuScene.prototype = {
	load: function() {
		if (this.view.audioEnable) {
			for (var i=0; i<this.audios.length; i++) {
				this.audios[i].load();
			}
		}
	},

	show: function() {
		for (var i=0; i<this.visibleElements.length; i++) {
			this.visibleElements[i].show();
		}
		for (var i=0; i<this.layers.length; i++) {
			this.layers[i].nfLayer('show');
		}

		// Play audios
		if (this.view.audioEnable) {
			for (var i=0; i<this.audios.length; i++) {
				var audio = this.audios[i];
				this._playAudio(audio);
			}
		}
	},

	hide: function(nextScene) {
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

		// Stop audios
		if (this.view.audioEnable) {
			for (var i=0; i<this.audios.length; i++) {
				var audio = this.audios[i];
				if (nextScene.audios.indexOf(audio) < 0) {
					this._stopAudio(audio);
				}
			}
		}
	},

	_playAudio: function(audio) {
		var delay = $(audio).data('delay') || 0;

		if (audio.paused || audio.ended) {
			$.delayApply(audio, function() {
				this.play();
			}, delay);
		}
	},

	_stopAudio: function(audio) {
		if (!audio.ended) {
			audio.pause();
			audio.currentTime = 0;
		}
	},
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
		view.layers.push($layer);

		// Register scenes
		var scenes = $layer.dataSplit('scene');
		for (var i=0; i<scenes.length; i++) {
			view._ensureScene(scenes[i]).layers.push($layer);
		}
	});

	// Initialize elements shown at specified scenes
	$obj.find('[data-visible-scenes]').each(function(idx) {
		var $elm = $(this);
		var snames = $elm.dataSplit('visible-scenes');
		for (var i=0; i<snames.length; i++) {
			view.scenes[snames[i]].visibleElements.push($elm);
		}
		$elm.hide();
	});

	// Initialize audios
	$obj.find('audio[data-scene]').each(function() {
		$audio = $(this);
		var scenes = $(this).dataSplit('scene');
		for (var i=0; i<scenes.length; i++) {
			view._ensureScene(scenes[i]).audios.push(this);
		}
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
			this.scenes[sceneName] = new nefuScene(this);
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

		// Load scene
		nextScene.load();

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
			prevScene.hide(nextScene);
		}

		// Show scene
		nextScene.show();

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
