// Copyright 2021 99cloud
const { isObject } = require('lodash');
const { getServerConfig } = require('./utils');

const { server, port, host } = getServerConfig();

// Ensure server has a valid URL format with protocol, host and optional port
const validateServerUrl = (url) => {
  if (!url) return 'http://localhost:8000';
  if (typeof url === 'string' && !url.includes('://')) {
    return `http://${url}`;
  }
  return url;
};

const validatedServer = validateServerUrl(server);

// Updated proxy helper function to support webpack-dev-server 5.x
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
    };
  });
  return result;
};

const apiMap = {
  '/api/': validatedServer,
};

// eslint-disable-next-line no-console
console.log('apiMap', apiMap);
const proxy = getProxyByMap(apiMap);

module.exports = { proxy, host, port };
