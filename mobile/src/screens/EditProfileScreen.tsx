import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import MemberForm from '../components/FormsComponent'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import api from '../api/api'
import Toast from 'react-native-toast-message'
import { useNavigation } from '@react-navigation/native'
import { format } from 'date-fns'



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
        { key: 'name', label: 'Nome completo', type: 'string', placeholder: 'Seu nome completo' },
        { key: 'email', label: 'E-mail', type: 'email', placeholder: 'exemplo@email.com' },
        { key: 'phone', label: 'Telefone', type: 'string', placeholder: '(00) 00000-0000' },
        { key: 'birthDate', label: 'Data de nascimento', type: 'date', placeholder: 'DD/MM/AAAA' },
        { key: 'address', label: 'Endereço', type: 'string', placeholder: 'Rua, número, bairro, cidade' },
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
                        ? format(new Date(data.birthDate), 'dd/MM/yyyy')
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
        <FormScreenLayout
            headerProps={{
                title: "Editar Perfil",
                Icon: FontAwesome5,
                iconName: "user"
            }}
        >
            <MemberForm
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={handleSave}
                submitLabel="Salvar alterações"
            />
        </FormScreenLayout>
    )
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
