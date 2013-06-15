/*
 * jQuery liquid carousel v2.0
 * http://www.nikolakis.net
 *
 * Copyright 2013, John Nikolakis
 * Free to use under the GPL license.
 * http://www.gnu.org/licenses/gpl.html
 */

/*jslint plusplus: true, todo: true, white: true */
/*global window, jQuery, $ */

// TODO:
//	 - See how to implement responsiveness (preferably detect changes on css)
//	 - Implement add/remove items functionality
//   - BUG: if the wrapper is smaller than the width of the item nothing is displayed

;(function($, window) {
	"use strict";

	var pluginName = 'liquidCarousel',
	    document   = window.document,
		defaults   = {
			height:            150,
			hideNavigation:    false,
			animationDuration: 1000,
			noTransitions:     false,
			touchDistance:	   25
		};

	/**
	 * The constructor of the plugin
	 * @param {Object} element
	 * @param {Object} options
	 */
	function Plugin(element, options) {
		this.element   = element;
		this.options   = $.extend({}, defaults, options) ;
		this.name      = pluginName;

		this.carouselWrapper      = null;
		this.carouselWrapperWidth = 0;

		this.items             = [];
		this.totalItems        = 0;
		this.firstVisibleItem  = 0;
		this.lastVisibleItem   = 0;
		this.visibleItemsWidth = 0;

		this.browserSupportsTransitions = false;
		this.useTransitions             = false;

		this.touchStartX  = 0;
		this.touchEndX    = 0;
		this.touchStarted = false;

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
		this.items      = $(this.element).children();
		this.totalItems = this.items.length;
		this.initItems();

		// Add the navigation buttons
		this.addNavigation();

		// Add css transitions if they are supported and are desirable
		this.browserSupportsTransitions = this.supports('transition');
		this.useTransitions             = (this.browserSupportsTransitions && !this.options.noTransitions);
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

		this.carouselWrapper = $(this.element).parent();
	};

	/**
	 * Sets the css and initial position for every item in the list
	 */
	Plugin.prototype.initItems = function() {
		var wrapperWidth   = this.carouselWrapper.outerWidth(true),
			carouselHeight = this.options.height,
			i,
			item;

		for (i = 0; i < this.totalItems; i++) {
			item = this.items[i];

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
		var instance = this,
			paddingLeft,
			paddingRight,
			navigationButtons;

		// Add next and prev buttons to wrapper
		this.carouselWrapper.prepend('<span class="navigation prev"></span>')
							 .append('<span class="navigation next"></span>');

		// add padding to the wrapper equal to the buttons width
		paddingLeft  = $('.navigation.prev', this.carouselWrapper).outerWidth(true);
		paddingRight = $('.navigation.next', this.carouselWrapper).outerWidth(true);

		this.carouselWrapper.css({
							    'padding-left':  paddingLeft,
								'padding-right': paddingRight
							   });

		// Bind next and previous clicks
		$('.navigation.next', this.carouselWrapper).click(function(){
			instance.next();
		});
		$('.navigation.prev', this.carouselWrapper).click(function(){
			instance.previous();
		});

		// If hide navigation is enabled display/hide buttons on wrapper hover
		if (this.options.hideNavigation) {
			navigationButtons = $('span.navigation', this.carouselWrapper);

			$(this.carouselWrapper).hover(
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
		if (this.lastVisibleItem < (this.totalItems - 1)) {
			this.firstVisibleItem = (this.lastVisibleItem + 1);
			this.redraw('forward');
		}
	};

	/**
	 * Displays the previous items
	 */
	Plugin.prototype.previous = function() {
		if (this.firstVisibleItem !== 0) {
			this.lastVisibleItem = (this.firstVisibleItem - 1);
			this.redraw('backward');
		}
	};

	/**
	 * Bind touch (swipe left/right) events if device supports it
	 */
	Plugin.prototype.bindTouchEvents = function() {
		var instance = this;

		if (!this.touchSupport()) {
			return;
		}

		$(this.carouselWrapper).bind('touchstart', function(e) {
			instance.touchStart(e, instance);
		});
	};

	/**
	 * Gets the touch start position and binds touch move method
	 * @param {Object} e        The fired event
	 * @param {Object} instance Instance of the plugin
	 */
	Plugin.prototype.touchStart = function(e, instance) {
		instance.touchStartX = e.originalEvent.touches[0].pageX;
		instance.touchStarted = true;

		$(instance.carouselWrapper).bind('touchmove', function(e) {
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

		if (!instance.touchStarted) {
			return;
		}

		var touchEndX        = e.originalEvent.touches[0].pageX,
			traveledDistance = (touchEndX - instance.touchStartX),
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
		$(this.carouselWrapper).unbind('touchend');
		this.touchStarted = false;
		this.touchStartX = 0;
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

		if (div.style[cssProperty] !== undefined) {
			return true;
		}

		cssProperty = cssProperty.replace(/^[a-z]/, function(val) {
			return val.toUpperCase();
		});

		while (vendorsLength--) {
			if (div.style[vendors[vendorsLength] + cssProperty] !== undefined) {
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
		if (!this.browserSupportsTransitions || !this.useTransitions) {
			return;
		}

		var durationSeconds = (this.options.animationDuration / 1000),
			transition      = 'all ' + durationSeconds + 's';

		this.items.css({
			'-webkit-transition': transition,
			'-moz-transition':    transition,
			'-ms-transition':     transition,
			'-o-transition':      transition
		});
	};

	/**
	 * Displays the items that should be visible and hides all the rest
	 * @param {String} direction
	 */
	Plugin.prototype.redraw = function(direction) {
		var itemPosition,
			spacing,
			wrapperWidth,
			i;

		if (direction === undefined || direction !== 'backward') {
			direction = 'forward';
		}

		this.carouselWrapperWidth = this.carouselWrapper.width();

		// Figure out which items should be visible
		this.calculateItemsToDisplay(direction);

		spacing      = this.getItemsExtraSpace();
		wrapperWidth = this.carouselWrapper.outerWidth(true);

		// Hide all elements before first visible one
		for (i = 0; i < this.firstVisibleItem; i++) {
			this.animateElement(this.items[i], -wrapperWidth);
		}

		// Hide all elements after last visible one
		for (i = (this.lastVisibleItem + 1); i < this.totalItems; i++) {
			this.animateElement(this.items[i], wrapperWidth);
		}

		// Set the position of every visible element
		itemPosition = Math.floor(spacing / 2);
		for (i = this.firstVisibleItem; i <= this.lastVisibleItem; i++) {
			this.animateElement(this.items[i], itemPosition);

			itemPosition += $(this.items[i]).data('width') + spacing;
		}

	};

	/**
	 * Figures out which items should be visible and their actual width
	 * @param {String} direction The direction to use in order to add more items
	 */
	Plugin.prototype.calculateItemsToDisplay = function(direction) {
		var i;

		this.visibleItemsWidth = 0;

		if (direction === 'forward') {
			if (this.firstVisibleItem < 0) {
				this.firstVisibleItem = 0;
			}

			i = this.firstVisibleItem;

			while (this.visibleItemsWidth + $(this.items[i]).data('width') < this.carouselWrapperWidth && i < this.totalItems) {
				this.lastVisibleItem = i;
				this.visibleItemsWidth += $(this.items[i]).data('width');
				i++;
			}

			if (i === this.totalItems && this.firstVisibleItem !== 0) {
				this.calculateItemsToDisplay('backward');
			}

		} else if (direction === 'backward') {
			if (this.lastVisibleItem > (this.totalItems - 1)) {
				this.lastVisibleItem = (this.totalItems - 1);
			}

			i = this.lastVisibleItem;

			while (this.visibleItemsWidth + $(this.items[i]).data('width') < this.carouselWrapperWidth && i >= 0) {
				this.firstVisibleItem = i;
				this.visibleItemsWidth += $(this.items[i]).data('width');
				i--;
			}

			if (i === -1 && this.lastVisibleItem !== (this.totalItems - 1)) {
				this.calculateItemsToDisplay('forward');
			}

		}

	};

	/**
	 * Animates the position of an element
	 * @param {Object} element
	 * @param {Number} left
	 */
	Plugin.prototype.animateElement = function(element, left) {
		if (this.useTransitions) {
			$(element).css({left: left});
		} else {
			$(element).stop(true).animate({left: left}, this.options.animationDuration);
		}
	};

	/**
	 * Returns the additional pixels to be added to items
	 * @return {Number}
	 */
	Plugin.prototype.getItemsExtraSpace = function() {
		var itemsExtraSpace = 0,
			freeSpace       = (this.carouselWrapperWidth - this.visibleItemsWidth),
			visibleItems    = (this.lastVisibleItem - this.firstVisibleItem + 1);

		if (freeSpace) {
			itemsExtraSpace = Math.floor(freeSpace / visibleItems);
		}

		return itemsExtraSpace;
	};

	$.fn[pluginName] = function (options) {
		return this.each(function() {
			if (!$.data(this, pluginName)) {
				$.data(this, pluginName, new Plugin(this, options));
			}
		});
	};

}(jQuery, window));
