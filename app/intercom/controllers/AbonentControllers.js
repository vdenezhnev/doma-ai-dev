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

app.controller('AbonentDetailCtrl', ['$rootScope', '$http', '$httpParamSerializer', '$scope', '$controller', '$state', '$stateParams', 'Abonent', 'notify', 'gettextCatalog', 'User', 'Camera', 'settings', 'ModalService', 'AccessObject', 'DataService', 'Parking',
  function ($rootScope, $http, $httpParamSerializer, $scope, $controller, $state, $stateParams, Abonent, notify, gettextCatalog, User, Camera, settings, ModalService, AccessObject, DataService, Parking) {
    if (!$stateParams.abonent) {
      $state.go('admin.abonent.list');
      return;
    }

    $scope.isOld = true;
    $scope.isSavingPhoneNumber = false;
    // Plain object on parent scope so ng-include child scope can bind nested fields (dot rule).
    $scope.objectKeyExport = {
      accessObjectId: null
    };
    $scope.accessObjectsForKeyExport = [];
    $scope.exportAccessObjectSelectReady = false;

    function normalizeAccessObjectId(value) {
      if (!value) {
        return null;
      }
      if (angular.isObject(value)) {
        return value.id || value.Id || null;
      }
      return value;
    }

    function accessObjectIdFromDto(dto) {
      if (!dto) {
        return null;
      }
      var plain = angular.isObject(dto) ? angular.extend({}, dto) : dto;
      var id = plain.id || plain.Id;
      return id ? String(id) : null;
    }

    function isValidExportAccessObjectId(value) {
      if (!value || value === '?') {
        return false;
      }
      var normalized = String(normalizeAccessObjectId(value) || '').toLowerCase();
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized);
    }

    function resolveExportAccessObjectId() {
      var fromScope = normalizeAccessObjectId($scope.objectKeyExport.accessObjectId);
      if (isValidExportAccessObjectId(fromScope)) {
        return String(fromScope).toLowerCase();
      }

      var selectEl = document.getElementById('abonentObjectKeyExportSelect');
      if (selectEl && selectEl.selectedIndex >= 0 && selectEl.options.length) {
        var optionValue = selectEl.options[selectEl.selectedIndex].value;
        if (isValidExportAccessObjectId(optionValue)) {
          return String(normalizeAccessObjectId(optionValue)).toLowerCase();
        }
      }

      return null;
    }

    function resolveSelectedAccessObjectForExport(accessObjectId) {
      var selected = findAccessObjectForExport(accessObjectId);
      if (selected) {
        return selected;
      }

      var selectEl = document.getElementById('abonentObjectKeyExportSelect');
      if (selectEl && selectEl.selectedIndex >= 0 && selectEl.options.length) {
        return {
          id: accessObjectId,
          displayName: selectEl.options[selectEl.selectedIndex].text || 'object'
        };
      }

      return {
        id: accessObjectId,
        displayName: 'object'
      };
    }

    function syncExportAccessObjectSelect() {
      var items = $scope.accessObjectsForKeyExport;
      if (!items || !items.length) {
        $scope.exportAccessObjectSelectReady = false;
        return;
      }

      angular.forEach(items, function (item) {
        item.id = String(item.id).toLowerCase();
      });

      $scope.objectKeyExport.accessObjectId = items[0].id;
      $scope.exportAccessObjectSelectReady = true;
    }

    if (settings.ACMS_MODE === 'local') {
      AccessObject.query(function (response) {
        var seen = {};

        $scope.exportAccessObjectSelectReady = false;
        $scope.accessObjectsForKeyExport = (response.items || []).map(function (item) {
          return {
            id: accessObjectIdFromDto(item),
            displayName: item.displayName || item.DisplayName
          };
        }).filter(function (item) {
          if (!item.id) {
            return false;
          }
          var key = String(item.id).toLowerCase();
          if (seen[key]) {
            return false;
          }
          seen[key] = true;
          return true;
        });

        if ($scope.accessObjectsForKeyExport.length) {
          syncExportAccessObjectSelect();
        }
      });
    }

    function findAccessObjectForExport(accessObjectId) {
      var normalizedId = String(normalizeAccessObjectId(accessObjectId) || '').toLowerCase();
      if (!normalizedId) {
        return null;
      }

      for (var i = 0; i < $scope.accessObjectsForKeyExport.length; i++) {
        var item = $scope.accessObjectsForKeyExport[i];
        if (String(item.id || '').toLowerCase() === normalizedId) {
          return item;
        }
      }

      return null;
    }

    function buildClientExportFileName(accessObject) {
      var abonentName = ($scope.abonent && ($scope.abonent.displayName || $scope.abonent.name)) || 'abonent';
      var objectName = (accessObject && accessObject.displayName) || 'object';
      var objectId = accessObject && accessObject.id ? String(accessObject.id).replace(/-/g, '').substring(0, 8) : 'object';

      function slug(text, fallback) {
        var token = String(text || '')
          .replace(/[^\w\-]+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        return token || fallback;
      }

      return slug(abonentName, 'abonent') + '_' + slug(objectName, 'object') + '_' + objectId + '.key';
    }

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
    angular.forEach($scope.abonent.perimeters, function (perimeter) {
      perimeter.isPersisted = !!(perimeter.accessPerimeterId && perimeter.tariffPolicyId);
    });
    $scope.abonent.persistedPhoneNumber = $scope.abonent.phoneNumber;
    $scope.originalPhoneNumber = $scope.abonent.phoneNumber;

    // ------------------------------------------------ парковочные места

    $scope.parkings = [];
    $scope.parkingPools = [];
    $scope.parkingBindings = [];
    $scope.parkingLoaded = false;

    // Привязать можно только сохранённый автомобиль: сервер проверяет, что такой
    // номер заведён у абонента. Номера, добавленные в таблицу и ещё не сохранённые,
    // он не найдёт.
    $scope.persistedCarNumbers = ($scope.abonent.cars || []).map(function (car) {
      return Parking.normalize(car.number);
    });

    function loadParkingBindings() {
      if (!$scope.abonent.id) {
        return;
      }

      Parking.getAbonentBindings($scope.abonent.id).then(function (bindings) {
        $scope.parkingBindings = bindings || [];
      });
    }

    function loadParkings() {
      Parking.getParkings().then(function (parkings) {
        $scope.parkings = parkings || [];
        $scope.parkingLoaded = true;

        $scope.parkings.forEach(function (parking) {
          Parking.getPools(parking.id).then(function (pools) {
            (pools || []).forEach(function (pool) {
              $scope.parkingPools.push({
                parkingId: parking.id,
                parkingName: parking.name,
                poolId: pool.id,
                poolName: pool.name,
                title: parking.name + ' — ' + pool.name
              });
            });
          });
        });
      });

      loadParkingBindings();
    }

    $scope.isCarPersisted = function (car) {
      return $scope.persistedCarNumbers.indexOf(Parking.normalize(car && car.number)) > -1;
    };

    /**
     * Привязки автомобиля по всем парковкам. На разных объектах у одной машины
     * могут быть разные места, и это не конфликт.
     */
    $scope.carBindings = function (car) {
      var normalized = Parking.normalize(car && car.number);
      if (!normalized) {
        return [];
      }

      return $scope.parkingBindings.filter(function (binding) {
        return binding.identifierType === 'PLATE' && binding.identifierValue === normalized;
      });
    };

    $scope.passTypes = [
      {value: 'QR', title: gettextCatalog.getString('parking.type_qr')},
      {value: 'CARD', title: gettextCatalog.getString('parking.type_card')},
      {value: 'PIN', title: gettextCatalog.getString('parking.type_pin')},
      {value: 'BLE', title: gettextCatalog.getString('parking.type_ble')}
    ];

    $scope.newPass = {type: 'QR'};

    $scope.passTypeTitle = function (type) {
      var found = $scope.passTypes.filter(function (option) { return option.value === type; })[0];
      return found ? found.title : type;
    };

    /** Привязки всех типов, кроме номеров: те показаны в таблице автомобилей. */
    $scope.passBindings = function () {
      return $scope.parkingBindings.filter(function (binding) {
        return binding.identifierType !== 'PLATE';
      });
    };

    $scope.bindPass = function () {
      if (!$scope.newPass.value || !$scope.newPass.pool) {
        return;
      }

      Parking.bind($scope.newPass.pool.poolId, $scope.abonent.id, $scope.newPass.type, $scope.newPass.value)
        .then(function () {
          notify(gettextCatalog.getString('parking.pass_bound'));
          $scope.newPass = {type: $scope.newPass.type};
          loadParkingBindings();
        });
    };

    $scope.bindCar = function (car) {
      var option = car.selectedPool;
      if (!option) {
        return;
      }

      Parking.bind(option.poolId, $scope.abonent.id, 'PLATE', car.number).then(function () {
        notify(gettextCatalog.getString('parking.car_bound'));
        car.selectedPool = null;
        loadParkingBindings();
      });
    };

    $scope.unbindCar = function (binding) {
      if (!window.confirm(gettextCatalog.getString('parking.confirm_unbind'))) {
        return;
      }

      Parking.unbind(binding.id).then(function () {
        notify(gettextCatalog.getString('parking.car_unbound'));
        loadParkingBindings();
      });
    };

    loadParkings();

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

    var objectKeyExportInProgress = false;

    $scope.exportAbonentObjectKey = function () {
      if (settings.ACMS_MODE !== 'local') {
        return;
      }
      if (!$scope.abonent.id || objectKeyExportInProgress) {
        return;
      }

      if (!$scope.abonent.userId) {
        notify({
          message: gettextCatalog.getString('html.abonent.object_key.no_user'),
          classes: 'alert-warning'
        });
        return;
      }

      var accessObjectId = resolveExportAccessObjectId();
      if (!accessObjectId) {
        notify({
          message: gettextCatalog.getString('html.abonent.object_key.error'),
          classes: 'alert-warning'
        });
        return;
      }

      var selectedAccessObject = resolveSelectedAccessObjectForExport(accessObjectId);
      $scope.objectKeyExport.accessObjectId = accessObjectId;

      objectKeyExportInProgress = true;

      var exportParams = {
        action: 'ExportAbonentObjectKeyFile',
        abonentId: normalizeAccessObjectId($scope.abonent.id) || $scope.abonent.id,
        accessObjectId: accessObjectId,
        _: Date.now()
      };

      $http.get(settings.API_URL + '?' + $httpParamSerializer(exportParams), {
        responseType: 'arraybuffer',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      }).then(function (response) {
        var headers = response.headers();
        var contentDisposition = headers['content-disposition'] || headers['Content-Disposition'] || '';
        var filenameMatch = /filename=([^;]+)/i.exec(contentDisposition);
        var filename = filenameMatch ? filenameMatch[1].trim().replace(/"/g, '') : buildClientExportFileName(selectedAccessObject);
        if (!filename || filename.indexOf('object-key') === 0 || filename.indexOf('___') === 0) {
          filename = buildClientExportFileName(selectedAccessObject);
        }
        var contentType = headers['content-type'] || 'application/octet-stream';

        var blob = new Blob([response.data], { type: contentType });
        var url = window.URL.createObjectURL(blob);
        var linkElement = document.createElement('a');

        linkElement.href = url;
        linkElement.download = filename;
        linkElement.style.display = 'none';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        window.setTimeout(function () {
          window.URL.revokeObjectURL(url);
        }, 100);
      }, function (response) {
        var message = gettextCatalog.getString('html.abonent.object_key.error');
        if (response.data) {
          try {
            var decoded = new TextDecoder('utf-8').decode(new Uint8Array(response.data));
            var details = JSON.parse(decoded);
            if (details.error) {
              message = details.error;
            } else if (details.Error) {
              message = details.Error;
            }
          } catch (e) {
            // keep default message
          }
        }
        notify({
          message: message,
          classes: 'alert-danger'
        });
      }).finally(function () {
        objectKeyExportInProgress = false;
      });
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

app.controller('AccessObjectMasterKeyModalCtrl', ['$scope', '$element', '$rootScope', 'close', 'masterKeyData', '$http', 'settings', 'notify', 'gettextCatalog',
  function ($scope, $element, $rootScope, close, masterKeyData, $http, settings, notify, gettextCatalog) {
    $scope.masterKeyData = masterKeyData;
    $scope.regenerateInProgress = false;

    $scope.closeModal = function () {
      $element.modal('hide');
      close(null, 500);
    };

    $scope.copyMasterKey = function () {
      var text = 'PID: ' + $scope.masterKeyData.pid + '\nMaster key: ' + $scope.masterKeyData.masterKeyToken;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          notify(gettextCatalog.getString('html.abonent.master_key.copied'));
        });
        return;
      }

      notify(text);
    };

    $scope.regenerateMasterKey = function () {
      if ($scope.regenerateInProgress) {
        return;
      }

      if (!window.confirm(gettextCatalog.getString('html.account.object_key.regenerate_confirm'))) {
        return;
      }

      if (!$scope.masterKeyData.accessObjectId) {
        notify({
          message: gettextCatalog.getString('html.account.object_key.error'),
          classes: 'alert-danger'
        });
        return;
      }

      $scope.regenerateInProgress = true;

      $http.post(settings.API_URL, {
        Action: 'RegenerateAccessObjectKey',
        AccessObjectId: $scope.masterKeyData.accessObjectId
      })
        .then(function (response) {
          $scope.masterKeyData = {
            accessObjectId: $scope.masterKeyData.accessObjectId,
            objectName: $scope.masterKeyData.objectName,
            pid: response.data.pid || response.data.PID,
            masterKeyToken: response.data.masterKeyToken || response.data.MasterKeyToken
          };

          $rootScope.$broadcast('accessObjectKeyUpdated', {
            accessObjectId: $scope.masterKeyData.accessObjectId,
            data: $scope.masterKeyData
          });
          notify(gettextCatalog.getString('html.account.object_key.regenerated'));
        }, function (response) {
          var message = gettextCatalog.getString('html.account.object_key.regenerate_error');
          if (response.data && response.data.error) {
            message = response.data.error;
          }
          notify({
            message: message,
            classes: 'alert-danger'
          });
        })
        .finally(function () {
          $scope.regenerateInProgress = false;
        });
    };
  }
]);
