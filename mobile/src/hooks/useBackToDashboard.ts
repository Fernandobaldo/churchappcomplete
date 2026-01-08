import { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'

/**
 * Hook que intercepta o gesto de voltar e navega para o Dashboard
 * quando não há página anterior na pilha de navegação
 */
export function useBackToDashboard() {
    const navigation = useNavigation()

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            // Verifica se está dentro de um TabNavigator
            const parent = navigation.getParent()
            
            if (parent) {
                // Se está dentro de um TabNavigator, verifica se o parent pode voltar
                const parentCanGoBack = parent.canGoBack()
                
                // Se o parent não pode voltar (não há página anterior no Stack Navigator),
                // intercepta e navega para o Dashboard
                if (!parentCanGoBack) {
                    // Previne a navegação padrão
                    e.preventDefault()
                    
                    // Navega para "Página Inicial" dentro do TabNavigator
                    navigation.navigate('Página Inicial' as never)
                }
            } else {
                // Se não está dentro de um TabNavigator, verifica se pode voltar
                const canGoBack = navigation.canGoBack()
                
                // Se não pode voltar, intercepta e navega para Main
                if (!canGoBack) {
                    // Previne a navegação padrão
                    e.preventDefault()
                    
                    // Navega para Main (TabNavigator)
                    navigation.navigate('Main' as never)
                }
            }
        })

        return unsubscribe
    }, [navigation])
}

