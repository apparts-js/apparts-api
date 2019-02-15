import Base64 from 'base-64';

const apiConfig = require('apparts-config').get('api');
const baseURLs =
      _shuffle(apiConfig.urls.slice(0, apiConfig.amountFirstURLsToShuffle || 0))
      .concat(apiConfig.urls.slice(apiConfig.amountFirstURLsToShuffle || 0));

export const _myFetch = (url, auth, method, body, urlToTry=0) => {
  let headers = { 'Content-Type': 'application/json'};
  if(auth){
    headers.Authorization = 'Basic ' + auth;
  }
//  console.log(method, url, auth, JSON.stringify(body));

  let obj = {
    method,
    headers
  };
  if(body){
    obj.body = JSON.stringify(body);
  }

  return fetch(baseURLs[urlToTry] + url, obj)
    .then(x => {
      if(urlToTry > 0){
        baseURLs.unshift(baseURLs.splice(urlToTry, 1)[0]);
      }
      return Promise.resolve(x);
    })
    .catch(e => {
      if(e.message == "Failed to fetch" && urlToTry < baseURLs.length){
        return _myFetch(url, auth, method, body, urlToTry + 1);
      } else {
        return Promise.reject(e);
      }
    });
};

export const post = (url, auth, body) => {
  return _myFetch(url, auth, 'POST', body);
};

export const put = (url, auth, body) => {
  return _myFetch(url, auth, 'PUT', body);
};

export const get = (url, auth) => {
  return _myFetch(url, auth, 'GET');
};

export const basicAuth = (uname, pw) => {
  let auth = Base64.encode(uname + ':' + pw);
//  console.log(auth);
  return auth;
};


function _shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
