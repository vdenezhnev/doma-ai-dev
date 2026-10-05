'use strict';

/**
 * Minimal client for @open-condo/bridge postMessage protocol (Condo / Doma miniapp host).
 */
app.service('CondoBridge', ['$q', function ($q) {
    var DEFAULT_TIMEOUT_MS = 5000;
    var LAUNCH_PARAMS_TIMEOUT_MS = 8000;

    this.send = function (method, params, timeoutMs) {
        var timeout = timeoutMs || DEFAULT_TIMEOUT_MS;

        return $q(function (resolve, reject) {
            if (window.parent === window) {
                reject(new Error('Not embedded in Condo host'));
                return;
            }

            var requestId = 'acms-' + Date.now() + '-' + Math.random().toString(16).slice(2);
            var timer = setTimeout(function () {
                window.removeEventListener('message', onMessage);
                reject(new Error('Condo bridge timeout'));
            }, timeout);

            function onMessage(event) {
                var payload = event.data;
                if (!payload || payload.requestId !== requestId) {
                    return;
                }

                var type = payload.type || payload.handler;
                if (type !== method + 'Result' && type !== method + 'Error') {
                    return;
                }

                clearTimeout(timer);
                window.removeEventListener('message', onMessage);

                if (type === method + 'Error') {
                    reject(payload.data || payload.error || payload);
                    return;
                }

                resolve(payload.data != null ? payload.data : payload);
            }

            window.addEventListener('message', onMessage);
            window.parent.postMessage({
                handler: method,
                method: method,
                params: params || {},
                type: 'condo-bridge',
                version: 1,
                requestId: requestId
            }, '*');
        });
    };

    this.getLaunchParams = function () {
        return this.send('CondoWebAppGetLaunchParams', {}, LAUNCH_PARAMS_TIMEOUT_MS);
    };
}]);
