'use strict';

var PACS_MAX_WIEGAND26 = 16777215;
var PACS_MAX_WIEGAND58_BYTES = 7;
var PACS_MAX_WIEGAND58_DECIMAL = '72057594037927935';

function normalizePacsHexString(hex) {
  return String(hex || '').replace(/[\s-]/g, '').toUpperCase();
}

function getPacsHexByteLength(hex) {
  var normalized = normalizePacsHexString(hex);
  if (!normalized) {
    return 0;
  }

  if (normalized.length % 2 !== 0) {
    normalized = '0' + normalized;
  }

  return normalized.length / 2;
}

function compareUnsignedDecimalStrings(a, b) {
  a = String(a || '').replace(/\D/g, '').replace(/^0+/, '') || '0';
  b = String(b || '').replace(/\D/g, '').replace(/^0+/, '') || '0';

  if (a.length !== b.length) {
    return a.length > b.length ? 1 : -1;
  }

  if (a === b) {
    return 0;
  }

  return a > b ? 1 : -1;
}

function isPacsValueOverWiegand26Limit(value) {
  var numericValue = Number(value);
  return !isNaN(numericValue) && numericValue > PACS_MAX_WIEGAND26;
}

function isPacsValueOverWiegand58Limit(value, mode) {
  var display = String(value || '').trim();
  if (!display) {
    return false;
  }

  if (mode === 'HEX') {
    return getPacsHexByteLength(display) > PACS_MAX_WIEGAND58_BYTES;
  }

  if (mode === 'PROX') {
    var parts = display.split(',');
    if (parts.length === 2) {
      var proxValue = (parseInt(parts[0], 10) || 0) * 65536 + (parseInt(parts[1], 10) || 0);
      return compareUnsignedDecimalStrings(String(proxValue), PACS_MAX_WIEGAND58_DECIMAL) > 0;
    }

    return false;
  }

  return compareUnsignedDecimalStrings(display, PACS_MAX_WIEGAND58_DECIMAL) > 0;
}

var PHONE_VALIDATION_PATTERN = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\.\/0-9]*$/;

function isValidPhoneNumber(phone) {
  var value = String(phone || '').trim();
  return value.length > 0 && PHONE_VALIDATION_PATTERN.test(value);
}

app.controller('AbonentListCtrl', ['$scope', '$http', '$httpParamSerializer', 'settings', 'Abonent', 'gettextCatalog', 'Camera', 'notify',
  function ($scope, $http, $httpParamSerializer, settings, Abonent, gettextCatalog, Camera, notify) {
    $scope.filter = {};
    $scope.take = 20;
    $scope.objects = [];
    $scope.skip = 0;
    $scope.isLoadedAll = false;
    $scope.importedFile = null;
    $scope.importInfoTitle = gettextCatalog.getString('importInfoTitle');

    $scope.getAbonentCards = function (abonent) {
      if (!abonent) {
        return [];
      }

      var seen = {};
      var cards = [];

      function pushCard(value) {
        if (value == null || value === '') {
          return;
        }

        var key = String(value).trim();
        if (!key || seen[key]) {
          return;
        }

        seen[key] = true;
        cards.push(key);
      }

      if (abonent.pacsCodes && abonent.pacsCodes.length) {
        angular.forEach(abonent.pacsCodes, function (code) {
          pushCard(code.value);
        });
      }

      pushCard(abonent.pacsCode);
      pushCard(abonent.externalId);
      pushCard(abonent.tagId);

      return cards;
    };

    $scope.buildSearchParams = function () {
      var params = angular.extend({
        skip: $scope.skip,
        take: $scope.take
      }, $scope.filter);

      var cardNumber = params.cardNumber;
      delete params.cardNumber;

      if (cardNumber) {
        var normalized = String(cardNumber).trim().replace(/[\s-]/g, '');
        if (normalized && /^[0-9a-fA-F]+$/.test(normalized)) {
          params.PacsCode = /[a-fA-F]/.test(normalized) ? normalized.toUpperCase() : normalized;
        }
      }

      return params;
    };

    $scope.enrichAbonentCards = function (abonent) {
      abonent.cardList = $scope.getAbonentCards(abonent);
      return abonent;
    };

    $scope.loadObjects = function (reset) {
      Abonent.query($scope.buildSearchParams()).$promise.then(function (response) {
        $scope.skip += response.items.length;
        $scope.$emit('updateAddresses');

        var items = (response.items || []).map($scope.enrichAbonentCards);

        if (reset) {
          $scope.objects = items;
        } else {
          $scope.objects.push.apply($scope.objects, items);
        }

        $scope.isLoadedAll = response.items.length < $scope.take;
      });
    };

    $scope.$watchCollection('filter', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        $scope.skip = 0;
        $scope.loadObjects(true);
      }
    });
    $scope.$watchCollection('importedFile', function (newVal, oldVal) {
      if (newVal !== oldVal && newVal) {
        const fd = new FormData();
        fd.append('file', newVal);
        $scope.skip = 0;
        Abonent.import(fd).$promise
          .then(function (response) {
            var errors = (response && (response.errors || response.Errors)) || [];
            if (errors.length) {
              notify(errors.join('\n'));
            } else {
              notify(gettextCatalog.getString('abonents.import_completed'));
            }
            $scope.importedFile = null;
            $scope.loadObjects(true);
          })
          .catch(function () {
            notify(gettextCatalog.getString('abonents.import_failed'));
            $scope.importedFile = null;
          });
      }
    });

    $scope.loadObjects();

    $scope.downloadTemplate = function () {
      var getParams = angular.extend({ action: 'DownloadImportAbonentsTemplate' });
      $http.get(settings.API_URL + '?' + $httpParamSerializer(getParams), {
        responseType: 'arraybuffer'
      }).success(function (data, status, headers) {
        headers = headers();

        var filename = 'abonent-import-template.xlsx';
        var contentType = headers.contentType;

        var linkElement = document.createElement('a');
        try {
          var blob = new Blob([data], { type: contentType });
          var url = window.URL.createObjectURL(blob);

          linkElement.setAttribute('href', url);
          linkElement.setAttribute("download", filename);

          var clickEvent = new MouseEvent("click", {
            "view": window,
            "bubbles": true,
            "cancelable": false
          });
          linkElement.dispatchEvent(clickEvent);
        } catch (ex) {
        }
      });
    };

    $scope.user.updateKeyCountInfo();
  }
]);

