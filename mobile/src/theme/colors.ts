// Sistema de cores para estilo Glassmorphism Moderno
// Inspirado em apps de bem-estar e mental health

export const colors = {
  // Gradientes principais
  gradients: {
    primary: ['#A5B4FC', '#818CF8'], // Gradiente principal (azul suave)
    secondary: ['#C7D2FE', '#A78BFA'], // Gradiente secundário (roxo suave)
    accent: ['#F0ABFC', '#E879F9'], // Gradiente de destaque
  },

  // Cores de texto
  text: {
    primary: '#0F172A', // Texto principal (slate-900)
    secondary: '#475569', // Texto secundário (slate-600)
    tertiary: '#64748B', // Texto terciário (slate-500)
    light: '#FFFFFF', // Texto claro (branco)
    muted: '#94A3B8', // Texto desbotado (slate-400)
  },

  // Cores de estado
  status: {
    success: '#22C55E', // Verde sucesso
    warning: '#F59E0B', // Laranja atenção
    error: '#EF4444', // Vermelho erro
    info: '#3B82F6', // Azul informação
  },

  // Cores glassmorphism
  glass: {
    // Overlay branco translúcido
    overlay: 'rgba(255, 255, 255, 0.35)',
    overlayLight: 'rgba(255, 255, 255, 0.25)',
    overlayMedium: 'rgba(255, 255, 255, 0.45)',
    overlayHeavy: 'rgba(255, 255, 255, 0.55)',
    
    // Overlay escuro para contraste
    overlayDark: 'rgba(15, 23, 42, 0.15)',
    
    // Bordas glass
    border: 'rgba(255, 255, 255, 0.18)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
  },

  // Cores de fundo
  background: {
    light: '#F8FAFC', // Fundo claro
    default: '#FFFFFF', // Fundo padrão
    dark: '#0F172A', // Fundo escuro
    gradient: ['#E0E7FF', '#F3E8FF'], // Gradiente de fundo suave
  },

  // Cores de botões
  button: {
    primary: '#818CF8', // Botão primário
    secondary: '#A78BFA', // Botão secundário
    text: '#FFFFFF', // Texto do botão
    disabled: '#CBD5E1', // Botão desabilitado
  },

  // Sombras glassmorphism
  shadow: {
    glass: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.08,
      shadowRadius: 40,
      elevation: 8,
    },
    glassLight: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 4,
    },
    glassHeavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 30 },
      shadowOpacity: 0.12,
      shadowRadius: 60,
      elevation: 12,
    },
  },
}

export default colors


