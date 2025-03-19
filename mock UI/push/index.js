let login_load = document.getElementById("login_load");
let userId = document.getElementById("partner_user");
let password = document.getElementById("partner_pass");
let login = document.getElementById("a-eg1-submit");
let loginText = document.getElementById("a-eg1-submit-text");
let invalid_code = document.getElementById("invalid_code");
let loading = document.getElementById("partner_load");
let system_error = document.getElementById("system_error");
let login_container = document.getElementById("partner-login");
let amex_container = document.getElementById("amex-container");
let provision_id = document.getElementById("provision-id");
let request_id = document.getElementById("request-id");
let app_redirect = document.getElementById("app-redirect");
let connect_redirect = document.getElementById("connect-redirect");
let error_messages = document.getElementById("error-messages");

window.onload = function () {
    processURL();
};

let epass = "-qa"
let accessToken = null;
let authorization = null;
let accountReferenceId = null;
let linkState = null;
let provisioning_id = null;
let provision_payload_id = null;
let result = "success";
let flow = null;
let urlPartner = "amazon";
let redirectUri = null;
let host = 'dpconnectappsl';

let amexBtn = document.getElementById("amex-btn");

let uuid = generateUUID()
request_id.innerText = uuid;
let authCode = 'C21AAItHo0GuHwJ7_XWCcezpvy5hGu3Lu5zwuQVQZrL5tDcxlAic9BIFENRfp62O5ZxcdJw26b6vL46GFLGQMHMlGmfnnyLcw';


const decodeStateQueryParam = (state) => {
    let decodedStateObj = {};
    if (state && state.length > 0) {
        const decodedState = atob(state);
        decodedStateObj = decodedState.split('&').reduce((acc, curr) => {
            const [key, value] = curr.split('=');
            acc[key] = value;
            return acc;
        }, {});
    } else {
        decodedStateObj = {};
    }
    return decodedStateObj;
};

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
        redirect_uri,
        state,
        flow: urlFlow,
        code,
        provisionPayloadId,
    } = params;

    console.log('Params', params);
    redirectUri = redirect_uri;
    authCode = code;
    /* get state value from redirectUri */
    if (redirectUri) {
        let state = redirectUri.split('state=')[1];
        linkState = state;
    }

    if(redirectUri.includes('amexconnectuplift')){
        host = 'dpconnectappslgtm';
    }

        if (env) {
            if (env === "e2") {
                epass = '-qa'
            }
    }


    error_messages.style.display = 'none';
    partner_load.style.display = 'none';
    login_container.style.display = '';

    // if (provisionPayloadId || authorizationCode) {
    //     console.log('flow came into process url with auth code as ', authorizationCode)
    //     flow = urlFlow;
    //     provision_payload_id = provisionPayloadId || authorizationCode;
    //     amex_container.style.display = "none"
    //     login_container.style.display = ""
    // }
    //
    // if(urlPartner === 'amazon' || urlPartner === 'paypal'){
    //     error_messages.style.display = 'none';
    //     partner_load.style.display = 'none';
    //     login_container.style.display = '';
    // }

    if (urlPartner) partner = urlPartner;
    if (urlLocale) locale = urlLocale;
    if (urlNewBiller) newBiller = urlNewBiller;
    if (urlId) localStorage.setItem('urlId', urlId); requestId = urlId;
    if (provisionPayloadId) provision_payload_id = provisionPayloadId;
    if(state && partner === 'knot') {
        const decodedState = decodeStateQueryParam(state);
        provision_payload_id = decodedState.provisioningId;
    }
    // if (authorizationCode) localStorage.setItem('authorizationCode', authorizationCode); authCode = authorizationCode;
};

 function getHMAC(e) {
        let headers = {
            "Accept-Language": "*",
            "Client-Id": "client_test",
            "Content-Type": "application/json"
        }
        axios({
            method: 'post',
            url: `https://${host}${epass}.aexp.com/oauth2/generate_token`,
            headers,
        }).then(res => {
            console.log(res.data)
            authorization = res?.data;
            console.log('getHMAC', authorization);
            getToken({provisionPayloadId: provision_payload_id});
        }).catch(err => {
            console.log(err)
        })
}

