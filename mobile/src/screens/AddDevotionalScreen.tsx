import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import api from '../api/api'

export default function AddDevotionalScreen({ navigation }: any) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [date, setDate] = useState('')

    const handleSave = async (isDraft = false) => {
        await api.post('/devotionals', {
            title,
            content,
            date,
            isDraft,
        })
        navigation.goBack()
    }

    return (
        <View style={styles.container}>
            <Text>Título</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />

            <Text>Data (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} />

            <Text>Conteúdo</Text>
            <TextInput
                style={[styles.input, { height: 120 }]}
                value={content}
                onChangeText={setContent}
                multiline
            />

            <Button title="Salvar como Rascunho" onPress={() => handleSave(true)} />
            <Button title="Publicar" onPress={() => handleSave(false)} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    input: { borderWidth: 1, padding: 10, marginBottom: 12 },
})
