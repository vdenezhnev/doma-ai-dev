window.searchSkip = 0;
window.skip = 10;
window.keySkip = 10;
window.searchKeySkip = 0;

function login() {
	$.ajax({
	  async: true,
	  url: '/admin/login',
	  type: "POST",
	  data: {
	  	'phone':$('#login-phone').val(),
	  	'password':$('#login-password').val(),
	  },
	  success: function(data, status, jqxhr) {
	  	if(data == 'error') {
	  		BootstrapDialog.show({
				type: BootstrapDialog.TYPE_DANGER,
				closeByBackdrop: false,
		        title: '',
		        message: 'Неверный логин или пароль'
		    });
	  	}
	  	else if(data == 'success') {
	  		window.location = '/admin/client';
	  	}
	  	$('.loader').hide();
	  },
	  error: function() {
	  	$('.loader').hide();

	  	return false;
	  }

	});
}
function searchUser(val) {
	$.ajax({
	  async: true,
	  url: '/admin/searchUser',
	  type: "POST",
	  data: {
	  	'SearchPhrase':$('#search-form input[type="text"]').val(),
	  	'Skip':window.searchSkip
	  },
	  success: function(data, status, jqxhr) {
	  		// var arr = $.map(data, function(el) { return el; });
	  		window.searchSkip+=10;
	  		console.log(data);
	  		console.log(typeof data);
	  		data = JSON.parse(data);
	  		var elem = $('#client-all table');
	  		elem.empty();
	  		if(data.length) {
		  		
		  		data.forEach(function(item,i,data){
		  			elem.append('<tr><td class="date"><A href="#" data-id="'+ item.id +'" class="view-user">' +  item.displayName + '</a></td><td class="date">' +  item.phoneNumber + '</td><td class="date">' +  item.email + '</td></tr>');
		  		});
		  		// console.log(data);
		  		$('#more-client').show();
		  		$('.loader').hide();
	  		}
		  	else {
		  		$('#more-client').hide();
		  		elem.append('<tr><td class="date">Список пуст</td><td></td><td></td></tr>');
		  		console.log('Список пуст');
		  	}
		  	return false;
	  },
	  error: function() {
	  	$('.loader').hide();
	  	return false;
	  }

	});
}
function updateUsersList() {
	$.ajax({
	  async: true,
	  url: '/admin/client',
	  type: "POST",
	  data: {
	  	'skip':0
	  },
	  success: function(data, status, jqxhr) {
	  		// var arr = $.map(data, function(el) { return el; });
	  		window.skip=10;
	  		data = JSON.parse(data);
	  		if(data.length) {
		  		var elem = $('.payment-table table');
		  		elem.empty();
		  		data.forEach(function(item,i,data){
		  			elem.append('<tr><td class="date"><A href="#" data-id="'+ item.id +'" class="view-user">' +  item.displayName + '</a></td><td class="date">' +  item.phoneNumber + '</td><td class="date">' +  item.email + '</td></tr>');
		  		});
		  		// console.log(data);
		  		$('#more-client').show();
		  		$('.loader').hide();
	  		}
		  	else {
		  		console.log('Список пуст');
		  	}
	  },
	  error: function() {
	  	$('.loader').hide();
	  	return false;
	  }

	});
}
function getUsers(skip) {
	$.ajax({
	  async: true,
	  url: '/admin/client',
	  type: "POST",
	  data: {
	  	'skip':skip
	  },
	  success: function(data, status, jqxhr) {
	  		// var arr = $.map(data, function(el) { return el; });
	  		data = JSON.parse(data);
	  		if(data.length) {
		  		var elem = $('#client-all table');
		  		if(!skip) {
	  				elem.empty();
	  				$('#more-client').show();
	  			};
		  		data.forEach(function(item,i,data){
		  			elem.append('<tr><td class="date"><A href="#" data-id="'+ item.id +'" class="view-user">' +  item.displayName + '</a></td><td class="date">' +  item.phoneNumber + '</td><td class="date">' +  item.email + '</td></tr>');
		  		});
		  		// console.log(data);
		  		$('.loader').hide();
	  		}
		  	else {
		  		$('#more-client').hide();
		  		$('.loader').hide();
		  	}
	  },
	  error: function() {
	  	$('.loader').hide();
	  	return false;
	  }

	});
}

