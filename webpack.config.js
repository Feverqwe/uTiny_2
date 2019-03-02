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
    bg: './src/js/background',
    popup: './src/js/manager',
    options: './src/js/options',
  },
  output: {
    path: path.join(outputPath, 'dist'),
    filename: '[name].js',
    chunkFilename: 'chunk-[name].js',
  },
  mode: mode,
  devtool: devtool,
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: "commons",
          chunks: chunk => ['bg', 'popup', 'options'].indexOf(chunk.name) !== -1,
          minChunks: 3,
          priority: 0
        },
        'commons_ui': {
          name: "commons-ui",
          chunks: chunk => ['popup', 'options'].indexOf(chunk.name) !== -1,
          minChunks: 2,
          priority: -10
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
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new CleanWebpackPlugin(outputPath),
    new CopyWebpackPlugin([
      {from: './src/manifest.json',},
      {from: './src/assets/img', to: './assets/img'},
      {from: './src/assets/icons', to: './assets/icons'},
      {from: './src/_locales', to: './_locales'},
    ]),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: "chunk-[id].css"
    }),
    new HtmlWebpackPlugin({
      filename: 'manager.html',
      template: './src/templates/manager.html',
      chunks: ['commons', 'commons-ui', 'popup']
    }),
    new HtmlWebpackPlugin({
      filename: 'options.html',
      template: './src/templates/options.html',
      chunks: ['commons', 'commons-ui', 'options']
    }),
    new DefinePlugin({
      'BUILD_ENV': Object.entries(BUILD_ENV).reduce((obj, [key, value]) => {
        obj[key] = JSON.stringify(value);
        return obj;
      }, {}),
    })
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
  Object.keys(config.entry).forEach(entryName => {
    let value = config.entry[entryName];
    if (!Array.isArray(value)) {
      value = [value];
    }
    // value.unshift('babel-polyfill');
    value.unshift('whatwg-fetch');

    config.entry[entryName] = value;
  });
}

module.exports = config;