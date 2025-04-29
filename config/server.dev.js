const { isObject } = require('lodash');
const { getServerConfig } = require('./utils');

const { server, port, host } = getServerConfig();

const getProxyByMap = (apiMap) => {
  const result = {};
  Object.keys(apiMap).forEach((key) => {
    const value = apiMap[key];
    const base = isObject(value) ? value : { target: value };
    result[key] = {
      ...base,
      changeOrigin: true,
      secure: false,
      headers: {
        Connection: 'keep-alive',
      },
      onProxyReq: (proxyReq, req) => {
        console.log(`Proxying: ${req.method} ${req.url} -> ${proxyReq.path}`);
      },
      onError: (err) => {
        console.error('Proxy error:', err);
      },
    };
  });
  return result;
};

// Đổi thứ tự các rule proxy để rule cụ thể có độ ưu tiên cao hơn
const apiMap = {
  '/api/openstack/skyline/api/v1': {
    target: server,
    pathRewrite: { '^/api/openstack/skyline/api/v1': '/api/v1' },
  },
  '/api/': server,
};

// eslint-disable-next-line no-console
console.log('apiMap', apiMap);
const proxy = getProxyByMap(apiMap);

module.exports = { proxy, host, port };