function viewUser(id) {
	$.ajax({
	  async: true,
	  url: '/admin/getUserInfo',
	  type: "POST",
	  data: {
		'id':id,	  	
	  },
	  success: function(data, status, jqxhr) {
	  	// console.log(data);
	  	data = JSON.parse(data);
	  	console.log(data);
		  	var elem = $('.key-container');
		  	elem.empty();
	  		$('#user-id').val(data.id);
	  		$('#name').val(data.displayName);
	  		$('#phone').val(data.phoneNumber);
	  		$('#email').val(data.email);
	  		data.keys.original.forEach(function(item,i,data){
	  			// elem.append('<tr><td class="date"><A href="#" data-id="'+ item.id +'" class="view-user">' +  item.displayName + '</a></td><td class="date">' +  item.phoneNumber + '</td><td class="date">' +  item.email + '</td></tr>');
	  			if(item.metadata!=null)
	  				elem.append('<div class="admin-key-block key-block duplicate"><a href="#" class="delete-key" data-id="'+ item.id +'"><img src="/assets/img/key-delete-icon.png"/></a><div class="key"><span class="owner"><b>Создан:</b><br/>'+item.metadata.created+'</span><span class="owner"><b>Изменен:</b><br/>' +item.metadata.modified+'</span><p class="key-status opened">Оригинал</p></div></div>');
	  			else
	  				elem.append('<div class="admin-key-block key-block duplicate"><a href="#" class="delete-key" data-id="'+ item.id +'"><img src="/assets/img/key-delete-icon.png"/></a><div class="key"><span class="owner"><b>Создан:</b><br/>'+'</span><span class="owner"><b>Изменен:</b><br/>' +'</span><p class="key-status opened">Оригинал</p></div></div>');
	  		});
	  		data.keys.duplicates.forEach(function(item,i,data){
	  			// elem.append('<tr><td class="date"><A href="#" data-id="'+ item.id +'" class="view-user">' +  item.displayName + '</a></td><td class="date">' +  item.phoneNumber + '</td><td class="date">' +  item.email + '</td></tr>');
	  			if(item.metadata!=null)
	  				elem.append('<div class="admin-key-block key-block duplicate"><a href="#" class="delete-key" data-id="'+ item.id +'"><img src="/assets/img/key-delete-icon.png"/></a><div class="key"><span class="owner"><b>Создан:</b><br/>'+item.metadata.created+'</span><span class="owner"><b>Изменен:</b><br/>' +item.metadata.modified+'</span><p class="key-status closed">Дубликат</p></div></div>');
	  			else
	  				elem.append('<div class="admin-key-block key-block duplicate"><a href="#" class="delete-key" data-id="'+ item.id +'"><img src="/assets/img/key-delete-icon.png"/></a><div class="key"><span class="owner"><b>Создан:</b><br/>'+'</span><span class="owner"><b>Изменен:</b><br/>' +'</span><p class="key-status closed">Дубликат</p></div></div>');
	  		});
	  		// alert(1);
	  		$('#user-profile').show();
			$('#user-close-btn').show();
			$('#user-delete-btn').show();
			$('#client-all').hide();
			$('#search-form').hide();
	  		$('.loader').hide();
	  },
	  error: function() {
	  	BootstrapDialog.show({
				type: BootstrapDialog.TYPE_DANGER,
				closeByBackdrop: false,
		        title: '',
		        message: 'Ошибка'
		    });
	  	$('.loader').hide();
	  }
	});
}
function deleteUser() {
	$.ajax({
	  async: true,
	  url: '/admin/deleteUser',
	  type: "POST",
	  data: {
		'UserId':$('#user-id').val(),
	  },
	  success: function(data, status, jqxhr) {
	  	console.log(data);
	  	BootstrapDialog.show({
			type: BootstrapDialog.TYPE_SUCCESS,
			closeByBackdrop: false,
	        title: '',
	        message: data
	    });
	    updateUsersList();
	  	$('.loader').hide();
	  },
	  error: function() {
	  	BootstrapDialog.show({
			type: BootstrapDialog.TYPE_DANGER,
			closeByBackdrop: false,
	        title: '',
	        message: 'Ошибка'
	    });
	  	$('.loader').hide();
	  }
	});
}
function updateUserInfo() {
	$.ajax({
	  async: true,
	  url: '/admin/updateUserInfo',
	  type: "POST",
	  data: {
		'UserId':$('#user-id').val(),
		'DisplayName':$('#name').val(),
		'PhoneNumber':$('#phone').val(),
		'Email':$('#email').val(),
	  },
	  success: function(data, status, jqxhr) {
	  	console.log(data);
	  	BootstrapDialog.show({
				type: BootstrapDialog.TYPE_SUCCESS,
				closeByBackdrop: false,
		        title: '',
		        message: 'Данные успешно сохранены'
		    });
	  	$('.loader').hide();
	  	
	  },
	  error: function() {
	  	BootstrapDialog.show({
				type: BootstrapDialog.TYPE_DANGER,
				closeByBackdrop: false,
		        title: '',
		        message: 'Ошибка'
		    });
	  	$('.loader').hide();
	  }
	});
}

