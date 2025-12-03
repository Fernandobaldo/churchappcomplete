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
    const [positions, setPositions] = useState<any[]>([])
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        address: '',
        avatarUrl: '',
        positionId: '',
    })

    const getFields = () => [
        { key: 'name', label: 'Nome completo', type: 'string', placeholder: 'Seu nome completo' },
        { key: 'email', label: 'E-mail', type: 'email', placeholder: 'exemplo@email.com' },
        { key: 'phone', label: 'Telefone', type: 'string', placeholder: '(00) 00000-0000' },
        { key: 'birthDate', label: 'Data de nascimento', type: 'date', placeholder: 'DD/MM/AAAA' },
        { key: 'address', label: 'Endereço', type: 'string', placeholder: 'Rua, número, bairro, cidade' },
        { key: 'avatarUrl', label: 'Foto de Perfil', type: 'image' },
        { 
            key: 'positionId', 
            label: 'Cargo na Igreja', 
            type: 'select', 
            placeholder: 'Selecione um cargo', 
            options: [
                { label: 'Nenhum cargo', value: '' },
                ...positions.map(p => ({ label: p.name, value: p.id }))
            ] 
        },
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
                    positionId: data.positionId || '',
                })
            } catch (err) {
                console.error('Erro ao carregar perfil:', err)
                Alert.alert('Erro ao carregar perfil')
            } finally {
                setLoading(false)
            }
        }
        
        async function fetchPositions() {
            try {
                const res = await api.get('/positions')
                setPositions(res.data)
            } catch (err) {
                console.error('Erro ao carregar cargos:', err)
            }
        }
        
        fetchProfile()
        fetchPositions()
    }, [])

    const handleSave = async () => {
        try {
            const dataToSend = {
                ...form,
                positionId: form.positionId || null,
            }
            await api.put(`/members/${profile.id}`, dataToSend)
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
                fields={getFields()}
                onSubmit={handleSave}
                submitLabel="Salvar alterações"
            />
        </FormScreenLayout>
    )
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
