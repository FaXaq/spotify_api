const APP_URI = 'http://localhost:1234';

var clientId = 'b4a609e732e342868d003ca4e8a76f46';
var clientSecret = '839036bd57ed45c895f5d967d4ea0f6a';
var searchParams = new URLSearchParams(window.location.search);
var authorizationCode = localStorage.getItem('authroziation_code') || '';

function hasAuthorizationCode() {
    // retrieve the authorization code if in url
    if (searchParams.has('code')) {
        authorizationCode = searchParams.get('code');
        localStorage.setItem('authroization_code', authorizationCode);
    }

    return authorizationCode != '';
}

function requestAuthorization() {
    let API_URL = 'https://accounts.spotify.com/fr/authorize?';
    let API_URL_PARAMS = new URLSearchParams({
        client_id: clientId,
        redirect_uri: APP_URI,
        response_type: 'code'
    })
    location.href = API_URL + API_URL_PARAMS
}

function refreshAccessToken() {
    return new Promise((resolve, reject) => {
        axios
        .post('https://accounts.spotify.com/api/token', Qs.stringify({
            'refresh_token': localStorage.getItem('refresh_token'),
            'grant_type': 'refresh_token',
            'redirect_uri': APP_URI
        }), {
            headers: {
                // btoa encode in base 64
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then((response) => {
            localStorage.setItem('access_token', response.data.access_token);

            // refresh access token after it expires
            setTimeout(refreshAccessToken, response.data.expires_in * 1000);
            resolve();
        })
        .catch((err) => {
            console.log('error:', err);
            requestAuthorization();
        })
    })
}

function getAccessToken() {
    return new Promise((resolve, reject) => {
        // we have authorization code
        // get access token
        // mandatory to use Qs.stringify : see https://github.com/axios/axios/issues/350
        axios
        .post('https://accounts.spotify.com/api/token', Qs.stringify({
                'code': authorizationCode,
                'grant_type': 'authorization_code',
                'redirect_uri': APP_URI
            }), {
                headers: {
                    // encode in base 64
                    'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
        })
        .then((response) => {
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);

            // refresh access token after it expires
            setTimeout(refreshAccessToken, response.data.expires_in * 1000);
            resolve();
        })
        .catch((err) => {
            console.log('Error in get access token:', err);
            if (err.response.status === 400) {
                // authorization token is revoked refresh it
                requestAuthorization();
            }
            reject(err);
        })
    })
}

// get authentication token if no access token in local storage or search params
if (!hasAuthorizationCode()) {
    requestAuthorization();
}
if (!localStorage.getItem('access_token')) {
    getAccessToken();
}

// get a metallica album
function getAlbum() {
    return new Promise((resolve, reject) => {
        axios
        .get('https://api.spotify.com/v1/albums/' + '5tEW32iyrRuYPQQ4bwUiCf', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then((response) => {
            resolve(response.data);
        })
        .catch((err) => {
            if (err.response.data.error.status === 401) {
                getAccessToken().then(() => getAlbum());
            }
            reject(err);
        })
    })
}