$(document).on('click','.view-user',function(){
	$('.loader').show();
	viewUser($(this).data('id'));
	return false;
});
$('#more-client').bind('click',function(){
	// console.log(window.skip);
	if($('#search-form input[type="text"]').val()) {
		searchUser(window.searchSkip);
		window.searchSkip+=10;
	}
	else {
		getUsers(window.skip);
		window.skip+=10;
	}
	$('.loader').show();
	return false;
});

$('#search-form').submit(function(){
	if($('#search-form input[type="text"]').val() == '') {
		// alert(1);
		getUsers(0);
		window.skip=10;
	}
	else {
		searchUser(0);
		// window.skip=10;
	}
	return false;
});
$("#admin-login").validate({
	rules:{

	    'login-phone':{
	        required: true,
	        minlength: 4,
	        maxlength: 16,
	    },

	    'login-password':{
	        required: true,
	        minlength: 6,
	        maxlength: 16,
	    },
	},

	messages:{

	    'login-phone':{
	        required: "Это поле обязательно для заполнения",
	        minlength: "Логин должен быть минимум 4 символа",
	        maxlength: "Максимальное число символо - 16",
	    },

	    'login-password':{
	        required: "Это поле обязательно для заполнения",
	        minlength: "Пароль должен быть минимум 6 символа",
	        maxlength: "Пароль должен быть максимум 16 символов",
	    },

	},
	submitHandler: function(form) {
		// $('.loader').show();
		login();
		return false;
	}

});
$('#user-close-btn').bind('click',function(){
	$('#client-all').show();
	$('#user-profile').hide();
	$('#search-form').show();
	$('#user-delete-btn').hide();
	$(this).hide();
	return false;
});
$('#user-delete-btn').bind('click',function(){
	$('#client-all').show();
	$('#user-profile').hide();
	$(this).hide();
	deleteUser();
	return false;
});


$("#user-update-profile").validate({
	rules:{
	    'phone':{
	        required: true,
	        minlength: 4,
	    },

	    'name':{
	        required: true,
	    },
	    'email':{
	        required: true,
	        email: true,
	    },
	},

	messages:{

	    'phone':{
	        required: "Это поле обязательно для заполнения",
	        minlength: "Телефон должен быть минимум 4 символа",
	    },

	    'name':{
	        required: "Это поле обязательно для заполнения",
	    },
	    'email':{
	        required: "Это поле обязательно для заполнения",
	        email: "Неправильный email",
	    },

	},
	submitHandler: function(form) {
		// $('.loader').show();
		updateUserInfo();
		return false;
	}

});
$(document).on('click','.delete-key',function(){
	var elem = $(this);
	$.ajax({
	  async: true,
	  url: '/admin/deleteUserKey',
	  type: "POST",
	  data: {
	  	'UserId':$('#user-id').val(),
	  	'KeyId':$(this).data('id')
	  },
	  success: function(data, status, jqxhr) {
	  		BootstrapDialog.show({
				type: BootstrapDialog.TYPE_SUCCESS,
				closeByBackdrop: false,
		        title: '',
		        message: 'Ключ удален'
		    });
		    elem.parent().remove();
		    console.log('success'+data);
	  		// window.location = '/cabinet';
	  		return false;
	  },
	  error: function(data) {
	  	console.log('error:'+data);
	  	return false;
	  }
	});
	return false;
});
$('#block-keys').bind('click',function(){
	$.ajax({
	  async: true,
	  url: '/admin/blockPhoneKeys',
	  type: "POST",
	  data: {
	  	'UserId':$('#user-id').val()
	  },
	  success: function(data, status, jqxhr) {
	  		BootstrapDialog.show({
				type: BootstrapDialog.TYPE_SUCCESS,
				closeByBackdrop: false,
		        title: '',
		        message: 'Ключи заблокированы'
		    });
		    console.log(data);
	  		// window.location = '/cabinet';
	  		return false;
	  },
	  error: function() {
	  	console.log(data);
	  	return false;
	  }

	});
	return false;
});
$('#unblock-keys').bind('click',function(){
	$.ajax({
	  async: true,
	  url: '/admin/unblockPhoneKeys',
	  type: "POST",
	  data: {
	  	'UserId':$('#user-id').val()
	  },
	  success: function(data, status, jqxhr) {
	  		BootstrapDialog.show({
				type: BootstrapDialog.TYPE_SUCCESS,
				closeByBackdrop: false,
		        title: '',
		        message: 'Ключи разблокированы'
		    });
		    console.log(data);
	  		// window.location = '/cabinet';
	  		return false;
	  },
	  error: function() {
	  	console.log(data);
	  	return false;
	  }

	});
	return false;
});


