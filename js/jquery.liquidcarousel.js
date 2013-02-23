/*
 * jQuery liquid carousel v2.0
 * http://www.nikolakis.net
 *
 * Copyright 2013, John Nikolakis
 * Free to use under the GPL license.
 * http://www.gnu.org/licenses/gpl.html
 */

// TODO:
//	 - See how to implement responsiveness (preferably detect changes on css)
//	 - Implement add/remove items functionality
//   - BUG: if the wrapper is smaller than the width of the item nothing is displayed

;(function($, window, undefined) {

	var pluginName = 'liquidCarousel',
	    document   = window.document,
		defaults   = {
			height: 150,
			hideNavigation:    false,
			animationDuration: 1000,
			noTransitions:     false,
			touchDistance:	   25,
		};

	/**
	 * The constructor of the plugin
	 * @param {Object} element
	 * @param {Object} options
	 */
	function Plugin(element, options) {
		this.element   = element;
		this.options   = $.extend({}, defaults, options) ;
		this._defaults = defaults;
		this._name     = pluginName;

		this._carouselWrapper      = null;
		this._carouselWrapperWidth = 0

		this._items             = [];
		this._totalItems        = 0;
		this._firstVisibleItem  = 0;
		this._lastVisibleItem   = 0;
		this._visibleItemsWidth = 0;

		this._browserSupportsTransitions = false;
		this._useTransitions             = false;

		this._touchStartX  = 0;
		this._touchEndX    = 0;
		this._touchStarted = false;

		this.init();
	}

	/**
	 * Plugin initialization
	 */
	Plugin.prototype.init = function() {
		// Add a wrapper to the list
		this.addCarouselWrapper();

		// Set the style of the list
		$(this.element).css({
			height:   this.options.height,
			position: 'relative',
			overflow: 'hidden'
		});

		// Set the initial css and position for all list items
		this._items      = $(this.element).children();
		this._totalItems = this._items.length;
		this.initItems();

		// Add the navigation buttons
		this.addNavigation();

		// Add css transitions if they are supported and are desirable
		this._browserSupportsTransitions = this.supports('transition');
		this._useTransitions             = (this._browserSupportsTransitions && !this.options.noTransitions);
		this.addCssTransitions();

		// Bind redraw method to window resize
		var instance = this;
		$(window).bind('resize.liquidCarousel', function() {
			instance.redraw();
		});

		// Bind touch events
		this.bindTouchEvents();

		this.redraw();
	};

	/**
	 * Adds a wrapper div to the the lists
	 */
	Plugin.prototype.addCarouselWrapper = function() {
		var carouselWrapper = $('<div/>')
							  .addClass('liquid_carousel_wrapper')
							  .css({
								  height:   this.options.height,
								  overflow: 'hidden',
								  position: 'relative'
							  });

		$(this.element).wrap(carouselWrapper);

		this._carouselWrapper = $(this.element).parent();
	};

	/**
	 * Sets the css and initial position for every item in the list
	 */
	Plugin.prototype.initItems = function() {
		var wrapperWidth   = this._carouselWrapper.outerWidth(true),
			carouselHeight = this.options.height;

		for (var i = 0; i < this._totalItems; i++) {
			var item = this._items[i];

			$(item).data('width',    $(item).outerWidth(true))
				   .css({
						position: 'absolute',
						left:      wrapperWidth,
						top:       Math.floor((carouselHeight - $(item).outerHeight(true)) / 2)
					});
		}
	};

	/**
	 * Adds the navigation buttons and binds click events on them
	 */
	Plugin.prototype.addNavigation = function() {
		// Add next and prev buttons to wrapper
		this._carouselWrapper.prepend('<span class="navigation prev"></span>')
							 .append('<span class="navigation next"></span>');

		// add padding to the wrapper equal to the buttons width
		var paddingLeft  = $('.navigation.prev', this._carouselWrapper).outerWidth(true),
			paddingRight = $('.navigation.next', this._carouselWrapper).outerWidth(true);

		this._carouselWrapper.css({
							    'padding-left':  paddingLeft,
								'padding-right': paddingRight
							   });

		// Bind next and previous clicks
		var instance = this;
		$('.navigation.next', this._carouselWrapper).click(function(){
			instance.next();
		});
		$('.navigation.prev', this._carouselWrapper).click(function(){
			instance.previous();
		});

		// If hide navigation is enabled display/hide buttons on wrapper hover
		if (this.options.hideNavigation) {
			var navigationButtons = $('span.navigation', this._carouselWrapper);

			$(this._carouselWrapper).hover(
				function() {
					navigationButtons.css({opacity: 1});
				},
				function() {
					navigationButtons.css({opacity: 0});
				}
			);

			navigationButtons.css({opacity: 0});
		}
	};

	/**
	 * Displays the next items
	 */
	Plugin.prototype.next = function() {
		if (this._lastVisibleItem < (this._totalItems - 1)) {
			this._firstVisibleItem = (this._lastVisibleItem + 1);
			this.redraw('forward');
		}
	};

	/**
	 * Displays the previous items
	 */
	Plugin.prototype.previous = function() {
		if (this._firstVisibleItem !== 0) {
			this._lastVisibleItem = (this._firstVisibleItem - 1);
			this.redraw('backward');
		}
	};

	/**
	 * Bind touch (swipe left/right) events if device supports it
	 */
	Plugin.prototype.bindTouchEvents = function() {
		if (!this.touchSupport()) {
			return;
		}

		var instance = this;

		$(this._carouselWrapper).bind('touchstart', function(e) {
			instance.touchStart(e, instance);
		});
	};

	/**
	 * Gets the touch start position and binds touch move method
	 * @param {Object} e        The fired event
	 * @param {Object} instance Instance of the plugin
	 */
	Plugin.prototype.touchStart = function(e, instance) {
		instance._touchStartX = e.originalEvent.touches[0].pageX;
		instance._touchStarted = true;

		$(instance._carouselWrapper).bind('touchmove', function(e) {
			instance.touchMove(e, instance);
		});
	};

	/**
	 * Checks if finger has travelled more than the defined distance and calls next or previous methods
	 * @param {Object} e        The fired event
	 * @param {Object} instance Instance of the plugin
	 */
	Plugin.prototype.touchMove = function(e, instance) {
		e.preventDefault();

		if (!instance._touchStarted) {
			return;
		}

		var touchEndX        = e.originalEvent.touches[0].pageX,
			traveledDistance = (touchEndX - instance._touchStartX),
			touchDistance    = instance.options.touchDistance;

		if (traveledDistance > touchDistance) {
			instance.touchEnd();
			instance.previous();
		} else if (traveledDistance < -touchDistance) {
			instance.touchEnd();
			instance.next();
		}
	};

	/**
	 * Resets the variables used for tracking touch movement
	 */
	Plugin.prototype.touchEnd = function() {
		$(this._carouselWrapper).unbind('touchend');
		this._touchStarted = false;
		this._touchStartX = 0;
	};

	/**
	 * Returns if a css property is supported by the browser
	 * @param {String} cssProperty
	 * @return {Boolean}
	 */
	Plugin.prototype.supports = function(cssProperty) {
		var div           = document.createElement('div'),
			vendors       = ['khtml', 'ms', 'o', 'moz', 'webkit'],
			vendorsLength = vendors.length;

		if (cssProperty in div.style) {
			return true;
		}

		cssProperty = cssProperty.replace(/^[a-z]/, function(val) {
			return val.toUpperCase();
		});

		while (vendorsLength--) {
			if (vendors[vendorsLength] + cssProperty in div.style) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Returns if a the browser has touch support
	 * @return {Boolean}
	 */
	Plugin.prototype.touchSupport = function() {
		return !!('ontouchstart' in window) || !!('onmsgesturechange' in window);
	};

	/**
	 * Adds css transitions to every item in the list
	 */
	Plugin.prototype.addCssTransitions = function() {
		if (!this._browserSupportsTransitions || !this._useTransitions) {
			return;
		}

		var durationSeconds = (this.options.animationDuration / 1000),
			transition      = 'all ' + durationSeconds + 's';

		this._items.css({
			'-webkit-transition': transition,
			'-moz-transition':    transition,
			'-ms-transition':     transition,
			'-o-transition':      transition,
		});
	}

	/**
	 * Displays the items that should be visible and hides all the rest
	 * @param {String} direction
	 */
	Plugin.prototype.redraw = function(direction) {

		if (typeof direction === 'undefined' || direction !== 'backward') {
			direction = 'forward';
		}

		this._carouselWrapperWidth = this._carouselWrapper.width();

		// Figure out which items should be visible
		this.calculateItemsToDisplay(direction);

		var spacing      = this.getItemsExtraSpace(),
			wrapperWidth = this._carouselWrapper.outerWidth(true),
			i;

		// Hide all elements before first visible one
		for (i = 0; i < this._firstVisibleItem; i++) {
			this.animateElement(this._items[i], -wrapperWidth);
		}

		// Hide all elements after last visible one
		for (i = (this._lastVisibleItem + 1); i < this._totalItems; i++) {
			this.animateElement(this._items[i], wrapperWidth);
		}

		// Set the position of every visible element
		var itemPosition = Math.floor(spacing / 2);
		for (i = this._firstVisibleItem; i <= this._lastVisibleItem; i++) {
			this.animateElement(this._items[i], itemPosition);

			itemPosition += $(this._items[i]).data('width') + spacing;
		}

	}

	/**
	 * Figures out which items should be visible and their actual width
	 * @param {String} direction The direction to use in order to add more items
	 */
	Plugin.prototype.calculateItemsToDisplay = function(direction) {
		this._visibleItemsWidth = 0;

		if (direction == 'forward') {
			if (this._firstVisibleItem < 0) {
				this._firstVisibleItem = 0;
			}

			var i = this._firstVisibleItem;

			while (this._visibleItemsWidth + $(this._items[i]).data('width') < this._carouselWrapperWidth && i < this._totalItems) {
				this._lastVisibleItem = i;
				this._visibleItemsWidth += $(this._items[i]).data('width');
				i++;
			}

			if (i == this._totalItems && this._firstVisibleItem !== 0) {
				this.calculateItemsToDisplay('backward');
			}

		} else if (direction == 'backward') {
			if (this._lastVisibleItem > (this._totalItems - 1)) {
				this._lastVisibleItem = (this._totalItems - 1);
			}

			var i = this._lastVisibleItem;

			while (this._visibleItemsWidth + $(this._items[i]).data('width') < this._carouselWrapperWidth && i >= 0) {
				this._firstVisibleItem = i;
				this._visibleItemsWidth += $(this._items[i]).data('width');
				i--;
			}

			if (i == -1 && this._lastVisibleItem !== (this._totalItems - 1)) {
				this.calculateItemsToDisplay('forward');
			}

		}

	}

	/**
	 * Animates the position of an element
	 * @param {Object} element
	 * @param {Number} left
	 */
	Plugin.prototype.animateElement = function(element, left) {
		if (this._useTransitions) {
			$(element).css({left: left});
		} else {
			$(element).stop(true).animate({left: left}, this.options.animationDuration);
		}
	}

	/**
	 * Returns the additional pixels to be added to items
	 * @return {Number}
	 */
	Plugin.prototype.getItemsExtraSpace = function() {
		var itemsExtraSpace = 0;
			freeSpace       = (this._carouselWrapperWidth - this._visibleItemsWidth),
			visibleItems    = (this._lastVisibleItem - this._firstVisibleItem + 1);

		if (freeSpace) {
			itemsExtraSpace = Math.floor(freeSpace / visibleItems);
		}

		return itemsExtraSpace;
	}

	$.fn[pluginName] = function (options) {
		return this.each(function() {
			if (!$.data(this, pluginName)) {
				$.data(this, pluginName, new Plugin(this, options));
			}
		});
	};

}(jQuery, window));
