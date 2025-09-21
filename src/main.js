import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import VueLazyload from 'vue-lazyload'

createApp(App).use(router).use(VueLazyload, {
  preLoad: 2,
  // error: 'https://via.placeholder.com/150?text=Error',
  // loading: 'https://via.placeholder.com/150?text=Loading',
  attempt: 1
}).mount('#app')
