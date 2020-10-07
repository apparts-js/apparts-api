const axios = require("axios");

const useApi = (Request) => ({
  get(uri, params) {
    const obj = new Request(uri, params, (a, b, c) => axios.get(a, c));
    obj.data = () => {
      throw "GET Request cannot take data";
    };
    return obj;
  },

  post(uri, params) {
    return new Request(uri, params, axios.post);
  },

  put(uri, params) {
    return new Request(uri, params, axios.put);
  },

  patch(uri, params) {
    return new Request(uri, params, axios.patch);
  },

  del(uri, params) {
    return new Request(uri, params, (a, b, c) => axios.delete(a, c));
  },
});

module.exports = useApi;
