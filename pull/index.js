let epass = "-qa";
let authorization = null;
let accessToken = null;
let partner = "amazon";
let locale = "en-US";
let newBiller = "true";
let requestId = '';
let authCode = '';
let bpayCode = '';
let host = 'dpconnectappsl'
// let host = 'dpconnectinbnd'
let amexBtn = document.getElementById("amex-btn");

let uuid = generateUUID();

window.onload = function () {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const {
    env,
    partner: urlPartner,
    locale: urlLocale,
    newBiller: urlNewBiller,
    urlId,
    authorizationCode,
    code
  } = params;

  console.log('Params', params);

  localStorage.setItem('backendService', 'ecp');
  localStorage.setItem('backendAppSlService', 'ecp');

  const appslService = localStorage.getItem('backendAppSlService');
  if (env) {
      if (env === "e2") {
        epass = '-qa'
      }
        if(appslService === 'ecp') {
          host = 'dpconnectappsl'
      } else {
         host = 'dpconnectappslgtm'
      }
  }

  if (urlPartner) partner = urlPartner;
  if (urlLocale) locale = urlLocale;
  if (urlNewBiller) newBiller = urlNewBiller;
  if (urlId) localStorage.setItem('urlId', urlId); requestId = urlId;
  if (authorizationCode) localStorage.setItem('authorizationCode', authorizationCode); authCode = authorizationCode;
  if (code) localStorage.setItem('code', code), bpayCode = code;
};
function initiatePull() {
  let headers = {
      "Accept-Language": "*",
      "Client-Id": "client_test",
      "Content-Type": "application/x-www-form-urlencoded",
  }
  if(partner === 'paypal') {
    let paypalHeaders = {
      "Selected-Partner": "PAYPAL",
      "Source": "PARTNER_WEB",
    }
    axios({
      method: 'post',
      url: `https://dpconnectptnr${epass}.americanexpress.com/payments/digital/v1/connect/partnertoken`,
      headers: paypalHeaders,
      data: {
        auth_code: 'authCode1'
      }
    }).then(res => {
      console.log(res.data)
      if(res.next_step === 'REDIRECT_TO_MYCA_LOGIN'){
        // redirect to myca login
        const redirectUrl='https://amex-connect-qa.americanexpress.com/paypal?code=C21AALJRWc7ocHKvXR2KwcnO6ZqtsgpSkCwYyKp1xJC1F-H9Vs8z7gAY43cPwc5pyDcl65NxtgYTtwNq5XOMgQjA33iRy4PKw&scope=scope_group_provisioning_platform';
        window.location.href = redirectUrl
      }
    }).catch(err => console.log(err));
  } else {
    axios({
      method: 'post',
      url: `https://${host}${epass}.aexp.com/oauth2/generate_token`,
      headers,
    }).then(res => {
      console.log(res.data)
      authorization = res?.data;
      localStorage.setItem('authorization', authorization);
      getToken();
    }).catch(err => console.log(err));
  }
}

function getToken() {
  if (partner === 'amazon') {
    let headers = {
        "Accept-Language": "*",
        "Authorization": authorization,
        "X-Request-ID": uuid,
        "Content-Type": "application/x-www-form-urlencoded",
        "Partner": partner.toUpperCase(),
    }

    axios({
        method: 'post',
        url: `https://${host}${epass}.aexp.com/payments/digital/v1/connect/oauth2/token?grant_type=client_credentials`,
        headers,
        data: ''
    }).then(res => {
        if (res && res.data) {
          accessToken = res.data.access_token
          provisionInitiation();
        }
    }).catch(err => console.log(err));
  } else if (partner === 'bpay') {
    let headers = {
      "Authorization": authorization,
      "Accept": "application/json",
      "RequestId": uuid,
      "Content-Type": "application/x-www-form-urlencoded",
      "Partner": partner.toUpperCase(),
    }

    axios({
      method: 'post',
      url: `https://${host}${epass}.aexp.com/payments/digital/v1/connect/oauth2/token?grant_type=authorization_code&code=${bpayCode}`,
      headers,
      data: ''
    }).then(res => {
      if (res && res.data) {
        accessToken = res.data.access_token
        localStorage.setItem('authorization', accessToken);
        provisionInitiation();
      }
    }).catch(err => console.log(err));
  }
}

