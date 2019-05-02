require('./builder/defaultBuildEnv');
const {DefinePlugin} = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const outputPath = BUILD_ENV.outputPath;
const mode = BUILD_ENV.mode;
const devtool = BUILD_ENV.devtool;
const babelEnvOptions = BUILD_ENV.babelEnvOptions;

const config = {
  entry: {
    bg: './src/bg/bg',
    app: './src/App',
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    path: outputPath,
  },
  mode: mode,
  devtool: devtool,
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: "commons",
          chunks: 'all',
          minChunks: 2
        },
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              ['@babel/plugin-proposal-decorators', {'legacy': true}],
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-class-properties'
            ],
            presets: [
              '@babel/preset-react',
              ['@babel/preset-env', babelEnvOptions]
            ]
          }
        }
      },
      {
        test: /\.(css|less)$/,
        use: [{
          loader: MiniCssExtractPlugin.loader
        }, {
          loader: "css-loader"
        }, {
          loader: "clean-css-loader"
        }, {
          loader: "less-loader"
        }]
      },
      {
        test: /\.(gif|png|svg)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 8192
          }
        }]
      },
      {
        test: /[\\/]src[\\/]templates[\\/]index\.html$/,
        use: [{
          loader: path.resolve('./builder/cacheDependencyLoader.js'),
          options: {
            dependencies: [
              path.resolve('./src/AppPrerender')
            ]
          }
        }, {
          loader: 'prerender-loader',
          options: {
            string: true,
            params: {
              location: {
                pathname: '/index.html'
              }
            }
          }
        }]
      },
      {
        test: /[\\/]src[\\/]templates[\\/]options\.html$/,
        use: [{
          loader: path.resolve('./builder/cacheDependencyLoader.js'),
          options: {
            dependencies: [
              path.resolve('./src/AppPrerender')
            ]
          }
        }, {
          loader: 'prerender-loader',
          options: {
            string: true,
            params: {
              location: {
                pathname: '/options.html'
              }
            },
          }
        }]
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
      cleanOnceBeforeBuildPatterns: [
        outputPath
      ]
    }),
    new CopyWebpackPlugin([
      {from: './src/manifest.json',},
      {from: './src/assets/img', to: './assets/img'},
      {from: './src/assets/icons', to: './assets/icons'},
      {from: './src/_locales', to: './_locales'},
    ]),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].chunk.css'
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/templates/index.html',
      chunks: ['commons', 'app']
    }),
    new HtmlWebpackPlugin({
      filename: 'options.html',
      template: './src/templates/options.html',
      chunks: ['commons', 'app']
    }),
    new DefinePlugin({
      'BUILD_ENV': Object.entries(BUILD_ENV).reduce((obj, [key, value]) => {
        obj[key] = JSON.stringify(value);
        return obj;
      }, {}),
    }),
  ]
};

if (mode === 'production') {
  config.plugins.push(
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorPluginOptions: {
        preset: [
          'default',
          {discardComments: {removeAll: true}}
        ],
      },
      canPrint: true
    }),
  );
}

module.exports = config;