import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export type PageHeaderProps = {
    title?: string
    Icon?: React.ComponentType<{ name: string; size: number; color: string; style?: object }>
    iconName?: string
    backgroundColor?: string
    rightButtonIcon?: React.ReactNode
    onRightButtonPress?: () => void
    // Novas props para avatar e igreja
    userAvatar?: string | null
    userName?: string
    onAvatarPress?: () => void
    churchLogo?: string | null
    churchName?: string
}

type Props = PageHeaderProps

export default function PageHeader({
                                       title,
                                       Icon,
                                       iconName,
                                       backgroundColor = '#3366FF',
                                       rightButtonIcon,
                                       onRightButtonPress,
                                       userAvatar,
                                       userName,
                                       onAvatarPress,
                                       churchLogo,
                                       churchName,
                                   }: Props) {
    return (
        <View style={[styles.header, { backgroundColor }]}>
            {/* Lado esquerdo: Logo e nome da igreja ou título padrão */}
            <View style={styles.leftSection}>
                {(churchLogo || churchName) ? (
                    <View style={styles.churchInfo}>
                        {churchLogo ? (
                            <Image source={{ uri: churchLogo }} style={styles.churchLogo} />
                        ) : (
                            <Ionicons name="church" size={24} color="white" />
                        )}
                        {churchName ? (
                            <Text style={styles.churchName} numberOfLines={1}>
                                {churchName}
                            </Text>
                        ) : (
                            <Text style={styles.churchName} numberOfLines={1}>
                                Igreja
                            </Text>
                        )}
                    </View>
                ) : (
                    <>
                        {Icon && iconName && (
                            <Icon name={iconName} size={21} color="white" style={{ marginRight: 8 }} />
                        )}
                        {title ? (
                            <Text style={styles.headerTitle}>{title}</Text>
                        ) : (
                            <View style={styles.churchInfo}>
                                <Ionicons name="church" size={24} color="white" />
                                <Text style={styles.churchName} numberOfLines={1}>
                                    Igreja
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </View>

            {/* Lado direito: Avatar do usuário ou botão customizado */}
            <View style={styles.rightSection}>
                {userAvatar !== undefined || userName ? (
                    <TouchableOpacity
                        onPress={onAvatarPress}
                        style={styles.avatarContainer}
                        activeOpacity={0.7}
                    >
                        {userAvatar ? (
                            <Image source={{ uri: userAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>
                                    {userName?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ) : (
                    rightButtonIcon && (
                        <TouchableOpacity onPress={onRightButtonPress}>
                            {rightButtonIcon}
                        </TouchableOpacity>
                    )
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        elevation: 5,
    },
    leftSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightSection: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    churchInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    churchLogo: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    churchName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
})
