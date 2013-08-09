#Liquid-Carousel v2.0


Liquid carousel v2.0 is a jQuery plugin intended for liquid designs. Every time the container of the carousel gets resized, the number of items in the list change to fit the new width.

**This plugin is still under development**

- You can see a demo at http://jnik.github.io/Liquid-Carousel/
- You can find the older version of the plugin at http://www.nikolakis.net/liquidcarousel/

##New in this version

- Touch support
- Support for CSS3 animations
- Carousel elements can have different height / width
- Public methods for displaying previous / next elements

##Usage

**Properties**
```js
$('#selector').liquidCarousel({
    height: 200,                   // Th height of the carousel (in pixels)
    hideNavigation: false,         // Hide navigation elements
    animationDuration: 1000,       // The duration of the animation (in ms)
    noTransitions: false,          // Don't use CSS transitions even if they are available
    onBeforeNext: function(){},    // Function to run before the next carousel items appear
    onBeforePrevious: function(){} // Function to run before the previous carousel items appear
});
```
**Methods**
```js
$('#selector').liquidCarousel('next');     // Displays the next carousel items
$('#selector').liquidCarousel('previous'); // Displays the previous carousel items
```



