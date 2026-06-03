import nextTranspileModules from 'next-transpile-modules';

const withTM = nextTranspileModules([
  'bpmn-js',
  'diagram-js',
  'bpmn-js-properties-panel',
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  output: 'standalone',
  webpack(config) {
    config.module.rules.push({
      test: /\.xml$/,
      use: ['xml-loader'],
    });

    return config;
  },
};

export default withTM(nextConfig);
