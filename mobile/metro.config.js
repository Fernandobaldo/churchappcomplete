// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurações para melhorar a conexão de rede
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return middleware;
  },
  // Forçar Metro a escutar em todas as interfaces (0.0.0.0)
  port: 8081,
};

// Configurações de transformação
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;


