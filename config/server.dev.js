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
  // Skyline API
  '/api/openstack/skyline/api/v1': {
    target: server,
    pathRewrite: { '^/api/openstack/skyline/api/v1': '/api/v1' },
  },

  // OpenStack Nova (Compute)
  '/api/openstack/regionone/nova/': {
    target: 'http://openstack.local/compute/',
    pathRewrite: { '^/api/openstack/regionone/nova/': '/' },
    onProxyRes: (proxyRes) => {
      // Fix lỗi Location header nếu có chuyển hướng
      const { location } = proxyRes.headers;
      if (location && location.startsWith('http://openstack.local/compute/')) {
        proxyRes.headers.location = location.replace(
          'http://openstack.local/compute/',
          '/api/openstack/regionone/nova/'
        );
      }
    },
  },

  // Thêm các endpoints khác ở đây nếu cần
  // Ví dụ cho Keystone (Identity)
  '/api/openstack/regionone/keystone/': {
    target: 'http://openstack.local/identity/',
    pathRewrite: { '^/api/openstack/regionone/keystone/': '/' },
  },

  // Glance (Image)
  '/api/openstack/regionone/glance/': {
    target: 'http://openstack.local/image/',
    pathRewrite: { '^/api/openstack/regionone/glance/': '/' },
  },

  // Neutron (Network)
  '/api/openstack/regionone/neutron/': {
    target: 'http://openstack.local/network/',
    pathRewrite: { '^/api/openstack/regionone/neutron/': '/' },
  },

  // Cinder (Block Storage)
  '/api/openstack/regionone/cinder/': {
    target: 'http://openstack.local/volume/',
    pathRewrite: { '^/api/openstack/regionone/cinder/': '/' },
  },

  // Route mặc định cho tất cả API khác
  '/api/': server,
};

// eslint-disable-next-line no-console
console.log('apiMap', apiMap);
const proxy = getProxyByMap(apiMap);

module.exports = { proxy, host, port };