app.controller('AbonentCreateCtrl',
  ['$scope', '$state', '$http', '$httpParamSerializer', 'settings', 'Abonent', 'Device', 'User',
  function ($scope, $state, $http, $httpParamSerializer, settings, Abonent, Device, User) {

    $scope.userIdAsPacsPrefix = !!(User.data && User.data.UserIdAsPacsPrefix);

    $scope.externalIdViewModes = ['DEC', 'HEX'];

    $scope.externalIdViewMode = {
      state: localStorage.getItem('externalIdViewMode') || 'DEC'
    };

    $scope.onExternalIdViewModeChange = function () {
      localStorage.setItem('externalIdViewMode', $scope.externalIdViewMode.state);
    };

    function toPaddedHexFromParts(userIdUint32, pacsCode) {
      var userHex = (userIdUint32 >>> 0).toString(16).toUpperCase();
      var pacsHex = (parseInt(pacsCode, 10) || 0).toString(16).toUpperCase();

      while (userHex.length < 8) {
        userHex = '0' + userHex;
      }

      while (pacsHex.length < 6) {
        pacsHex = '0' + pacsHex;
      }

      return userHex + pacsHex;
    }

    function guidToCSharpInt(guid) {
      if (!guid || typeof guid !== 'string') {
        return 0;
      }

      var hex = guid.replace(/-/g, "");
      if (hex.length !== 32) {
        return 0;
      }

      var bytes = [
        parseInt(hex.slice(6, 8), 16),
        parseInt(hex.slice(4, 6), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(0, 2), 16)
      ];

      return (
        bytes[0] |
        (bytes[1] << 8) |
        (bytes[2] << 16) |
        (bytes[3] << 24)
      ) >> 0;
    }

    function combineUint32And24ToDecimalString(userIdUint32, pacsCode) {
      var base = 16777216; // 2^24
      var result = String(userIdUint32 >>> 0);

      pacsCode = parseInt(pacsCode, 10) || 0;

      function multiplyDecimalStringByInt(str, multiplier) {
        var carry = 0;
        var out = '';

        for (var i = str.length - 1; i >= 0; i--) {
          var prod = parseInt(str.charAt(i), 10) * multiplier + carry;
          out = (prod % 10) + out;
          carry = Math.floor(prod / 10);
        }

        while (carry > 0) {
          out = (carry % 10) + out;
          carry = Math.floor(carry / 10);
        }

        return out.replace(/^0+/, '') || '0';
      }

      function addIntToDecimalString(str, num) {
        var carry = num;
        var out = '';
        var i;

        for (i = str.length - 1; i >= 0; i--) {
          var sum = parseInt(str.charAt(i), 10) + (carry % 10);
          carry = Math.floor(carry / 10);

          if (sum >= 10) {
            sum -= 10;
            carry += 1;
          }

          out = sum + out;
        }

        while (carry > 0) {
          out = (carry % 10) + out;
          carry = Math.floor(carry / 10);
        }

        return out.replace(/^0+/, '') || '0';
      }

      return addIntToDecimalString(
        multiplyDecimalStringByInt(result, base),
        pacsCode
      );
    }

    $scope.getVisualExternalId = function () {
      var pacsCodeStr = $scope.abonent && $scope.abonent.externalId != null
        ? String($scope.abonent.externalId).trim()
        : '';

      if (!pacsCodeStr) {
        return '';
      }

      if (!$scope.userIdAsPacsPrefix) {
        return pacsCodeStr;
      }

      var signedUserId = guidToCSharpInt($scope.abonent && $scope.abonent.userId);
      var userIdUint32 = signedUserId >>> 0;

      if ($scope.externalIdViewMode.state === 'HEX') {
        return toPaddedHexFromParts(userIdUint32, pacsCodeStr);
      }

      return combineUint32And24ToDecimalString(userIdUint32, pacsCodeStr);
    };

    $scope.showRfid = false;
    $scope.abonent = new Abonent({
      cars: [],
      perimeters: [],
      temporaryAccessPerimeters: [],
      floors: [],
    });

    $scope.duplicateValues = [];

    Abonent.getStatusCreateAbonentUser().$promise.then(function (response) {
      $scope.createAbonentUser = response.status;
    });

    $scope.save = function () {
      $scope.checkExternalIdUnique().then(function (isUnique) {
        if (!isUnique) {
          notify(gettextCatalog.getString('abonents.external_id_unique_error'));
          return;
        }

        $scope.abonent.$save().then(function (response) {
          $state.go('admin.abonent.list');
        });
      });
    };

    $scope.lowerFloorValidation = function () {
      var val = $scope.abonent.lowerFloor;
      if (val === '0') return;
      if (val === '-') return;
      if (val.length === 2) {
        if (val[0] === "0") {
          $scope.abonent.lowerFloor = '0';
          return;
        }
        if (Number(val) >= -5 && Number(val) <= 0) return;
        $scope.abonent.lowerFloor = '-';
        return;
      }
      if (val.length > 2) {
        $scope.abonent.lowerFloor = val.slice(0, 2);
        return;
      }
      $scope.abonent.lowerFloor = '';
    };

    $scope.workingTimeStart = function () {
      var val = $scope.abonent.workingTime.start.replace(/[^0-9]/g, '');
      if (val.length === 2) {
        $scope.abonent.workingTime.start = val + ":";
        return;
      }
    }

    $scope.workingTimeEnd = function () {
      var val = $scope.abonent.workingTime.end.replace(/[^0-9]/g, '');
      if (val.length === 2) {
        $scope.abonent.workingTime.end = val + ":";
        return;
      }
    }

    $scope.onlyNumbersExternalId = function () {
      var val = $scope.abonent.externalId;
      $scope.abonent.externalId = parseInt(val.replace(/[^0-9]/g, '')) < 16777215 ? val.replace(/[^0-9]/g, '') : 16777215
    }

    $scope.onlyNumbersFloor = function () {
      var val = $scope.abonent.floor;
      $scope.abonent.floor = val.replace(/[^0-9]/g, '');
      if (val === "123456") {
        $scope.abonent.floor = 123456;
        return;
      }

      if (val > 200 && val !== 123456) $scope.abonent.floor = 200;
    }

    $scope.pacsValidation = function (value) {
      var val = value;
      var res = val.replace(/[^0-9]/g, '');
      return res;
    }

    $scope.hasPacsError = function () {
      return $scope.pacsCodes.some(function (field) {
        return field.value > 16777215;
      });
    };

    $scope.hasDuplicates = function () {
      return $scope.duplicateValues && $scope.duplicateValues.length > 0;
    };

    $scope.model = {
      allowedFloors: $scope.abonent.floors.join(","),
      allowedFloorsError: false,
    };

    $scope.$watch('model.allowedFloors', function (newVal) {
      if (newVal) {
        $scope.abonent.floors = newVal.split(',')
          .map(function (item) {
            return parseInt(item.trim(), 10);
          })
          .filter(function (num) {
            return !isNaN(num);
          });
      } else {
        $scope.abonent.floors = [];
      }
    });
    $scope.checkAllowedFloors = function (value) {
      // Regex allows negative numbers and numbers separated by commas
      const regex = /^-?\d+(,-?\d+)*$/;

      // Allow empty input (if that's acceptable, remove this check if input is required)
      if (!value) {
        $scope.model.allowedFloorsError = false;
        return;
      }

      // Check if the value matches the regex pattern
      if (!regex.test(value)) {
        $scope.model.allowedFloorsError = true;
        return;
      }

      // Split the string into an array of trimmed numbers
      const numbers = value.split(",").map(item => item.trim());

      // Check for duplicates by comparing array length to the size of a Set (which holds only unique values)
      const uniqueNumbers = new Set(numbers);
      $scope.model.allowedFloorsError = uniqueNumbers.size !== numbers.length;
    };

    $scope.devices = Device.query();

    $scope.externalIdNotUnique = false;

    $scope.checkExternalIdUnique = function () {
      if (!$scope.abonent.externalId) {
        $scope.externalIdNotUnique = false;
        return Promise.resolve(true);
      }

      var request = {
        Action: 'CheckUniqueAbonentExternalId',
        ExternalId: String($scope.abonent.externalId)
      };

      return $http.post(settings.API_URL, request).then(function (resp) {
        var data = resp.data || {};

        var isUnique = (data.isUnique != null) ? data.isUnique
                    : (data.IsUnique != null) ? data.IsUnique
                    : false;

        $scope.externalIdNotUnique = !isUnique;
        return !!isUnique;
      }, function () {
        // если проверка упала — запретить сохранение
        $scope.externalIdNotUnique = false;
        return false;
      });
    };

    $scope.$watch('abonent.externalId', function () {
      $scope.externalIdNotUnique = false;
    });

    $scope.isGeneratingExternalId = false;

    $scope.generateExternalId = function () {
      if ($scope.isGeneratingExternalId) return;
      $scope.isGeneratingExternalId = true;

      var url = settings.API_URL + '?' + $httpParamSerializer({
        Action: 'GetUniqueAbonentExternalId'
      });

      $http.get(url)
      .then(function (resp) {
        var data = resp.data || {};

        var id = (data.externalId != null) ? data.externalId
              : (data.ExternalId != null) ? data.ExternalId
              : null;

        if (id != null) {
          $scope.abonent.externalId = String(id);
          if ($scope.checkDuplicates) $scope.checkDuplicates();
        }
      })
      .finally(function () {
        $scope.isGeneratingExternalId = false;
        $scope.externalIdNotUnique = false;
      });
    };

  }
]);

