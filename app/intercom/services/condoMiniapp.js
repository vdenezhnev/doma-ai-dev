'use strict';

app.service('CondoMiniapp', ['$q', '$location', 'CondoBridge', function ($q, $location, CondoBridge) {
    var LAUNCH_STORAGE_KEY = 'acms_condo_launch_params';

    this.isEmbedded = function () {
        var search = $location.search();
        if (search.condoMiniapp === '1' || search.condoMiniapp === 'true') {
            return true;
        }

        if (search.condoUserId || search.domaUserId) {
            return true;
        }

        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    };

    this.getCachedLaunchParams = function () {
        try {
            var raw = sessionStorage.getItem(LAUNCH_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    };

    this.cacheLaunchParams = function (params) {
        try {
            sessionStorage.setItem(LAUNCH_STORAGE_KEY, JSON.stringify(params || {}));
        } catch (e) {
            // ignore
        }
    };

    this.getLaunchParams = function () {
        var cached = this.getCachedLaunchParams();
        if (cached && cached.condoUserId) {
            return $q.resolve(cached);
        }

        var search = $location.search();
        if (search.domaUserId || search.condoUserId) {
            var fromQuery = {
                condoUserId: search.domaUserId || search.condoUserId,
                condoUserType: search.condoUserType || 'staff'
            };
            this.cacheLaunchParams(fromQuery);
            return $q.resolve(fromQuery);
        }

        if (!this.isEmbedded()) {
            return $q.reject(new Error('Not in Condo miniapp'));
        }

        return CondoBridge.getLaunchParams().then(function (params) {
            this.cacheLaunchParams(params);
            return params;
        }.bind(this));
    };

    this.getStaffCondoUserId = function () {
        return this.getLaunchParams().then(function (params) {
            if (!params || !params.condoUserId) {
                return $q.reject(new Error('Condo user id is missing'));
            }

            if (params.condoUserType && params.condoUserType !== 'staff') {
                return $q.reject(new Error('Staff user type is required'));
            }

            return params.condoUserId;
        });
    };
}]);
