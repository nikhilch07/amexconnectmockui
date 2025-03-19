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
    const {state, env, flow: urlFlow, provisionPayloadId} = params;
    if (env) {
        if (env === "sandbox") {
            epass = '-qa'
        }
    }

    if (urlFlow === "pull" && provisionPayloadId) {
        flow = urlFlow;
        provision_payload_id = provisionPayloadId;
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
    let headers = {
        "Accept-Language": "*",
        "Client-Id": "client_test",
        "Content-Type": "application/json"
    }
    axios({
        method: 'post',
        url: `https://dpconnectappsl${epass}.aexp.com/oauth2/generate_token`,
        headers,
    }).then(res => {
        console.log(res.data)
        authorization = res?.data;
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
        "X-Request-ID": uuid,
        "Content-Type": "application/x-www-form-urlencoded",
    }

    let requestParam = '';
    if (request.provisionPayloadId) {
        requestParam = `?code=${request.provisionPayloadId}&grant_type=authorization_code&scope=getAccountList`; 
    } else if (request.accountReferenceId) {
        requestParam = `?code=${request.accountReferenceId}&grant_type=authorization_code&scope=createAccountLink`; 
    }

    axios({
        method: 'post',
        url: `https://dpconnectappsl${epass}.aexp.com/payments/digital/v1/connect/oauth2/token${requestParam}`,
        headers,
        data: ''
    }).then(res => {
        if (res && res.data) {
            accessToken = res.data.access_token
            if (request.provisionPayloadId) {
                getAccounts(request.provisionPayloadId);
            } else if (request.accountReferenceId) {
                setTimeout(createAccountLink, 1000);
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
        url: `https://dpconnectappsl${epass}.aexp.com/payments/digital/v1/connect/getaccountlist?provisionPayloadId=${provisionPayloadId}`,
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
        url: `https://dpconnectappsl${epass}.aexp.com/payments/digital/v1/connect/createaccountlink`,
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

function generateURL() {
    invalid_code.style.display = "none";
    login_load.style.display = ""
    let headers = {
        "Accept": "application/json",
        "X-AXP-Locale": "en_US",
        "X-AXP-ClientType": "Android",
        "X-AXP-AppVersion": "6.44.0",
        "X-AXP-AppId": "uk.co.americanexpress.amexservice.sl",
        "X-AXP-HardwareId": "12345",
        "X-AXP-DeviceOs": "iOS",
        "X-AXP-DeviceModel": "iPHONE",
        "X-AXP-TimeZoneOffset": "MST",
        "x-axp-git-sha": "123"
    }
    let request = {
        "agent": {
            "id": "61004661-1401-4753-9845-fa48bf1c8ce5",
            "cryptoVersion": "1.0",
            "timestamp": "1602793384600",
            "signature": "KDh8LYHKkpuVsoYZ17NoROf+uBw+/N4IV5+h8xrJTLBag2r0JSnxJwMZIJovAH4LDJ0SUCGbm7zH5ZRBxkS2nHgBn5tmNBvCNPMYbnMHQyNeRho9P726K50Ow51LUKSGdz8bbsputJUKqvzxTz9s3hjLs/uCRTT/1kf+jKzb5AVQ+c+IMxam49KMDAz7FPvgS45hFS58sDbsXgfyPEeQalc/sEZHIuGGBQ/TbGbCk3ZIvdIHM4+QoA3vtZ9Ly2b5QjDWoqMgYvH1H3c0Zx4WPCHkvGvBPp0m1nIyzztUTslY8l+7yZN5kyBEeBtWUmOxPoSpfiMr82+1ZAQWrAeTMg=="
        },
        "loginCredentials": {
            "userIdLogin": {
                "userId": "aren642426",
                "password": "flower1234"
            }
        },
        "cardArtRequest": [
            {
                "tag": "big-image",
                "minimumWidth": 1490
            }
        ]
    }
    console.log(headers)
    axios({
        method: 'post',
        url: `https://mobileone02-qa.americanexpress.com/mobileone/msl/services/accountservicing/v1/loginsummary`,
        headers,
        data: request
    }).then(res => {
        console.log(res);
        let {data} = res;
        let jwt = data.logonData.jsonWebToken.rawToken;
        console.log(jwt)
        getAccountToken(jwt);
    }).catch(err => {
        console.log(err)
    })
}

function getAccountToken(jwt) {
    let headers = {
        "Authorization": `AMAT ${jwt}`,
        "x-amex-tracking-id": "testaec5676secretfix",
        "Source": "MOBILEONE",
        "Selected-Partner": "AMAZON",
        "Accept-Language": "*",
        "Session-Id": "testaec5676secretfix",
        "Content-Type": "application/json",
        "Provisioning-Id": "058e03a1-ded2-4bcd-99c1-0e1d456e4446"
    }
    axios({
        method: 'get',
        url: `https://dpconnect-qa.aexp.com/payments/digital/v1/connect/accounts`,
        headers,
    }).then(res => {
        console.log(res);
        let {data} = res;
        let accountToken = data.eligible_card_list[0].account_token;
        provisioning_id = data.provisioning_id
        provision_id.innerText = provisioning_id
        selectAccount(jwt, accountToken)
    }).catch(err => {
        console.log(err)
    })
}

function selectAccount(jwt, account) {
    let headers = {
        "Authorization": `AMAT ${jwt}`,
        "x-amex-tracking-id": "testaec5676secretfix",
        "Source": "MOBILEONE",
        "Selected-Partner": "AMAZON",
        "Accept-Language": "*",
        "Session-Id": "testaec5676secretfix",
        "Content-Type": "application/json",
        "Provisioning-Id": provisioning_id
    }

    let request = {
        "account_details": {
            "account_token": account
        },
        "risk_assessment_data": {
            "ip_address": "139.71.144.4",
            "browser_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
            "browser_language": "en-US",
            "os_platform": "Macintosh",
            "device_timezone": "MST",
            "device_latitude": "33.856159",
            "device_longitude": "33.856159",
            "country_on_device": "US",
            "device_id": "058281b9-937c-4dbd-a771-5eb110795e8e",
            "device_key": "eyJhbGciOiJBMjU2S1ciLCJmaWVsZF9sZXZlbF9lbmNfa2V5X3ZlcnNpb24iOiIzLjAiLCJraWQiOiIzNCIsImVuYyI6IkExMjhDQkMtSFMyNTYifQ==.nHNC+Qaau5Dxf\\/9HZoPYD9ZEFVEU9jQOv88ub4Xf9GG9myZ8+hNtFQ==.AAAAAAAAAAAAAAAAAAAAAA==.mURqqyKUyIsfASMkSZB\\/3L9W4SBpVD3oO8R9WfAfeUNC5lGpxy78OjkPQ288h9sRdcLE1I6nYgRHq3I\\/NUgVv4P13SYQPQOUWtX1WebNH7s=.tHawsC3ddCkAStjlUKoawA==",
            "encrypted_risk_data": "HwM7CmYCZe4wnGblR\\/4rWa9sqZsOo5UWI6Tb921enKlKg9NGCOWWmU31EEhylkBRdPX\\/kolqnpZllPPoWiCyu2iKszGg2A2Pt2UBfhsnK0aTNYIf47gb85gB8+WWUU2\\/Fw2VuPQJb0IAiRgucljS4h1kPOYY3rhZf+ZfQn08EiwsK3IkA\\/VSDCqXWHB8bNszR4feXmOo4NErUPjvvKauow==",
            "device_type": "iphone"
        }
    }
    axios({
        method: 'post',
        url: `https://dpconnect-qa.aexp.com/payments/digital/v1/connect/selectedaccount`,
        headers,
        data: request
    }).then(res => {
        console.log(res);
        let {data} = res;
        let {provisionPayloadId, partner_url} = data;
        partner_url = new URL(partner_url)
        let state = partner_url.searchParams.get("state");
        let redirecrUrl = new URL("https://axpco.com/connect/amazon");
        redirecrUrl.searchParams.append('env', "sandbox");
        redirecrUrl.searchParams.append('state', state);
        redirecrUrl.searchParams.append('provisionPayloadId', provisionPayloadId);
        console.log(redirecrUrl);
        window.location.href = redirecrUrl;
    }).catch(err => {
        console.log(err)
    })
}