app.controller('AbonentDetailCtrl', ['$rootScope', '$http', '$httpParamSerializer', '$scope', '$controller', '$state', '$stateParams', 'Abonent', 'notify', 'gettextCatalog', 'User', 'Camera', 'ModalService', 'settings',
  function ($rootScope, $http, $httpParamSerializer, $scope, $controller, $state, $stateParams, Abonent, notify, gettextCatalog, User, Camera, ModalService, settings) {
    if (!$stateParams.abonent) {
      $state.go('admin.abonent.list');
      return;
    }

    $scope.isOld = true;
    $scope.isSavingPhoneNumber = false;

    $scope.endDateBeforeRender = endDateBeforeRender
    $scope.endDateOnSetTime = endDateOnSetTime
    $scope.startDateBeforeRender = startDateBeforeRender
    $scope.startDateOnSetTime = startDateOnSetTime

    $scope.userIdAsPacsPrefix = !!(User.data && User.data.userIdAsPacsPrefix);

    $scope.externalIdViewModes = ['DEC', 'HEX'];

    $scope.externalIdViewMode = {
      state: localStorage.getItem('externalIdViewMode') || 'DEC'
    };

    $scope.onExternalIdViewModeChange = function () {
      localStorage.setItem('externalIdViewMode', $scope.externalIdViewMode.state);
    };

    function toPaddedHexFromParts(userIdUint32, pacsCode) {
      var userHex = (userIdUint32 >>> 0).toString(16).toUpperCase();
      var pacsHex = (parseInt(pacsCode, 10) || 0).toString(16).toUpperCase();

      while (userHex.length < 8) {
        userHex = '0' + userHex;
      }

      while (pacsHex.length < 6) {
        pacsHex = '0' + pacsHex;
      }

      return userHex + pacsHex;
    }

    function guidToCSharpInt(guid) {
      if (!guid || typeof guid !== 'string') {
        return 0;
      }

      var hex = guid.replace(/-/g, "");
      if (hex.length !== 32) {
        return 0;
      }

      var bytes = [
        parseInt(hex.slice(6, 8), 16),
        parseInt(hex.slice(4, 6), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(0, 2), 16)
      ];

      return (
        bytes[0] |
        (bytes[1] << 8) |
        (bytes[2] << 16) |
        (bytes[3] << 24)
      ) >> 0;
    }

    function combineUint32And24ToDecimalString(userIdUint32, pacsCode) {
      var base = 16777216; // 2^24
      var result = String(userIdUint32 >>> 0);

      pacsCode = parseInt(pacsCode, 10) || 0;

      function multiplyDecimalStringByInt(str, multiplier) {
        var carry = 0;
        var out = '';

        for (var i = str.length - 1; i >= 0; i--) {
          var prod = parseInt(str.charAt(i), 10) * multiplier + carry;
          out = (prod % 10) + out;
          carry = Math.floor(prod / 10);
        }

        while (carry > 0) {
          out = (carry % 10) + out;
          carry = Math.floor(carry / 10);
        }

        return out.replace(/^0+/, '') || '0';
      }

      function addIntToDecimalString(str, num) {
        var carry = num;
        var out = '';
        var i;

        for (i = str.length - 1; i >= 0; i--) {
          var sum = parseInt(str.charAt(i), 10) + (carry % 10);
          carry = Math.floor(carry / 10);

          if (sum >= 10) {
            sum -= 10;
            carry += 1;
          }

          out = sum + out;
        }

        while (carry > 0) {
          out = (carry % 10) + out;
          carry = Math.floor(carry / 10);
        }

        return out.replace(/^0+/, '') || '0';
      }

      return addIntToDecimalString(
        multiplyDecimalStringByInt(result, base),
        pacsCode
      );
    }

    $scope.getVisualExternalId = function () {
      var pacsCodeStr = $scope.abonent && $scope.abonent.externalId != null
        ? String($scope.abonent.externalId).trim()
        : '';

      if (!pacsCodeStr) {
        return '';
      }

      if (!$scope.userIdAsPacsPrefix) {
        return pacsCodeStr;
      }

      var signedUserId = guidToCSharpInt($scope.abonent && $scope.abonent.userId);
      var userIdUint32 = signedUserId >>> 0;

      if ($scope.externalIdViewMode.state === 'HEX') {
        return toPaddedHexFromParts(userIdUint32, pacsCodeStr);
      }

      return combineUint32And24ToDecimalString(userIdUint32, pacsCodeStr);
    };

    function startDateOnSetTime() {
      $scope.$broadcast('start-date-changed');
    }

    function endDateOnSetTime() {
      $scope.$broadcast('end-date-changed');
    }

    function startDateBeforeRender($view, $dates, $leftDate, $upDate, $rightDate, endDate) {
      if (endDate) {
        var activeDate = moment(new Date(endDate)).subtract(1, $view).add(1, 'minute');
        var weekBeforeEnd = moment(new Date(endDate)).subtract(7, 'day').subtract(1, $view).add(1, 'minute');
      }
      var now = moment(new Date()).subtract(1, $view).add(1, 'minute');
      var weekFromNow;
      if ($view === 'day') {
        weekFromNow = moment(new Date()).add(8, 'day').subtract(1, $view).add(1, 'minute');
      } else {
        weekFromNow = moment(new Date()).add(7, 'day').subtract(1, $view).add(1, 'minute');
      }
      $dates.filter(function (date) {
        if (activeDate) {
          return date.localDateValue() <= now.valueOf()
            || date.localDateValue() >= activeDate.valueOf()
            || date.localDateValue() <= weekBeforeEnd.valueOf()
            || date.localDateValue() >= weekFromNow.valueOf();
        }
        return date.localDateValue() <= now.valueOf() || date.localDateValue() >= weekFromNow.valueOf();
      }).forEach(function (date) {
        date.selectable = false;
      })
    }

    function endDateBeforeRender($view, $dates, $leftDate, $upDate, $rightDate, startDate, endDate) {
      if (startDate) {
        var activeDate = moment(new Date(startDate)).subtract(1, $view).add(1, 'minute');
      }
      var now = moment(new Date()).subtract(1, $view).add(1, 'minute');
      var weekFromNow;
      if ($view === 'day') {
        weekFromNow = moment(new Date()).add(8, 'day').subtract(1, $view).add(1, 'minute');
      } else {
        weekFromNow = moment(new Date()).add(7, 'day').subtract(1, $view).add(1, 'minute');
      }
      $dates.filter(function (date) {
        if (activeDate) {
          return date.localDateValue() <= now.valueOf()
            || date.localDateValue() <= activeDate.valueOf()
            || date.localDateValue() >= weekFromNow.valueOf();
        }
        return date.localDateValue() <= now.valueOf() || date.localDateValue() >= weekFromNow.valueOf();
      }).forEach(function (date) {
        date.selectable = false;
      })
    }

    $scope.abonent = new Abonent(angular.copy($stateParams.abonent));
    $scope.abonent.persistedPhoneNumber = $scope.abonent.phoneNumber;
    $scope.originalPhoneNumber = $scope.abonent.phoneNumber;

    $scope.isPhoneNumberChanged = function () {
      return String($scope.abonent.phoneNumber || '') !== String($scope.originalPhoneNumber || '');
    };

    $scope.isPhoneNumberValid = function () {
      return isValidPhoneNumber($scope.abonent.phoneNumber);
    };

    $scope.savePhoneNumber = function () {
      if (!$scope.isPhoneNumberChanged() || !$scope.isPhoneNumberValid() || $scope.isSavingPhoneNumber) {
        return;
      }

      $scope.isSavingPhoneNumber = true;

      $http.post(settings.API_URL, {
        Action: 'ChangeAbonentPhoneNumber',
        AbonentId: $scope.abonent.id,
        PhoneNumber: $scope.abonent.phoneNumber
      }).then(function (response) {
        var updatedAbonent = response.data || {};
        if (updatedAbonent.phoneNumber) {
          $scope.abonent.phoneNumber = updatedAbonent.phoneNumber;
        }
        $scope.abonent.persistedPhoneNumber = $scope.abonent.phoneNumber;
        $scope.originalPhoneNumber = $scope.abonent.phoneNumber;
        if ($scope.resetObjectWatch) {
          $scope.resetObjectWatch();
        }
        notify(gettextCatalog.getString('abonents.phone_number_updated'));
      }).catch(function (error) {
        if (!(error && error.data && error.data.error)) {
          notify(gettextCatalog.getString('abonents.phone_number_update_failed'));
        }
      }).finally(function () {
        $scope.isSavingPhoneNumber = false;
      });
    };

    $scope.originalExternalId = $scope.abonent && $scope.abonent.externalId
      ? String($scope.abonent.externalId)
      : '';

    $scope.model = {
      allowedFloors: $scope.abonent.floors.join(","),
      allowedFloorsError: false,
    };
    $scope.$watch('model.allowedFloors', function (newVal) {
      if (newVal) {
        $scope.abonent.floors = newVal.split(',')
          .map(function (item) {
            return parseInt(item.trim(), 10);
          })
          .filter(function (num) {
            return !isNaN(num);
          });
      } else {
        $scope.abonent.floors = [];
      }
    });
    $scope.checkAllowedFloors = function (value) {
      // Regex allows negative numbers and numbers separated by commas
      const regex = /^-?\d+(,-?\d+)*$/;

      // Allow empty input (if that's acceptable, remove this check if input is required)
      if (!value) {
        $scope.model.allowedFloorsError = false;
        return;
      }

      // Check if the value matches the regex pattern
      if (!regex.test(value)) {
        $scope.model.allowedFloorsError = true;
        return;
      }

      // Split the string into an array of trimmed numbers
      const numbers = value.split(",").map(item => item.trim());

      // Check for duplicates by comparing array length to the size of a Set (which holds only unique values)
      const uniqueNumbers = new Set(numbers);
      $scope.model.allowedFloorsError = uniqueNumbers.size !== numbers.length;
    };

    $scope.lowerFloorValidation = function () {
      var val = $scope.abonent.lowerFloor;
      if (val === '0') return;
      if (val === '-') return;
      if (val.length === 2) {
        if (val[0] === "0") {
          $scope.abonent.lowerFloor = '0';
          return;
        }
        if (Number(val) >= -5 && Number(val) <= 0) return;
        $scope.abonent.lowerFloor = '-';
        return;
      }
      if (val.length > 2) {
        $scope.abonent.lowerFloor = val.slice(0, 2);
        return;
      }
      $scope.abonent.lowerFloor = '';
    };

    $scope.workingTimeStart = function () {
      var val = $scope.abonent.workingTime.start.replace(/[^0-9]/g, '');
      if (val.length === 2) {
        $scope.abonent.workingTime.start = val + ":";
        return;
      }
    }

    $scope.workingTimeEnd = function () {
      var val = $scope.abonent.workingTime.end.replace(/[^0-9]/g, '');
      if (val.length === 2) {
        $scope.abonent.workingTime.end = val + ":";
        return;
      }
    }

    $scope.onlyNumbersExternalId = function () {
      var val = $scope.abonent.externalId;
      $scope.abonent.externalId = val.replace(/[^0-9]/g, '');
    }

    $scope.onlyNumbersFloor = function () {
      var val = $scope.abonent.floor;
      $scope.abonent.floor = val.replace(/[^0-9]/g, '');
      if (val === "123456") {
        $scope.abonent.floor = 123456;
        return;
      }

      if (val > 200 && val !== 123456) $scope.abonent.floor = 200;
    }

    $scope.save = function () {
      if ($scope.isPhoneNumberChanged()) {
        notify(gettextCatalog.getString('html.abonent.change_phone_hint'));
        return;
      }

      $scope.checkExternalIdUnique().then(function (isUnique) {
        if (!isUnique) {
          notify(gettextCatalog.getString('abonents.external_id_unique_error'));
          return;
        }
        $scope.abonent.$save(function (response) {
          notify(gettextCatalog.getString('abonents.abonent_updated'));
          $state.current.showConfirmation = false;
          User.updateKeyCountInfo();
          $state.go('admin.abonent.list');
        });
        $scope.originalExternalId = $scope.abonent && $scope.abonent.externalId
        ? String($scope.abonent.externalId)
        : '';
      });
    }

    $scope.delete = function () {
      if (window.confirm(gettextCatalog.getString('abonents.abonent_delete_confirm'))) {
        $scope.abonent.$delete(function (response) {
          notify(gettextCatalog.getString('abonents.abonent_deleted'));
          $state.current.showConfirmation = false;
          $state.go('admin.abonent.list');
        });
      }
    };

    $scope.deletePerimeterKey = function (object) {
      if (window.confirm(gettextCatalog.getString('abonents.key_delete_confirm'))) {
        var index = $scope.abonent.perimeters.indexOf(object);
        $scope.abonent.perimeters.splice(index, 1);
        $scope.abonent.$save(function (response) {
          notify(gettextCatalog.getString('abonents.key_deleted'));
          $state.current.showConfirmation = false;
          User.updateKeyCountInfo();
        });
      }
    };

    $scope.deleteTemporaryPerimeterKey = function (object) {
      if (window.confirm(gettextCatalog.getString('abonents.key_delete_confirm'))) {
        var index = $scope.abonent.temporaryAccessPerimeters.indexOf(object);
        $scope.abonent.temporaryAccessPerimeters.splice(index, 1);
        $scope.abonent.$save(function (response) {
          notify(gettextCatalog.getString('abonents.key_deleted'));
          $state.current.showConfirmation = false;
          User.updateKeyCountInfo();
        });
      }
    };

    $scope.cameras = [];
    $scope.abonentCameras = [];
    $scope.selectedCamera = {};

    $scope.loadCameras = function (reset) {
      Camera.query(angular.extend({ skip: 0, take: 99999 })).$promise.then(function (response) {
        $scope.cameras = response;
      });
    };
    $scope.loadAbonentCameras = function () {
      var params = {
        AbonentId: $scope.abonent.id,
        Action: 'GetAbonentCameras',
      };

      $http.get(settings.API_URL + '?' + $httpParamSerializer(params)).then(function (response) {
        $scope.abonentCameras = response.data;
        $scope.cameras = $scope.cameras.filter(c => !$scope.abonentCameras.find(ac => ac.id === c.id));
      });
    };

    $scope.loadCameras();
    $scope.loadAbonentCameras();

    $scope.addCamera = function () {
      if (!$scope.selectedCamera.id) return;
      if ($scope.abonentCameras.find(c => c.id === $scope.selectedCamera.id)) return;

      var request = {
        AbonentId: $scope.abonent.id,
        CameraId: $scope.selectedCamera.id,
        Action: 'AddCameraAccessPoint',
      };

      $http.post(settings.API_URL, request).then(function (response) {
        notify(gettextCatalog.getString('camera.camera_created'));
        $scope.loadAbonentCameras();
      });
    }

    $scope.deleteCamera = function (id) {

      var request = {
        CameraAccessPointId: id,
        Action: 'DeleteCameraAccessPoint',
      };

      $http.post(settings.API_URL, request).then(function (response) {
        notify(gettextCatalog.getString('camera.camera_deleted'));
        $scope.loadAbonentCameras();
      });
    }

    $scope.pacsCodes = [];
    $scope.modes = ["DEC", "HEX", "PROX"];

    $scope.pacsCodeMode = {
      state: "" + localStorage.getItem("pacsCodeMode") || "DEC"
    };

    $scope.updateMode = function () {
      localStorage.setItem("pacsCodeMode", $scope.pacsCodeMode.state);
      angular.forEach($scope.pacsCodes, function (pacsCode) {
        pacsCode.displayValue = $scope.formatPacs(pacsCode.value, $scope.pacsCodeMode.state);
        pacsCode.value = $scope.parsePacs(pacsCode.displayValue, $scope.pacsCodeMode.state);
        if ($scope.userIdAsPacsPrefix) {
          pacsCode.pacsInterfaceType = 'wiegand58';
        }
      });
      $scope.checkDuplicates();
    };

    // Conversion functions.
    $scope.formatPacs = function (value, mode) {
      if (value == null || value === "") return "";
      if (mode === "HEX") {
        var hexCandidate = String(value).replace(/[\s-]/g, '');
        if (/^[0-9a-fA-F]+$/.test(hexCandidate) && (hexCandidate.length > 8 || /[a-fA-F]/i.test(hexCandidate))) {
          return normalizePacsHexString(hexCandidate);
        }

        if ($scope.userIdAsPacsPrefix) {
          return normalizePacsHexString(hexCandidate);
        }

        return Number(value).toString(16).toUpperCase();
      } else if (mode === "PROX") {
        // Example: facility = floor(value / 65536); card = value % 65536.
        const facility = Math.floor(Number(value) / 65536);

        const card = Number(value) % 65536;
        return ((facility > 0x7F) ? Math.floor(facility / 2) : facility) + "," + card;
      }
      // DEC mode
      return value.toString();
    };

    $scope.parsePacs = function (display, mode) {
      if (!display) {
        return $scope.userIdAsPacsPrefix ? '' : 0;
      }

      if (mode === "HEX") {
        if ($scope.userIdAsPacsPrefix) {
          return normalizePacsHexString(display);
        }

        return parseInt(display, 16) || 0;
      } else if (mode === "PROX") {
        var parts = display.split(",");
        if (parts.length === 2) {
          return (parseInt(parts[0], 10) || 0) * 65536 + (parseInt(parts[1], 10) || 0);
        }
        return 0;
      }
      return parseInt(display, 10) || 0;
    };

    $scope.loadPacsCodes = function () {
      var params = {
        AbonentId: $scope.abonent.id,
        Action: 'GetAbonentPACSCodes',
      };

      $http.get(settings.API_URL + '?' + $httpParamSerializer(params)).then(function (response) {
        $scope.pacsCodes = response.data.pacsCodes || [];
        angular.forEach($scope.pacsCodes, function (pacsCode) {
          if ($scope.userIdAsPacsPrefix) {
            pacsCode.pacsInterfaceType = 'wiegand58';
          } else if (!pacsCode.pacsInterfaceType) {
            pacsCode.pacsInterfaceType = 'wiegand26';
          }

          pacsCode.displayValue = $scope.formatPacs(pacsCode.value, $scope.pacsCodeMode.state);
        });
      });
    };

    $scope.loadPacsCodes();

    $scope.addPacsCode = function () {
      $scope.pacsCodes.push({
        value: $scope.userIdAsPacsPrefix ? '' : 0,
        pacsInterfaceType: $scope.userIdAsPacsPrefix ? 'wiegand58' : 'wiegand26',
        isMain: false,
        description: "",
        displayValue: '',
      });
    };

    $scope.deletePacsCode = function (index) {
      $scope.pacsCodes = $scope.pacsCodes.filter((_, i) => i !== index)
    };

    $scope.savePacsCodes = function () {
      var pacsCodes = $scope.pacsCodes.map(function (pacsCode) {
        return {
          value: $scope.getPacsCodeApiValue(pacsCode),
          pacsInterfaceType: $scope.userIdAsPacsPrefix ? 'wiegand58' : (pacsCode.pacsInterfaceType || 'wiegand26'),
          isMain: !!pacsCode.isMain,
          description: pacsCode.description || '',
        };
      });

      var data = {
        AbonentId: $scope.abonent.id,
        Action: 'UpdateAbonentPACSCodes',
        PacsCodes: pacsCodes,
      };

      $http.post(settings.API_URL, data).then(function (response) {
        notify(gettextCatalog.getString('abonents.pacsCodes_updated'));
        $scope.loadPacsCodes();
      });
    };

    $scope.setMainPacsCode = function (selectedIndex) {
      if ($scope.pacsCodes[selectedIndex].isMain) {
        angular.forEach($scope.pacsCodes, function (pacsCode, index) {
          if (index !== selectedIndex) {
            pacsCode.isMain = false;
          }
        });
      }
    };

    $scope.limitValue = function (pacsCode) {
      if (pacsCode.value && pacsCode.value > 100) {
        pacsCode.value = 100;
      }
    };

    $scope.pacsValidation = function (value) {
      var val = value;
      var res = val.replace(/[^0-9]/g, '');
      return res;
    }

    $scope.isPacsCodeOverLimit = function (pacsCode) {
      if (!pacsCode) {
        return false;
      }

      var displayValue = pacsCode.displayValue != null
        ? pacsCode.displayValue
        : pacsCode.value;

      if ($scope.userIdAsPacsPrefix) {
        return isPacsValueOverWiegand58Limit(displayValue, $scope.pacsCodeMode.state);
      }

      return isPacsValueOverWiegand26Limit(pacsCode.value);
    };

    $scope.hasPacsError = function () {
      return $scope.pacsCodes.some($scope.isPacsCodeOverLimit);
    };

    $scope.onPacsCodeDisplayChange = function (pacsCode) {
      pacsCode.value = $scope.parsePacs(pacsCode.displayValue, $scope.pacsCodeMode.state);
      if ($scope.userIdAsPacsPrefix) {
        pacsCode.pacsInterfaceType = 'wiegand58';
      }
    };

    $scope.getPacsCodeApiValue = function (pacsCode) {
      var mode = $scope.pacsCodeMode.state;
      var display = String(pacsCode.displayValue || '').trim();

      if (mode === 'HEX') {
        return normalizePacsHexString(display || pacsCode.value);
      }

      if (mode === 'PROX') {
        return String($scope.parsePacs(display, mode));
      }

      if ($scope.userIdAsPacsPrefix) {
        return String(pacsCode.value != null ? pacsCode.value : $scope.parsePacs(display, mode));
      }

      return String($scope.parsePacs(display, mode));
    };

    // $scope.convertTo6DigitHex =  function (num) {
    //     const hexDigits = "0123456789ABCDEF";
    //     let hex = "";
    //     if (num === 0) {
    //         hex = "0";
    //     } else {
    //         while (num > 0) {
    //             const remainder = num % 16;
    //             // Prepend the corresponding hex digit.
    //             hex = hexDigits[remainder] + hex;
    //             num = Math.floor(num / 16);
    //         }
    //     }
    //
    //     while (hex.length < 6) {
    //         hex = "0" + hex;
    //     }
    //     return hex;
    // }
    //
    // $scope.getWiegandString = function (fullCode) {
    //
    //
    //     function hexDigitToDec(char) {
    //         const hexDigits = "0123456789ABCDEF";
    //         // Assume input char is uppercase and valid.
    //         return hexDigits.indexOf(char);
    //     }
    //
    //     function hexToDec(hexStr) {
    //         let dec = 0;
    //         for (let i = 0; i < hexStr.length; i++) {
    //             dec = dec * 16 + hexDigitToDec(hexStr[i]);
    //         }
    //         return dec;
    //     }
    //
    //     const hexString = $scope.convertTo6DigitHex(fullCode);
    //
    //     const facilityHexRaw = hexString.substring(0, 2);
    //     const cardHex = hexString.substring(2);
    //
    //     let facilityRaw = hexToDec(facilityHexRaw);
    //     const card = hexToDec(cardHex);
    //
    //     const facility = (facilityRaw > 0x7F) ? facilityRaw / 2 : facilityRaw;
    //
    //     return Math.floor(facility).toString() + ", " + card;
    // }

    $scope.normalizeDuplicateValue = function (value) {
      if (value == null || value === '') {
        return null;
      }

      if ($scope.userIdAsPacsPrefix && $scope.pacsCodeMode.state === 'HEX') {
        return normalizePacsHexString(value);
      }

      return String(Number(value));
    };

    $scope.checkDuplicates = function () {
      var allValues = [];
      var normalizedExternalId = $scope.normalizeDuplicateValue($scope.abonent.externalId);

      if (normalizedExternalId != null) {
        allValues.push(normalizedExternalId);
      }

      angular.forEach($scope.pacsCodes, function (item) {
        var apiValue = $scope.getPacsCodeApiValue(item);
        var normalizedValue = $scope.normalizeDuplicateValue(apiValue);

        if (normalizedValue != null) {
          allValues.push(normalizedValue);
        }
      });

      var counts = {};
      angular.forEach(allValues, function (val) {
        counts[val] = (counts[val] || 0) + 1;
      });

      $scope.duplicateValues = [];
      angular.forEach(counts, function (count, val) {
        if (count > 1) {
          $scope.duplicateValues.push(val);
        }
      });
    };

    $scope.$watch('abonent.externalId', function (newValues, oldValues) {
      $scope.checkDuplicates();
    });

    $scope.$watch('pacsCodes', function (newVal, oldVal) {
      $scope.checkDuplicates();
    }, true);

    $scope.hasDuplicates = function () {
      return $scope.duplicateValues && $scope.duplicateValues.length > 0;
    };

    $scope.isDuplicatePacsCode = function (pacsCode) {
      if (!$scope.duplicateValues || !$scope.duplicateValues.length) {
        return false;
      }

      var normalizedValue = $scope.normalizeDuplicateValue($scope.getPacsCodeApiValue(pacsCode));
      return normalizedValue != null && $scope.duplicateValues.indexOf(normalizedValue) !== -1;
    };

    $scope.isDuplicateExternalId = function () {
      if (!$scope.duplicateValues || !$scope.duplicateValues.length) {
        return false;
      }

      var normalizedValue = $scope.normalizeDuplicateValue($scope.abonent.externalId);
      return normalizedValue != null && $scope.duplicateValues.indexOf(normalizedValue) !== -1;
    };

    $scope.sipDevices = [];
    $scope.abonentSipDevices = [];
    $scope.selectedSipDevice = {};

    $scope.loadSipDevices = function () {
      return $http.get(settings.API_URL + '?' + $httpParamSerializer({
        Action: 'GetSipDevices'
      })).then(resp => {
        $scope.sipDevices = resp.data;
        return resp;
      });
    };

    $scope.loadAbonentSipDevices = function () {
      return $http
        .get(settings.API_URL + '?' + $httpParamSerializer({
          Action: 'GetAbonentSipDevices',
          AbonentId: $scope.abonent.id
        }))
        .then(resp => {
          $scope.abonentSipDevices = resp.data;
          return resp;
        });
    };

    $scope.addSipDevice = function () {
      if (
        !$scope.selectedSipDevice.id ||
        !$scope.selectedSipDevice.roomId ||
        !$scope.isRoomIdUnique()
      ) return;

      $http.post(settings.API_URL, {
        Action: 'AddSipDeviceToAbonent',
        AbonentId: $scope.abonent.id,
        SipDeviceId: $scope.selectedSipDevice.id,
        SipDeviceRoomId: $scope.selectedSipDevice.roomId
      }).then(() => {
        notify(gettextCatalog.getString('sipdevice.added_success'));
        $scope.selectedSipDevice = {};
        $scope.loadSipDevices();
        $scope.loadAbonentSipDevices();
      });
    };

    $scope.deleteSipDevice = function (toAbonentId) {
      $http.post(settings.API_URL, {
        Action: 'RemoveSipDeviceFromAbonent',
        SipDeviceToAbonentId: toAbonentId
      }).then(() => {
        notify(gettextCatalog.getString('sipdevice.deleted_success'));
        $scope.loadSipDevices();
        $scope.loadAbonentSipDevices();
      });
    };

    $scope.isRoomIdValid = function () {
      const raw = String($scope.selectedSipDevice.roomId || "").trim();

      if (!/^\d+$/.test(raw)) {
        return false;
      }

      const id = parseInt(raw, 10);

      if (raw !== id.toString()) {
        return false;
      }

      return !(id < 1 || id > 9999);


    };

    $scope.isRoomIdUnique = function () {
      return !$scope.abonentSipDevices.some(ad =>
        ad.sipDeviceRoomId === $scope.selectedSipDevice.roomId
      );
    };

    $scope.loadSipDevices();
    $scope.loadAbonentSipDevices();

    $scope.accessGroupKeys = [];

    $scope.loadAccessGroupKeys = function () {
      return $http.get(settings.API_URL + '?' + $httpParamSerializer({
        Action: 'SearchAccessGroupKeys',
        PhoneNumber: $scope.abonent.phoneNumber
      })).then(function (response) {
        $scope.accessGroupKeys = (response.data && response.data.items) || [];
      });
    };

    $scope.getAccessGroupKeyAccessPointNames = function (key) {
      return (key.accessPointIds || []).map(function (id) {
        var point = $scope.dataService.accessPoints[id];
        return point ? point.displayName : id;
      }).join(', ');
    };

    $scope.loadAccessGroupKeys();

    $scope.openAccessGroupKeyModal = function (key) {
      ModalService.showModal({
        templateUrl: settings.TEMPLATE_DIR + 'abonent/access-group-key-form.html',
        controller: 'AccessGroupKeyModalCtrl',
        inputs: {
          abonent: $scope.abonent,
          accessGroupKey: key || null
        }
      }).then(function (modal) {
        modal.element.modal();
        modal.close.then(function (result) {
          if (result) {
            $scope.loadAccessGroupKeys();
          }
        });
      });
    };

    $scope.deleteAccessGroupKey = function (key) {
      if (window.confirm(gettextCatalog.getString('abonents.access_group_key_delete_confirm'))) {
        $http.post(settings.API_URL, {
          Action: 'DeleteAccessGroupKey',
          KeyId: key.id
        }).then(function () {
          notify(gettextCatalog.getString('abonents.access_group_key_deleted'));
          $scope.loadAccessGroupKeys();
        });
      }
    };

    $controller('ObjectWatchChangesCtrl', {
      $scope: $scope,
      $state: $state,
      object: $scope.abonent
    });

    $scope.externalIdNotUnique = false;

    $scope.checkExternalIdUnique = function () {
      var current = $scope.abonent && $scope.abonent.externalId
        ? String($scope.abonent.externalId).trim()
        : '';

      var original = $scope.originalExternalId
        ? String($scope.originalExternalId).trim()
        : '';

      if (!current) {
        $scope.externalIdNotUnique = false;
        return Promise.resolve(true);
      }

      if (current === original) {
        $scope.externalIdNotUnique = false;
        return Promise.resolve(true);
      }

      var request = {
        Action: 'CheckUniqueAbonentExternalId',
        ExternalId: current
      };

      return $http.post(settings.API_URL, request).then(function (resp) {
        var data = resp.data || {};
        var isUnique = (data.isUnique != null) ? data.isUnique
                    : (data.IsUnique != null) ? data.IsUnique
                    : false;

        $scope.externalIdNotUnique = !isUnique;
        return !!isUnique;
      }, function () {
        $scope.externalIdNotUnique = false;
        return false;
      });
    };

    $scope.$watch('abonent.externalId', function () {
      $scope.externalIdNotUnique = false;
    });

    $scope.isGeneratingExternalId = false;

    $scope.generateExternalId = function () {
      if ($scope.isGeneratingExternalId) return;
      $scope.isGeneratingExternalId = true;

      var url = settings.API_URL + '?' + $httpParamSerializer({
        Action: 'GetUniqueAbonentExternalId'
      });

      $http.get(url)
      .then(function (resp) {
        var data = resp.data || {};

        var id = (data.externalId != null) ? data.externalId
              : (data.ExternalId != null) ? data.ExternalId
              : null;

        if (id != null) {
          $scope.abonent.externalId = String(id);
          if ($scope.checkDuplicates) $scope.checkDuplicates();
        }
      })
      .finally(function () {
        $scope.isGeneratingExternalId = false;
        $scope.externalIdNotUnique = false;
      });
    };
  }
]);

