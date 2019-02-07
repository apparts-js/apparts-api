import Base64 from 'base-64';

const apiConfig = require('apparts-config').get('api');

const baseURL = apiConfig.url;

export const _myFetch = (url, auth, method, body) => {
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
  return fetch(baseURL + url, obj)
    .then(x => {
//      console.log(x);
      return Promise.resolve(x);
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
