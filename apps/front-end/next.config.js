/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 16:23:21
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/apps/front-end/next.config.js
 */
//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  // 禁用严格模式可能有助于解决某些问题
  reactStrictMode: false,
  
  // 增加超时时间
  poweredByHeader: false,
  
  // 实验性配置
  experimental: {
    // 启用应用目录支持
    appDir: true,
  },
  
  // 确保API路由正常工作
  async rewrites() {
    return [];
  }
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
