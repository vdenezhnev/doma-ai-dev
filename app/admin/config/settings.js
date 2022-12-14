'use strict';

app.constant('settings', {
    API_URL: window.__api_host + window.__api_url,
    API_GET_IMAGE_URL: window.__api_host + 'api/file/images/binary/',
    TEMPLATE_DIR: document.baseURI + 'app/admin/views/'
});
