import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Clipboard, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { authService } from '../services/auth.service'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { colors } from '../theme/colors'

export default function InviteLinkScreen() {
    const [branchId, setBranchId] = useState('')
    const [inviteLink, setInviteLink] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchUserData = useCallback(async () => {
        try {
            setError(null)
            const user = await authService.getMe()
            setBranchId(user.branchId || '')
        } catch (err: any) {
            console.error('Erro ao carregar dados do usuário:', err)
            setError(err.response?.data?.message || 'Erro ao carregar dados')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUserData()
    }, [fetchUserData])

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchUserData().finally(() => setLoading(false))
    }, [fetchUserData])

    const generateLink = () => {
        if (!branchId) {
            Alert.alert('Erro', 'ID da filial não encontrado')
            return
        }
        const base = 'https://app.igreja.com/register'
        const full = `${base}?branchId=${branchId}`
        setInviteLink(full)
        Clipboard.setString(full)
        Alert.alert('Link copiado para a área de transferência!')
    }

    return (
        <ViewScreenLayout
            headerProps={{
                title: "Convidar Novo Membro",
                Icon: FontAwesome5,
                iconName: "user-plus",
            }}
            loading={loading}
            error={error}
            onRetry={handleRetry}
        >
            <View style={styles.container}>
                <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
                    <Text style={styles.title}>Gerar Link de Convite</Text>
                    <Text style={styles.description}>
                        Gere um link de convite para que novos membros possam se cadastrar na sua filial.
                    </Text>
                    
                    <TouchableOpacity
                        onPress={generateLink}
                        style={styles.button}
                        activeOpacity={0.8}
                        disabled={!branchId}
                    >
                        <LinearGradient
                            colors={branchId ? (colors.gradients.primary as [string, string]) : ['#94A3B8', '#94A3B8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>Gerar Link de Cadastro</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {inviteLink && (
                        <View style={styles.linkContainer}>
                            <Text style={styles.linkLabel}>Link gerado:</Text>
                            <Text style={styles.link} selectable>{inviteLink}</Text>
                        </View>
                    )}
                </GlassCard>
            </View>
        </ViewScreenLayout>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    card: {
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: colors.text.secondary,
        marginBottom: 24,
        lineHeight: 24,
    },
    button: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    buttonGradient: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    linkContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: colors.glass.overlay,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    linkLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: 8,
    },
    link: {
        fontSize: 14,
        color: colors.text.primary,
        fontFamily: 'monospace',
    },
})
