// ===================================
// FIREBASE CONFIGURATION
// Reemplaza a Supabase - Configuración centralizada
// ===================================

// ⚠️ ANTES DE USAR:
// 1. Crea un proyecto en https://console.firebase.google.com
// 2. Activa: Authentication (Email), Firestore Database, Storage
// 3. Copia tu firebaseConfig desde Project Settings
// 4. Actualiza los valores abajo:

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias globales
const firebaseAuth = firebase.auth();
const firebaseDb = firebase.firestore();
const firebaseStorage = firebase.storage();

// Exportar para uso en otros scripts
window.firebase = {
    auth: firebaseAuth,
    db: firebaseDb,
    storage: firebaseStorage,
    config: firebaseConfig
};

console.log('✅ Firebase inicializado correctamente');
