const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash:8].js' : 'renderer.js',
      chunkFilename: isProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
      publicPath: isProduction ? './' : '/',
      clean: true  // Clean dist folder on build
    },
    target: 'electron-renderer',
    optimization: {
      minimize: isProduction,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for node_modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true
          },
          // MUI components in separate chunk
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            priority: 20,
            reuseExistingChunk: true
          },
          // React ecosystem in separate chunk
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            name: 'react',
            priority: 20,
            reuseExistingChunk: true
          },
          // Common code used across multiple components
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            name: 'common'
          }
        }
      },
      runtimeChunk: isProduction ? 'single' : false,
      moduleIds: 'deterministic'  // Better caching
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,  // 500kb
      maxAssetSize: 512000
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  modules: false,  // Keep ES modules for tree shaking
                  targets: {
                    electron: '38'
                  }
                }],
                ['@babel/preset-react', {
                  runtime: 'automatic'  // New JSX transform
                }]
              ],
              cacheDirectory: true  // Cache babel compilations
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: 'images/[name].[hash:8].[ext]'
            }
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          use: {
            loader: 'file-loader',
            options: {
              name: 'fonts/[name].[hash:8].[ext]'
            }
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
    devServer: {
      port: 5173,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, 'dist')
      },
      compress: true,  // Enable gzip compression
      client: {
        overlay: {
          errors: true,
          warnings: false
        }
      }
    },
    devtool: isProduction ? false : 'eval-source-map',  // Faster dev builds
    cache: {
      type: 'filesystem',  // Use filesystem caching
      cacheDirectory: path.resolve(__dirname, '.webpack_cache')
    }
  };
};