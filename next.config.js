/** @type {import('next').NextConfig} */
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const withVanillaExtract = createVanillaExtractPlugin();

const nextConfig = {
	// Webpack customization
	webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
		// Custom webpack rules
		config.module.rules.push({
			test: /\.svg$/,
			use: ['@svgr/webpack'],
		});

		// Add plugins
		config.plugins.push(
			new webpack.DefinePlugin({
				__BUILD_ID__: JSON.stringify(buildId),
			})
		);

		return config;
	},

	// Build optimizations
	experimental: {
		optimizePackageImports: ['lodash'],
	},

	// Environment variables for bundle analyzer
	env: {
		ANALYZE: process.env.ANALYZE,
	},
};

module.exports = withVanillaExtract(nextConfig);
