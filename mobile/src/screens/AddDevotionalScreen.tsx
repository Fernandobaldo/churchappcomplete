import React, { useState, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import FormScreenLayout from '../components/layouts/FormScreenLayout'
import FormsComponent from '../components/FormsComponent'
import { devotionalsService } from '../services/devotionals.service'
import { bookTranslation } from '../utils/translateBooks'

export default function AddDevotionalScreen() {
    const navigation = useNavigation()

    const [form, setForm] = useState({
        title: '',
        selectedBook: '',
        chapter: '',
        verse: '',
        content: '',
        date: new Date(),
    })

    const booksOptions = useMemo(() => 
        Object.keys(bookTranslation).map((book) => ({
            key: book,
            label: book,
            value: book,
        }))
    , [])

    const fields = useMemo(() => [
        { 
            key: 'title', 
            label: 'Título', 
            type: 'string' as const, 
            required: true, 
            placeholder: 'Ex: Tema do dia' 
        },
        { 
            key: 'selectedBook', 
            label: 'Livro', 
            type: 'select' as const, 
            required: true, 
            placeholder: 'Selecione o livro',
            options: booksOptions
        },
        { 
            key: 'chapter', 
            label: 'Capítulo', 
            type: 'number' as const, 
            required: true, 
            placeholder: 'Número do capítulo' 
        },
        { 
            key: 'verse', 
            label: 'Versículo', 
            type: 'number' as const, 
            required: true, 
            placeholder: 'Número do versículo' 
        },
        { 
            key: 'content', 
            label: 'Conteúdo', 
            type: 'string' as const, 
            placeholder: 'Escreva o devocional aqui...' 
        },
        { 
            key: 'date', 
            label: 'Data', 
            type: 'date' as const, 
            placeholder: 'DD/MM/AAAA' 
        },
    ], [booksOptions])

    const handleSave = async () => {
        if (!form.title || !form.selectedBook || !form.chapter || !form.verse) {
            Toast.show({
                type: 'error',
                text1: 'Campos obrigatórios',
                text2: 'Preencha todos os campos obrigatórios (*)',
            })
            return
        }

        const passage = `${form.selectedBook} ${form.chapter}:${form.verse}`

        try {
            await devotionalsService.create({
                title: form.title,
                passage,
                content: form.content,
            })

            Toast.show({
                type: 'success',
                text1: 'Devocional criado!',
                text2: 'Seu devocional foi adicionado com sucesso. 🙏',
            })

            navigation.goBack()
        } catch (error) {
            console.error('Erro ao salvar devocional:', error)
            Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Ocorreu um erro ao salvar o devocional.',
            })
        }
    }

    return (
        <FormScreenLayout
            headerProps={{
                title: "Adicionar Devocional",
            }}
        >
            <FormsComponent
                form={form}
                setForm={setForm}
                fields={fields}
                onSubmit={handleSave}
                submitLabel="Salvar"
            />
        </FormScreenLayout>
    )
}