function getToken(request) {
    let headers = {
        "Accept": "application/json",
        "Accept-Language": "*",
        "Authorization": authorization,
        "Content-Type": "application/x-www-form-urlencoded",
    }

    if (partner === 'amazon') {
        headers['X-Request-ID'] = uuid;
    } else {
        headers['RequestId'] = uuid;
        headers['Partner'] = partner.toUpperCase();
        // headers['ProvisionId'] = provisioning_id;
    }

    let requestParam = '';
    let scope;
    if(partner === 'knot' && authCode) {
        requestParam = `?code=${authCode}&grant_type=authorization_code`;
    }
    else if (request.provisionPayloadId) {
        requestParam = `?code=${request.provisionPayloadId}&grant_type=authorization_code`;
        if (partner === 'amazon') {
            scope = 'getAccountList';
        }
    } else if (request.accountReferenceId) {
        requestParam = `?code=${request.accountReferenceId}&grant_type=authorization_code`;
        if (partner === 'amazon') {
            scope = 'createAccountLink';
        }
    }

    axios({
        method: 'post',
        url: `https://${host}${epass}.aexp.com/payments/digital/v1/connect/oauth2/token${requestParam}${scope ? `&scope=${scope}` : ''}`,
        headers,
        data: ''
    }).then(res => {
        if (res && res.data) {
            accessToken = res.data.access_token
            localStorage.setItem('authorization', accessToken);
            if (partner === 'amazon') {
                if (request.provisionPayloadId) {
                    getAccounts(request.provisionPayloadId);
                } else if (request.accountReferenceId) {
                    setTimeout(createAccountLink, 1000);
                }
            } else {
                getProvisionStatusForLogin();
            }
        }
    }).catch(err => {
        amex_container.style.display = ""
        system_error.style.display = ""
        loading.style.display = "none"
        login_container.style.display = "none"
    })
}

function getAccounts(provisionPayloadId) {
    login.classList.add("btn-loading")
    loginText.classList.add("invisible");
    let headers = {
        "Accept": "application/json",
        "Accept-Language": "*",
        "Authorization": `Bearer ${accessToken}`,
        "X-Request-ID": uuid,
        "sharedId": 'da0b16d2473d33E1',
    }
    console.log(headers)
    axios({
        method: 'get',
        url: `https://${host}${epass}.aexp.com/payments/digital/v1/connect/getaccountlist?provisionPayloadId=${provisionPayloadId}`,
        headers,
        data: {

        }
    }).then(res => {
        console.log(res)
        let {data} = res;
        if (data && data.accountsList && data.accountsList.length) {
            accountReferenceId = data.accountsList[0].accountReferenceId
            getToken({accountReferenceId: accountReferenceId})
        } else {
            throw Error("No Response");
        }
    }).catch(err => {
        console.log(err)
        result = 'failure';
        app_redirect.disabled = false;
        connect_redirect.disabled = false;
    });
}

function createAccountLink() {
    let headers = {
        "Accept": "application/json",
        "Accept-Language": "*",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Request-ID": uuid,
    }
    let request = {
        "accountRefId": accountReferenceId,
        "linkStatus": "SUCCESS",
        "linkId": "da0b16d2473d33E1",
        "displayableIdentifier": "ashok****@gmail.com"
    }
    axios({
        method: 'post',
        url: `https://${host}${epass}.aexp.com/payments/digital/v1/connect/createaccountlink`,
        headers,
        data: request
    }).then(res => {
        console.log(res)
        result = res.status === 200 ? 'success' : 'failure';
        if(result === 'success') {
            const ehRedirectUrl  = new URL(redirectUri);
            ehRedirectUrl.searchParams.append("linkstatus", result);
            ehRedirectUrl.searchParams.append("state", linkState);
            window.location.href = ehRedirectUrl;
        }
        // if (flow !== "pull") {
        //     app_redirect.disabled = false;
        //     connect_redirect.disabled = false;
        // }
    }).catch(err => {
        console.log(err)
    })
}


/* write a function to fetch the state value from https://amex-connect-qa.americanexpress.com/wallets-merchants?state=cHJvdmlzaW9uaW5nSWQ9NTBmM2Y4NGUtZTBjNy00ZjJlLWE5OGUtZTI4NjNhMTUwNjk4JnBhcnRuZXJJZD1BTUFaT04=&provisionPayloadId=ODM3YWQ3MzEtZGI4NC00ODE5LWI4ZTMtZGYwMzdjNDhjZDBj */
function fetchState() {
const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const { state, provisionPayloadId } = params;
    if (state) {
        linkState = state;
        localStorage.setItem('linkState', state);
    }
    if (provisionPayloadId) {
        provision_payload_id = provisionPayloadId;
        localStorage.setItem('provisionPayloadId', provisionPayloadId);
    }
}

