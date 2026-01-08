import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ServiceSchedule, serviceScheduleApi } from '../api/serviceScheduleApi'
import Toast from 'react-native-toast-message'

interface ServiceScheduleListProps {
    schedules: ServiceSchedule[]
    onEdit: (schedule: ServiceSchedule) => void
    onDelete: (id: string, deleteEvents: boolean) => void
    onRefresh: () => void
}

const DAYS_OF_WEEK = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
]

export default function ServiceScheduleList({
    schedules,
    onEdit,
    onDelete,
    onRefresh,
}: ServiceScheduleListProps) {
    const handleSetDefault = async (id: string) => {
        try {
            await serviceScheduleApi.setDefault(id)
            Toast.show({ type: 'success', text1: 'Horário definido como padrão!' })
            onRefresh()
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { message?: string } } }
            Toast.show({ 
                type: 'error', 
                text1: 'Erro ao definir horário como padrão',
                text2: apiError.response?.data?.message || 'Tente novamente'
            })
        }
    }

    const handleCreateEvents = async (schedule: ServiceSchedule) => {
        Alert.alert(
            'Criar Eventos',
            `Criar eventos a partir do horário "${schedule.title}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Criar',
                    onPress: async () => {
                        try {
                            const result = await serviceScheduleApi.createEvents(schedule.id)
                            Toast.show({
                                type: 'success',
                                text1: `${result.created} eventos criados com sucesso!`,
                            })
                            onRefresh()
                        } catch (error: unknown) {
                            const apiError = error as { response?: { data?: { message?: string } } }
                            Toast.show({ 
                                type: 'error', 
                                text1: 'Erro ao criar eventos',
                                text2: apiError.response?.data?.message || 'Tente novamente'
                            })
                        }
                    },
                },
            ]
        )
    }

    if (schedules.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Nenhum horário de culto cadastrado.</Text>
                <Text style={styles.emptySubtext}>Clique em "Adicionar Horário" para começar.</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {schedules.map((schedule) => (
                <View
                    key={schedule.id}
                    style={[
                        styles.scheduleCard,
                        schedule.isDefault && styles.scheduleCardDefault
                    ]}
                >
                    <View style={styles.scheduleHeader}>
                        <View style={styles.scheduleHeaderLeft}>
                            <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                            {schedule.isDefault && (
                                <View style={styles.defaultBadge}>
                                    <Ionicons name="star" size={16} color="#FFD700" />
                                    <Text style={styles.defaultText}>Padrão</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.scheduleInfo}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={16} color="#666" />
                            <Text style={styles.infoText}>{DAYS_OF_WEEK[schedule.dayOfWeek]}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text style={styles.infoText}>{schedule.time}</Text>
                        </View>
                        {schedule.location && (
                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={16} color="#666" />
                                <Text style={styles.infoText}>{schedule.location}</Text>
                            </View>
                        )}
                        {schedule.autoCreateEvents && (
                            <View style={styles.infoRow}>
                                <Ionicons name="refresh-outline" size={16} color="#666" />
                                <Text style={styles.infoText}>
                                    Auto-criar eventos ({schedule.autoCreateDaysAhead || 90} dias)
                                </Text>
                            </View>
                        )}
                    </View>

                    {schedule.description && (
                        <Text style={styles.scheduleDescription}>{schedule.description}</Text>
                    )}

                    <View style={styles.scheduleActions}>
                        {!schedule.isDefault && (
                            <TouchableOpacity
                                onPress={() => handleSetDefault(schedule.id)}
                                style={styles.actionButton}
                            >
                                <Ionicons name="star-outline" size={20} color="#FFD700" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => handleCreateEvents(schedule)}
                            style={styles.actionButton}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#16a34a" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onEdit(schedule)}
                            style={styles.actionButton}
                        >
                            <Ionicons name="pencil" size={20} color="#3366FF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={async () => {
                                try {
                                    const { count, scheduleTitle } = await serviceScheduleApi.getRelatedEventsCount(schedule.id)
                                    
                                    let message = `Tem certeza que deseja deletar o horário "${scheduleTitle}"?`
                                    if (count > 0) {
                                        message += `\n\n⚠️ ATENÇÃO: Ao deletar este horário de culto, ${count} evento(s) criado(s) a partir dele também serão deletados.`
                                    }
                                    
                                    Alert.alert('Confirmar Deleção', message, [
                                        { text: 'Cancelar', style: 'cancel' },
                                        {
                                            text: 'Deletar apenas o horário',
                                            onPress: async () => {
                                                try {
                                                    const result = await serviceScheduleApi.delete(schedule.id, false)
                                                    Toast.show({ 
                                                        type: 'success', 
                                                        text1: 'Horário deletado com sucesso!',
                                                        text2: `${result.relatedEventsCount} evento(s) permaneceram no calendário.`
                                                    })
                                                    onRefresh()
                                                } catch (error: unknown) {
                                                    const apiError = error as { response?: { data?: { message?: string } } }
                                                    Toast.show({ 
                                                        type: 'error', 
                                                        text1: apiError.response?.data?.message || 'Erro ao deletar horário'
                                                    })
                                                }
                                            },
                                        },
                                        {
                                            text: 'Deletar horário e eventos',
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    const result = await serviceScheduleApi.delete(schedule.id, true)
                                                    let successMessage = 'Horário deletado com sucesso!'
                                                    if (result.deletedEventsCount > 0) {
                                                        successMessage += ` ${result.deletedEventsCount} evento(s) também foram deletado(s).`
                                                    }
                                                    Toast.show({ type: 'success', text1: successMessage })
                                                    onRefresh()
                                                } catch (error: unknown) {
                                                    const apiError = error as { response?: { data?: { message?: string } } }
                                                    Toast.show({ 
                                                        type: 'error', 
                                                        text1: apiError.response?.data?.message || 'Erro ao deletar horário'
                                                    })
                                                }
                                            },
                                        },
                                    ])
                                } catch (error: unknown) {
                                    Toast.show({ 
                                        type: 'error', 
                                        text1: 'Erro ao verificar eventos relacionados'
                                    })
                                }
                            }}
                            style={styles.actionButton}
                        >
                            <Ionicons name="trash" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    scheduleCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    scheduleCardDefault: {
        borderColor: '#3366FF',
        backgroundColor: '#F0F4FF',
    },
    scheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    scheduleHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    scheduleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    defaultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
    },
    defaultText: {
        fontSize: 12,
        color: '#FFD700',
        fontWeight: '600',
    },
    scheduleInfo: {
        gap: 8,
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
    },
    scheduleDescription: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic',
    },
    scheduleActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 12,
    },
    actionButton: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
})

