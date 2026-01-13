import React, {useEffect, useState} from 'react'
import {StyleSheet, Alert} from 'react-native'
import { useAuthStore } from '../stores/authStore'
import {useNavigation, useRoute} from '@react-navigation/native'
import api from '../api/api'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
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
    const [saving, setSaving] = useState(false)


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
        { key: 'name', label: 'Nome completo', type: 'string', required: true, placeholder: 'Seu nome completo' },
        { key: 'email', label: 'E-mail', type: 'email', required: true, placeholder: 'exemplo@email.com' },
        { key: 'phone', label: 'Telefone', type: 'string', placeholder: '(00) 00000-0000' },
        { key: 'birthDate', label: 'Data de nascimento', type: 'date', placeholder: 'DD/MM/AAAA' },
        { key: 'role', label: 'Tipo de membro', type: 'select', options: typeOptions, placeholder: 'Selecione o tipo' },
        { key: 'password', label: 'Senha', type: 'password', required: true, placeholder: 'Mínimo 6 caracteres' },
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
        // Proteção contra double-click
        if (saving) {
            return
        }

        if (!branchId) {
            Alert.alert(
                'Erro',
                'ID da congregação não encontrado. Não é possível cadastrar o membro.'
            )
            return
        }

        // Validação de campos obrigatórios
        if (!form.name || !form.email || !form.password) {
            Toast.show({
                type: 'error',
                text1: 'Campos obrigatórios',
                text2: 'Preencha todos os campos obrigatórios (*)',
            })
            return
        }

        // Validação de senha
        if (form.password.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Senha inválida',
                text2: 'A senha deve ter pelo menos 6 caracteres',
            })
            return
        }

        setSaving(true)

        try {
            await api.post('/register', {
                ...form,
                branchId,
            })
            // Verifica se é possível voltar antes de navegar
            if (navigation.canGoBack()) {
                navigation.goBack()
            }
            Toast.show({
                type: 'success',
                text1: 'Perfil cadastrado!',
                text2: 'Seu perfil foi cadastrado com sucesso. 🎉',
            })
        } catch (err: any) {
            console.error(err)
            const errorMessage = err.response?.data?.message || 'Não foi possível cadastrar o membro.'
            Toast.show({
                type: 'error',
                text1: 'Erro ao cadastrar',
                text2: errorMessage,
            })
        } finally {
            setSaving(false)
        }
    }



    return (
        <FormScreenLayout
            headerProps={{
                title: "Cadastrar membro",
                Icon: FontAwesome5,
                iconName: "user"
            }}
        >
            <FormsComponent
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={handleRegister}
                submitLabel="Cadastrar membro"
                loading={saving}
            />
        </FormScreenLayout>
    )
}

// Estilos removidos - agora gerenciados pelo FormScreenLayout
