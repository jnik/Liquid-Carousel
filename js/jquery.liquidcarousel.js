/*
 * jQuery liquid carousel v2.0
 * http://www.nikolakis.net
 *
 * Copyright 2013, John Nikolakis
 * Free to use under the GPL license.
 * http://www.gnu.org/licenses/gpl.html
 */

 /*
  * Based on jQuery plugin boilerplate created by Jonathan Nicol @f6design
  * https://github.com/jnicol/jquery-plugin-boilerplate
  */

/*jslint plusplus: true, todo: true, white: true */
/*global window, document, jQuery, $ */

// TODO:
//	 - See how to implement responsiveness (preferably detect changes on css)
//	 - Implement add/remove items functionality
//   - Implement change speed/animation duration functionality
//   - Expose methods for pagination (number of 'pages', current page, go to page)
//   - Allow the removal of previous/next arrows
//   - BUG: if the wrapper is smaller than the width of the item nothing is displayed

;(function($) {
	"use strict";

	var pluginName = 'liquidCarousel';

	function Plugin(element, options) {

		var el  = element,
			$el = $(element),

			carouselWrapper      = null,
			carouselWrapperWidth = 0,

			items             = [],
			totalItems        = 0,
			firstVisibleItem  = 0,
			lastVisibleItem   = 0,
			visibleItemsWidth = 0,

			browserSupportsTransitions = false,
			useTransitions             = false,

			touchStartX  = 0,
			touchStarted = false;

		options = $.extend({}, $.fn[pluginName].defaults, options);


		/**
		 * Callback hooks
		 * @param {String} hookname
		 */
		function hook(hookName) {
			if (options[hookName] !== undefined) {
				options[hookName].call(el);
			}
		}


		/**
		 * Adds a wrapper div to the the lists
		 */
		function addCarouselWrapper() {
			carouselWrapper = $('<div/>')
								  .addClass('liquid_carousel_wrapper')
								  .css({
									  height:   options.height,
									  overflow: 'hidden',
									  position: 'relative'
								  });

			$el.wrap(carouselWrapper);

			carouselWrapper = $el.parent();
		}


		/**
		 * Sets the css and initial position for every item in the list
		 */
		function initItems() {
			var wrapperWidth   = carouselWrapper.outerWidth(true),
				carouselHeight = options.height,
				i,
				item;

			for (i = 0; i < totalItems; i++) {
				item = items[i];

				$(item).data('width', $(item).outerWidth(true))
					   .css({
							position: 'absolute',
							left:      wrapperWidth,
							top:       Math.floor((carouselHeight - $(item).outerHeight(true)) / 2)
						});
			}
		}


		/**
		 * Animates the position of an element
		 * @param {Object} element
		 * @param {Number} left
		 */
		function animateElement(element, left) {
			if (useTransitions) {
				$(element).css({left: left});
			} else {
				$(element).stop(true).animate({left: left}, options.animationDuration);
			}
		}


		/**
		 * Figures out which items should be visible and their actual width
		 * @param {String} direction The direction to use in order to add more items
		 */
		function calculateItemsToDisplay(direction) {
			var i;

			visibleItemsWidth = 0;

			if (direction === 'forward') {
				if (firstVisibleItem < 0) {
					firstVisibleItem = 0;
				}

				i = firstVisibleItem;

				while (visibleItemsWidth + $(items[i]).data('width') < carouselWrapperWidth && i < totalItems) {
					lastVisibleItem = i;
					visibleItemsWidth += $(items[i]).data('width');
					i++;
				}

				if (i === totalItems && firstVisibleItem !== 0) {
					calculateItemsToDisplay('backward');
				}

			} else if (direction === 'backward') {
				if (lastVisibleItem > (totalItems - 1)) {
					lastVisibleItem = (totalItems - 1);
				}

				i = lastVisibleItem;

				while (visibleItemsWidth + $(items[i]).data('width') < carouselWrapperWidth && i >= 0) {
					firstVisibleItem = i;
					visibleItemsWidth += $(items[i]).data('width');
					i--;
				}

				if (i === -1 && lastVisibleItem !== (totalItems - 1)) {
					calculateItemsToDisplay('forward');
				}

			}

		}
		

		/**
		 * Returns the additional pixels to be added to items
		 * @return {Number}
		 */
		function getItemsExtraSpace() {
			var itemsExtraSpace = 0,
				freeSpace       = (carouselWrapperWidth - visibleItemsWidth),
				visibleItems    = (lastVisibleItem - firstVisibleItem + 1);

			if (freeSpace) {
				itemsExtraSpace = Math.floor(freeSpace / visibleItems);
			}

			return itemsExtraSpace;
		}


		/**
		 * Displays the items that should be visible and hides all the rest
		 * @param {String} direction
		 */
		function redraw(direction) {
			var itemPosition,
				spacing,
				wrapperWidth,
				i;

			if (direction === undefined || direction !== 'backward') {
				direction = 'forward';
			}

			carouselWrapperWidth = carouselWrapper.width();

			// Figure out which items should be visible
			calculateItemsToDisplay(direction);

			spacing      = getItemsExtraSpace();
			wrapperWidth = carouselWrapper.outerWidth(true);

			// Hide all elements before first visible one
			for (i = 0; i < firstVisibleItem; i++) {
				animateElement(items[i], -wrapperWidth);
			}

			// Hide all elements after last visible one
			for (i = (lastVisibleItem + 1); i < totalItems; i++) {
				animateElement(items[i], wrapperWidth);
			}

			// Set the position of every visible element
			itemPosition = Math.floor(spacing / 2);
			for (i = firstVisibleItem; i <= lastVisibleItem; i++) {
				animateElement(items[i], itemPosition);

				itemPosition += $(items[i]).data('width') + spacing;
			}

		}


		/**
		 * Displays the next items
		 */
		function next() {
			if (lastVisibleItem < (totalItems - 1)) {
				hook('onBeforeNext');
				firstVisibleItem = (lastVisibleItem + 1);
				redraw('forward');
			}
		}


		/**
		 * Displays the previous items
		 */
		function previous() {
			if (firstVisibleItem !== 0) {
				hook('onBeforePrevious');
				lastVisibleItem = (firstVisibleItem - 1);
				redraw('backward');
			}
		}


		/**
		 * Adds the navigation buttons and binds click events on them
		 */
		function addNavigation() {
			var paddingLeft,
				paddingRight,
				navigationButtons;

			// Add next and prev buttons to wrapper
			carouselWrapper.prepend('<span class="navigation prev"></span>')
						   .append('<span class="navigation next"></span>');

			// add padding to the wrapper equal to the buttons width
			paddingLeft  = $('.navigation.prev', carouselWrapper).outerWidth(true);
			paddingRight = $('.navigation.next', carouselWrapper).outerWidth(true);

			carouselWrapper.css({
								 'padding-left':  paddingLeft,
								 'padding-right': paddingRight
								});

			// Bind next and previous clicks
			$('.navigation.next', carouselWrapper).click(function(){
				next();
			});
			$('.navigation.prev', carouselWrapper).click(function(){
				previous();
			});

			// If hide navigation is enabled display/hide buttons on wrapper hover
			if (options.hideNavigation) {
				navigationButtons = $('span.navigation', carouselWrapper);

				$(carouselWrapper).hover(
					function() {
						navigationButtons.css({opacity: 1});
					},
					function() {
						navigationButtons.css({opacity: 0});
					}
				);

				navigationButtons.css({opacity: 0});
			}
		}


		/**
		 * Returns if a the browser has touch support
		 * @return {Boolean}
		 */
		function touchSupport() {
			return !!('ontouchstart' in window) || !!('onmsgesturechange' in window);
		}


		/**
		 * Resets the variables used for tracking touch movement
		 */
		function touchEnd() {
			$(carouselWrapper).unbind('touchend');
			touchStarted = false;
			touchStartX = 0;
		}


		/**
		 * Checks if finger has travelled more than the defined distance and calls next or previous methods
		 * @param {Object} e The fired event
		 */
		function touchMove(e) {
			e.preventDefault();

			if (!touchStarted) {
				return;
			}

			var touchEndX        = e.originalEvent.touches[0].pageX,
				traveledDistance = (touchEndX - touchStartX),
				touchDistance    = options.touchDistance;

			if (traveledDistance > touchDistance) {
				touchEnd();
				previous();
			} else if (traveledDistance < -touchDistance) {
				touchEnd();
				next();
			}
		}


		/**
		 * Gets the touch start position and binds touch move method
		 * @param {Object} e The fired event
		 */
		function touchStart(e) {
			touchStartX = e.originalEvent.touches[0].pageX;
			touchStarted = true;

			$(carouselWrapper).bind('touchmove', function(e) {
				touchMove(e);
			});
		}


		/**
		 * Bind touch (swipe left/right) events if device supports it
		 */
		function bindTouchEvents() {
			if (!touchSupport()) {
				return;
			}

			$(carouselWrapper).bind('touchstart', function(e) {
				touchStart(e);
			});
		}


		/**
		 * Returns if a css property is supported by the browser
		 * @param {String} cssProperty
		 * @return {Boolean}
		 */
		function supports(cssProperty) {
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
		}


		/**
		 * Adds css transitions to every item in the list
		 */
		function addCssTransitions() {
			if (!browserSupportsTransitions || !useTransitions) {
				return;
			}

			var durationSeconds = (options.animationDuration / 1000),
				transition      = 'all ' + durationSeconds + 's';

			items.css({
				'-webkit-transition': transition,
				'-moz-transition':    transition,
				'-ms-transition':     transition,
				'-o-transition':      transition
			});
		}


		/**
		 * Get/set a plugin option.
		 * Get usage: $('#el').demoplugin('option', 'key');
		 * Set usage: $('#el').demoplugin('option', 'key', value);
		 */
		function option (key, val) {
			if (val) {
				options[key] = val;
			} else {
				return options[key];
			}
		}


		/**
		 * Destroys the plugin
		 */
		function destroy() {
			// Iterate over each matching element.
			$el.each(function() {
				var $el = $(this);

				// Add code to restore the element to its original state...
				hook('onDestroy');

				// Remove Plugin instance from the element.
				$el.removeData('plugin_' + pluginName);
			});
		}


		/**
		 * Initialize plugin.
		 */
		function init() {
			// Add a wrapper to the list			
			addCarouselWrapper();

			// Set the style of the list
			$el.css({
				height:   options.height,
				position: 'relative',
				overflow: 'hidden'
			});

			// Set the initial css and position for all list items
			items      = $el.children();
			totalItems = items.length;
			initItems();

			// Add the navigation buttons
			addNavigation();

			// Add css transitions if they are supported and are desirable
			browserSupportsTransitions = supports('transition');
			useTransitions             = (browserSupportsTransitions && !options.noTransitions);
			addCssTransitions();

			// Bind redraw method to window resize
			$(window).bind('resize.liquidCarousel', function() {
				redraw();
			});

			// Bind touch events
			bindTouchEvents();

			redraw();

			hook('onInit');
		}


		// Initialize the plugin instance
		init();

		// Public methods
		return {
			option:   option,
			destroy:  destroy,
			next:     next,
			previous: previous
		};

	}

	/**
	 * Plugin definition
	 */
	$.fn[pluginName] = function(options) {
		// If the first parameter is a string, treat this as a call to a public method
		if (typeof arguments[0] === 'string') {
			var methodName = arguments[0],
				args       = Array.prototype.slice.call(arguments, 1),
				returnVal;

			this.each(function() {
				// Check that the element has a plugin instance, and that the requested public method exists
				if ($.data(this, 'plugin_' + pluginName) && typeof $.data(this, 'plugin_' + pluginName)[methodName] === 'function') {
					// Call the method of the Plugin instance, and Pass it the supplied arguments
					returnVal = $.data(this, 'plugin_' + pluginName)[methodName].apply(this, args);
				} else {
					throw new Error('Method ' +  methodName + ' does not exist on jQuery.' + pluginName);
				}
			});

			// If the method returned a value, return the value
			if (returnVal !== undefined) {
				return returnVal;
			}

			// Otherwise, returning 'this' preserves chainability
			return this;
		} 

		// If the first parameter is an object (options), or was omitted, instantiate a new instance of the plugin
		if (typeof options === 'object' || !options) {
			return this.each(function() {
				// Only allow the plugin to be instantiated once
				if (!$.data(this, 'plugin_' + pluginName)) {
					// Pass options to Plugin constructor, and store Plugin instance in the elements jQuery data object
					$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
				}
			});
		}
	};

	// Default values
	$.fn[pluginName].defaults = {
		onInit:            function() {},
		onDestroy:         function() {},
		onBeforeNext:      function() {},
		onBeforePrevious:  function() {},
		height:            150,
		hideNavigation:    false,
		animationDuration: 1000,
		noTransitions:     false,
		touchDistance:	   25
	};

})(jQuery);