function provisionInitiation() {
  let request = {};
  if (partner === 'amazon') {
    request.headers = {
      "Accept": "application/json",
      "Accept-Language": "*",
      "Authorization": `Bearer ${accessToken}`,
      "X-Request-ID": uuid,
      "Content-Type": "application/json",
      "sharedId": "da0b16d2473d33E1",
    }
    request.url = `https://${host}${epass}.aexp.com/payments/digital/v1/connect/account/provision/initiation`;
    request.body = {
      workflowId: "amzn1.abc.1.wflow.partner-id.293bca8c-96f7-462c-a29a-8eb00db7a512",
      redirectUrl: `https://nikhilch07.github.io/amexconnectmockui/?env=sandbox&flow=pull&partner=${partner}`,
      failureUrl: "https://www.amazon.com/hp/abc/failed-provision?wid=amzn1.abc.1.wflow.partner-id.293bca8c-96f7-462c-a29a-8eb00db7a512",
      cancelUrl: "https://nikhilch07.github.io/amexconnectmockui/pull/?env=e2",
      linkedAccounts: [
        "REFERENCE-ID-1",
        "REFERENCE-ID-2"
      ],
      sourceDeviceType: "MOBILE",
    }
  } else if (partner === 'bpay') {
    request.headers = {
      "Accept": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "RequestId": bpayCode,
      "Content-Type": "application/json",
      "Partner": partner.toUpperCase(),
    }
    request.url = `https://${host}${epass}.aexp.com/payments/digital/v1/connect/provision/redirecturi`;
    request.body = {
      workflow_id: 'bpay_workflow_id',
      partner_redirect_uri: `https://nikhilch07.github.io/amexconnectmockui/?env=sandbox&flow=pull&partner=${partner}`,
      partner_failure_uri: 'http://bpay.com.au/failure',
      partner_redirect_type: 'WEB',
      locale,
      biller_info: {
        biller_code: 'test_biller_code',
        biller_name: 'test_biller_name',
        biller_crn: 'test_biller_crn',
        new_biller_flag: newBiller === 'true    ' ? 1 : 0,
      },
    }
  }

  axios({
    method: 'post',
    url: request.url,
    headers: request.headers,
    data: request.body
  }).then(res => {
      if (res && res.data) {
        if (partner === 'amazon') {
          const getBackendServiceName = localStorage.getItem('backendService');
          const getUIServiceName = localStorage.getItem('UIService');
          const connectUIHydraUrl = 'https://amexconnectuplift-qaeusw1.americanexpress.com/'
          const redirectUrl = res.data.redirectUrl;
          let connectUIUpdatedUrl = redirectUrl;
          if(getUIServiceName === 'hydra') {
            connectUIUpdatedUrl = redirectUrl.replace('https://amex-connect-qa.americanexpress.com/', connectUIHydraUrl);
          }
            connectUIUpdatedUrl = connectUIUpdatedUrl.replace('amazon', `amazon/${getBackendServiceName}`);
            localStorage.clear();
          window.location.href = connectUIUpdatedUrl;
        } else {
          localStorage.setItem('bpay_workflow_id', res.headers['provisionid']);
          window.location.href = res.data.redirect_uri;
        }
      }
  }).catch(err => console.log(err));
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0, // tslint:disable-line
          v = c === "x" ? r : (r & 0x3) | 0x8; // tslint:disable-line
      return v.toString(16);
  });
}

const toggleButtonUI = document.getElementById("toggleButtonUI");
const statusIndicatorUI = document.getElementById("statusIndicatorUI");
// Add event listener to toggle button
toggleButtonUI.addEventListener("change", function() {
  // Update status indicator text based on toggle button state
  if (this.checked) {
    statusIndicatorUI.textContent = "Hydra";
    localStorage.setItem('UIService', 'hydra');
  } else {
    statusIndicatorUI.textContent = "ECP";
    localStorage.setItem('UIService', 'ecp');
  }
});


const toggleButtonAPI = document.getElementById("toggleButtonAPI");
const statusIndicatorAPI = document.getElementById("statusIndicatorAPI");
// Add event listener to toggle button
toggleButtonAPI.addEventListener("change", function() {
  // Update status indicator text based on toggle button state
  if (this.checked) {
    statusIndicatorAPI.textContent = "Hydra";
    localStorage.setItem('backendService', 'hydra');
  } else {
    statusIndicatorAPI.textContent = "ECP";
    localStorage.setItem('backendService', 'ecp');
  }
});

const toggleButtonAPPSL = document.getElementById("toggleButtonAPPSL");
const statusIndicatorAPPSL = document.getElementById("statusIndicatorAPPSL");
// Add event listener to toggle button
toggleButtonAPPSL.addEventListener("change", function() {
  // Update status indicator text based on toggle button state
  if (this.checked) {
    statusIndicatorAPPSL.textContent = "Hydra";
    localStorage.setItem('backendAppSlService', 'hydra');
    // epass = '-qaeusw1c4'
    // epass = '-gtmqa'
    host = 'dpconnectappslgtm'
  } else {
    statusIndicatorAPPSL.textContent = "ECP";
    localStorage.setItem('backendAppSlService', 'ecp');
    // epass = '-qa'
    host = 'dpconnectappsl'
  }
});

