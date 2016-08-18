/*
'nefu' MMORPG-style Web UI Library

Copyright (C) 2016 sincfrac

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/


(function( $ ) {
  $.fn.toggleVisibility = function() {
  	var v = this.css('visibility');
  	if (v == 'visible') {
  		this.css('visibility', 'hidden');
  	}
  	else if (v == 'hidden') {
  		this.css('visibility', 'visible');
  	}
  };
  $.fn.showControl = function() {
	this.addClass('nf-visible');
	var duration = this.data('visible-duration');
	if (duration) {
		setTimeout(function(e) {
			e.removeClass('nf-visible');
			
			if (e.hasClass('nf-message')) {
				e.addClass('nf-hide');
				e.on('animationend', function() {
					$(this).removeClass('nf-hide');
				});
			}
			
		}, duration, this);
	}
  };
})( jQuery );


function nefuScene() {
	this.blocks = [];
	this.visibleElements = [];
	this.controls = [];
	this.onstarts = [];
	this.msggroups = [];
	this.audio = [];
	this.isPlayingMessage;
}
nefuScene.prototype = {
	show: function() {
		for (var i=0; i<this.blocks.length; i++) {
			var blk = this.blocks[i];
			blk.show();
			//blk.css('visibility', 'visible');

			blk.find('.visible').addClass('nf-visible');

			blk.find('[data-visible-delay]').each(function() {
				var elm = $(this);
				var delay = elm.data('visible-delay');
				if (delay == 0) {
					elm.showControl();
				}
				else {
					elm.removeClass('nf-visible');
					setTimeout(function(e) {
						e.showControl();
					}, delay, elm);
				}
			});
		}

		for (var i=0; i<this.visibleElements.length; i++) {
			this.visibleElements[i].show();
		}

		for (var i=0; i<this.onstarts.length; i++) {
			eval(this.onstarts[i]);
		}
	},

	hide: function(nextScene) {
		for (var i=0; i<this.blocks.length; i++) {
			var blk = this.blocks[i];
			if (nextScene.blocks.indexOf(blk) < 0) {
				//blk.css('visibility', 'hidden');
				blk.hide();
				blk.find('.nf-visible').removeClass('nf-visible');
			}
		}
		for (var i=0; i<this.visibleElements.length; i++) {
			var elm = this.visibleElements[i];
			if (nextScene.visibleElements.indexOf(elm) < 0) {
				elm.hide();
			}
		}
	},

	playAudio: function() {
		for (var i=0; i<this.audio.length; i++) {
			var audio = this.audio[i];
			if (audio.delay == 0) {
				audio.element.play();
			}
			else {
				setTimeout(function(a) {
					a.play();
				}, audio.delay, audio);
			}
		}
	}
};





function nefuView(wrapperElement, config) {
	// Initialize members
	this.scenes = [];
	this.flags = [];

	var view = this;
	var wrapper = $(wrapperElement);
	this.wrapper = wrapper;

	// Get view parameters
	this.maxWidth  = wrapper.width();
	this.maxHeight = wrapper.height();
	this.minWidth  = wrapper.data('min-width');
	this.minHeight = wrapper.data('min-height');
	this.minScale  = wrapper.data('min-scale');

	// Initialize cover
	this.cover = $('<div class="nf-cover"></div>');
	wrapper.append(this.cover);

	// Initialize scenes
	wrapper.find('.nf-scene[data-scene]').each(function(idx) {
		var self = $(this);

		// Parse scene names
		var snames = self.data('scene').split(' ');
		for (var i=0; i<snames.length; i++) {
			view.ensureScene(snames[i]).blocks.push(self);
		}

		// Register elements
		self.children().each(function() {
			var elm = $(this);
			if (elm.hasClass('nf-image')) return;
			if (elm.hasClass('nf-static')) return;

			var orgx = elm.data('origin-x');
			var orgy = elm.data('origin-y');
			var pos = elm.position();
			var width = elm.outerWidth(true);
			var height = elm.outerHeight(true);

			var x;
			if (orgx == 'left') {
				x = pos.left / view.maxWidth;
			}
			else if (orgx == 'right') {
				x = (pos.left + width) / view.maxWidth;
			}
			else {
				x = (pos.left+width /2) / view.maxWidth;
			}

			var y;
			if (orgy == 'top') {
				y = pos.top / view.maxHeight;
			}
			else if (orgy == 'bottom') {
				y = (pos.top + height) / view.maxHeight;
			}
			else {
				y = (pos.top +height/2) / view.maxHeight;
			}

			elm.data('pos-x', x)
			   .data('pos-y', y)
			   .css('left','')
			   .css('right','')
			   .css('top','')
			   .css('bottom','');

			for (var i=0; i<snames.length; i++) {
				view.scenes[snames[i]].controls.push(elm);
			}
		});

		// Register messages
		self.find('.nf-message').each(function() {
			var elm = $(this);
			var grp = elm.data('message-group');
			if (grp) {
				for (var i=0; i<snames.length; i++) {
					var sname = snames[i];
					if (!(grp in view.scenes[sname].msggroups)) {
						view.scenes[sname].msggroups[grp] = [];
					}
					view.scenes[sname].msggroups[grp].push(elm);
				}
			}
		});

		// Register audio tags
		self.find('audio').each(function() {
			var delay = 0;
			if ($(this).data('delay')) {
				delay = $(this).data('delay');
			}
			for (var i=0; i<snames.length; i++) {
				var sname = snames[i];
				view.scenes[sname].audio.push({element:this, delay:delay});
			}
		});

		// Register onSceneStart handler
		if (self.data('onscenestart')) {
			for (var i=0; i<snames.length; i++) {
				var sname = snames[i];
				view.scenes[sname].onstarts.push(self.data('onscenestart'));
			}
		}

		self.hide().css('visibility', 'visible');
	});

	// Initialize elements shown at specified scenes
	wrapper.find('[data-visible-scenes]').each(function(idx) {
		var self = $(this);
		var snames = self.data('visible-scenes').split(' ');
		for (var i=0; i<snames.length; i++) {
			view.scenes[snames[i]].visibleElements.push(self);
		}
		self.hide();
	});

	// Initialize window close-buttons
	wrapper.find('.nf-window .close').each(function() {
		var elm = $(this);
		var wnd = elm.parents('.nf-window');
		(function() {
			var w = wnd;
			elm.click(function() {
				w.removeClass('nf-visible');
			});
		})();
	});

	// Initialize window titlebars, moving
	wrapper.find('.nf-window .title').each(function() {
		var self = $(this);
		(function() {
			var elm = self;
			var par = self.parent();
			elm.mousedown(function(downev) {
				var pos = par.position();
				$(document).on('mousemove.nefu', function(ev) {
					var nposX = pos.left + ev.pageX-downev.pageX;
					var nposY = pos.top  + ev.pageY-downev.pageY;
					
					par.css('left', nposX)
					   .css('top',  nposY);

					var orgx = par.data('origin-x');
					var orgy = par.data('origin-y');

					var width  = par.outerWidth(true);
					var height = par.outerHeight(true);

					var mWidth  = view.maxWidth  * view.curScale;
					var mHeight = view.maxHeight * view.curScale;

					var x;
					if (orgx == 'left') {
						x = nposX / mWidth;
					}
					else if (orgx == 'right') {
						x = (nposX + width) / mWidth;
					}
					else {
						x = (nposX+width /2) / mWidth;
					}

					var y;
					if (orgy == 'top') {
						y = nposY / mHeight;
					}
					else if (orgy == 'bottom') {
						y = (nposY + height) / mHeight;
					}
					else {
						y = (nposY + height/2) / mHeight;
					}

					par.data('pos-x', x)
					   .data('pos-y', y);
				});
			});

			elm.mouseup(function() {
				$(document).off('mousemove.nefu');
			});
		})();
	});

	// Initialize chat input
	wrapper.find('.nf-chat .text').keypress(function(ev) {
		if (ev.keyCode && ev.keyCode === 13) {
			view.say($(this).val());
			$(this).val('');
		}
	});
	wrapper.find('.nf-chat .send').click(function() {
		view.say($(this).val());
		$(this).val('');
	});

	// Register resize handler, and do initial resize
	$(window).resize(function() {
		view.resize($(window).width(), $(window).height());
	});
	this.resize($(window).width(), $(window).height());

	if (config.defaultScene) {
		// Go to specified scene
		this.changeScene(config.defaultScene);
	}
	else {
		// Go to default scene
		this.changeScene('default');

		// Start preloading resources
		if (config.preloads) {
			var preloadNum = config.preloads.length;

			function loadImageNext(arr, fProgress, fFinish, fError) {
				if (arr.length == 0) {
					if (config.preloadFinish) { config.preloadFinish(); }
					return;
				}
				if (config.preloadProgress) {
					config.preloadProgress(1 - arr.length / preloadNum);
				}
				
				var img = new Image();
				img.onload = function() {
					setTimeout(function() {
						loadImageNext(arr);
					}, 10);
				};
				img.onerror = function() {
					if (config.preloadError) { config.preloadError(); }
				};
				img.src = arr.pop();
			}

			loadImageNext(config.preloads);
		}
	}
}
nefuView.prototype = {
	ensureScene: function(sceneName) {
		if (!(sceneName in this.scenes)) {
			this.scenes[sceneName] = new nefuScene();
		}
		return this.scenes[sceneName];
	},

	resize: function(wWidth, wHeight) {
		this.curWidth = wWidth;
		this.curHeight = wHeight;

		var r = Math.min(1, Math.max(this.minScale, Math.min(wWidth/this.minWidth, wHeight/this.minHeight)));
		this.curScale = r;

		this.wrapper.find('.nf-image').css('transform', 'scale('+r+')');

		var rWidth = (this.maxWidth * r) | 0;
		var rMinWidth = (this.minWidth * r) | 0;
		var rHeight = (this.maxHeight * r) | 0;
		var rMinHeight = (this.minHeight * r) | 0;

		if (wHeight < rMinHeight || wWidth < rMinWidth) {
			$('body').css('overflow', 'auto');
		} else {
			$('body').css('overflow', 'hidden');
		}

		var vWidth  = Math.min(rWidth,  Math.max(rMinWidth,  wWidth));
		var vHeight = Math.min(rHeight, Math.max(rMinHeight, wHeight));

		this.wrapper.width(vWidth)
		            .height(vHeight);

		var eLeft = Math.max(0, (rWidth  - vWidth ) / 2);
		var eTop  = Math.max(0, (rHeight - vHeight) / 2);

		this.wrapper.find('.nf-image')
		            .css('left', -eLeft)
		            .css('top',  -eTop);

		if (this.curScene) {
			for (var i=0; i<this.curScene.controls.length; i++) {
				var elm = this.curScene.controls[i];
				var orgx = elm.data('origin-x');
				var orgy = elm.data('origin-y');

				var eWidth  = elm.outerWidth();
				var eHeight = elm.outerHeight();

				var x;
				if (orgx == 'left') {
					x = 0;
				}
				else if (orgx == 'right') {
					x = eWidth;
				}
				else {
					x = eWidth / 2;
				}

				var y;
				if (orgy == 'top') {
					y = 0;
				}
				else if (orgy == 'bottom') {
					y = eHeight;
				}
				else {
					y = eHeight / 2;
				}

				elm.css('left', -eLeft + elm.data('pos-x')*rWidth  - x)
				   .css('top',  -eTop  + elm.data('pos-y')*rHeight - y);
			}
		}
	},

	changeScene: function(sceneName, fade, fadeDuration) {
		if (fade) {
			if (!fadeDuration) {
				fadeDuration = 0;
			}

			var view = this;
			var cover = this.cover;

			if (fade == true) {
				cover.css('background-color', 'black');
			} else {
				cover.css('background-color', fade);
			}

			cover.on('animationend', function() {
				setTimeout(function() {
					cover.off('animationend');
					view.changeScene(sceneName, false);

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

			return;
		}

		var nextScene = this.scenes[sceneName];

		this.curSceneName = sceneName;
		this.curScene = nextScene;

		for (var sname in this.scenes) {
			this.scenes[sname].hide(nextScene);
		}
		
		nextScene.show();

		for (var grp in nextScene.msggroups) {
			var t = 200 + 500 * Math.random();
			setTimeout(function(view, s, g) {
				view.showNextMessage(s, g);
			}, t, this, sceneName, grp);
		}

		this.updateFlagVisible();
		this.resize(this.curWidth, this.curHeight);

		nextScene.playAudio();
	},

	showMessage: function(msg, defaultDuration) {
		msg.addClass('nf-visible');

		var duration = msg.data('duration');
		if (!duration) {
			duration = defaultDuration;
		}

		setTimeout(function(m) {
			m.on('animationend', function() {
				m.off('animationend')
				 .removeClass('nf-hide');
			});
			m.removeClass('nf-visible')
			 .addClass('nf-hide');
		}, 
		duration, msg);

		return duration;
	},

	showNextMessage: function(scene, grp, idx) {
		if (scene != this.curSceneName) return;
		if (!(scene in this.scenes)) return;
		if (!(grp in this.scenes[scene].msggroups)) return;

		var msgs = this.scenes[scene].msggroups[grp];

		if (!idx) {
			idx = 0;
		}
		if (idx < 0 || idx >= msgs.length) {
			idx = 0;
		}
		
		var msg = msgs[idx];

		var duration = 3000;
		var delay = 500 + 1000 * Math.random();

		duration = this.showMessage(msg, duration);

		var nextIdx = idx + 1;

		(function(view) {
			var s = scene;
			var g = grp;
			var i = nextIdx;
			var v = view;
			setTimeout(function(view) {
				view.showNextMessage(s, g, i);
			}, duration + delay, view);
		})(this);
	},

	onFlag: function(flag) {
		if (!(flag in this.flags)) {
			this.flags[flag] = 1;
			this.updateFlagVisible();
		}
	},

	offFlag: function(flag) {
		if (flag in this.flags) {
			delete this.flags[flag];
			this.updateFlagVisible();
		}
	},

	checkFlag: function(flag) {
		if (flag in this.flags) {
			return true;
		}
		return false;
	},

	checkFlags: function(flags) {
		for (var i=0; i<flags.length; i++) {
			if (flags[i] in this.flags) {
				return true;
			}
		}
		return false;
	},

	updateFlagVisible: function() {
		var view = this;
		var scene = this.scenes[this.curSceneName];
		for (var i=0; i<scene.blocks.length; i++) {
			scene.blocks[i].find('[data-visible-flags]').each(function() {
				var self = $(this);
				var flags = self.data('visible-flags').split(' ');
				if (view.checkFlags(flags)) {
					self.addClass('nf-visible');
				}
				else {
					self.removeClass('nf-visible');
				}
			});
		}
	},

	showWindow: function(wid) {
		var wnd = $("#" + wid);
		wnd.addClass('nf-visible');
	},

	hideWindow: function(wid) {
		var wnd = $("#" + wid);
		wnd.removeClass('nf-visible');
	},

	say: function(text) {
		if (text == '') return;

		var msg = $('<div class="nf-message nf-visible color2">' + text + '</div>');
		var x = Math.random();
		if (x < 0.5) {
			msg.addClass('left')
			   .css('left', ((x*100)|0)+'%');
		}
		else {
			msg.addClass('right')
			   .css('right', (((x-0.5)*100)|0)+'%');
		}
		msg.css('bottom', '40px');
		this.wrapper.append(msg);

		var duration = 5000;

		(function() {
			var m = msg;
			setTimeout(function() {
				m.on('animationend', function() {
					m.off('animationend')
					 .removeClass('nf-hide');
				});
				m.removeClass('nf-visible')
				 .addClass('nf-hide');
			},
			duration);
		})();
	}
};