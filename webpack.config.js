/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");


const fs = require("fs");

class MetaInfoPlugin {
  constructor(options) {
    this.options = { filename: "meta.json", ...options };
  }

  apply(compiler) {
    compiler.hooks.done.tap(this.constructor.name, (stats) => {
      const metaInfo = {
        hash: stats.hash,
      };
      const json = JSON.stringify(metaInfo);
      return new Promise((resolve, reject) => {
        fs.writeFile(this.options.filename, json, "utf8", (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    });
  }
}

module.exports = [
  {
    plugins: [
      // new NodePolyfillPlugin(),
      new MiniCssExtractPlugin({
        filename: "[name].[hash].css",
      }),
      new MetaInfoPlugin({ filename: "dist/meta.json" }),

    ],
    entry: {
      "js/main": "./src/public/js/main.ts",
      "css/main": "./src/public/css/main.scss",
      "js/print": "./src/public/js/print.ts",
      "css/print": "./src/public/css/print.scss",
      "js/admin": "./src/public/js/admin.ts",
      "css/admin": "./src/public/css/admin.scss",
      "css/tailwind": "./src/public/css/tailwind.scss",
      "css/modern-ui": "./src/public/css/modern-ui.scss",
      "css/landing": "./src/public/css/landing.scss",
      
    },
    optimization: {
      minimizer: [
        new CssMinimizerPlugin(),
      ],
      // runtimeChunk: 'single',
      // splitChunks: {
      //   chunks: "all",
      // },
    },
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
              }
            },
            "sass-loader",
            "postcss-loader",
          ],
        },
        {
          test: /\.ts?$/,
          use: [{
            loader: "ts-loader",
            options: {
                configFile: "client.tsconfig.json"
            }
        }],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      chunkFilename: "[name].[hash].js",
      filename: "[name].[hash].js",
      path: path.resolve(__dirname, "dist/public/"),
    },
  },
];
