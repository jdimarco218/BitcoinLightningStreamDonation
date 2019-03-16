import Vue from 'vue'
import App from './App.vue'
import VueQRCodeComponent from 'vue-qrcode-component'
import VueSocketIO from 'vue-socket.io';
import 'bootstrap'; import 'bootstrap/dist/css/bootstrap.min.css';
import BootstrapVue from 'bootstrap-vue';
import VueQrcode from '@chenfengyuan/vue-qrcode';

const host = process.env.VUE_APP_SERVER_HOST || "localhost";
const port = process.env.VUE_APP_SERVER_PORT || 8081;
console.log(`Frontend port: ${port}`);
console.log(`Frontend host: ${host}`);
console.log(`Base url: ${process.env.BASE_URL}`);

Vue.component('qr-code', VueQRCodeComponent)
Vue.component(VueQrcode.name, VueQrcode);
Vue.use(BootstrapVue);

console.log(`SocketIO listening on: ${port}`);
Vue.use(new VueSocketIO({
    debug: true,
    connection: `http://${host}:${port}`,
}))

Vue.config.productionTip = false
new Vue({
  render: h => h(App),
}).$mount('#app')
