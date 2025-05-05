'use strict';

app.controller('AbonentListCtrl', ['$scope', '$http', '$httpParamSerializer', 'settings', 'Abonent', 'gettextCatalog', 'Camera',
  function ($scope, $http, $httpParamSerializer, settings, Abonent, gettextCatalog, Camera) {
    $scope.filter = {};
    $scope.take = 20;
    $scope.objects = [];
    $scope.skip = 0;
    $scope.isLoadedAll = false;
    $scope.importedFile = null;
    $scope.importInfoTitle = gettextCatalog.getString('importInfoTitle');

    $scope.loadObjects = function (reset) {
      Abonent.query(angular.extend({
        skip: $scope.skip,
        take: $scope.take
      }, $scope.filter)).$promise.then(function (response) {
        $scope.skip += response.items.length;
        $scope.$emit('updateAddresses');

        if (reset) {
          $scope.objects = response.items;
        } else {
          $scope.objects.push.apply($scope.objects, response.items);
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
      if (newVal !== oldVal) {
        const fd = new FormData();
        fd.append('file', newVal);
        $scope.skip = 0;
        Abonent.import(fd).$promise
          .then(() => $scope.loadObjects(true));
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

app.controller('AbonentCreateCtrl', ['$scope', '$state', 'Abonent', 'Device',
  function ($scope, $state, Abonent, Device) {
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
      $scope.abonent.$save().then(function (response) {
        $state.go('admin.abonent.list');
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
  }
]);

app.controller('AbonentDetailCtrl', ['$rootScope', '$http', '$httpParamSerializer', '$scope', '$controller', '$state', '$stateParams', 'Abonent', 'notify', 'gettextCatalog', 'User', 'Camera', 'settings',
  function ($rootScope, $http, $httpParamSerializer, $scope, $controller, $state, $stateParams, Abonent, notify, gettextCatalog, User, Camera, settings) {
    if (!$stateParams.abonent) {
      $state.go('admin.abonent.list');
      return;
    }

    $scope.isOld = true;

    $scope.endDateBeforeRender = endDateBeforeRender
    $scope.endDateOnSetTime = endDateOnSetTime
    $scope.startDateBeforeRender = startDateBeforeRender
    $scope.startDateOnSetTime = startDateOnSetTime

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
      $scope.abonent.$save(function (response) {
        notify(gettextCatalog.getString('abonents.abonent_updated'));
        $state.current.showConfirmation = false;
        User.updateKeyCountInfo();
        $state.go('admin.abonent.list');
      });
    };

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
      });
    };

    // Conversion functions.
    $scope.formatPacs = function (value, mode) {
      if (value == null || value === "") return "";
      if (mode === "HEX") {
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
      if (!display) return 0;
      if (mode === "HEX") {
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
          pacsCode.displayValue = $scope.formatPacs(pacsCode.value, $scope.pacsCodeMode.state);
        });
      });
    };

    $scope.loadPacsCodes();

    $scope.addPacsCode = function () {
      $scope.pacsCodes.push({
        value: 0,
        pacsInterfaceType: "wiegand26",
        isMain: false,
        description: "",
      });
    };

    $scope.deletePacsCode = function (index) {
      $scope.pacsCodes = $scope.pacsCodes.filter((_, i) => i !== index)
    };

    $scope.savePacsCodes = function () {
      var data = {
        AbonentId: $scope.abonent.id,
        Action: 'UpdateAbonentPACSCodes',
        PacsCodes: $scope.pacsCodes,
      };

      $http.post(settings.API_URL, data).then(function (response) {
        notify(gettextCatalog.getString('abonents.pacsCodes_updated'));
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

    $scope.hasPacsError = function () {
      return $scope.pacsCodes.some(function (field) {
        return field.value > 16777215;
      });
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

    $scope.checkDuplicates = function () {
      var allValues = [];
      if ($scope.abonent.externalId) {
        allValues.push(Number($scope.abonent.externalId));
      }
      angular.forEach($scope.pacsCodes, function (item) {
        if (item.value || item.value === 0) { // allow zero
          allValues.push(Number(item.value));
        }
      });

      var counts = {};
      angular.forEach(allValues, function (val) {
        counts[val] = (counts[val] || 0) + 1;
      });

      $scope.duplicateValues = [];
      angular.forEach(counts, function (count, val) {
        if (count > 1) {
          $scope.duplicateValues.push(Number(val));
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

    $scope.sipDevices = [];
    $scope.abonentSipDevices = [];
    $scope.availableSipDevices = [];
    $scope.selectedSipDevice = {};

    function updateAvailable() {
      $scope.availableSipDevices = $scope.sipDevices.filter(d =>
        !$scope.abonentSipDevices.some(ad => ad.sipDeviceId === d.sipDeviceId)
      );
    }

    $scope.loadSipDevices = function () {
      return $http.get(settings.API_URL + '?' + $httpParamSerializer({
        Action: 'GetSipDevices'
      })).then(resp => {
        $scope.sipDevices = resp.data;
        updateAvailable();
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
          updateAvailable();
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
  }
]);