/*
 * Ключи
 */

function getKeys(skip) {
	$.ajax({
	  async: true,
	  url: '/admin/keys',
	  type: "POST",
	  data: {
	  	'skip':skip
	  },
	  success: function(data, status, jqxhr) {
	  		// var arr = $.map(data, function(el) { return el; });
	  		data = JSON.parse(data);
	  		if(data.length) {
		  		var elem = $('#keys-all table');
		  		if(!skip) {
	  				elem.empty();
	  				$('#more-keys').show();
	  			};
		  		data.forEach(function(item,i,data){
		  			elem.append('<tr><td class="date"><A href="#" data-id="'+ item.id +'" class="view-user   view-lock">' +  item.id + '</a></td></tr>');
		  		});
		  		// console.log(data);
		  		$('.loader').hide();
	  		}
		  	else {
		  		$('#more-keys').hide();
		  		$('.loader').hide();
		  	}
	  },
	  error: function() {
	  	$('.loader').hide();
	  	return false;
	  }

	});
}
$('#more-keys').bind('click',function(){
	// console.log(window.skip);
	if($('#search-key-form input[type="text"]').val()) {
		searchKeys(window.searchKeySkip);
		window.searchKeySkip+=10;
	}
	else {
		getKeys(window.keySkip);
		window.keySkip+=10;
	}
	$('.loader').show();
	return false;
});
function searchKeys(val) {
	$.ajax({
	  async: true,
	  url: '/admin/searchKey',
	  type: "POST",
	  data: {
	  	'SearchPhrase':$('#search-key-form input[type="text"]').val(),
	  	'Skip':window.searchKeySkip
	  },
	  success: function(data, status, jqxhr) {
	  		// var arr = $.map(data, function(el) { return el; });
	  		window.searchSkip+=10;
	  		console.log(data);
	  		console.log(typeof data);
	  		data = JSON.parse(data);
	  		var elem = $('#keys-all table');
	  		elem.empty();
	  		if(data.length) {
		  		
		  		data.forEach(function(item,i,data){
		  			elem.append('<tr><td class="date"><A href="#" data-id="'+ item.id +'" class="view-user">' +  item.id + '</a></td></tr>');
		  		});
		  		// console.log(data);
		  		$('#more-keys').show();
		  		$('.loader').hide();
	  		}
		  	else {
		  		$('#more-keys').hide();
		  		elem.append('<tr><td class="date">Список пуст</td></tr>');
		  		console.log('Список пуст');
		  	}
		  	return false;
	  },
	  error: function() {
	  	$('.loader').hide();
	  	return false;
	  }

	});
}
$('#search-key-form').submit(function(){
	if($('#search-key-form input[type="text"]').val() == '') {
		// alert(1);
		getKeys(0);
		window.keySkip=10;
	}
	else {
		searchKeys(0);
		// window.skip=10;
	}
	return false;
});

$('#transport-add').bind('click',function(){
	if($("#transport-type :selected").val() != undefined) {
		if($("#transport-type :selected").val() == 1) {
			$('.wifi-add').show();
		}
		else if($("#transport-type :selected").val() == 2) {
			$('.bluetooth-add').show();	
		}
		else if($("#transport-type :selected").val() == 3) {
			$('.ble-add').show();	
		}
		$("#transport-type :selected").remove();
		if($("#transport-type :selected").val() == undefined) {
			$('#transport-select-container').hide();
		}
	}
	return false;
});

