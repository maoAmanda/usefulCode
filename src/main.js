import Vue from "vue";
import App from "./App.vue";

Vue.config.productionTip = false;
import { i18n } from "./lang/index";
new Vue({
  i18n,
  render: (h) => h(App),
}).$mount("#app");
