// Sistema de tipografia para estilo Glassmorphism Moderno
// Tipografia moderna, elegante e emocional

export const typography = {
  // Família de fontes
  fontFamily: {
    regular: 'System', // Inter ou Poppins quando disponível
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    light: 'System',
  },

  // Tamanhos de fonte
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },

  // Pesos de fonte
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },

  // Line heights (espaçamento entre linhas generoso)
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2.0,
  },

  // Estilos pré-definidos
  styles: {
    // Títulos grandes e leves
    h1: {
      fontSize: 32,
      fontWeight: '600' as const,
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600' as const,
      lineHeight: 1.3,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 1.4,
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 1.5,
    },
    
    // Subtítulos
    subtitle: {
      fontSize: 18,
      fontWeight: '500' as const,
      lineHeight: 1.5,
    },
    subtitleSmall: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 1.5,
    },
    
    // Texto corpo
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.75,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.75,
    },
    
    // Texto secundário
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.6,
    },
    captionSmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.6,
    },
    
    // Botões
    button: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 1.5,
      letterSpacing: 0.2,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 1.5,
    },
    
    // Labels
    label: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 1.5,
    },
    labelSmall: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 1.5,
    },
  },
}

export default typography


