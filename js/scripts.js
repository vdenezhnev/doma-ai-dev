window._confirmed = false;

function validatePassword(password) {
	return (password.length > 6)?true:false;
}
function comparePasswords(value1,value2) {
	return (value1 === value2)?true:false;
}
function validateField(value) {
	return (value.length > 2)?true:false;
}
function putError(elem,value) {
	$('[data-elem=' + elem + ']').html(value);
}

$('.wallet-operation a').bind('click',function(){
	$('.wallet-operation a').removeClass('selected');
	$(this).addClass('selected');
	$('.payment-block').hide();
	$($(this).attr('href')).show();
	return false;
});


function centerModal(item) {
	var top = $(window).outerHeight()/2 - item.outerHeight()/2;
	var left = $(window).outerWidth()/2 - item.outerWidth()/2;
	item.css('top',top+'px');
	item.css('left',left+'px');
}

$('.choose-menu a').bind('click',function(){
	$('.access-image').hide();
	$($(this).attr('href')).show();
	$('.choose-menu a').parent().removeClass('m-active');
	$(this).parent().addClass('m-active');
	return false;
});

$('.item-bubble').bind('click',function(){
	$('.more-text').hide();
	$($(this).data('block')).show();
	return false;
});

$('.partners-btn').bind('click',function(){
	var elem = $('#partners');
	elem.show();
	centerModal(elem);
	return false;
});

$('.recall .call-btn, .more-text-items a.get_partner').bind('click',function(){
	var elem = $('#call');
	elem.show();
	centerModal(elem);
	return false;
});

/*$('.install-btn').bind('click',function(){
	var elem = $('#install');
	elem.show();
	centerModal(elem);
	return false;
});*/

$('.action .install-btn, .why .button.install-btn, .steps .button.install-btn').bind('click',function(){
	var elem = $('#order');
	elem.show();
	centerModal(elem);
	return false;
});

$('.form-modal .close-btn').click(function(){
	$(this).parent().hide();
	return false;
});

$('.login-popup .popup-close').click(function(){
	$(this).parent().hide();
	$(".login-show").show();
	return false;
});

$('.login-show').click(function(){
	$(".login-popup").show();
	$(".login-show").hide();
	return false;
});

$('#signup-form p .ng-scope').click(function(){
	$("#login-form").show();
	$("#signup-form").hide();
	$("#restore-password-form").hide();
	return false;
});

$('#restore-password-form p a').click(function(){
	$("#login-form").show();
	$("#restore-password-form").hide();
	$("#signup-form").hide();
	return false;
});

$('#login-form .login-links .register-link').click(function(){
	$("#login-form").hide();
	$("#restore-password-form").hide();
	$("#signup-form").show();
	return false;
});

$('#login-form .login-links .forgot-link').click(function(){
	$("#login-form").hide();
	$("#restore-password-form").show();
	$("#signup-form").hide();
	return false;
});

/*$('.container-top .phone .call-btn').click(function(){
	$(".form-modal").show();
	return false;
});*/


$('.topmenu-ico-mobile a').click(function(){
	$(".hero .topmenu ul").show();
	$(".hero .topmenu ul li.selected ul, .hero .topmenu ul li.sibling ul").hide();
	return false;
});


$('.topmenu-mobile-close').click(function(){
	$(".hero .topmenu ul").hide();
	return false;
});


/*menu level2*/
$(".hero .topmenu ul li.selected, .hero .topmenu ul li.sibling").hover(
  function() {
  	$(this).find("ul").show();
  	$(this).find("a.level1").attr("style", "text-decoration: none; border: 1px solid #3ebcec; color: #3ebcec; -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px;")
  }, function() {
  	$(this).find("ul").hide();
  	$(this).find("a.level1").removeAttr("style");
  }
);

if ($(window).width() > '1000'){
	$(".youtube iframe").attr('width', 853);
	$(".youtube iframe").attr('height', 480);
}

if (($(window).width() >= '768')&&($(window).width() <= '1000')){
	$(".youtube iframe").attr('width', 700);
	$(".youtube iframe").attr('height', 480);
}
if (($(window).width() >= '481')&&($(window).width() <= '767')){
	$(".youtube iframe").attr('width', 370);
	$(".youtube iframe").attr('height', 380);

	/*******menu********/

}
if ($(window).width() <= '480'){
	$(".youtube iframe").attr('width', 270);
	$(".youtube iframe").attr('height', 380);
}



$(window).resize(function() {
	if ($(window).width() > '1000'){
		$(".youtube iframe").attr('width', 853);
		$(".youtube iframe").attr('height', 480);
	}
	if (($(window).width() >= '768')&&($(window).width() <= '1000')){
    	$(".youtube iframe").attr('width', 700);
		$(".youtube iframe").attr('height', 480);
    }
	if (($(window).width() >= '481')&&($(window).width() <= '767')){
		$(".youtube iframe").attr('width', 370);
		$(".youtube iframe").attr('height', 380);
	}

	if ($(window).width() <= '480'){
		$(".youtube iframe").attr('width', 270);
		$(".youtube iframe").attr('height', 380);
	}
});

$('.bxslider-ligthbox').bxSlider({
	mode: 'horizontal',
	auto: true,
	moveSlides: 1,
	slideMargin: 40,
	infiniteLoop: true,
	slideWidth: 660,
	minSlides: 3,
	maxSlides: 3,
	speed: 1000
});
