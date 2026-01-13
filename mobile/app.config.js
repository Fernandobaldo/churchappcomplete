require('dotenv').config()
module.exports = {
  expo: {
    name: "Conecta Church",
    slug: "mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false, // Desabilitar para compatibilidade com Expo Go
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    // Configurações de desenvolvimento
    packagerOpts: {
      host: "0.0.0.0"
    },
    // Variáveis de ambiente
    extra: {
      // URL da API - prioridade: EXPO_PUBLIC_API_URL > fallback
      // O Expo SDK 54+ expõe automaticamente variáveis EXPO_PUBLIC_* para o código
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3333",
    }
  }
};
