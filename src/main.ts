// Importiere die Funktion zum Erstellen der Vue-Anwendung
import { createApp } from 'vue';
// Importiere die Hauptkomponente der App
import App from './components/App.vue';
// Importiere den Vue-Router für die Navigation
import router from './router';

// Erstelle die Vue-Anwendung mit der Hauptkomponente `App`
// Binde den Router ein, damit Routing funktioniert
// Und mounte die App an das HTML-Element mit der ID "app"
createApp(App)
  .use(router)
  .mount('#app');
