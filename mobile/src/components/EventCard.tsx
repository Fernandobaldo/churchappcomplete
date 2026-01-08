import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import GlassCard from './GlassCard'
import { colors } from '../theme/colors'

interface EventCardProps {
    event: {
        id: string
        title: string
        startDate: string
        time?: string
    }
    onPress?: () => void
    style?: ViewStyle
}

export default function EventCard({ event, onPress, style }: EventCardProps) {
    return (
        <GlassCard
            onPress={onPress}
            opacity={0.4}
            blurIntensity={20}
            borderRadius={20}
            style={style ? [styles.eventCard, style] : styles.eventCard}
            contentStyle={{ flexDirection: 'row', alignItems: 'center' }}
        >
            <View style={styles.eventDateBox}>
                <Text style={styles.eventDay}>
                    {format(new Date(event.startDate), 'dd', { locale: ptBR })}
                </Text>
                <Text style={styles.eventMonth}>
                    {format(new Date(event.startDate), 'MMM', { locale: ptBR })}
                </Text>
            </View>
            <View style={styles.eventInfo}>
                <Text style={styles.eventCardTitle} numberOfLines={2}>
                    {event.title}
                </Text>
                {event.time && event.time.trim() !== '' && event.time !== '00:00' && (
                    <View style={styles.eventTimeContainer}>
                        <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                        <Text style={styles.eventCardTime}>
                            {event.time}
                        </Text>
                    </View>
                )}
            </View>
        </GlassCard>
    )
}

const styles = StyleSheet.create({
    eventCard: {
        padding: 20,
        minHeight: 90,
    },
    eventDateBox: {
        width: 70,
        height: 70,
        backgroundColor: colors.glass.overlay,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: colors.glass.border,
        flexShrink: 0,
    },
    eventDay: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
        color: '#0F172A',
    },
    eventMonth: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 18,
        color: '#475569',
        textTransform: 'capitalize',
    },
    eventInfo: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        
    },
    eventCardTitle: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
    },
    eventTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    eventCardTime: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        color: '#475569',
        marginLeft: 6,
        opacity: 0.75,
    },
})

