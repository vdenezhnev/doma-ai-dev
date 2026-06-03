'use strict';

app.directive('lockSchedules', function() {
    return {
        restrict: 'E',
        scope: {
            points: '=',
            title: '@',
            mode: '@'
        },
        templateUrl: 'app/intercom/views/common/lock-schedules.html',
        controller: ['$scope', '$q', 'LockSchedule', 'notify', function($scope, $q, LockSchedule, notify) {
            $scope.weekDays = [
                { value: 1, shortName: 'Пн' },
                { value: 2, shortName: 'Вт' },
                { value: 3, shortName: 'Ср' },
                { value: 4, shortName: 'Чт' },
                { value: 5, shortName: 'Пт' },
                { value: 6, shortName: 'Сб' },
                { value: 0, shortName: 'Вс' }
            ];

            $scope.schedules = [];
            $scope.loading = false;
            $scope.form = {
                visible: false,
                saving: false,
                error: '',
                model: null,
                selectedLockIds: {}
            };

            $scope.$watchCollection('points', function() {
                $scope.closeForm();
                $scope.loadSchedules();
            });

            $scope.hasMultipleControllers = function() {
                return getSchedulePoints().length > 1;
            };

            $scope.loadSchedules = function() {
                var points = getSchedulePoints();

                $scope.schedules = [];

                if (!points.length) {
                    return $q.when();
                }

                $scope.loading = true;

                return $q.all(points.map(function(point) {
                    return LockSchedule.query(point.lockId).then(function(schedules) {
                        return (schedules || []).map(function(schedule) {
                            schedule.lockId = schedule.lockId || point.lockId;
                            schedule.controllerName = point.displayName || point.lockId;
                            return schedule;
                        });
                    });
                })).then(function(groupedSchedules) {
                    $scope.schedules = [].concat.apply([], groupedSchedules);
                }).catch(showError).finally(function() {
                    $scope.loading = false;
                });
            };

            $scope.openForm = function(schedule) {
                $scope.form.visible = true;
                $scope.form.error = '';
                $scope.form.selectedLockIds = {};

                if (schedule) {
                    $scope.form.model = cloneScheduleForForm(schedule);
                    $scope.form.selectedLockIds[schedule.lockId] = true;
                    return;
                }

                $scope.form.model = {
                    name: '',
                    isEnabled: true,
                    entries: [newScheduleEntry()]
                };

                angular.forEach(getSchedulePoints(), function(point) {
                    $scope.form.selectedLockIds[point.lockId] = true;
                });
            };

            $scope.closeForm = function() {
                $scope.form.visible = false;
                $scope.form.saving = false;
                $scope.form.error = '';
                $scope.form.model = null;
                $scope.form.selectedLockIds = {};
            };

            $scope.addEntry = function() {
                $scope.form.model.entries.push(newScheduleEntry());
            };

            $scope.removeEntry = function(index) {
                if ($scope.form.model.entries.length > 1) {
                    $scope.form.model.entries.splice(index, 1);
                }
            };

            $scope.isDaySelected = function(entry, day) {
                return entry.daysOfWeek.indexOf(day) !== -1;
            };

            $scope.toggleDay = function(entry, day) {
                var index = entry.daysOfWeek.indexOf(day);

                if (index === -1) {
                    entry.daysOfWeek.push(day);
                } else {
                    entry.daysOfWeek.splice(index, 1);
                }
            };

            $scope.formatDays = function(days) {
                return $scope.weekDays.filter(function(day) {
                    return (days || []).indexOf(day.value) !== -1;
                }).map(function(day) {
                    return day.shortName;
                }).join(', ');
            };

            $scope.utcTimeToLocal = utcTimeToLocal;

            $scope.save = function() {
                var model = buildScheduleForSave($scope.form.model);
                var validationError = validateSchedule(model);

                $scope.form.error = validationError;
                if (validationError) return;

                var lockIds = getSelectedLockIds();

                if (!model.id && !lockIds.length) {
                    $scope.form.error = 'Выберите хотя бы один контроллер';
                    return;
                }

                $scope.form.saving = true;

                var request = model.id
                    ? LockSchedule.update(model)
                    : $q.all(lockIds.map(function(lockId) {
                        return LockSchedule.create(angular.extend({}, model, { lockId: lockId }));
                    }));

                request.then(function() {
                    notify(model.id ? 'Расписание обновлено' : 'Расписание создано');
                    $scope.closeForm();
                    $scope.loadSchedules();
                }).catch(function(error) {
                    $scope.form.error = getErrorMessage(error);
                    showError(error);
                }).finally(function() {
                    $scope.form.saving = false;
                });
            };

            $scope.toggleSchedule = function(schedule) {
                var previousValue = !schedule.isEnabled;

                schedule.isUpdating = true;

                LockSchedule.update(schedule).then(function() {
                    notify('Расписание обновлено');
                }).catch(function(error) {
                    schedule.isEnabled = previousValue;
                    showError(error);
                }).finally(function() {
                    schedule.isUpdating = false;
                });
            };

            $scope.deleteSchedule = function(schedule) {
                if (!window.confirm('Вы уверены, что хотите удалить расписание?')) return;

                LockSchedule.delete(schedule.id).then(function() {
                    notify('Расписание удалено');
                    $scope.loadSchedules();
                }).catch(showError);
            };

            function getSchedulePoints() {
                var result = [];
                var added = {};

                angular.forEach($scope.points || [], function(point) {
                    if (!point || !point.lockId || added[point.lockId]) {
                        return;
                    }

                    added[point.lockId] = true;
                    result.push(point);
                });

                return result;
            }

            function getSelectedLockIds() {
                var lockIds = [];

                angular.forEach(getSchedulePoints(), function(point) {
                    if ($scope.form.selectedLockIds[point.lockId]) {
                        lockIds.push(point.lockId);
                    }
                });

                return lockIds;
            }

            function newScheduleEntry() {
                return {
                    daysOfWeek: [1, 2, 3, 4, 5],
                    openTimeLocal: localTimeStringToDate('09:00'),
                    closeTimeLocal: localTimeStringToDate('18:00')
                };
            }

            function cloneScheduleForForm(schedule) {
                return {
                    id: schedule.id,
                    lockId: schedule.lockId,
                    name: schedule.name,
                    isEnabled: !!schedule.isEnabled,
                    entries: (schedule.entries || []).map(function(entry) {
                        return {
                            daysOfWeek: (entry.daysOfWeek || []).slice(),
                            openTimeLocal: utcTimeToLocalDate(entry.openTime),
                            closeTimeLocal: utcTimeToLocalDate(entry.closeTime)
                        };
                    })
                };
            }

            function buildScheduleForSave(schedule) {
                return {
                    id: schedule.id,
                    lockId: schedule.lockId,
                    name: schedule.name,
                    isEnabled: !!schedule.isEnabled,
                    entries: (schedule.entries || []).map(function(entry) {
                        return {
                            daysOfWeek: (entry.daysOfWeek || []).slice(),
                            openTime: localTimeToUtc(entry.openTimeLocal),
                            closeTime: localTimeToUtc(entry.closeTimeLocal)
                        };
                    })
                };
            }

            function validateSchedule(schedule) {
                if (!schedule.name) return 'Укажите название расписания';
                if (!schedule.entries.length) return 'Добавьте хотя бы один интервал';

                for (var i = 0; i < schedule.entries.length; i++) {
                    var entry = schedule.entries[i];

                    if (!entry.daysOfWeek.length) return 'В каждом интервале должен быть выбран хотя бы один день';
                    if (!entry.openTime || !entry.closeTime) return 'Укажите время открытия и закрытия';
                    if (entry.openTime >= entry.closeTime) return 'Время открытия должно быть меньше времени закрытия';
                }

                return '';
            }

            function utcTimeToLocal(utcTime) {
                if (!utcTime) return '';

                var parts = utcTime.split(':').map(Number);
                var date = new Date();
                date.setUTCHours(parts[0], parts[1], 0, 0);

                return padTime(date.getHours()) + ':' + padTime(date.getMinutes());
            }

            function utcTimeToLocalDate(utcTime) {
                return localTimeStringToDate(utcTimeToLocal(utcTime));
            }

            function localTimeStringToDate(localTime) {
                if (!localTime) return null;

                var parts = localTime.split(':').map(Number);
                return new Date(1970, 0, 1, parts[0], parts[1], 0, 0);
            }

            function localTimeToUtc(localTime) {
                if (!localTime) return '';

                var date = new Date();

                if (angular.isDate(localTime)) {
                    date.setHours(localTime.getHours(), localTime.getMinutes(), 0, 0);
                } else {
                    var parts = localTime.split(':').map(Number);
                    date.setHours(parts[0], parts[1], 0, 0);
                }

                return padTime(date.getUTCHours()) + ':' + padTime(date.getUTCMinutes());
            }

            function padTime(value) {
                value = String(value);
                return value.length === 1 ? '0' + value : value;
            }

            function showError(error) {
                notify({
                    message: getErrorMessage(error),
                    classes: 'alert-danger'
                });
            }

            function getErrorMessage(error) {
                if (error && error.data) {
                    if (angular.isString(error.data)) return error.data;
                    if (error.data.message) return error.data.message;
                    if (error.data.error) return error.data.error;
                }

                return 'Ошибка при сохранении расписания';
            }
        }]
    };
});
