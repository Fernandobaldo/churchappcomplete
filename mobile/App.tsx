import React from 'react'
import AppNavigator from './src/navigation/AppNavigator'
import Toast from 'react-native-toast-message'
import { toastConfig } from './src/toastConfig'




export default function App() {
  return (
      <>
        {/* Seu NavigationContainer ou Stack Navigator */}
        <AppNavigator />

        {/* Toast Global */}
        <Toast config={toastConfig} />
      </>
  )
}