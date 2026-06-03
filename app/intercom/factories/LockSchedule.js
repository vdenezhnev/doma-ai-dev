'use strict';

app.factory('LockSchedule', ['Api', 'settings', function(Api, settings) {
    var baseUrl = settings.API_URL.replace(/\/$/, '');

    function cleanEntry(entry) {
        return {
            daysOfWeek: (entry.daysOfWeek || []).slice().sort(function(a, b) { return a - b; }),
            openTime: entry.openTime,
            closeTime: entry.closeTime
        };
    }

    function cleanSchedule(schedule) {
        return {
            id: schedule.id,
            lockId: schedule.lockId,
            name: schedule.name,
            isEnabled: !!schedule.isEnabled,
            entries: (schedule.entries || []).map(cleanEntry)
        };
    }

    return {
        query: function(lockId) {
            return Api.get(baseUrl + '/GetLockSchedules', lockId ? { lockId: lockId } : null)
                .then(function(response) {
                    return response.data || [];
                });
        },
        create: function(schedule) {
            return Api.post(baseUrl + '/CreateLockSchedule', cleanSchedule(schedule))
                .then(function(response) {
                    return response.data;
                });
        },
        update: function(schedule) {
            var data = cleanSchedule(schedule);
            delete data.lockId;

            return Api.post(baseUrl + '/UpdateLockSchedule', data)
                .then(function(response) {
                    return response.data;
                });
        },
        delete: function(id) {
            return Api.post(baseUrl + '/DeleteLockSchedule', { id: id })
                .then(function(response) {
                    return response.data;
                });
        }
    };
}]);
