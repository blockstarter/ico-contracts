module.exports = {
  send: function(method, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method,
      params: params || [],
      id: new Date().getTime()
    }, callback);
  }
}
