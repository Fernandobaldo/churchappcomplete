import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image, Button, Linking, Alert } from 'react-native'
import api from '../api/api'

export default function ContributionDetailScreen({ route }: any) {
    const { id } = route.params
    const [data, setData] = useState<any>({})

    useEffect(() => {
        api.get(`/contributions/${id}`).then(res => setData(res.data))
    }, [])

    const handleComprovante = () => {
        Alert.alert('Comprovante enviado!', 'Obrigado pela contribuição.')
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.reason}>{data.reason}</Text>

            <Text style={styles.sub}>Meta: R$ {data.goal?.toFixed(2) || '---'}</Text>
            <Text style={styles.sub}>Arrecadado: R$ {data.collected?.toFixed(2) || '---'}</Text>

            <Text style={styles.section}>PIX (QR Code):</Text>
            <Image
                source={{ uri: data.qrCodeUrl || 'https://via.placeholder.com/150' }}
                style={{ height: 150, width: 150, marginBottom: 10 }}
            />

            <Text style={styles.section}>Dados Bancários:</Text>
            <Text>{data.bankInfo || 'Banco XPTO - Agência 0001 - Conta 123456-7'}</Text>

            <Text style={styles.section}>Link de Pagamento:</Text>
            <Text style={styles.link} onPress={() => Linking.openURL(data.paymentLink)}>
                {data.paymentLink}
            </Text>

            <Button title="Enviar Comprovante" onPress={handleComprovante} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold' },
    reason: { marginBottom: 20 },
    sub: { fontWeight: 'bold', marginBottom: 4 },
    section: { marginTop: 20, fontWeight: 'bold' },
    link: { color: 'blue', textDecorationLine: 'underline', marginBottom: 20 },
})
