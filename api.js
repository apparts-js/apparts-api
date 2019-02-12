import * as network from './network.js';

let myStore;
export const setStore = store => myStore = store;

const _myFetch = (url, method, body,
                  auth = myStore.getState().global.token) =>
        {
          return network._myFetch(url, auth, method, body)
            .then(x => {
              if(x.status === 200){
                return x.json();
              }
              return Promise.reject(x);
            })
            .catch(x => {
              if(x.status > 200){
                if(x.status === 401 && x._bodyText === "Unauthorized"){
                  return Promise.reject(401);
                } else {
                  return Promise.reject(x);
                }
              }
              console.log(x);
              return Promise.reject(0);
            });
        };

export const post = (url, body, auth) => {
  return _myFetch(url, 'POST', body, auth);
};

export const put = (url, body, auth) => {
  return _myFetch(url, 'PUT', body, auth);
};

export const get = (url, auth) => {
  return _myFetch(url, 'GET', undefined, auth);
};


let defaultErrorDispatcher;
const _dispatchError = h => {
  if(typeof h === 'object'){
    console.log(h.title, h.text, h.buttons);
    defaultErrorDispatcher && defaultErrorDispatcher(h);
  } else {
    defaultErrorDispatcher && defaultErrorDispatcher({title: h});
  }
};

const _defaultErrorHandlers = {
/*  401: () => {
    // do something
  }*/
};

export const setErrorHandler = (h, code) => {
  if(code){
    _defaultErrorHandlers[code] = h;
  } else {
    defaultErrorDispatcher = h;
  }
};

export const handleApiError = (errorHandlers, next) => x => {
  console.log(x);
  if(typeof x === 'number'){
    if(errorHandlers && errorHandlers[x]){
      _dispatchError(errorHandlers[x]);
    } else {
      if(_defaultErrorHandlers[x]){
        _dispatchError(_defaultErrorHandlers[x]);
      }
    }
  } else {
    if(errorHandlers && errorHandlers[x.status]){
      _dispatchError(errorHandlers[x.status]);
    } else if(errorHandlers
              && errorHandlers[x.status + '.' + x._bodyText]){
      _dispatchError(errorHandlers[x.status + '.' + x._bodyText]);
    } else {
      _dispatchError(
        { title: 'Unexpected connection error',
          text: x._bodyText});
    }
  }
  next && next();
};

export { basicAuth } from './network.js';
