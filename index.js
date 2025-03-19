window.onload = function () {
    processURL();
};
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

let epass = "-qa"
let accessToken = null;
let authorization = null;
let accountReferenceId = null;
let linkState = null;
let provisioning_id = null;
let provision_payload_id = null;
let result = "success";
let flow = null;
let service = 'ecp';
let host = 'dpconnectappsl';
let urlPartner = "amazon";

let uuid = generateUUID()
request_id.innerText = uuid;

let invalid_users = [
    "user01",
    "user02",
    "user03"
]

function processURL() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    // const {state, env, flow: urlFlow, provisionPayloadId, authorizationCode, partner: urlPartner} = params;
    const {state, env, flow: urlFlow, provisionPayloadId, partner: urlPartner, authorizationCode, service} = params;
    const updatedAuthorizationCode = authorizationCode || localStorage.getItem('authorizationCode');
    const appslService = localStorage.getItem('backendAppSlService');
    if (env) {
        if (env === "sandbox") {
            if (appslService === 'ecp') {
                epass = '-qa'
            } else {
                // epass = '-qaeusw1c4'
                // epass = '-qaeusw1'
            }
            if(service === 'hydra'){
                host = 'dpconnectappslgtm'
            }
        }
    }

    // if (env) {
    //     if (env === "sandbox") {
    //         epass = '-qa'
    //     }
    // }

    if (urlPartner) {
        partner = urlPartner;
        provisioning_id = localStorage.getItem('bpay_workflow_id');
    }

    if (urlFlow === "pull" && (provisionPayloadId || updatedAuthorizationCode)) {
        console.log('flow came into process url with auth code as ', updatedAuthorizationCode)
        flow = urlFlow;
        provision_payload_id = provisionPayloadId || updatedAuthorizationCode;
        amex_container.style.display = "none"
        login_container.style.display = ""
    } else if (urlFlow === "pull" && urlPartner === 'bpay') {
        amex_container.style.display = "none"
        login_container.style.display = ""
    } else if (state) {
        linkState = state;
        provision_payload_id = provisionPayloadId;
        amex_container.style.display = "none"
        login_container.style.display = ""
    } else {
        invalid_code.style.display = ""
        loading.style.display = "none"
    }
}

 function getHMAC(e) {
    if(partner === 'bpay'){
        setTimeout(getCardDetails, 1000);
    } else {
        let headers = {
            "Accept-Language": "*",
            "Client-Id": "client_test",
            "Content-Type": "application/json"
        }
        axios({
            method: 'post',
            url: `https://${host}${epass}.aexp.com/oauth2/generate_token`,
            // url: `https://dpconnectinbnd${epass}eusw1.americanexpress.com/oauth2/generate_token`,
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
}

const cardOnFile = () => {
    const headers = {
     'Selected-Partner': 'PAYPAL',
        'Source': 'EH_WEB'
    }

    axios({
        method: 'post',
        url: `https://dpconnectptnr-qa.americanexpress.com/payments/digital/v1/connect/push/cardonfile`,
        headers,
        data: ''
    }).then(res => {
        if (res && res.data) {
            accessToken = res.data.access_token
            if (partner === 'amazon') {
                if (request.provisionPayloadId) {
                    getAccounts(request.provisionPayloadId);
                } else if (request.accountReferenceId) {
                    setTimeout(createAccountLink, 1000);
                }
            } else if (partner === 'bpay') {
                getCardDetails();
            }
        }
    }).catch(err => {
        amex_container.style.display = ""
        system_error.style.display = ""
        loading.style.display = "none"
        login_container.style.display = "none"
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
        headers['ProvisionId'] = provisioning_id;
    }

    let requestParam = '';
    let scope;
    if (request.provisionPayloadId) {
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
        // url: `https://dpconnectinbnd${epass}eusw1.americanexpress.com/payments/digital/v1/connect/oauth2/token${requestParam}${scope ? `&scope=${scope}` : ''}`,
        headers,
        data: ''
    }).then(res => {
        if (res && res.data) {
            accessToken = res.data.access_token
            if (partner === 'amazon') {
                if (request.provisionPayloadId) {
                    getAccounts(request.provisionPayloadId);
                } else if (request.accountReferenceId) {
                    setTimeout(createAccountLink, 1000);;
                }
            } else if (partner === 'bpay') {
                getCardDetails();
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
        // url: `https://dpconnectinbnd${epass}eusw1.americanexpress.com/payments/digital/v1/connect/getaccountlist?provisionPayloadId=${provisionPayloadId}`,
        headers,
        data: {}
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
        // url: `https://dpconnectinbnd${epass}eusw1.americanexpress.com/payments/digital/v1/connect/createaccountlink`,
        headers,
        data: request
    }).then(res => {
        console.log(res)
        result = res.status === 200 ? 'success' : 'failure';
        if (flow !== "pull") {
            app_redirect.disabled = false;
            connect_redirect.disabled = false;
        }
    }).catch(err => {
        console.log(err)
    })
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
        // url: `https://dpconnectinbnd${epass}eusw1.americanexpress.com/payments/digital/v1/connect/provision/carddetails`,
        headers,
        data: {
        }
    }).then(res => {
        console.log(res)
        // getProvisionStatus();
    }).catch(err => {
        console.log(err)
    });
}

function getProvisionStatus() {
    accessToken = localStorage.getItem('authorization');
    let urlId = localStorage.getItem('urlId');
    let headers = {
        "Content-Type": "application/json",
        "RequestId": urlId,
        "Authorization": `Bearer ${accessToken}`,
        "ProvisionId": urlId,
        "Partner": partner.toUpperCase()
    }
    let request = {
        "link_status": "SUCCESS",
    }
    axios({
        method: 'post',
        url: `https://${host}${epass}.aexp.com/payments/digital/v1/connect/provision/status`,
        // url: `https://dpconnectinbnd${epass}eusw1.americanexpress.com/payments/digital/v1/connect/provision/status`,
        headers,
        data: request
    }).then(res => {
        console.log(res)
    }).catch(err => {
        console.log(err)
    });
}

function userCancelled() {
    if (flow !== "pull") {
        let connectLink = new URL("https://amex-connect-qa.americanexpress.com/amazon");
        connectLink.searchParams.append("state", linkState);
        window.location.href = connectLink;
    }
}

function appRedirect() {
    let deepLink = new URL("amexapp://amexconnect/amazon/redirect");
    deepLink.searchParams.append("linkStatus", result);
    deepLink.searchParams.append("state", linkState);
    window.location.href = deepLink;
}

function connectRedirect() {
    let connectLink = new URL("https://amex-connect-qa.americanexpress.com/amazon");
    connectLink.searchParams.append("linkstatus", result);
    connectLink.searchParams.append("state", linkState);
    window.location.href = connectLink;
}

function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0, // tslint:disable-line
            v = c === "x" ? r : (r & 0x3) | 0x8; // tslint:disable-line
        return v.toString(16);
    });
}


userId.addEventListener('input', onInputChange)
password.addEventListener('input', onInputChange)

function onInputChange(e) {
    login.disabled = !(userId?.value && password?.value);
}
