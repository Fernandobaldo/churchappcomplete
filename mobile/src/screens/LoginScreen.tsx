import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import api, { setToken } from "../api/api"


export default function LoginScreen() {
    const navigation = useNavigation()
    const setUserFromToken = useAuthStore((s) => s.setUserFromToken)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async () => {
        try {
            const res = await api.post('/auth/login', {
                email,
                password,
            })
            const token = res.data.token

            setToken(token)
            setUserFromToken(token)

            navigation.navigate('Main')
        } catch (err: any) {
            console.log('Erro de login:', JSON.stringify(err, null, 2))
            console.log('Erro de login:', err?.response?.data || err.message)
            alert('Erro ao fazer login')
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder="E-mail"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Senha"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <Button title="Entrar" onPress={handleLogin} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1, justifyContent: 'center', padding: 20
    },
    title: {
        fontSize: 28, marginBottom: 20, textAlign: 'center'
    },
    input: {
        borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 16
    }
})
