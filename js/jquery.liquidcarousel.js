/*
 * jQuery liquid carousel v2.0
 * http://www.nikolakis.net
 *
 * Copyright 2012, John Nikolakis
 * Free to use under the GPL license.
 * http://www.gnu.org/licenses/gpl.html
 */

;(function($, window, undefined) {

	var pluginName = 'liquidCarousel',
	document = window.document,
	defaults = {
		height: 150,
		hideNavigation: false,
		animationDuration: 1000,
		noTransitions: false
	};

	function Plugin(element, options) {
		this.element = element;
		this.options = $.extend({}, defaults, options) ;
		this._defaults = defaults;
		this._name = pluginName;
		this._carouselWrapper;
		this._carouselWrapperWidth = 0;
		this._items = [];
		this._totalItems = 0;
		this._firstDisplayedItem = 0;
		this._lastDisplayedItem = 0;
		this._displayedItems = 0;
		this._displayedItemsWidth = 0;
		this._direction = 'forward';
		this._browserSupportsTransitions = false;
		this._useTransitions = false;
		this.init();
	}

	Plugin.prototype.init = function() {
		var carouselWrapper = $('<div class="liquid_carousel_wrapper" />');
		carouselWrapper.css({height: this.options.height});
		carouselWrapper.css({overflow: 'hidden'});
		carouselWrapper.css({position: 'relative'});
		$(this.element).wrap(carouselWrapper);
		this._carouselWrapper = $(this.element).parent();

		$(this.element).css({height: this.options.height});
		$(this.element).css({position: 'relative'});
		$(this.element).css({overflow: 'hidden'});

		this._items = $(this.element).children();
		this.initItems();

		this._totalItems = this._items.length;

		this.addNavigation();

		var instance = this;
		$(window).bind('resize.liquidCarousel', function(){
			instance.redraw();
		});

		this._browserSupportsTransitions = this.supports('transition');
		this._useTransitions = (this._browserSupportsTransitions && !this.options.noTransitions);
		this.addCssTransitions();

		this.redraw();
	};

	Plugin.prototype.initItems = function() {
		var wrapperWidth = this._carouselWrapper.outerWidth(true);
		var carouselHeight = this.options.height;
		$.each(this._items, function(key, item) {
			$(item).data('width', $(item).outerWidth(true));
			$(item).css({
				position: 'absolute',
				left: wrapperWidth,
				top: Math.floor((carouselHeight - $(item).outerHeight(true)) / 2)
			});
		});
	}

	Plugin.prototype.addCssTransitions = function() {
		if (!this._browserSupportsTransitions || !this._useTransitions) {
			return;
		}

		var durationSeconds = (this.options.animationDuration / 1000);
		var transition = 'all ' + durationSeconds + 's';

		this._items.css({
			'-webkit-transition': transition,
			'-moz-transition': transition,
			'-ms-transition': transition,
			'-o-transition': transition,
		});
	}

	Plugin.prototype.addNavigation = function() {
		this._carouselWrapper.prepend('<span class="navigation prev"></span>');
		this._carouselWrapper.append('<span class="navigation next"></span>');

		var paddingLeft = $('.navigation.prev', this._carouselWrapper).outerWidth(true);
		var paddingRight = $('.navigation.next', this._carouselWrapper).outerWidth(true);

		this._carouselWrapper.css({'padding-left':paddingLeft,'padding-right':paddingRight});

		var instance = this;
		$('.navigation.next', this._carouselWrapper).click(function(){
			instance.next();
		});
		$('.navigation.prev', this._carouselWrapper).click(function(){
			instance.previous();
		});

		if (this.options.hideNavigation) {
			$(this._carouselWrapper).hover(
				function() {
					$('span.navigation', this).css({opacity: 1});
				},
				function() {
					$('span.navigation', this).css({opacity: 0});
				}
			);

			$('span.navigation', this._carouselWrapper).css({opacity: 0});
		}
	}

	Plugin.prototype.redraw = function() {
		this._carouselWrapperWidth = this._carouselWrapper.width();

		this.calculateItemsToDisplay();

		itemsFreemSpace = this.getItemsExtraSpace();

		var wrapperWidth = this._carouselWrapper.outerWidth(true);

		for (i = 0; i < this._firstDisplayedItem; i++) {
			this.animateElement(this._items[i], -wrapperWidth);
		}

		for (i = (this._lastDisplayedItem + 1); i < this._totalItems; i++) {
			this.animateElement(this._items[i], wrapperWidth);
		}

		var itemPosition = Math.floor(itemsFreemSpace / 2);
		for (i = this._firstDisplayedItem; i <= this._lastDisplayedItem; i++) {
			this.animateElement(this._items[i], itemPosition);

			itemPosition += $(this._items[i]).data('width') + itemsFreemSpace;
		}
	}

	// Returns the additional pixels to be added to items
	Plugin.prototype.getItemsExtraSpace = function() {
		var itemsExtraSpace = 0;

		var freeSpace = (this._carouselWrapperWidth - this._displayedItemsWidth);
		if (freeSpace) {
			itemsExtraSpace = Math.floor(freeSpace / this._displayedItems);
		}

		return itemsExtraSpace;
	}

	Plugin.prototype.calculateItemsToDisplay = function() {
		this._displayedItemsWidth = 0;

		if (this._firstDisplayedItem < 0) {
			this._firstDisplayedItem = 0;
		}
		if (this._lastDisplayedItem >= this._totalItems) {
			this._lastDisplayedItem = (this._totalItems - 1);
		}

		if (this._direction == 'forward') {
			this._lastDisplayedItem = this.addForwardItems(this._firstDisplayedItem);

			if (this._lastDisplayedItem == (this._totalItems -1))
			{
				this._firstDisplayedItem = this.addBackwardItems(this._firstDisplayedItem-1);
			}

		} else if (this._direction == 'backward') {
			this._firstDisplayedItem = this.addBackwardItems(this._lastDisplayedItem);

			if (this._firstDisplayedItem == 0) {
				this._lastDisplayedItem = this.addForwardItems(this._lastDisplayedItem+1);
			}

		}

		this._displayedItems = (this._lastDisplayedItem - this._firstDisplayedItem);
	}

	Plugin.prototype.addForwardItems = function(itemNumber) {
		while (itemNumber < this._totalItems) {
			itemWidth = $(this._items[itemNumber]).data('width');

			if (this._displayedItemsWidth + itemWidth < this._carouselWrapperWidth) {
				this._displayedItemsWidth += itemWidth;
				itemNumber++;
			} else {
				itemNumber--;
				break;
			}
		}

		if (itemNumber == this._totalItems) {
			itemNumber = (this._totalItems - 1);
		}

		return itemNumber;
	}

	Plugin.prototype.addBackwardItems = function(itemNumber) {
		while (itemNumber >= 0) {
			itemWidth = $(this._items[itemNumber]).data('width');

			if (this._displayedItemsWidth + itemWidth < this._carouselWrapperWidth) {
				this._displayedItemsWidth += itemWidth;
				itemNumber--;
			} else {
				itemNumber++;
				break;
			}
		};

		if (itemNumber == -1) {
			itemNumber = 0;
		}

		return itemNumber;
	}

	Plugin.prototype.next = function() {
		if (this._lastDisplayedItem < (this._totalItems - 1)) {
			this._firstDisplayedItem = (this._lastDisplayedItem + 1);
			this._direction = 'forward';
			this.redraw();
		}
	}

	Plugin.prototype.previous = function() {
		if (this._firstDisplayedItem) {
			this._lastDisplayedItem = (this._firstDisplayedItem - 1);
			this._direction = 'backward';
			this.redraw();
		}
	}

	Plugin.prototype.animateElement = function(element, left) {
		if (this._useTransitions) {
			$(element).css({left: left});
		} else {
			$(element).stop(true).animate({left: left}, this.options.animationDuration);
		}
	}

	// Returns if a css property is supported by the browser
	Plugin.prototype.supports = function(cssProperty) {
		var div = document.createElement('div'),
			vendors = ['khtml', 'ms', 'o', 'moz', 'webkit'],
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

	$.fn[pluginName] = function (options) {
		return this.each(function() {
			if (!$.data(this, pluginName)) {
				$.data(this, pluginName, new Plugin(this, options));
			}
		});
	}

}(jQuery, window));