userId.addEventListener('input', onInputChange)
password.addEventListener('input', onInputChange)

function onInputChange(e) {
    login.disabled = !(userId?.value && password?.value);
}

function getCardDetails() {
    login.classList.add("btn-loading")
    loginText.classList.add("invisible");
    accessToken = localStorage.getItem('authorization');
    let urlId = localStorage.getItem('urlId');
    let headers = {
        "Content-Type": "application/json",
        "RequestId": 'bpay-test-dec-05-test-1',
        "Authorization": `Bearer ${accessToken}`,
        // "ProvisionId": urlId,
        "Partner": partner.toUpperCase()
    }
    console.log(headers)
    axios({
        method: 'get',
        url: `https://${host}${epass}.aexp.com/payments/digital/v1/connect/provision/carddetails`,
        headers,
        data: {
        }
    }).then(res => {
        console.log(res)
        getProvisionStatusForLink();
    }).catch(err => {
        console.log(err)
    });
}

function getProvisionStatusForLogin() {
    accessToken = localStorage.getItem('authorization');
    let urlId = localStorage.getItem('urlId');
    let headers = {
        "Content-Type": "application/json",
        "RequestId": provision_payload_id,
        "Authorization": `Bearer ${accessToken}`,
        // "ProvisionId": urlId,
        "Partner": partner.toUpperCase()
    }
    let request = {
        "login_status": "SUCCESS",
    }
    axios({
        method: 'post',
        url: `https://${host}${epass}.aexp.com/payments/digital/v1/connect/provision/status`,
        headers,
        data: request
    }).then(res => {
        console.log(res)
        window.parent.postMessage(authCode, 'https://amex-connect-qa.americanexpress.com');
        getCardDetails();
    }).catch(err => {
        console.log(err)
    });
}

function getProvisionStatusForLink() {
    accessToken = localStorage.getItem('authorization');
    // let urlId = localStorage.getItem('urlId');
    let headers = {
        "Content-Type": "application/json",
        "RequestId": provision_payload_id,
        "Authorization": `Bearer ${accessToken}`,
        // "ProvisionId": urlId,
        "Partner": partner.toUpperCase()
    }
    let request = {
        "link_status": "SUCCESS",
    }
    axios({
        method: 'post',
        url: `https://${host}${epass}.aexp.com/payments/digital/v1/connect/provision/status`,
        headers,
        data: request
    }).then(res => {
        console.log(res)
        window.parent.postMessage(authCode, 'https://amex-connect-qa.americanexpress.com');
    }).catch(err => {
        console.log(err)
    });
}
function postEvent(event) {
    getProvisionStatusForLogin();
}
function extractUrl(url) {
    const urlArr = url.split('?');
    return urlArr.slice(0, urlArr.length - 1).join('/');
}

// function loginClick() {
//     if(partner === 'amazon' || partner === 'paypal'){
//         const ehRedirectUrl  = new URL(extractUrl(redirectUri));
//         ehRedirectUrl.searchParams.append("linkstatus", result);
//         ehRedirectUrl.searchParams.append("state", linkState);
//         window.location.href = ehRedirectUrl;
//     } else {
//         postEvent();
//     }
// }

function loginClick() {
    if(partner === 'amazon'){
        getHMAC()
    } else if( partner === 'paypal') {
        // const redirectUrl = 'https://amex-connect-qa@americanexpress.com/wallets-merchants'
        // window.location.href = redirectUrl;
        const ehRedirectUrl  = new URL(extractUrl(redirectUri));

        const paypalUrl = 'https://amex-connect-qa.americanexpress.com/paypal&state=source=ICN:correlationId=cb58f751-9d3a-42d7-9a5a-6a4b291a9275&scope=scope_group_provisioning_platform';


        /* write a function to append code=authcode after https://amex-connect-qa.americanexpress.com/paypal */
        if (ehRedirectUrl.searchParams.has("code")) {
            ehRedirectUrl.searchParams.delete("code");
        }

        ehRedirectUrl.searchParams.append("code", authCode);
        ehRedirectUrl.searchParams.append("state", linkState);
        window.location.href = ehRedirectUrl;
    } else {
        // postEvent();
        getHMAC();
    }
}
function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0, // tslint:disable-line
            v = c === "x" ? r : (r & 0x3) | 0x8; // tslint:disable-line
        return v.toString(16);
    });
}
