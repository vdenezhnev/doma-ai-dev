'use strict';

app.controller('LockCtrl', ['$scope', '$stateParams', '$state', '$http', '$filter', 'settings', 'notify', 'ModalService',
  function ($scope, $stateParams, $state, $http, $filter, settings, notify, ModalService) {
    if ($stateParams.locks && $stateParams.uuid) {
      $scope.locks = $stateParams.locks.split(',').map(function (l) {
        return {
          LockID: l,
          Status: false,
          LockOpen: false,
          isLoaded: false
        }
      }) || [];
      $scope.hasLocks = $scope.locks.length > 0;

      $scope.uuid = $stateParams.uuid;

      var onlineApiUrl = getOnlineApiUrl();
      $scope.online_server = onlineApiUrl;

      var prelocks = $stateParams.locks.split(',');

      for (var i = 0; i < prelocks.length; i++) {
        let lock = prelocks[i]
        fetch(`${onlineApiUrl}/lockauth?lock=${lock}&uuid=${$stateParams.uuid}`)
          .then(function (data) {
            return data.json();
          })
          .then(function (data) {
            getStatus(lock, data.Token)
          })
          .catch(function () {
            getStatus(lock, '')
          });
      }

      $scope.onOpenLock = function (lockId) {
        $http.get(`${onlineApiUrl}/open?lock=${lockId}&uuid=${$stateParams.uuid}`)
          .catch(function () {
            notify('Не удалось открыть замок');
          });
      };

      $scope.isAvailable = function (lock) {
        return lock.Status === 'Online';
      };
      $scope.isOpen = function (lock) {
        return lock.LockOpen === true;
      }
      $scope.isNotLoaded = function (lock) {
        return lock.isLoaded === false;
      }
      $scope.isConnected = function (lock) {
        return lock.Connected === true;
      }
      $scope.isDoorOpen = function (lock) {
        return lock.DoorOpen === true;
      }

      function getStatus(lock, token) {
        var eventSource = new EventSource(`${onlineApiUrl}/lockstate?lock=${lock}&uuid=${$stateParams.uuid}&token=${token}`);

        eventSource.onopen = function () {
          var eventLock = $scope.locks.find(function (e) {
            return e.LockID === lock;
          });
          eventLock.isLoaded = true;
          $scope.$apply();
        }

        eventSource.onmessage = function (event) {
          var lockState = JSON.parse(event.data);
          var eventLock = $scope.locks.find(function (e) {
            return e.LockID === lockState.LockID;
          });


          if (!(lockState.Status === undefined && lockState.LockOpen === undefined)) {
            if (lockState.Status !== undefined) {
              eventLock.Status = lockState.Status;
            }
            if (lockState.LockOpen !== undefined) {
              eventLock.LockOpen = lockState.LockOpen;
            }
            $scope.$apply();
          }

        };
        eventSource.onerror = function () {
          var eventLock = $scope.locks.find(function (e) {
            return e.LockID === lock;
          });
          if (eventLock !== undefined) {
            eventLock.Status = false;
            eventLock.LockOpen = false;
          }
          eventLock.isLoaded = true;
          $scope.$apply();
        };
      }
    }
    if ($scope.hasLocks === undefined) {
      $scope.hasLocks = false;
    }

    function getOnlineApiUrl() {
      var server = $stateParams.online_server;
      var url = server
        ? (/^https?:\/\//.test(server) ? server : 'https://' + server)
        : settings.API_URL;

      return url.replace(/\/$/, '');
    }

    $scope.hasQr = !!$stateParams.qrcode;
    $scope.hasPinCode = false;

    if ($stateParams.pincode) {
      try {
        var pinPayload = decodePinContainer($stateParams.pincode);
        var pinString = String(pinPayload.pinCode).padStart(8, '0');

        $scope.pinCode = pinString.slice(0, 4) + ' ' + pinString.slice(4);
        $scope.intercomPinCode = pinString.slice(0, 6);
        $scope.hasPinCode = true;
      } catch (e) {
        $scope.hasPinCode = false;
      }
    }

    if ($stateParams.qrcode) {
      var canvas = document.getElementById('aztec-canvas');
      try {
        bwipjs.toCanvas(canvas, {
          bcid: 'azteccodecompact',
          text: $stateParams.qrcode,
          includetext: false
        });
      } catch (e) {
        try {
          bwipjs.toCanvas(canvas, {
            bcid: 'azteccode',
            text: $stateParams.qrcode,
            includetext: false
          });
        } catch (e2) {
          //
        }
      }
    }

    function decodePinContainer(raw) {
      var bytes = base64ToBytes(raw);
      var offset = 0;

      while (offset < bytes.length) {
        var containerField = readVarint(bytes, offset);
        offset = containerField.offset;

        var fieldNumber = containerField.value >>> 3;
        var wireType = containerField.value & 7;

        if (fieldNumber === 1 && wireType === 2) {
          var payloadLength = readVarint(bytes, offset);
          offset = payloadLength.offset;
          return decodePinPayload(bytes, offset, offset + payloadLength.value);
        }

        offset = skipField(bytes, offset, wireType);
      }

      throw new Error('Pin payload not found');
    }

    function decodePinPayload(bytes, offset, endOffset) {
      var payload = {};

      while (offset < endOffset) {
        var payloadField = readVarint(bytes, offset);
        offset = payloadField.offset;

        var fieldNumber = payloadField.value >>> 3;
        var wireType = payloadField.value & 7;

        if (wireType === 0) {
          var fieldValue = readVarint(bytes, offset);
          offset = fieldValue.offset;

          if (fieldNumber === 1) {
            payload.pinCode = fieldValue.value;
          } else if (fieldNumber === 2) {
            payload.validFrom = fieldValue.value;
          } else if (fieldNumber === 3) {
            payload.validTill = fieldValue.value;
          }
        } else {
          offset = skipField(bytes, offset, wireType);
        }
      }

      if (payload.pinCode === undefined) {
        throw new Error('PIN code not found');
      }

      return payload;
    }

    function base64ToBytes(raw) {
      var base64 = String(raw).replace(/ /g, '+');
      var binary = atob(base64);
      var bytes = new Uint8Array(binary.length);

      for (var i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return bytes;
    }

    function readVarint(bytes, offset) {
      var result = 0;
      var shift = 0;

      while (offset < bytes.length) {
        var byte = bytes[offset++];
        result += (byte & 0x7f) * Math.pow(2, shift);

        if ((byte & 0x80) === 0) {
          return {
            value: result,
            offset: offset
          };
        }

        shift += 7;
      }

      throw new Error('Invalid varint');
    }

    function skipField(bytes, offset, wireType) {
      if (wireType === 0) {
        return readVarint(bytes, offset).offset;
      }

      if (wireType === 2) {
        var length = readVarint(bytes, offset);
        return length.offset + length.value;
      }

      if (wireType === 5) {
        return offset + 4;
      }

      if (wireType === 1) {
        return offset + 8;
      }

      throw new Error('Unsupported wire type');
    }
  }
]);

app.controller('LockQrCtrl', ['$scope', '$stateParams', '$state', '$http', '$filter', 'settings', 'notify', 'ModalService',
  function ($scope, $stateParams, $state, $http, $filter, settings, notify, ModalService) {
    if (!$stateParams.qrcode) {
      $state.go('lock.404');
    }

  }
]);

app.controller('LockQrCtrl', ['$scope', '$stateParams', '$state', '$http', '$filter', 'settings', 'notify', 'ModalService',
  function ($scope, $stateParams, $state, $http, $filter, settings, notify, ModalService) {
    if (!$stateParams.qrcode) {
      $state.go('lock.404');
    }
    var canvas = document.getElementById('aztec-canvas');
    try {
      bwipjs.toCanvas(canvas, {
        bcid: 'azteccode',  // Use 'azteccodecompact' if you need the compact version and your library supports it
        text: $stateParams.qrcode,  // Data to encode
        includetext: false  // Set to true if you want the text displayed below the barcode
      });
    } catch (e) {
      console.error('Error generating Aztec code:', e);
    }
  }
]);
