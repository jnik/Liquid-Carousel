$(document).ready(function(){

	$('#android_carousel').liquidCarousel({
		height: 108,
		hideNavigation: false,
		showAnimation: function(element, left) {
			$(element).stop(true).animate({opacity: 1, left: left}, 800);
		},
		hideAnimation: function(element, left) {
			$(element).stop(true).animate({opacity: 0, left: left}, 800);
		}
	});
	$('#partheni_carousel').liquidCarousel({
		height: 170,
		hideNavigation: true
	});

	 //$('#partheni_carousel').data('liquidCarousel').next();
	 //$('#partheni_carousel').data('liquidCarousel').previous();
});
