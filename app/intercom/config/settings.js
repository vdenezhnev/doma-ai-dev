'use strict';

app.constant('settings', {
    API_HOST: window.__api_host,
    API_URL: window.__api_host + window.__api_url,
    TEMPLATE_DIR: document.baseURI + 'app/intercom/views/',
    AUTH_ACTIVATION_ACCOUNT_URL: '/auth/activate_account?code',
    AUTH_PASSWORD_CHANGE_URL: '/auth/confirm_password_reset?code'
});
