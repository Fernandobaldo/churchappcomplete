import React, {useEffect, useState} from 'react'
import {View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity} from 'react-native'
import { useAuthStore } from '../stores/authStore'
import {useNavigation, useRoute} from '@react-navigation/native'
import api from '../api/api'
import PageHeader from "../components/PageHeader";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FormsComponent from '../components/FormsComponent'
import Toast from 'react-native-toast-message'



export default function MemberRegistrationScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    const currentUser = useAuthStore((s) => s.user)
    const [type, setType] = useState('')
    const [typeOptions, setTypeOptions] = useState([])
    const [refreshing, setRefreshing] = useState(false)


    // Tenta pegar do parâmetro ou do usuário logado
    const branchId = route?.params?.branchId || currentUser?.branchId

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        password: '',
        avatarUrl: '',
        role: ''

    })


    const fields = [
        { key: 'name', label: 'Nome completo', type: 'string' },
        { key: 'email', label: 'E-mail', type: 'email', placeholder: 'exemplo@email.com' },
        { key: 'phone', label: 'Telefone', type: 'string' },
        { key: 'birthDate', label: 'Data de nascimento', type: 'date' },
        { key: 'role', label: 'Typo de membro', type: 'select', options: typeOptions },
        { key: 'password', label: 'Senha', type: 'password' },
        { key: 'avatarUrl', label: 'Foto de Perfil', type: 'image' },


    ]
    useEffect(() => {
    async function fetchTypes() {
        try {
            const res = await api.get('/register/types')
            const types = res.data || []
            setTypeOptions(types.map((option) => ({
                key: option.value,
                label: option.label,
                value: option.value,
            })))
            if (types.length > 0) {
                setType(types[0].value)
            }
        } catch (error) {
            console.error('Erro ao buscar tipos:', error)
        }
    }
    fetchTypes()
}, [])

    const handleRegister = async () => {
        if (!branchId) {
            Alert.alert(
                'Erro',
                'ID da congregação não encontrado. Não é possível cadastrar o membro.'
            )
            return
        }

        try {
            await api.post('/register', {
                ...form,
                branchId,
            })
            navigation.goBack()
            Toast.show({
                type: 'success',
                text1: 'Perfil cadastrado!',
                text2: 'Seu perfil foi cadastrado com sucesso. 🎉',
            })
        } catch (err) {
            console.error(err)
            Alert.alert('Erro', 'Não foi possível cadastrar o membro.')
        }
    }



    return (
        <View >
            <PageHeader
                title="Cadastrar membro"
                Icon={FontAwesome5}
                iconName="user"
            />

                <FormsComponent
                    form={form}
                    setForm={setForm}
                    fields={fields}
                    onSubmit={handleRegister}
                    submitLabel="Cadastrar membro"
                />

        </View>

    )
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
