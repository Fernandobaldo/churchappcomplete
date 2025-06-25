import React, { useEffect, useState } from 'react'
import { View, Text, Button, StyleSheet, Clipboard, Alert } from 'react-native'
import api from '../api/api'

export default function InviteLinkScreen() {
    const [branchId, setBranchId] = useState('')
    const [inviteLink, setInviteLink] = useState('')

    useEffect(() => {
        // Supondo que /auth/me retorna filial atual
        api.get('/auth/me').then(res => {
            setBranchId(res.data.branchId)
        })
    }, [])

    const generateLink = () => {
        const base = 'https://app.igreja.com/register'
        const full = `${base}?branchId=${branchId}`
        setInviteLink(full)
        Clipboard.setString(full)
        Alert.alert('Link copiado para a área de transferência!')
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Convidar Novo Membro</Text>
            <Button title="Gerar Link de Cadastro" onPress={generateLink} />
            {inviteLink && (
                <Text style={styles.link}>Link: {inviteLink}</Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    link: { marginTop: 20, fontSize: 14, color: '#333' },
})
