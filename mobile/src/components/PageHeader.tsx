import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

type Props = {
    title: string
    Icon?: React.ComponentType<{ name: string; size: number; color: string; style?: object }>
    iconName?: string
    backgroundColor?: string
    rightButtonIcon?: React.ReactNode
    onRightButtonPress?: () => void
}

export default function PageHeader({
                                       title,
                                       Icon,
                                       iconName,
                                       backgroundColor = '#3366FF',
                                       rightButtonIcon,
                                       onRightButtonPress,
                                   }: Props) {
    return (
        <View style={[styles.header, { backgroundColor }]}>
            {Icon && iconName && (
                <Icon name={iconName} size={21} color="white" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.headerTitle}>{title}</Text>

            {rightButtonIcon && (
                <TouchableOpacity onPress={onRightButtonPress}>
                    {rightButtonIcon}
                </TouchableOpacity>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        position: 'relative',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
})
