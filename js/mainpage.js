jQuery(document).ready(function(){  

	doc_w = $(document).width();
	carusel(doc_w);

	function carusel(doc_w){
		if (doc_w >= 768){
		 	$('.bxslider.solutions').bxSlider({
		            mode: 'horizontal',
		            //auto: true,
		            moveSlides: 1,
		            slideMargin: 40,
		            infiniteLoop: true,
		            slideWidth: 660,
		            minSlides: 3,
		            maxSlides: 3,
		            speed: 1000,
		    });

		    $(document).ready(function(){
		        $('.bxslider.compatibility').bxSlider({
		            mode: 'horizontal',
		            //auto: true,
		            moveSlides: 1,
		            slideMargin: 40,
		            infiniteLoop: true,
		            slideWidth: 660,
		            minSlides: 3,
		            maxSlides: 3,
		            speed: 1000,
		        });
		    });

		    $(document).ready(function(){
		        $('.bxslider.example').bxSlider({
		            mode: 'horizontal',
		            //auto: true,
		            moveSlides: 1,
		            slideMargin: 40,
		            infiniteLoop: true,
		            slideWidth: 660,
		            minSlides: 3,
		            maxSlides: 3,
		            speed: 1000,
		        });
		    });
		}

		/**************/

		if ((doc_w >=481)&&(doc_w < 768)){
		 	$('.bxslider.solutions').bxSlider({
		            mode: 'horizontal',
		            //auto: true,
		            moveSlides: 1,
		            slideMargin: 40,
		            infiniteLoop: true,
		            slideWidth: 660,
		            minSlides: 2,
		            maxSlides: 2,
		            speed: 1000,
		    });

		    $(document).ready(function(){
		        $('.bxslider.compatibility').bxSlider({
		            mode: 'horizontal',
		            //auto: true,
		            moveSlides: 1,
		            slideMargin: 40,
		            infiniteLoop: true,
		            slideWidth: 660,
		            minSlides: 2,
		            maxSlides: 2,
		            speed: 1000,
		        });
		    });

		    $(document).ready(function(){
		        $('.bxslider.example').bxSlider({
		            mode: 'horizontal',
		            //auto: true,
		            moveSlides: 1,
		            slideMargin: 40,
		            infiniteLoop: true,
		            slideWidth: 660,
		            minSlides: 2,
		            maxSlides: 2,
		            speed: 1000,
		        });
		    });
		}

		/**************/

		if (doc_w<481){
		 	$('.bxslider.solutions').bxSlider({
		            mode: 'horizontal',
		            //auto: true,
		            moveSlides: 1,
		            slideMargin: 40,
		            infiniteLoop: true,
		            slideWidth: 660,
		            minSlides: 1,
		            maxSlides: 1,
		            speed: 1000,
		    });

		    $(document).ready(function(){
		        $('.bxslider.compatibility').bxSlider({
		            mode: 'horizontal',
		            //auto: true,
		            moveSlides: 1,
		            slideMargin: 40,
		            infiniteLoop: true,
		            slideWidth: 660,
		            minSlides: 1,
		            maxSlides: 1,
		            speed: 1000,
		        });
		    });

		    $(document).ready(function(){
		        $('.bxslider.example').bxSlider({
		            mode: 'horizontal',
		            //auto: true,
		            moveSlides: 1,
		            slideMargin: 40,
		            infiniteLoop: true,
		            slideWidth: 660,
		            minSlides: 1,
		            maxSlides: 1,
		            speed: 1000,
		        });
		    });
		}			
	}	



	$( window ).resize(function() {
		doc_w = $(document).width();
		carusel(doc_w);
	});

	$('#send-request').appear();
 	$('#send-request').on('appear', function(event, $all_appeared_elements) {
 		if (!Cookies.get('popupIsOpened')) {
			Cookies.set('popupIsOpened', true);
			$('#send-request').click();
		}
	});
});
