import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native'
import api from '../api/api'

export default function MemberRegistrationScreen({ route }: any) {
    const { branchId } = route.params
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleRegister = async () => {
        try {
            await api.post('/auth/register', { name, email, password, branchId })
            Alert.alert('Cadastro realizado com sucesso!')
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível cadastrar.')
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Cadastro de Novo Membro</Text>

            <Text>Nome</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} />

            <Text>Senha</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

            <Button title="Cadastrar" onPress={handleRegister} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    input: { borderWidth: 1, padding: 10, marginBottom: 12 },
})
