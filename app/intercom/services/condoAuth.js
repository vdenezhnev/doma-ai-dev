'use strict';

app.service('CondoAuth', ['$http', '$httpParamSerializer', '$q', 'Api', 'settings', 'User', 'CondoMiniapp',
    function ($http, $httpParamSerializer, $q, Api, settings, User, CondoMiniapp) {
        var CONDO_RETURN_STORAGE_KEY = 'acms_condo_auth_return';

        this.getStatus = function () {
            return Api.get(settings.API_URL, { Action: 'GetCondoOidcStatus' }).then(function (response) {
                return response.data;
            });
        };

        this.createAccessToken = function () {
            return Api.post(settings.API_URL, { Action: 'CreateDomaOidcAccessToken' }).then(function (response) {
                return response.data;
            });
        };

        this.loginByDomaUserId = function (domaUserId, serviceCompanyId) {
            var payload = {
                Action: 'LoginByDomaUserId',
                DomaUserId: domaUserId
            };

            if (serviceCompanyId) {
                payload.ServiceCompanyId = serviceCompanyId;
            }

            return $http.post(settings.API_URL, payload).then(function (response) {
                return response.data;
            });
        };

        this.applyLoginResponse = function (data) {
            User.load(null, data.credentials, null);

            if (data.profiles && data.profiles.length === 1 && data.role) {
                User.load(data.profiles[0], null, data.role);
                return {
                    status: 'complete',
                    profiles: data.profiles,
                    role: data.role,
                    hasMoreProfiles: data.hasMoreProfiles
                };
            }

            return {
                status: 'selectProfile',
                profiles: data.profiles || [],
                role: data.role,
                hasMoreProfiles: !!data.hasMoreProfiles
            };
        };

        this.buildAuthorizeUrl = function (status, accessToken, extraQuery) {
            var path = status.authorizeUrlPath || ('api/auth/' + encodeURIComponent(status.provider));
            var base = path.indexOf('http') === 0 ? path : settings.API_HOST + path.replace(/^\//, '');

            var query = angular.extend({
                user_type: 'staff',
                client_id: status.clientId,
                access_token: accessToken
            }, extraQuery || {});

            var separator = base.indexOf('?') >= 0 ? '&' : '?';
            return base + separator + $httpParamSerializer(query);
        };

        this.rememberReturnUrl = function () {
            try {
                sessionStorage.setItem(CONDO_RETURN_STORAGE_KEY, window.location.href);
            } catch (e) {
                // ignore
            }
        };

        this.redirectToCondoAuthorize = function (confirmPhoneActionToken) {
            var self = this;

            return this.getStatus().then(function (status) {
                if (!status || !status.enabled) {
                    return false;
                }

                return self.createAccessToken().then(function (tokenResponse) {
                    var accessToken = tokenResponse.accessToken || tokenResponse.AccessToken;
                    if (!accessToken) {
                        return $q.reject(new Error('Condo access token was not returned'));
                    }

                    var extra = {};
                    if (confirmPhoneActionToken) {
                        extra.confirm_phone_action_token = confirmPhoneActionToken;
                    }

                    self.rememberReturnUrl();
                    (window.top || window).location.href = self.buildAuthorizeUrl(status, accessToken, extra);
                    return true;
                });
            });
        };

        this.trySeamlessLogin = function () {
            var self = this;

            if (User.isAuthenticated()) {
                return $q.resolve({ status: 'alreadyAuthenticated' });
            }

            if (!CondoMiniapp.isEmbedded()) {
                return $q.resolve({ status: 'skipped' });
            }

            return CondoMiniapp.getStaffCondoUserId().then(function (domaUserId) {
                return self.loginByDomaUserId(domaUserId).then(function (data) {
                    return self.applyLoginResponse(data);
                });
            }).catch(function () {
                return { status: 'failed' };
            });
        };

        this.shouldLinkAfterPasswordLogin = function () {
            return CondoMiniapp.isEmbedded();
        };
    }]);
