if (!window.console) {
	console = {
		log: function(){}
	};
}

$(document).ready(function(){

	$('#android_carousel').liquidCarousel({
		height: 108,
		hideNavigation: false,
		onBeforeNext: function() {
			console.log('%conBeforeNext', 'color: green; font-weight:bold;', ' has been called');
		},
		onBeforePrevious: function() {
			console.log('%conBeforePrevious', 'color: green; font-weight:bold;', ' has been called');
		}
	});

	$('#androidPrevious').click(function(){
		$('#android_carousel').liquidCarousel('previous');
	});

	$('#androidNext').click(function(){
		$('#android_carousel').liquidCarousel('next');
	});




	$('#partheni_carousel').liquidCarousel({
		height: 170,
		hideNavigation: true,
		animationDuration: 800,
		noTransitions: true
	});

	$('#partheniPrevious').click(function(){
		$('#partheni_carousel').liquidCarousel('previous');
	});

	$('#partheniNext').click(function(){
		$('#partheni_carousel').liquidCarousel('next');
	});

});