app.controller('AccessGroupKeyModalCtrl', ['$scope', '$http', '$httpParamSerializer', 'settings', 'notify', 'gettextCatalog', 'close', '$element', 'AccessPoint', 'abonent', 'accessGroupKey',
  function ($scope, $http, $httpParamSerializer, settings, notify, gettextCatalog, close, $element, AccessPoint, abonent, accessGroupKey) {
    $scope.isEdit = !!(accessGroupKey && accessGroupKey.id);
    $scope.submitted = false;

    $scope.model = {
      title: accessGroupKey ? accessGroupKey.title : '',
      accessPointIds: accessGroupKey ? angular.copy(accessGroupKey.accessPointIds || []) : [],
      tagIds: accessGroupKey ? (accessGroupKey.tagIds || []).map(function (id) { return { value: id }; }) : [],
      topFloor: accessGroupKey ? accessGroupKey.topFloor : null,
      lowerFloor: accessGroupKey ? accessGroupKey.lowerFloor : null,
      validFrom: accessGroupKey && accessGroupKey.validFrom ? new Date(accessGroupKey.validFrom) : null,
      validTill: accessGroupKey && accessGroupKey.validTill ? new Date(accessGroupKey.validTill) : null,
      tariffPolicyId: accessGroupKey ? accessGroupKey.tariffPolicyId : null,
      restrictPassPermanentKeys: accessGroupKey ? !!accessGroupKey.restrictPassPermanentKeys : false,
      restrictPassTemporaryKeys: accessGroupKey ? !!accessGroupKey.restrictPassTemporaryKeys : false
    };

    $scope.accessPoints = AccessPoint.query();

    $scope.tariffs = [];
    $http.get(settings.API_URL + '?' + $httpParamSerializer({
      Action: 'GetTariffPolicies',
      Skip: 0,
      Take: 200
    })).then(function (response) {
      $scope.tariffs = response.data || [];
    });

    $scope.hasLiftSelected = function () {
      if (!$scope.accessPoints.$resolved) return false;
      return $scope.accessPoints.items.some(function (point) {
        return point.isLift && $scope.model.accessPointIds.indexOf(point.id) !== -1;
      });
    };

    $scope.addTag = function () {
      $scope.model.tagIds.push({ value: '' });
    };

    $scope.removeTag = function (index) {
      $scope.model.tagIds.splice(index, 1);
    };

    $scope.hasEmptyTag = function () {
      return $scope.model.tagIds.some(function (tag) {
        return !tag.value || !tag.value.trim();
      });
    };

    $scope.isDateRangeValid = function () {
      return new Date($scope.model.validFrom) < new Date($scope.model.validTill);
    };

    $scope.isValid = function () {
      if (!$scope.model.accessPointIds.length) return false;
      if (!$scope.model.validFrom || !$scope.model.validTill) return false;
      if (!$scope.isDateRangeValid()) return false;
      if ($scope.hasEmptyTag()) return false;
      return true;
    };

    function toNullableNumber(value) {
      return (value === undefined || value === null || value === '') ? null : Number(value);
    }

    $scope.closeModal = function (result) {
      $element.modal('hide');
      close(result || null, 500);
    };

    $scope.save = function () {
      $scope.submitted = true;
      if (!$scope.isValid()) return;

      var request = {
        AccessPointIds: $scope.model.accessPointIds,
        TagIds: $scope.model.tagIds.map(function (tag) { return tag.value.trim(); }),
        TopFloor: toNullableNumber($scope.model.topFloor),
        LowerFloor: toNullableNumber($scope.model.lowerFloor),
        ValidFrom: new Date($scope.model.validFrom).toISOString(),
        ValidTill: new Date($scope.model.validTill).toISOString(),
        TariffPolicyId: $scope.model.tariffPolicyId || null,
        RestrictPassPermanentKeys: !!$scope.model.restrictPassPermanentKeys,
        RestrictPassTemporaryKeys: !!$scope.model.restrictPassTemporaryKeys,
        Title: $scope.model.title || ''
      };

      if ($scope.isEdit) {
        request.Action = 'UpdateAccessGroupKey';
        request.KeyId = accessGroupKey.id;
      } else {
        request.Action = 'CreateAccessGroupKey';
        request.PhoneNumber = abonent.phoneNumber;
      }

      $http.post(settings.API_URL, request).then(function () {
        notify(gettextCatalog.getString($scope.isEdit ? 'abonents.access_group_key_updated' : 'abonents.access_group_key_created'));
        $scope.closeModal(true);
      });
    };
  }
]);
