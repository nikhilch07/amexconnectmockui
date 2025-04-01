

window.onload = function () {
  let winref = null;
  let selectedPartner = 'PAYPAL';
  let isCloseConnectUIOnError = localStorage.getItem('isCloseConnectUIOnError') === 'true';;

  // Get the success element
  var paypalSuccess = document.getElementById('paypalSuccess');
  var amazonSuccess = document.getElementById('amazonSuccess');

  // Get the success element
  var paypalError = document.getElementById('paypalError');
  var amazonError = document.getElementById('amazonError');

  // Get the modal
  var modal = document.getElementById('myModal');

  var overlayDiv = document.getElementById('overlay-div');

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName('close')[0];

  var error = document.getElementById('error-text');

  var paypalButton = document.getElementById('paypalPayButton');
  var amazonButton = document.getElementById('amazonPayButton');
  // When the user clicks the button, open the modal
  paypalButton.onclick = function () {
    //modal.style.display = 'block';
    selectedPartner = 'PAYPAL';
    initiateAccountSetup();
  }

  amazonButton.onclick = function () {
    //modal.style.display = 'block';
    selectedPartner = 'AMAZON';
    initiateAccountSetup();
  }

  var settings = document.getElementById('settings');
  settings.onclick = function () {
    selectedPartner = 'PAYPAL';
    var checkbox = document.getElementById('closeUiOnError');
    checkbox.checked = isCloseConnectUIOnError;
    modal.style.display = 'block';
  }

  var setupBtn = document.getElementById('setupBtn');
  setupBtn.onclick = function () {
    initiateAccountSetup();
  }

  var partnersEl = document.getElementById('partners');
  partnersEl.onchange = function (e) {
    selectPartner(e);
  }

  var continueEl = document.getElementById('continue');
  continueEl.onclick = function (e) {
    redirect();
  }

  var closeUiOnErrorEl = document.getElementById('closeUiOnError');
  closeUiOnErrorEl.onclick = function (e) {
    saveUserSettings();
  }

  var jweFromModal;
  var jweEl = document.getElementById('jwe');
  jweEl.onblur = function () {
    jweFromModal = document.getElementById('jwe').value;
  }

  var aatFromModal;
  var aatEl = document.getElementById('aat');
  aatEl.onblur = function () {
    aatFromModal = document.getElementById('aat').value;
  }

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = 'none';
  };
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };

  function redirect(url) {
    if (!url) {
      url = document.getElementById('url').value;
    }
    console.log(url);

    if (url) {
      selectedPartner = url.includes('paypal') ? 'PAYPAL' : 'AMAZON';
      winref = openNewWindow(`${url}&isTestPage=true`);
      modal.style.display = 'none';
    }

  }

  function focusWindow() {

  }

  function showResult(eventStatus, isCloseWindow) {
    if (selectedPartner === 'PAYPAL') {
      paypalButton.style.display = 'none';
      eventStatus === 'SUCCESS' ? paypalSuccess.style.display = '' : paypalError.style.display = '';
    } else {
      amazonButton.style.display = 'none';
      eventStatus === 'SUCCESS' ? amazonSuccess.style.display = '' : amazonError.style.display = '';
    }
    overlayDiv.style.display = 'none';
    if (isCloseWindow) {
      winref.close();
    }
  }

  const MessageListener = (event) => {
    console.log(`origin: ${event.origin}`);
    if (event.origin) {
      try {
        const obj = JSON.parse(event.data);
        let { eventName, eventStatus } = obj;
        if (eventName && eventName === 'CONNECT_COF') {
          console.log('Message Received :', obj);
          if (eventStatus === 'READY' || eventStatus === 'IN_PROGRESS') {
            overlayDiv.style.display = '';
            if (eventStatus === 'IN_PROGRESS') {
              timeoutId = setTimeout(checkStatus, TIMEOUT);
            }
          } else if (eventStatus === 'CANCEL') {
            overlayDiv.style.display = 'none';
            winref.close();
          } else if (eventStatus === 'SUCCESS') {
            showResult(eventStatus, true);
          } else {
            checkStatus();
            // showResult('ERROR', isCloseConnectUIOnError);
          }
          if (timeoutId && eventStatus !== 'IN_PROGRESS') {
            clearTimeout(timeoutId);
          }
        }
      }
      catch ( e ) {
      }
    }
  };

  window.addEventListener('message', MessageListener, false);

  var windowInnerWidth = function () {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  };
  var windowInnerHeight = function () {
    return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  };
  var windowScreenWidth = function () {
    return window.screen.width;
  };
  var windowScreenHeight = function () {
    return window.screen.height;
  };
  var windowOuterWidth = function () {
    return window.outerWidth;
  };
  var windowOuterHeight = function () {
    return window.outerHeight;
  };
  var windowWidth = function () {
    if (self === top) {
      return windowInnerWidth();
    } else {
      return windowOuterWidth() || windowScreenWidth();
    }
  };
  var windowHeight = function () {
    if (self === top) {
      return windowInnerHeight();
    } else {
      return windowOuterHeight() || windowScreenHeight();
    }
  };

  function isMobileCheck() {
    return (function (a) {
      return (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
          a,
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
          a.substr(0, 4),
        )
      );
    })(navigator.userAgent || navigator.vendor || window.opera);
    // return mobileCheck;
  }

  function openNewWindow(url) {
    //width 40%
    //height 70%
    var childWindowWidth = 435;
    var childWindowHeight = 675;
    var leftPosition = windowScreenWidth() - childWindowWidth;
    var topPosition = windowScreenHeight() - childWindowHeight;
    var wLeft = 0;
    var wTop = 0;

    if (window.screenX) {
      wLeft = window.screenX;
    } else if (window.screenLeft) {
      wLeft = window.screenLeft;
    } else if (window.screen.left) {
      wLeft = window.screen.left;
    }

    if (window.screenY) {
      wTop = window.screenY;
    } else if (window.screenTop) {
      wTop = window.screenTop;
    } else if (window.screen.top) {
      wTop = window.screen.top;
    }

    leftPosition = wLeft + windowWidth() / 2 - childWindowWidth / 2;
    topPosition = wTop + windowHeight() / 2 - childWindowHeight / 2;
    if (isMobileCheck()) {
      return window.open(
        url,
        'newWindowRef',
        `toolbar=no,menubar=no,location=no,resizable=yes,status=no,top=0, left=0,width=${window.innerWidth}, height=${window.innerHeight}`,
      );
    } else {
      return window.open(
        url,
        'newWindowRef',
        'toolbar=no,menubar=no,location=no,resizable=yes,status=no,top=' +
        topPosition +
        ', left=' +
        leftPosition +
        ',width=' +
        childWindowWidth +
        ', height=' +
        childWindowHeight,
      );
    }
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0, // tslint:disable-line
        v = c === 'x' ? r : (r & 0x3) | 0x8; // tslint:disable-line
      return v.toString(16);
    });
  }

  function selectPartner(e) {
    selectedPartner = e.target.value;
  }

  function saveUserSettings() {
    var checkbox = document.getElementById('closeUiOnError');
    isCloseConnectUIOnError = checkbox.checked;
    localStorage.setItem('isCloseConnectUIOnError', isCloseConnectUIOnError);
  }

  function getEnv() {
    const urlParams = new URLSearchParams(window.location.search);
    let env = urlParams.get('env');
    if (env === 'e2') {
      env = `-qa`
    } else if (env === 'e3') {
      env = ''
    } else {
      env = '-dev'
    }

    return env;
  }

  let env = getEnv();
  let trackingId = generateUUID();
  let timeoutId;
  const TIMEOUT = 360000; // 6 minutes

  function initiateAccountSetup() {
    const service = localStorage.getItem('backendService');
    const url = service === 'hydra' ? `https://dpconnectgtm${env}.aexp.com/payments/digital/v1/connect/initiateaccountsetup` : `https://dpconnect${env}.aexp.com/payments/digital/v1/connect/initiateaccountsetup`;
    winref = openNewWindow('');
    const urlParams = new URLSearchParams(window.location.search);
    let urlEnv = urlParams.get('env');

    if (!env && urlEnv !== 'e3') return;

    let jwe = 'eyJraWQiOiJhbWV4Y29ubmVjdF9pbV9hY2NvdW50X2VuYyIsImVuYyI6IkExMjhHQ00iLCJhbGciOiJSU0EtT0FFUCJ9.NEmHEfTQiM6B_8mGjT__3D5gNAs4t2JLrvd_gNBviuoc5COb5ccAOmdbd6uki8bEsbC65P39Wou-fjGD9J8d4hA18lHPH6KmfqIHeKyD65CLUWbSgpLPDkGUKPu8hXMaQbx5FfjypucH52A-6h8LfVtPLM8sW-90TEr3TprKsrCxm4ft_iRvlihdUwC4gVYJ-WP41EH9_kS5iMoYPlRhRurKy7m2jdYpgfYPT2jRJS4JVv9ViS2BKs7epfPX9MUn6ioFSUHS4HDlIPTlN1k_WJ4KMiL-L1v9rdlLnMuAQ9u3NzlOH3U8wAXIsUhtEqPBO2THm0u68Ok-pox5kI3xyw.Cml3rWUUizUVx9hl.NssRYKXw7SfzZCIkIAV5nlzZ3tJeiNeh25kwtSnGWQRZQoY9ixFq1zdn-r8x3PKgL-tj9u6xIIOu0jnlWL-Vt06raUCM7rLPw-2PAB8DQmk8vuBsnDk0n2H61Iq2C2KOxy30GsVMHuA0Axb9160PhI9c_ITlggN-kMRV7cuK3HJMN27aLcYhXzdLxPqkLbypMqQMPbHHXe6qqezSfBEk__t5g5xL6e9XUDMvQUfz5EVQGwjnBf_8gfZxX8zNEAh2pheRTqZ1l4eRkkRGvlkqVc5JNgqsYjBdSr_8RNAv1xzZ2KqhtLnkwB7y7_YZN29rM1uYjdVYir2jwL1iTw3I6ngVB0PDpK3uj_ePkGOaUVwYu8VuaEaWmrqfTRua0dyn6z5AIl47EEoCrGfnO-L-kqPvZN4zDMYlBFA52qn8VVBz9UVUxKs7oMSGNP_gGkXhOXaXoVZikyA_0yoYTWpP0PMa0Dq33Dj5gEce-0W6b7pSFTp0vFoRiJicwcAideYINHwPUos8QSfgoZuIWu-QYDFomBgyem-z-prx9gog9mTIiyalHD1DROqWWms5RNz1vbHTECJvNgNmhHSZN18cB_w0XDllYOsBgjH-vX_1gzEMHU-0Cr4gBxgpv2D73w8DYRPgvriJScxySZmadZHKl1pIdAry7C_o_XUhRYe-UC8PLgJkq6fcSeJyDJFCh7foJWnclSpmjGstVH563KeuLLJ-_OhLCTDLutrpxPGECFSz5da6AMaLUKSu5pouyf8_al_2M7BwM87fKvYtaFlnwrMesf3LlWY-zbevyDBHjSNa2Q.RG99eBNyx4aj88RV3Hmlmg';

    // fetch(`https://dpconnect${env}.aexp.com/payments/digital/v1/connect/initiateaccountsetup`, {
    fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Language': '*',
        'Content-Type': 'application/json',
        'x-amex-tracking-id': trackingId,
        'Source': 'ICN',
        'Selected-Partner': selectedPartner,
      },
      body: JSON.stringify({
        jwe: jweFromModal || jwe
      }),
    }).then(res => res.json().then((response) => {
        console.log(response);
        if (response.status_code === '0000') {
          let terms_condition_url = response.terms_condition_url;
          winref.location.href = `${terms_condition_url}&isTestPage=true`;
        } else {
          showResult('ERROR', isCloseConnectUIOnError);
        }
      }))
      .catch((error) => {
        console.log(error)
        showResult('ERROR', isCloseConnectUIOnError);
      });
  };

  function checkStatus() {
    if (!env) return;

    fetch(`https://dpconnect${env}.aexp.com/payments/digital/v1/connect/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Language': '*',
        'Content-Type': 'application/json',
        'x-amex-tracking-id': trackingId,
        'Source': 'ICN',
        'Selected-Partner': selectedPartner,
        Authorization: `AMAT ${aatFromModal}==`,
      },
    }).then(res => res.json().then((response) => {
        console.log(response);
        if (response.status_code === '0000') {
          if (response.provisionStatus !== 'SUCCESS') {
            showResult('ERROR', isCloseConnectUIOnError);
          }
        } else {
          showResult('ERROR', isCloseConnectUIOnError);
        }
      }))
      .catch((error) => {
        console.log(error)
        showResult('ERROR', isCloseConnectUIOnError);
      });
  }
}
// Add event listener to toggle button
toggleButton.addEventListener("change", function() {
  // Update status indicator text based on toggle button state
  if (this.checked) {
    statusIndicator.textContent = "Hydra";
    localStorage.setItem('backendService', 'hydra');
  } else {
    statusIndicator.textContent = "ECP";
    localStorage.setItem('backendService', 'ecp');
  }
});