$('#edit-transport-add').bind('click',function(){	
    if($("#edit-transport-type :selected").val() != undefined) {
		if($("#edit-transport-type :selected").val() == 1) {
			$('.wifi-add').show();
		}
		else if($("#edit-transport-type :selected").val() == 2) {
			$('.bluetooth-add').show();	
		}
		else if($("#edit-transport-type :selected").val() == 3) {
			$('.ble-add').show();	
		}
		$("#edit-transport-type :selected").remove();
		if($("#edit-transport-type :selected").val() == undefined) {
			$('#edit-transport-select-container').hide();
		}
	}
	return false;
});

$('#create-key').bind('submit',function(){
	if(($('#mac-adress').val()!='' || $('#device-name').val()!='') && ($('.wifi-add').css('display') == 'block' || $('.ble-add').css('display') == 'block')) {
		var result = {
			"Action" : "RegisterLock",
		    "LockId" : $('#key-id').val(),
		    "Connectivity": {
		            "gestures": {
		              "useMethod1": ($('#gesture-method-1').prop('checked'))?true:false,
		              "useMethod2": ($('#gesture-method-2').prop('checked'))?true:false
		            },
		            "onMoving": {
		              "activeDistance": $('#active-distance').val(),
		              "autoOpen": $('#auto-open').val(),
		              "autoClose": $('#auto-close').val()
		            },
		            "transports": []
		          }
		};
		if($('#mac-adress').val() != '') {
			result.Connectivity.transports.push({
				'macAdress':$('#mac-adress').val(),
				'type':1
			});
		}
		if($('#bluetooth-device-name').val() != '') {
			result.Connectivity.transports.push({
				'deviceName': $('#bluetooth-device-name').val(),
				'macAdress':$('#bluetooth-mac-adress').val(),
				"SeсureUuid" : $('#secure-uuid').val(),
				"InseсureUuid" : $('#insecure-uuid').val(),
                'type':2
			});
		}
		if($('#device-name').val() != '') {
			result.Connectivity.transports.push({
				'deviceName': $('#device-name').val(),
				'macAdress':$('#ble-mac-adress').val(),
				"ServiceUuid" : $('#service-uuid').val(),
                "CharDataUuid" : $('#chardata-uuid').val(),
                "CharRssiUuid" : $('#charrssi-uuid').val(),
                'type':3
			});
		}
		console.log(result);
		$.ajax({
		  async: true,
		  url: '/admin/addKey',
		  type: "POST",
		  data: result,
		  success: function(data, status, jqxhr) {
		  		// var arr = $.map(data, function(el) { return el; });
		  		BootstrapDialog.show({
					type: BootstrapDialog.TYPE_SUCCESS,
					closeByBackdrop: false,
			        title: '',
			        message: 'Ключ создан'
			    });
		  },
		  error: function() {
		  	// $('.loader').hide();
		  	return false;
		  }

		});
	}
	else {
		alert('Необходимо указать хотя бы один тип транспорта!');
	}
	return false;
});

