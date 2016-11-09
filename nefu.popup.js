/*
'nefu' MMORPG-style Web UI Library

Copyright (C) 2016 sincfrac

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/


function nefuPopupManager($layer, config) {
	this._$layer = $layer;
	this._popups = [];
	this._config = $.extend({
		default: {
			text: '',
			title: '',
			left: 0,
			top: 0,
			right: null,
			botton: null,
			direction: 'left',	// 'left', 'right', 'auto'
			delay: 0,
			duration: 'auto',	// 'auto', 0(infinity), integer
			color: '1',
			loud: false
		}
	}, config);
}
nefuPopupManager.prototype = {
	say: function(cfg) {
		config = $.extend(this._config.default, cfg);

		// Delay
		if (config.delay > 0) {
			var c = config;
			var self = this;

			setTimeout(function() {
				c.delay = 0;
				self.say(c);
			}, config.delay);

			return this;
		}

		// Find inactive popup
		var popup = null;
		for (var i=0; i<this._popups.length; i++) {
			if (!this._popups[i].hasClass('nf-visible') && !this._popups[i].hasClass('nf-hide')) {
				popup = this._popups[i];
				break;
			}
		}

		// Create a new popup if needed
		if (popup == null) {
			popup = $('<div class="nf-message"><span class="title"></span><span class="text"></span></div>');
			this._popups.push(popup);
			this._$layer.append(popup);

			popup.hide = function() {
				if (popup.durationTimer) {
					clearTimeout(popup.durationTimer);
					popup.durationTimer = null;
					popup.duration = null;
				}

				if (popup.hasClass('nf-visible')) {
					popup.on('animationend', function() {
						popup.off('animationend')
						 .removeClass('nf-hide');
					});

					popup.removeClass('nf-visible')
					 .addClass('nf-hide');
				}
			};
		}
		
		// Set text and title
		popup.find('.text').text(config.text);
		popup.find('.title').text(config.title);

		// Set position
		if (config.left) {
			popup.css('left', config.left);
		}
		else if (config.right) {
			popup.css('right', config.right);
		}
		if (config.top) {
			popup.css('top', config.top);
		}
		else if (config.bottom) {
			popup.css('top', config.bottom);
		}

		// Set direction
		var dir = config.direction;
		popup.removeClass('left right')
		     .addClass(dir);

		// Set color
		popup.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9');
		popup.addClass('color' + config.color);

		// Set loud
		if (config.loud == true) {
			popup.addClass('loud');
		}
		else {
			popup.removeClass('loud');
		}

		// Calculate auto duration
		var dur = config.duration;
		if (dur == 'auto') {
			dur = Math.max(2000, config.text.length * 100);	// ToDo: 
		}
		
		// Set duration timer
		if (dur > 0) {
			popup.duration = dur;
			popup.durationTimer = setTimeout(function(m) {
				m.durationTimer = null;
				m.duration = null;
				m.hide();
			}, 
			dur, popup);
		}
		else {
			popup.duration = null;
			popup.durationTimer = null;
		}

		// Show
		popup.addClass('nf-visible');

		return popup;
	},

	clear: function() {
		// hide all popups
		for (var i=0; i<this._popups.length; i++) {
			if (this._popups[i].hasClass('nf-visible') || this._popups[i].hasClass('nf-hide')) {
				this._popups[i].removeClass('nf-visible nf-hide');
			}
		}
	},
};




function nefuAutoPopup(popupManager, config) {
	this._manager = popupManager;

	this.config = $.extend({
		default: {},
		minRest: 1000,
		maxRest: 3000,
		shuffle: true,
		xRand: 10,
		yRand: 10
	},
	config);

	this._texts = [];
	this._started = false;
	this._lastPopup = null;
	this._indices = [];
	this._lastIndex = -1;
	this._interruptText = null;
	this._lastTimer = -1;
}
nefuAutoPopup.prototype = {
	set: function(texts) {
		this._texts = texts;
		this._makeIndices();
		return this;
	},

	_makeIndices: function() {
		var len = this._texts.length;
		var arr = [];

		// Make indices array
		for (var n=len-1; n>=0; n--) {
			arr.push(n);
		}

		if (len > 1 && this.config.shuffle == true) {
			// Shuffle indices
			do {
				$.shuffle(arr);
			} while(arr[len-1] == this._lastIndex)
		}

		this._indices = arr;
	},

	_setNext: function(delay) {
		var self = this;

		// Calculate rest time
		var rest = this.config.minRest + 
			Math.random() * (this.config.maxRest - this.config.minRest);

		// Set timer
		this._lastTimer = setTimeout(function() {
			if (self.started = true) {
				self._say();
			}
		},
		delay + rest);
	},

	_say: function(text) {
		var self = this;

		// Get text
		if (!text) {
			if (this._indices.length == 0) {
				this._makeIndices();
			}
			var idx = this._indices.pop();
			this._lastIndex = idx;
			text = this._texts[idx];
		}

		// Merge with default values
		text = $.extend({}, this.config.default, text);

		// Set position
		//text.left += (Math.random() * this.config.xRand) | 0;
		//text.top  += (Math.random() * this.config.yRand) | 0;

		// Say
		this._lastPopup = this._manager.say(text);

		// Set next
		if (this.started == true && this._lastPopup.duration > 0) {
			this._setNext(this._lastPopup.duration);
		}
	},

	start: function() {
		if (this.started) { return this; }
		this.started = true;
		this._setNext(0);
		return this;
	},

	stop: function() {
		this.started = false;

		// Cancel timer
		if (this._lastTimer) {
			clearTimeout(this._lastTimer);
			this._lastTimer = null;
		}

		return this;
	},

	say: function(text) {
		// Cancel timer
		if (this._lastTimer) {
			clearTimeout(this._lastTimer);
			this._lastTimer = null;
		}

		// Hide popup immediately
		if (this._lastPopup) {
			this._lastPopup.hide();
			this._lastPopup = null;
		}

		// Say immediately
		this._say(text);

		return this;
	}
};

