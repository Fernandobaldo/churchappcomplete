import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native'
import { useRoute } from '@react-navigation/native'

export default function ContributionDetailScreen() {
    const route = useRoute()
    const { contribution } = route.params || {}
    if (!contribution) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'red' }}>Erro: contribuição não encontrada.</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{contribution.title}</Text>
            <Text style={styles.subtitle}>{contribution.description}</Text>

            <View style={styles.stats}>
                <View>
                    <Text style={styles.label}>Objetivo</Text>
                    <Text style={styles.amount}>${Number(contribution.goal || 0).toLocaleString('en-US')}</Text>
                </View>
                <View>
                    <Text style={styles.label}>Alcançado</Text>
                    <Text style={styles.amount}>${Number(contribution.raised || 0).toLocaleString('en-US')}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Formas de contribuir</Text>

            <View style={styles.card}>
                <Text style={styles.methodTitle}>QR Code PIX</Text>
                <Text style={styles.text}>Banco: {contribution.bankName || '123 Bank'}</Text>
                <Text style={styles.text}>Agencia: {contribution.agency || '45678'}</Text>
                <Image
                    source={{ uri: contribution.qrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PIX' }}
                    style={styles.qrCode}
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.methodTitle}>Transferencia Bancaria</Text>
                <Text style={styles.text}>Banco: {contribution.bankName || '123 Bank'}</Text>
                <Text style={styles.text}>Agencia: {contribution.agency || '45678'}</Text>
                <Text style={styles.text}>Nome da conta: {contribution.accountName || 'First Church'}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.methodTitle}>Link para pagamento</Text>
                <TouchableOpacity onPress={() => Linking.openURL(contribution.paymentLink || 'https://example.com')}>
                    <Text style={styles.link}>Faça uma contribuição online</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.proofButton}>
                <Text style={styles.proofText}>Já contribuiu? Enviar comprovante</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
        marginBottom: 30,
    },
    label: {
        color: '#666',
        fontSize: 14,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
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
    },
    text: {
        color: '#444',
        marginBottom: 4,
    },
    qrCode: {
        width: 120,
        height: 120,
        marginTop: 12,
        alignSelf: 'center',
    },
    link: {
        color: '#3366FF',
        marginTop: 8,
    },
    proofButton: {
        backgroundColor: '#f1f1f1',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    proofText: {
        color: '#444',
        fontWeight: '500',
    },
})
