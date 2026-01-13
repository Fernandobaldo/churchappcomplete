import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, Image, Linking, TouchableOpacity, Clipboard } from 'react-native'
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import DetailScreenLayout from '../components/layouts/DetailScreenLayout'
import GlassCard from '../components/GlassCard'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { colors } from '../theme/colors'
import { useAuthStore } from '../stores/authStore'
import Toast from 'react-native-toast-message'
import api from '../api/api'

interface PaymentMethod {
    id: string
    type: string
    data: Record<string, any>
}

export default function ContributionDetailScreen() {
    const route = useRoute()
    const navigation = useNavigation()
    const { contribution: initialContribution } = (route.params as { contribution?: any }) || {}
    const { user } = useAuthStore()
    const [contribution, setContribution] = useState(initialContribution)
    const [loading, setLoading] = useState(!initialContribution)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const fetchContribution = useCallback(async () => {
        if (!initialContribution?.id) {
            setError('Contribuição não encontrada')
            setLoading(false)
            return
        }
        try {
            setError(null)
            const response = await api.get(`/contributions/${initialContribution.id}`)
            setContribution(response.data)
        } catch (err: any) {
            console.error('Erro ao carregar detalhes da contribuição:', err)
            const errorMessage = err.response?.data?.message || 'Não foi possível carregar os detalhes da contribuição.'
            setError(errorMessage)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [initialContribution?.id])

    useEffect(() => {
        if (initialContribution?.id) {
            fetchContribution()
        } else {
            setLoading(false)
            setError('Contribuição não encontrada')
        }
    }, [initialContribution?.id, fetchContribution])

    // Recarrega quando a tela recebe foco (após editar)
    useFocusEffect(
        useCallback(() => {
            if (initialContribution?.id && !loading && !refreshing) {
                fetchContribution()
            }
        }, [initialContribution?.id, fetchContribution, loading, refreshing])
    )

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        fetchContribution()
    }, [fetchContribution])

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchContribution().finally(() => setLoading(false))
    }, [fetchContribution])

    const isEmpty = !loading && !contribution && !error

    const getPaymentMethodLabel = (type: string) => {
        const labels: Record<string, string> = {
            PIX: 'PIX',
            CONTA_BR: 'Conta Bancária Brasileira',
            IBAN: 'IBAN',
        }
        return labels[type] || type
    }

    const handleCopyToClipboard = (text: string, label: string) => {
        Clipboard.setString(text)
        Toast.show({
            type: 'success',
            text1: 'Copiado!',
            text2: `${label} copiado para a área de transferência`,
        })
    }

    const renderCopyableField = (label: string, value: string) => {
        if (!value) return null
        return (
            <View style={styles.fieldRow}>
                <View style={styles.fieldContent}>
                    <Text style={styles.fieldLabel}>{label}:</Text>
                    <Text style={styles.fieldValue}>{value}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleCopyToClipboard(value, label)}
                    style={styles.copyButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="copy-outline" size={20} color={colors.gradients.primary[1]} />
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <DetailScreenLayout
            headerProps={{
                title: "Detalhes da Contribuição",
                Icon: FontAwesome5,
                iconName: "heart",
            }}
            loading={loading}
            error={error}
            empty={isEmpty}
            emptyTitle="Contribuição não encontrada"
            emptySubtitle="A contribuição solicitada não existe ou foi removida"
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onRetry={handleRetry}
        >
            {contribution && (
                <>
                    <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.titleCard}>
                        <Text style={styles.title}>{contribution.title}</Text>
                    </GlassCard>

            {contribution.description && (
                <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.descriptionCard}>
                    <Text style={styles.subtitle}>{contribution.description}</Text>
                </GlassCard>
            )}

            <View style={styles.stats}>
                <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.statCard}>
                    <Text style={styles.label}>Meta</Text>
                    <Text style={styles.amount}>
                        {contribution.goal 
                            ? `R$ ${contribution.goal.toFixed(2).replace('.', ',')}`
                            : 'Sem meta'
                        }
                    </Text>
                </GlassCard>
                <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.statCard}>
                    <Text style={styles.label}>Arrecadado</Text>
                    <Text style={[styles.amount, styles.raisedAmount]}>
                        R$ {(contribution.raised || 0).toFixed(2).replace('.', ',')}
                    </Text>
                </GlassCard>
            </View>

            {contribution.endDate && (
                <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.dateCard}>
                    <Text style={styles.label}>Data de Término</Text>
                    <Text style={styles.dateText}>
                        {new Date(contribution.endDate).toLocaleDateString('pt-BR')}
                    </Text>
                </GlassCard>
            )}

            {contribution.PaymentMethods && contribution.PaymentMethods.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Formas de Pagamento</Text>

                    {contribution.PaymentMethods.map((pm: PaymentMethod) => (
                        <GlassCard key={pm.id} opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
                            <Text style={styles.methodTitle}>{getPaymentMethodLabel(pm.type)}</Text>
                            
                            {pm.type === 'PIX' && (
                                <>
                                    {renderCopyableField('Chave', pm.data.chave)}
                                    {pm.data.qrCodeUrl && (
                                        <>
                                            <Image
                                                source={{ uri: pm.data.qrCodeUrl }}
                                                style={styles.qrCode}
                                            />
                                            <TouchableOpacity
                                                onPress={() => Linking.openURL(pm.data.qrCodeUrl)}
                                            >
                                                <Text style={styles.link}>
                                                    Abrir QR Code
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </>
                            )}

                            {pm.type === 'CONTA_BR' && (
                                <>
                                    {renderCopyableField('Banco', pm.data.banco)}
                                    {renderCopyableField('Agência', pm.data.agencia)}
                                    {renderCopyableField('Conta', pm.data.conta)}
                                    {pm.data.tipo && (
                                        <View style={styles.fieldRow}>
                                            <View style={styles.fieldContent}>
                                                <Text style={styles.fieldLabel}>Tipo:</Text>
                                                <Text style={styles.fieldValue}>{pm.data.tipo}</Text>
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}

                            {pm.type === 'IBAN' && (
                                <>
                                    {renderCopyableField('IBAN', pm.data.iban)}
                                    {renderCopyableField('Banco', pm.data.banco)}
                                    {renderCopyableField('Titular', pm.data.nome)}
                                </>
                            )}
                        </GlassCard>
                    ))}
                </>
            )}

                    {(!contribution.PaymentMethods || contribution.PaymentMethods.length === 0) && (
                        <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.card}>
                            <Text style={styles.text}>Nenhuma forma de pagamento cadastrada.</Text>
                        </GlassCard>
                    )}
                </>
            )}
        </DetailScreenLayout>
    )
}

