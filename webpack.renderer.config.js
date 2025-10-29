const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : 'renderer.js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      publicPath: isProduction ? './' : '/',
      clean: true // Clean dist folder before each build
    },
    target: 'electron-renderer',
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
              cacheDirectory: true // Enable caching for faster rebuilds
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8192 // 8kb
            }
          },
          generator: {
            filename: 'images/[name].[hash:8][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash:8][ext]'
          }
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@config': path.resolve(__dirname, 'src/config.js'),
        '@assets': path.resolve(__dirname, 'assets')
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        } : false
      })
    ],
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single', // Extract webpack runtime
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          // Vendor bundle for node_modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true
          },
          // MUI bundle (large library)
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            priority: 20,
            reuseExistingChunk: true
          },
          // React bundle
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            name: 'react',
            priority: 20,
            reuseExistingChunk: true
          },
          // Common bundle for shared code
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      },
      usedExports: true, // Tree shaking
      minimize: isProduction
    },
    performance: {
      maxAssetSize: 512000, // 500 KiB
      maxEntrypointSize: 512000,
      hints: isProduction ? 'warning' : false
    },
    devServer: {
      port: 5173,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, 'dist')
      },
      compress: true,
      client: {
        overlay: {
          errors: true,
          warnings: false
        }
      }
    },
    devtool: isProduction ? false : 'source-map',
    cache: {
      type: 'filesystem', // Enable persistent caching
      cacheDirectory: path.resolve(__dirname, '.webpack_cache')
    },
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }
  };
};
