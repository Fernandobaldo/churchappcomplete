// components/FormsComponent.tsx

import React, { useMemo, useCallback } from 'react'
import {
    View,
    Text,
    TextInput,
    Switch,
    TouchableOpacity,
    StyleSheet,
    KeyboardTypeOptions,
    Image, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import {useNavigation} from "@react-navigation/native"
import ModalSelector from 'react-native-modal-selector'
import DateTimePickerComponent from './DateTimePicker'
import TextInputField from './TextInputField'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import GlassCard from './GlassCard'

export type SelectOption = {
    key: string
    label: string
    value: string
}

export type FieldType = 'string' | 'number' | 'email' | 'password' | 'date' | 'time' | 'image' | 'toggle' | 'select'

export type Field = {
    key: string
    label: string
    placeholder?: string
    secure?: boolean
    required?: boolean
    type?: FieldType
    dependsOn?: string // opcional: define de qual campo booleano o campo depende
    options?: SelectOption[] // opções para tipo select
    error?: string // mensagem de erro para validação
}

export type FormsComponentProps = {
    form: Record<string, any>
    setForm: React.Dispatch<React.SetStateAction<Record<string, any>>>
    fields: Field[]
    onSubmit: () => void
    submitLabel?: string
    hideButtons?: boolean
    loading?: boolean // Prop para desabilitar botão durante processamento
}

export default function FormsComponent({
                                           form,
                                           setForm,
                                           fields,
                                           onSubmit,
                                           submitLabel = 'Salvar',
                                           hideButtons = false,
                                           loading = false,
                                       }: FormsComponentProps) {
    const navigation = useNavigation()

    // Validação: verifica se todos os campos obrigatórios estão preenchidos
    const isFormValid = useMemo(() => {
        return fields.every((field) => {
            // Se o campo não é obrigatório, sempre válido
            if (!field.required) return true
            
            // Se o campo depende de outro que não está ativo, não precisa validar
            if (field.dependsOn && !form[field.dependsOn]) return true
            
            const value = form[field.key]
            
            // Validação baseada no tipo
            if (field.type === 'toggle') {
                return true // Toggle sempre tem valor (true/false)
            }
            
            if (field.type === 'image') {
                return !!value // Imagem precisa estar selecionada
            }
            
            // Para outros tipos, verifica se tem valor
            return value !== null && value !== undefined && value !== ''
        })
    }, [form, fields])

    // Memoizar handlers de onChangeText para evitar re-renderizações
    const handleTextChange = useCallback((fieldKey: string) => {
        return (text: string) => {
            setForm((prev: Record<string, any>) => ({ ...prev, [fieldKey]: text }))
        }
    }, [setForm])

    const handleSelectImage = async (key: string) => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permissionResult.granted) {
            alert('Permissão de acesso à galeria é necessária.')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        })

        if (!result.canceled && result.assets?.[0]?.uri) {
            setForm((prev: Record<string, any>) => ({ ...prev, [key]: result.assets[0].uri }))
        }
    }

    return (
        <View style={[styles.container, hideButtons && styles.containerNoPadding]}>
            {fields.map((field) => {
                // Verifica dependências
                if (field.dependsOn && !form[field.dependsOn]) return null

                // Renderiza label com indicador de obrigatório
                const renderLabel = () => (
                    <Text style={styles.label}>
                        {field.label}
                        {field.required && <Text style={styles.required}> *</Text>}
                    </Text>
                )
                
                // Wrapper para inputs glass (sem BlurView para não interferir com TextInput)
                const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
                    <View style={styles.inputWrapper}>
                        {children}
                    </View>
                )

                // Determina estilo do input baseado em erro
                const getInputStyle = (baseStyle: object | object[]) => {
                    if (field.error) {
                        return [baseStyle, styles.inputError]
                    }
                    return baseStyle
                }

                if (field.type === 'date') {
                    return (
                        <View key={field.key} style={styles.fieldContainer}>
                            <DateTimePickerComponent
                                label={field.label}
                                required={field.required}
                                value={form[field.key]}
                                onChange={(value) => setForm((prev: Record<string, any>) => ({ ...prev, [field.key]: value }))}
                                mode="date"
                                placeholder={field.placeholder || 'DD/MM/AAAA'}
                                error={field.error}
                            />
                        </View>
                    )
                }

                if (field.type === 'time') {
                    return (
                        <View key={field.key} style={styles.fieldContainer}>
                            <DateTimePickerComponent
                                label={field.label}
                                required={field.required}
                                value={form[field.key]}
                                onChange={(value) => setForm((prev: Record<string, any>) => ({ ...prev, [field.key]: value }))}
                                mode="time"
                                placeholder={field.placeholder || 'HH:mm'}
                                error={field.error}
                            />
                        </View>
                    )
                }

                if (field.type === 'image') {
                    const imageKey = field.key === 'avatar' ? 'avatar' : field.key
                    return (
                        <View key={field.key} style={{alignItems: 'center'}}>
                            {renderLabel()}
                            {form[field.key] ? (
                                <Image source={{uri: form[field.key]}} style={styles.imagePreview}/>
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Text style={{color: '#888'}}>Nenhuma imagem</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.buttonSmall}
                                onPress={() => handleSelectImage(field.key)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={colors.gradients.secondary as [string, string]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButtonSmall}
                                >
                                    <Text style={styles.buttonText}>Selecionar Imagem</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            {field.error && <Text style={styles.errorText}>{field.error}</Text>}
                        </View>
                    )
                }

                if (field.type === 'toggle') {
                    return (
                        <View key={field.key} style={styles.switchRow}>
                            {renderLabel()}
                            <Switch
                                value={!!form[field.key]}
                                onValueChange={(value) =>
                                    setForm((prev: Record<string, any>) => ({ ...prev, [field.key]: value }))
                                }
                                trackColor={{ false: '#CBD5E1', true: colors.gradients.primary[1] }}
                                thumbColor={!!form[field.key] ? '#FFFFFF' : '#F1F5F9'}
                                ios_backgroundColor="#CBD5E1"
                            />
                        </View>
                    )
                }

                if (field.type === 'select') {
                    const selectedOption = field.options?.find(opt => opt.value === form[field.key])
                    return (
                        <View key={field.key} style={styles.fieldContainer}>
                            {renderLabel()}
                            <GlassInputWrapper>
                                <ModalSelector
                                    data={field.options || []}
                                    initValue={selectedOption?.label || field.placeholder || 'Selecione uma opção'}
                                    onChange={(option) => {
                                        setForm((prev: Record<string, any>) => ({ ...prev, [field.key]: option.value }))
                                    }}
                                    style={getInputStyle(styles.input)}
                                    initValueTextStyle={{ color: form[field.key] ? colors.text.primary : colors.text.tertiary }}
                                    selectTextStyle={{ padding: 12 }}
                                >
                                    <TextInput
                                        style={getInputStyle(styles.input)}
                                        editable={false}
                                        placeholder={field.placeholder || 'Selecione uma opção'}
                                        value={selectedOption?.label || ''}
                                        placeholderTextColor={colors.text.tertiary}
                                    />
                                </ModalSelector>
                            </GlassInputWrapper>
                            {field.error && <Text style={styles.errorText}>{field.error}</Text>}
                        </View>
                    )
                }


                const keyboardType: KeyboardTypeOptions =
                    field.type === 'number'
                        ? 'numeric'
                        : field.type === 'email'
                            ? 'email-address'
                            : 'default'

                const secure = field.type === 'password' || field.secure

                // Placeholders padrão baseados no tipo
                const getDefaultPlaceholder = () => {
                    if (field.placeholder) return field.placeholder
                    switch (field.type) {
                        case 'email':
                            return 'exemplo@email.com'
                        case 'password':
                            return '••••••••'
                        case 'number':
                            return '0'
                        default:
                            return ''
                    }
                }

                // Campos que devem ser multiline
                const multilineKeys = ['description', 'message', 'content']
                const isMultiline = multilineKeys.includes(field.key)

                return (
                    <TextInputField
                        key={field.key}
                        fieldKey={field.key}
                        label={field.label}
                        value={form[field.key] || ''}
                        placeholder={getDefaultPlaceholder()}
                        required={field.required}
                        error={field.error}
                        keyboardType={keyboardType}
                        secureTextEntry={secure}
                        autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
                        autoCorrect={field.type === 'email' || field.type === 'password' ? false : true}
                        multiline={isMultiline}
                        onChangeText={handleTextChange(field.key)}
                    />
                )

            })}
            {!hideButtons && (
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                        <GlassCard opacity={0.3} blurIntensity={10} borderRadius={16} style={styles.cancelButtonGlass}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </GlassCard>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.saveButton} 
                        onPress={onSubmit} 
                        activeOpacity={0.8}
                        disabled={!isFormValid || loading}
                    >
                        <LinearGradient
                            colors={
                                (isFormValid && !loading)
                                    ? colors.gradients.primary as [string, string]
                                    : ['#94A3B8', '#94A3B8'] // Cinza quando desativado ou loading
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Salvando...' : submitLabel}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

        </View>
    )
}

const styles = StyleSheet.create({
    container: { 
        padding: 16,
        paddingTop: 0, // Removido paddingTop para permitir controle externo
    },
    containerNoPadding: {
        padding: 0,
    },
    fieldContainer: {
        marginBottom: 8,
    },
    label: { 
        ...typography.styles.label,
        marginBottom: 8, 
        marginTop: 16, 
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
    required: {
        color: colors.status.error,
        fontWeight: typography.fontWeight.bold,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 32,
        gap: 12,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.glass.overlay,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.glass.border,
        ...colors.shadow.glassLight,
    },
    saveButton: {
        flex: 1,
        marginLeft: 6,
        borderRadius: 18,
        overflow: 'hidden',
        ...colors.shadow.glassLight,
    },
    gradientButton: {
        width: '100%',
        height: 56,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal * typography.fontSize.base,
        color: colors.text.primary,
    },
    cancelButton: {
        flex: 1,
        marginRight: 6,
        borderRadius: 18,
    },
    cancelButtonGlass: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputWrapper: {
        width: '100%',
        backgroundColor: colors.glass.overlay,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.glass.border,
        ...colors.shadow.glassLight,
        marginBottom: 0,
        padding: 0,
    },
    input: {
        borderWidth: 0,
        padding: 16,
        borderRadius: 16,
        marginBottom: 0,
        backgroundColor: 'transparent',
        fontSize: 16,
        fontWeight: '400',
        color: '#0F172A',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    inputError: {
        borderColor: colors.status.error,
        borderWidth: 1.5,
    },
    errorText: {
        ...typography.styles.captionSmall,
        color: colors.status.error,
        marginTop: 6,
        marginBottom: 4,
        marginLeft: 4,
    },
    buttonSmall: {
        marginTop: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientButtonSmall: {
        width: '100%',
        minHeight: 44,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    imagePreview: {
        width: '100%',
        height: 180,
        borderRadius: 20,
        marginTop: 12,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        width: '100%',
        height: 180,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.glass.border,
        borderStyle: 'dashed',
    },
})
