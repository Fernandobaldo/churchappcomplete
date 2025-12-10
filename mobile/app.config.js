module.exports = {
  expo: {
    name: "mobile",
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
      // URL da API - pode ser sobrescrita por variável de ambiente do sistema
      // Para desenvolvimento local, use: http://SEU_IP_LOCAL:3333
      // Para produção/staging, use a URL do Render
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://churchapp-backend-dev.onrender.com",
    }
  }
};
