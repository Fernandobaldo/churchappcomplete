import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import api from '../api/api'

export default function AddNoticeScreen({ navigation }: any) {
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')

    const handleSubmit = async () => {
        await api.post('/notices', { title, message })
        navigation.goBack()
    }

    return (
        <View style={styles.container}>
            <Text>Título do Aviso</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />

            <Text>Mensagem</Text>
            <TextInput
                style={[styles.input, { height: 120 }]}
                multiline
                value={message}
                onChangeText={setMessage}
            />

            <Button title="Publicar Aviso" onPress={handleSubmit} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    input: { borderWidth: 1, padding: 10, marginBottom: 12 },
})
