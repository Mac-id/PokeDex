import { createApp } from 'vue';
import { createPinia } from 'pinia'; // Pinia importieren
import App from './components/App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia(); // Pinia-Instanz erstellen

app.use(pinia); // Pinia in der App registrieren
app.use(router);
app.mount('#app');