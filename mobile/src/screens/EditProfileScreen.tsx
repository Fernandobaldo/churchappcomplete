import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import MemberForm from '../components/FormsComponent'
import PageHeader from '../components/PageHeader'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import { useNavigation } from '@react-navigation/native'



export default function EditProfileScreen() {
    const navigation = useNavigation()

    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        address: '',
        avatarUrl: '',
    })

    const fields = [
        { key: 'name', label: 'Nome completo', type: 'string' },
        { key: 'email', label: 'E-mail', type: 'email' },
        { key: 'phone', label: 'Telefone', type: 'string' },
        { key: 'birthDate', label: 'Data de nascimento', type: 'date' },
        { key: 'address', label: 'Endereço', type: 'string' },
        { key: 'avatarUrl', label: 'Foto de Perfil', type: 'image' },
    ]


    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await api.get('/members/me')
                const data = res.data
                setProfile(res.data)
                setForm({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    birthDate: data.birthDate && !isNaN(Date.parse(data.birthDate))
                        ? new Date(data.birthDate).toISOString()
                        : '',
                    address: data.address || '',
                    avatarUrl: data.avatarUrl || '',

                })
            } catch (err) {
                console.error('Erro ao carregar perfil:', err)
                Alert.alert('Erro ao carregar perfil')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleSave = async () => {
        try {

            await api.put(`/members/${profile.id}`,{
                ...form,
            })
            Toast.show({
                type: 'success',
                text1: 'Perfil editado!',
                text2: 'Seu perfil foi editado com sucesso. 🎉',
            })
            navigation.goBack()
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: 'Erro ao editar perfil!',
                text2: 'Houve um erro ao editar o perfil'
            })
        }
    }



    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3366FF" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <PageHeader
                title="Editar Perfil"
                Icon={FontAwesome5}
                iconName="user"
            />
            <MemberForm
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={handleSave}
                submitLabel="Salvar alterações"
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
