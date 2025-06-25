import React from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'

const roles = [
    { title: 'ADM GERAL', description: 'Acesso total a todas as filiais da igreja.' },
    { title: 'ADM FILIAL', description: 'Gerencia toda a filial, permissões e dados.' },
    { title: 'COORDENADOR', description: 'Permissões específicas atribuídas pelo ADM.' },
    { title: 'MEMBRO', description: 'Acesso básico à plataforma e conteúdos públicos.' },
]

export default function PermissionsScreen() {
    const navigation = useNavigation()

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Hierarquia da Igreja</Text>

            <FlatList
                data={roles}
                keyExtractor={(item) => item.title}
                renderItem={({ item }) => (
                    <View style={styles.roleCard}>
                        <Text style={styles.roleTitle}>{item.title}</Text>
                        <Text>{item.description}</Text>
                    </View>
                )}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('ManagePermissions')}
            >
                <Text style={styles.buttonText}>Gerenciar Permissões</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    roleCard: { marginBottom: 15 },
    roleTitle: { fontWeight: 'bold', fontSize: 16 },
    button: {
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
})
