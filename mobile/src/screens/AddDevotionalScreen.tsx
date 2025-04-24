import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'
import api from '../api/api'

export default function AddDevotionalScreen() {
    const [title, setTitle] = useState('')
    const [passage, setPassage] = useState('')
    const [content, setContent] = useState('')
    const [author, setAuthor] = useState('')
    const [date, setDate] = useState(new Date())
    const [showDate, setShowDate] = useState(false)

    const navigation = useNavigation()

    const handleSubmit = async () => {
        try {
            await api.post('/devotionals', {
                title,
                passage,
                content,
                author,
                date: date.toISOString(),
            })

            Alert.alert('Sucesso', 'Devocional criado com sucesso')
            navigation.goBack()
        } catch (err) {
            console.error('Erro ao criar devocional:', err)
            Alert.alert('Erro', 'Não foi possível criar o devocional.')
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Título</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />

            <Text style={styles.label}>Passagem</Text>
            <TextInput style={styles.input} value={passage} onChangeText={setPassage} />

            <Text style={styles.label}>Conteúdo</Text>
            <TextInput
                style={[styles.input, { height: 100 }]}
                value={content}
                onChangeText={setContent}
                multiline
            />

            <Text style={styles.label}>Autor</Text>
            <TextInput style={styles.input} value={author} onChangeText={setAuthor} />

            <Text style={styles.label}>Data</Text>
            <TouchableOpacity onPress={() => setShowDate(true)} style={styles.dateInput}>
                <Text>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showDate && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                        setShowDate(false)
                        if (selectedDate) setDate(selectedDate)
                    }}
                />
            )}

            <Button title="Salvar Devocional" onPress={handleSubmit} />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 60,
    },
    label: {
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
    },
})
