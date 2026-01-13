import { registerRootComponent } from 'expo';

import App from './App';

// Log de debug das variáveis de ambiente (apenas em desenvolvimento)
if (__DEV__) {
  console.log('🔍 [ENV DEBUG] ====================')
  console.log('🔍 [ENV DEBUG] Variáveis EXPO_PUBLIC_* disponíveis:')
  const expoPublicVars = Object.keys(process.env)
    .filter(key => key.startsWith('EXPO_PUBLIC_'))
    .reduce((obj, key) => {
      obj[key] = process.env[key]
      return obj
    }, {} as Record<string, string | undefined>)
  
  if (Object.keys(expoPublicVars).length === 0) {
    console.warn('⚠️ [ENV DEBUG] Nenhuma variável EXPO_PUBLIC_* encontrada')
    console.warn('⚠️ [ENV DEBUG] Verifique se o arquivo .env existe e contém EXPO_PUBLIC_API_URL')
  } else {
    Object.entries(expoPublicVars).forEach(([key, value]) => {
      console.log(`  ${key} = ${value}`)
    })
  }
  console.log('🔍 [ENV DEBUG] ====================')
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
