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
  // ############ Skyline API ############
  '/api/openstack/skyline/api/v1': {
    target: server,
    pathRewrite: { '^/api/openstack/skyline/api/v1': '/api/v1' },
  },
  // ############ end Skyline API ############

  // ############ Keystone (Identity) ############
  '/api/openstack/hochiminh/keystone/': {
    target: 'http://control.cercatrova.uk:5000/',
    pathRewrite: { '^/api/openstack/hochiminh/keystone/': '/' },
    onProxyRes: (proxyRes) => {
      const { location } = proxyRes.headers;
      if (
        location &&
        location.startsWith('http://control.cercatrova.uk:5000/')
      ) {
        proxyRes.headers.location = location.replace(
          'http://control.cercatrova.uk:5000/',
          '/api/openstack/hochiminh/keystone/'
        );
      }
    },
    onProxyReq: (proxyReq, req) => {
      console.log(
        `Keystone Proxy (lowercase): ${req.method} ${req.url} -> ${proxyReq.path}`
      );
    },
  },
  // ############ end Keystone ############

  // ############ Nova (Compute) ############
  '/api/openstack/hochiminh/nova/': {
    target: 'http://control.cercatrova.uk:8774/',
    pathRewrite: { '^/api/openstack/hochiminh/nova/': '/' },
  },
  // ############ end Nova (Compute) ############

  // ############ Glance (Image) ############
  '/api/openstack/hochiminh/glance/': {
    target: 'http://control.cercatrova.uk:9292/',
    pathRewrite: { '^/api/openstack/hochiminh/glance/': '/' },
  },
  // ############ end Glance (Image) ############

  // ############ Neutron (Network) ############
  '/api/openstack/hochiminh/neutron/': {
    target: 'http://control.cercatrova.uk:9696/',
    pathRewrite: { '^/api/openstack/hochiminh/neutron/': '/' },
    onProxyRes: (proxyRes) => {
      const { location } = proxyRes.headers;
      if (
        location &&
        location.startsWith('http://control.cercatrova.uk:9696/')
      ) {
        proxyRes.headers.location = location.replace(
          'http://control.cercatrova.uk:9696/',
          '/api/openstack/hochiminh/neutron/'
        );
      }
    },
    headers: {
      Host: '10.10.184.9:9696',
    },
    onProxyReq: (proxyReq, req) => {
      console.log(
        `Neutron Proxy (lowercase): ${req.method} ${req.url} -> ${proxyReq.path}`
      );
    },
  },
  // ############ end Neutron (Network) ############

  // ############ Cinder (Block Storage) ############
  '/api/openstack/hochiminh/cinder/': {
    target: 'http://control.cercatrova.uk:8776/',
    pathRewrite: { '^/api/openstack/hochiminh/cinder/': '/' },
  },
  // ############ end Cinder (Block Storage) ############

  // ############ Placement ############
  '/api/openstack/hochiminh/placement/': {
    target: 'http://control.cercatrova.uk:8780/',
    pathRewrite: { '^/api/openstack/hochiminh/placement/': '/' },
  },
  // ############ end Placement ############

  // ############ Route mặc định cho tất cả API khác ############
  '/api/': server,
};

// eslint-disable-next-line no-console
console.log('apiMap', apiMap);
const proxy = getProxyByMap(apiMap);

module.exports = { proxy, host, port };
