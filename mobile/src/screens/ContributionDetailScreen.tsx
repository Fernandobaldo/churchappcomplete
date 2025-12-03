import React from 'react'
import { View, Text, StyleSheet, ScrollView, Image, Linking } from 'react-native'
import { useRoute } from '@react-navigation/native'

interface PaymentMethod {
    id: string
    type: string
    data: Record<string, any>
}

export default function ContributionDetailScreen() {
    const route = useRoute()
    const { contribution } = route.params || {}
    
    if (!contribution) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'red' }}>Erro: campanha não encontrada.</Text>
            </View>
        )
    }

    const getPaymentMethodLabel = (type: string) => {
        const labels: Record<string, string> = {
            PIX: 'PIX',
            CONTA_BR: 'Conta Bancária Brasileira',
            IBAN: 'IBAN',
        }
        return labels[type] || type
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>{contribution.title}</Text>
            {contribution.description && (
                <Text style={styles.subtitle}>{contribution.description}</Text>
            )}

            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={styles.label}>Meta</Text>
                    <Text style={styles.amount}>
                        {contribution.goal 
                            ? `R$ ${contribution.goal.toFixed(2).replace('.', ',')}`
                            : 'Sem meta'
                        }
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.label}>Arrecadado</Text>
                    <Text style={[styles.amount, styles.raisedAmount]}>
                        R$ {(contribution.raised || 0).toFixed(2).replace('.', ',')}
                    </Text>
                </View>
            </View>

            {contribution.endDate && (
                <View style={styles.dateContainer}>
                    <Text style={styles.label}>Data de Término</Text>
                    <Text style={styles.dateText}>
                        {new Date(contribution.endDate).toLocaleDateString('pt-BR')}
                    </Text>
                </View>
            )}

            {contribution.PaymentMethods && contribution.PaymentMethods.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Formas de Pagamento</Text>

                    {contribution.PaymentMethods.map((pm: PaymentMethod) => (
                        <View key={pm.id} style={styles.card}>
                            <Text style={styles.methodTitle}>{getPaymentMethodLabel(pm.type)}</Text>
                            
                            {pm.type === 'PIX' && (
                                <>
                                    {pm.data.chave && (
                                        <Text style={styles.text}>Chave: {pm.data.chave}</Text>
                                    )}
                                    {pm.data.qrCodeUrl && (
                                        <>
                                            <Image
                                                source={{ uri: pm.data.qrCodeUrl }}
                                                style={styles.qrCode}
                                            />
                                            <Text 
                                                style={styles.link}
                                                onPress={() => Linking.openURL(pm.data.qrCodeUrl)}
                                            >
                                                Abrir QR Code
                                            </Text>
                                        </>
                                    )}
                                </>
                            )}

                            {pm.type === 'CONTA_BR' && (
                                <>
                                    {pm.data.banco && (
                                        <Text style={styles.text}>Banco: {pm.data.banco}</Text>
                                    )}
                                    {pm.data.agencia && (
                                        <Text style={styles.text}>Agência: {pm.data.agencia}</Text>
                                    )}
                                    {pm.data.conta && (
                                        <Text style={styles.text}>Conta: {pm.data.conta}</Text>
                                    )}
                                    {pm.data.tipo && (
                                        <Text style={styles.text}>Tipo: {pm.data.tipo}</Text>
                                    )}
                                </>
                            )}

                            {pm.type === 'IBAN' && (
                                <>
                                    {pm.data.iban && (
                                        <Text style={styles.text}>IBAN: {pm.data.iban}</Text>
                                    )}
                                    {pm.data.banco && (
                                        <Text style={styles.text}>Banco: {pm.data.banco}</Text>
                                    )}
                                    {pm.data.nome && (
                                        <Text style={styles.text}>Titular: {pm.data.nome}</Text>
                                    )}
                                </>
                            )}
                        </View>
                    ))}
                </>
            )}

            {(!contribution.PaymentMethods || contribution.PaymentMethods.length === 0) && (
                <View style={styles.card}>
                    <Text style={styles.text}>Nenhuma forma de pagamento cadastrada.</Text>
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
        paddingTop: 30,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 6,
        paddingTop: 50,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
    },
    label: {
        color: '#666',
        fontSize: 14,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
        color: '#333',
    },
    raisedAmount: {
        color: '#22c55e',
    },
    dateContainer: {
        marginBottom: 20,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
        color: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 10,
    },
    card: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#3366FF',
    },
    text: {
        color: '#444',
        marginBottom: 4,
        fontSize: 14,
    },
    qrCode: {
        width: 150,
        height: 150,
        marginTop: 12,
        marginBottom: 8,
        alignSelf: 'center',
    },
    link: {
        color: '#3366FF',
        marginTop: 8,
        textDecorationLine: 'underline',
    },
})
