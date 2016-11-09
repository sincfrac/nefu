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
	var methods = {
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
		}
	};

	$.fn.nfWindow = function(method) {
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.nfWindow' );
    }
	};
})( jQuery );






function nefuChat(view, funcInput) {
	// Create chat area
	var $chat = $('<div class="nf-chat"><input class="text" type="text" /><div class="send loc-say">発言</div></div>');
	view.$obj.append($chat);
	this.$obj = $chat;

	this._funcInput = funcInput;
	var self = this;

	// Set handlers
	var $chatInput = $chat.find('.text');
	$chatInput.keypress(function(ev) {
		if (ev.keyCode && ev.keyCode === 13) {
			self._funcInput($(this).val());
			$(this).val('');
		}
	});
	$chat.find('.send').click(function() {
		self.cbInput($chatInput.val());
		$chatInput.val('');
	});
}
nefuChat.prototype = {

};

