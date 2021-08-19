const SpritesmithPlugin = require("webpack-spritesmith");
const CompressionWebpackPlugin = require("compression-webpack-plugin");
const path = require("path"); //引入path模块
const fs = require("fs");
const isProduction = process.env.NODE_ENV.indexOf("release") > -1;
const productionGzipExtensions = ["js", "css"];
// cdn预加载的模块及地址
const cdnModule = {
  externals: {
    vue: "Vue",
    "vue-router": "VueRouter",
    axios: "axios",
    vuex: "Vuex",
  },
  externalsJsArr: [
    "https://cdn.bootcdn.net/ajax/libs/vue/2.6.10/vue.min.js",
    "https://cdn.bootcdn.net/ajax/libs/vue-router/3.1.3/vue-router.min.js",
    "https://cdn.bootcdn.net/ajax/libs/axios/0.19.0/axios.min.js",
    "https://cdn.bootcdn.net/ajax/libs/vuex/3.1.2/vuex.min.js",
  ],
};

function resolve(dir) {
  return path.join(__dirname, dir); //path.join(__dirname)设置绝对路径
}
let has_sprite = true;
let files = [];
const icons = {};

try {
  fs.statSync(resolve("./src/assets/imgs"));
  files = fs.readdirSync(resolve("./src/assets/imgs"));
  files.forEach((item) => {
    let filename = item.toLocaleLowerCase().replace(/_/g, "-");
    icons[filename] = true;
  });
} catch (error) {
  fs.mkdirSync(resolve("./src/assets/imgs"));
}

if (!files.length) {
  has_sprite = false;
} else {
  try {
    let iconsObj = fs.readFileSync(resolve("./src/assets/imgs.json"), "utf8");
    iconsObj = JSON.parse(iconsObj);
    has_sprite = files.some((item) => {
      let filename = item.toLocaleLowerCase().replace(/_/g, "-");
      return !iconsObj[filename];
    });
    if (has_sprite) {
      fs.writeFileSync(
        resolve("./src/assets/imgs.json"),
        JSON.stringify(icons, null, 2)
      );
    }
  } catch (error) {
    fs.writeFileSync(
      resolve("./src/assets/imgs.json"),
      JSON.stringify(icons, null, 2)
    );
    has_sprite = true;
  }
}
// 雪碧图样式处理模板
const SpritesmithTemplate = function (data) {
  // pc
  let icons = {};
  let tpl = `.ico {
    background-image: url(${data.sprites[0].image});
    background-size: ${data.spritesheet.width}px ${data.spritesheet.height}px;
  }`;

  data.sprites.forEach((sprite) => {
    const name = "" + sprite.name.toLocaleLowerCase().replace(/_/g, "-");
    icons[`${name}.png`] = true;
    tpl = `${tpl}
    .ico-${name}{
      width: ${sprite.width}px;
      height: ${sprite.height}px;
      background-position: ${sprite.offset_x}px ${sprite.offset_y}px;
    }
    `;
  });
  return tpl;
};
module.exports = {
  lintOnSave: false,
  publicPath: "/",
  outputDir: "dist",
  devServer: {
    disableHostCheck: true,
  },
  productionSourceMap: false,
  configureWebpack: (config) => {
    config.plugins.push(
      new CompressionWebpackPlugin({
        filename: "[path].gz[query]",
        algorithm: "gzip",
        test: new RegExp("\\.(" + productionGzipExtensions.join("|") + ")$"),
        threshold: 1024, // 只有大小大于该值的资源会被处理,当前配置为对于超过1k的数据进行处理，不足1k的可能会越压缩越大
        minRatio: 0.99, // 只有压缩率小于这个值的资源才会被处理
        deleteOriginalAssets: true, // 删除原文件
      })
    );
    //如果是生产环境，采用CDN加载模式
    config.optimization = {
      splitChunks: {
        minSize: 10000,
        maxSize: 200000,
      },
    };
    if (isProduction) {
      Object.assign(config, {
        externals: cdnModule.externals,
      });
    }
    const plugins = [];
    if (has_sprite) {
      // 生成雪碧图
      plugins.push(
        new SpritesmithPlugin({
          src: {
            cwd: path.resolve(__dirname, "./src/assets/imgs/"), // 图标根路径
            glob: "**/*.png", // 匹配任意 png 图标
          },
          target: {
            image: path.resolve(__dirname, "./src/assets/sprites.png"), // 生成雪碧图目标路径与名称
            // 设置生成CSS背景及其定位的文件或方式
            css: [
              [
                path.resolve(__dirname, "./src/assets/sprites.scss"),
                {
                  format: "function_based_template",
                },
              ],
            ],
          },
          customTemplates: {
            function_based_template: SpritesmithTemplate,
          },
          apiOptions: {
            cssImageRef: "~@/assets/sprites.png", // css文件中引用雪碧图的相对位置路径配置
          },
          spritesmithOptions: {
            padding: 2,
          },
        })
      );
    }
    config.plugins = [...config.plugins, ...plugins];
  },
  chainWebpack: (config) => {
    //如果是生产环境，采用CDN加载模式在index.html写入script
    if (isProduction) {
      config.plugin("html").tap((args) => {
        args[0].cdnConfig = cdnModule.externalsJsArr;
        return args;
      });
    }
    config.resolve.alias.set("@", resolve("src")); // key,value自行定义，比如.set('@@', resolve('src/components'))
    config.cache(true); // 开启缓存，加快项目启动，如果不需要可删除
  },
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {},
          javascriptEnabled: true,
        },
      },
      scss: {
        prependData: `@import "@/assets/css/variables.scss";`, // 为每个scss文件，自动添加变量，不用每次导入。scss必须分号结尾
      },
    },
  },
};
