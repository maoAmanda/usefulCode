import cn from "./cn.js";
import en from "./en.js";
const messages = {
  cn: {
    ...cn,
  },
  en: {
    ...en,
  },
};
import Vue from "vue";
import VueI18n from "vue-i18n";
Vue.use(VueI18n);

import axios from "axios";
import Storage from "@/assets/js/storage";
const lang = Storage.get("lang", true);
export const i18n = new VueI18n({
  locale: lang || "cn",
  fallbackLocale: "cn",
  messages, // 语言包
  silentTranslationWarn: true, // 隐藏警告
});

loadFont(lang);
setI18nLanguage(lang);
setLang(lang);

function setI18nLanguage(lang) {
  i18n.locale = lang;
  axios.defaults.headers.common["Accept-Language"] = lang; // 设置请求头部
  axios.defaults.headers.hl = lang;
  document.querySelector("html").setAttribute("lang", lang); // 根元素增加lang属性
  return lang;
}

function loadFont(lang) {
  if (lang === "cn") {
    document.body.style.fontFamily = "NotoSansCJKsc";
  } else {
    document.body.style.fontFamily = "Open Sans";
  }
}

function setLang(lang) {
  Storage.set("lang", lang, true);
  setI18nLanguage(lang);
  loadFont(lang);
}
