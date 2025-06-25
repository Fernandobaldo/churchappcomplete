import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import api from '../api/api'

export default function AddTransactionScreen({ navigation }: any) {
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState<'entry' | 'exit'>('entry')

    const handleSubmit = async () => {
        await api.post('/finances', {
            title,
            amount: parseFloat(amount),
            type,
        })
        navigation.goBack()
    }

    return (
        <View style={styles.container}>
            <Text>Título</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />

            <Text>Valor</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />

            <Text>Tipo</Text>
            <View style={styles.typeButtons}>
                <Button title="Entrada" onPress={() => setType('entry')} color={type === 'entry' ? '#4CAF50' : '#888'} />
                <Button title="Gasto" onPress={() => setType('exit')} color={type === 'exit' ? '#F44336' : '#888'} />
            </View>

            <Button title="Salvar Transação" onPress={handleSubmit} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    input: { borderWidth: 1, padding: 10, marginBottom: 12 },
    typeButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
})
