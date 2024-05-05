import Vue from 'vue'
import App from './components/App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'
import track from '../util/track.js'
Vue.prototype.$track = track;

import '../assets/font/iconfont.css'

Vue.use(ElementUI)


Vue.prototype.axios = axios
// 添加响应拦截器
axios.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    return Promise.reject(error);
});


axios.defaults.baseURL="http://localhost:8082"
//axios.defaults.baseURL="http://39.106.72.202"

new Vue({
    el: '#app',
    App,
    render: h => h(App)
})
