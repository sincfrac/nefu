/*
'nefu' MMORPG-style Web UI Library

Copyright (C) 2016 sincfrac

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/



/*
	nfWindow
*/
(function( $ ) {
	$.nfPlugin('nfWindow', 
	{
		// Initialize
		init: function(opts) {
			return this.each(function() {
				var $this = $(this);

				var options = $.extend({
					view: null
				}, opts);

				// Check initialized and store options
				if ($this.data('nfWindow')) { return; }
				$this.data('nfWindow', options);

				// Register close button
				$this.find('.close').click(function() {
					$this.removeClass('nf-visible');
				});

				// Register move handlers
				$this.find('.title').mousedown(function(downev) {
					var pos  = $this.position();

					$(document).on('mousemove.nefu', function(ev) {
						var nleft   = pos.left + ev.pageX - downev.pageX;
						var ntop    = pos.top  + ev.pageY - downev.pageY;
						$this.nfPosition(nleft, ntop);
					});
				}).mouseup(function() {
					$(document).off('mousemove.nefu');
				});

			});
		},

		show: function() {
			return this.addClass('nf-visible');
		},

		hide: function() {
			return this.removeClass('nf-visible');
		},

		toggle: function() {
			if (this.hasClass('nf-visible')) {
				return this.removeClass('nf-visible');
			}
			else {
				return this.addClass('nf-visible');
			}
		}

	});
})( jQuery );



/*
	nfChatBox
*/
(function( $ ) {
	$.nfPlugin('nfChatBox', 
	{
		init: function(funcSend) {
			return this.each(function() {
				var $this = $(this);
				var func = funcSend;

				// Store function
				$this.data('nfChatBox.func', func);

				// Set handler
				$this.keypress(function(ev) {
					if (ev.keyCode && ev.keyCode === 13) {
						func($this.val());
						$this.val('');
					}
				});
			});
		},

		send: function() {
			return this.each(function() {
				var $this = $(this);
				var func = $this.data('nfChatBox.func');
				if (func) {
					func($this.val());
					$this.val('');
				}
			});
		}
	});
})( jQuery );