$('#edit-key').bind('submit',function(){
	if(($('#edit-mac-adress').val()!='' || $('#edit-device-name').val()!='') && ($('.wifi-edit-block').css('display') == 'block' || $('.ble-edit-block').css('display') == 'block')) {
		var result = {
			"Action" : "UpdateLock",
		    "LockId" : $('#edit-key-id').val(),
		    "Connectivity": {
		            "gestures": {
		              "useMethod1": ($('#edit-gesture-method-1').prop('checked'))?true:false,
		              "useMethod2": ($('#edit-gesture-method-2').prop('checked'))?true:false
		            },
		            "onMoving": {
		              "activeDistance": $('#edit-active-distance').val(),
		              "autoOpen": $('#edit-auto-open').val(),
		              "autoClose": $('#edit-auto-close').val()
		            },
		            "transports": []
		          }
		};
		if($('#edit-mac-adress').val() != '') {
			result.Connectivity.transports.push({
				'macAddress':$('#edit-mac-adress').val(),
				'type':1
			});
		}
		if($('#edit-secure-uuid').val() != '') {
			result.Connectivity.transports.push({
				'deviceName': $('#edit-bluetooth-device-name').val(),
				'macAddress':$('#edit-bluetooth-mac-adress').val(),
				"SecureUuid" : $('#edit-secure-uuid').val(),
				"InsecureUuid" : $('#edit-insecure-uuid').val(),
                'type':2
			});
		}
		if($('#edit-service-uuid').val() != '') {
			result.Connectivity.transports.push({
				'deviceName': $('#edit-device-name').val(),
				'macAddress':$('#edit-ble-mac-adress').val(),
				"ServiceUuid" : $('#edit-service-uuid').val(),
                "CharDataUuid" : $('#edit-chardata-uuid').val(),
                "CharRssiUuid" : $('#edit-charrssi-uuid').val(),
                'type':3
			});
		}
		console.log(result);
		$.ajax({
		  async: true,
		  url: '/admin/updateKey',
		  type: "POST",
		  data: result,
		  success: function(data, status, jqxhr) {
		  		// var arr = $.map(data, function(el) { return el; });
		  		BootstrapDialog.show({
					type: BootstrapDialog.TYPE_SUCCESS,
					closeByBackdrop: false,
			        title: '',
			        message: 'Ключ изменен'
			    });
		  },
		  error: function() {
		  	// $('.loader').hide();
		  	return false;
		  }

		});
	}
	else {
		alert('Необходимо указать хотя бы один тип транспорта!');
	}
	return false;
});

$('.create-lock-btn').bind('click',function(){
	$(this).hide();
	$('#search-key-form,#keys-all').hide();
	$('.create-key-container').show();
	$('#lock-close-btn').show();
	return false;
});
$('#lock-close-btn').bind('click',function(){
	$(this).hide();
	$('#search-key-form,#keys-all').show();
	$('.create-key-container,.edit-key-container').hide();
	$('.create-lock-btn').show();
	return false;
});

$(document).on('click','.view-lock',function(){
	$.ajax({
	  async: true,
	  url: '/admin/getLock',
	  type: "POST",
	  data: {
	  	'id':$(this).data('id')
	  },
	  success: function(data, status, jqxhr) {
	  		data = JSON.parse(data);
	  		data = data[0];
	  		console.log(data);
	  		$('#search-key-form,#keys-all,.create-lock-btn').hide();
			$('.edit-key-container').show();
			$('#lock-close-btn').show();
            $('.loader').hide();
			console.log(data.id);

			$('#edit-key-id').val(data.id);
			$('#edit-gesture-method-1').attr('checked',data.connectivity.gestures.useMethod1);
			$('#edit-gesture-method-2').attr('checked',data.connectivity.gestures.useMethod2);
			$('#edit-active-distance').val(data.connectivity.onMoving.activeDistance);
			$('#edit-active-distance').val(data.connectivity.onMoving.activeDistance);
			$('#edit-auto-close [value='+data.connectivity.onMoving.autoClose+']').attr('selected','selected');
			$('#edit-auto-open [value='+data.connectivity.onMoving.autoOpen+']').attr('selected','selected');
			if(typeof data.connectivity.transports !== undefined) {
				var transports = data.connectivity.transports;
				for (var i = 0;i <= transports.length - 1; i++) {
					if(transports[i].type==1) {
						$('#wifi-edit-block').show();
						$('#edit-mac-adress').val(transports[i].macAddress);
					}
					if(transports[i].type==2) {
						$('.bluetooth-edit-block').show();
						$('#edit-bluetooth-device-name').val(transports[i].deviceName);
						$('#edit-bluetooth-mac-adress').val(transports[i].macAddress);
						$('#edit-secure-uuid').val(transports[i].secureUuid);
						$('#edit-insecure-uuid').val(transports[i].insecureUuid);
					}
					if(transports[i].type==3) {
						$('.ble-edit-block').show();
						$('#edit-device-name').val(transports[i].deviceName);
						$('#edit-ble-mac-adress').val(transports[i].macAddress);
						$('#edit-service-uuid').val(transports[i].serviceUuid);
						$('#edit-chardata-uuid').val(transports[i].charDataUuid);
						$('#edit-charrssi-uuid').val(transports[i].charRssiUuid);
					}
					$('#edit-transport-type [value='+transports[i].type+']').remove();
				};
				if($("#edit-transport-type :selected").val() == undefined) {
					$('#edit-transport-select-container').hide();
				}
			}
	  },
	  error: function() {
	  	// $('.loader').hide();
	  	return false;
	  }

	});
	return false;
});