const styles = StyleSheet.create({
    titleCard: {
        padding: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
        color: '#0F172A',
        textAlign: 'center',
    },
    descriptionCard: {
        padding: 20,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#475569',
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingVertical: 8,
    },
    fieldContent: {
        flex: 1,
        marginRight: 12,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        color: '#475569',
        marginBottom: 4,
    },
    fieldValue: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#0F172A',
    },
    copyButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: colors.glass.overlay,
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
        alignItems: 'stretch',
    },
    statCard: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
    },
    label: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        color: '#475569',
        marginBottom: 8,
        textAlign: 'center',
        width: '100%',
    },
    amount: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
        color: '#0F172A',
        textAlign: 'center',
        width: '100%',
    },
    raisedAmount: {
        color: colors.status.success,
    },
    dateCard: {
        padding: 20,
        marginBottom: 16,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
        marginBottom: 12,
        marginTop: 8,
        paddingHorizontal: 16,
    },
    card: {
        padding: 20,
        marginBottom: 16,
        marginHorizontal: 16,
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        marginBottom: 12,
        color: colors.gradients.primary[1],
    },
    text: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        color: '#0F172A',
        marginBottom: 8,
    },
    qrCode: {
        width: 150,
        height: 150,
        marginTop: 12,
        marginBottom: 8,
        alignSelf: 'center',
    },
    link: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        color: colors.gradients.primary[1],
        marginTop: 8,
        textDecorationLine: 'underline',
    },
})
