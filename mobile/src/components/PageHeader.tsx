import React, { memo, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'

// Função para obter saudação baseada no horário
const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

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
    // Prop para desabilitar blur e tornar header transparente
    transparent?: boolean
}

type Props = PageHeaderProps

const PageHeader = memo(function PageHeader({
                                       title,
                                       Icon,
                                       iconName,
                                       backgroundColor,
                                       rightButtonIcon,
                                       onRightButtonPress,
                                       userAvatar,
                                       userName,
                                       onAvatarPress,
                                       churchLogo,
                                       churchName,
                                       transparent = false,
                                   }: Props) {
    const greeting = useMemo(() => getGreeting(), [])
    const displayName = useMemo(() => {
        if (userName) {
            // Pega o primeiro nome apenas
            return userName.split(' ')[0]
        }
        return null
    }, [userName])

    // Determina o conteúdo do lado esquerdo
    const leftContent = useMemo(() => {
        // Prioridade: Se tem userName, mostra avatar + saudação + nome
        if (userName || userAvatar !== undefined) {
            return (
                <View style={styles.leftContentWithAvatar}>
                    {/* Avatar à esquerda */}
                    {onAvatarPress && (
                        <TouchableOpacity
                            onPress={onAvatarPress}
                            style={[styles.avatarContainer, transparent && styles.avatarContainerTransparent]}
                            activeOpacity={0.7}
                        >
                            {userAvatar ? (
                                <Image 
                                    source={{ uri: userAvatar }} 
                                    style={[styles.avatar, transparent && styles.avatarTransparent]}
                                />
                            ) : (
                                <View style={[styles.avatarPlaceholder, transparent && styles.avatarPlaceholderTransparent]}>
                                    <Text style={[styles.avatarInitial, transparent && styles.avatarInitialTransparent]}>
                                        {displayName?.charAt(0).toUpperCase() || userName?.charAt(0).toUpperCase() || 'U'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                    {/* Saudação e pergunta */}
                    <View style={styles.greetingContainer}>
                        <Text style={[styles.greetingText, transparent && styles.greetingTextTransparent]}>
                            {greeting}{displayName ? `, ${displayName}!` : '!'}
                        </Text>
                        {title ? (
                            <Text style={[styles.mainQuestion, transparent && styles.mainQuestionTransparent]} numberOfLines={2}>
                                {title}
                            </Text>
                        ) : null}
                    </View>
                </View>
            )
        }
        
        // Se tem churchLogo ou churchName, mostra info da igreja
        if (churchLogo || churchName) {
            return (
                <View style={styles.churchInfo}>
                    {churchLogo ? (
                        <Image 
                            source={{ uri: churchLogo }} 
                            style={styles.churchLogo}
                            resizeMode="cover"
                        />
                    ) : null}
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
            )
        }
        
        // Fallback: título com ícone ou apenas título
        return (
            <View style={styles.titleContainer}>
                {Icon && iconName && (
                    <Icon name={iconName} size={20} color={colors.text.primary} style={styles.titleIcon} />
                )}
                {title ? (
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {title}
                    </Text>
                ) : (
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        Igreja
                    </Text>
                )}
            </View>
        )
    }, [greeting, displayName, userName, userAvatar, churchLogo, churchName, title, Icon, iconName])

    // Determina o conteúdo do lado direito (apenas menu)
    const rightContent = useMemo(() => {
        // Menu circular à direita
        if (rightButtonIcon && onRightButtonPress) {
            return (
                <TouchableOpacity 
                    onPress={onRightButtonPress}
                    style={styles.menuButton}
                    activeOpacity={0.7}
                >
                    <BlurView intensity={15} tint="light" style={styles.menuButtonBlur}>
                        {rightButtonIcon}
                    </BlurView>
                </TouchableOpacity>
            )
        }
        
        // Menu padrão (grid de 4 pontos) se não há rightButtonIcon mas há onRightButtonPress
        if (onRightButtonPress) {
            return (
                <TouchableOpacity 
                    onPress={onRightButtonPress}
                    style={styles.menuButton}
                    activeOpacity={0.7}
                >
                    <BlurView intensity={15} tint="light" style={styles.menuButtonBlur}>
                        <View style={styles.menuIconGrid}>
                            <View style={styles.menuDot} />
                            <View style={styles.menuDot} />
                            <View style={styles.menuDot} />
                            <View style={styles.menuDot} />
                        </View>
                    </BlurView>
                </TouchableOpacity>
            )
        }
        
        return null
    }, [rightButtonIcon, onRightButtonPress])

    // Se transparent, renderiza sem blur e sem background
    if (transparent) {
        return (
            <View style={styles.headerWrapper}>
                <View style={styles.headerTransparent}>
                    {/* Lado esquerdo: Saudação + Nome ou Título */}
                    <View style={styles.leftSection}>
                        {leftContent}
                    </View>

                    {/* Lado direito: Avatar + Menu ou apenas Menu */}
                    <View style={styles.rightSection}>
                        {rightContent}
                    </View>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.headerWrapper}>
            <BlurView
                intensity={15}
                tint="light"
                style={styles.blurView}
            />
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: backgroundColor || 'rgba(255, 255, 255, 0.25)',
                    },
                ]}
            >
                {/* Lado esquerdo: Saudação + Nome ou Título */}
                <View style={styles.leftSection}>
                    {leftContent}
                </View>

                {/* Lado direito: Avatar + Menu ou apenas Menu */}
                <View style={styles.rightSection}>
                    {rightContent}
                </View>
            </View>
        </View>
    )
})

const styles = StyleSheet.create({
    headerWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        elevation: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        // Removido completamente: elevation, shadow, borderBottom
        elevation: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        overflow: 'hidden',
    },
    blurView: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        elevation: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
    },
    headerTransparent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 70,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'transparent',
        elevation: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
    },
    leftSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    rightSection: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Container para avatar + saudação + pergunta
    leftContentWithAvatar: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    // Container para saudação + pergunta
    greetingContainer: {
        flex: 1,
    },
    greetingText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.regular,
        lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
        color: '#475569',
        marginBottom: 4,
    },
    greetingTextTransparent: {
        fontSize: typography.fontSize.base,
        lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    },
    mainQuestion: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semiBold,
        lineHeight: typography.lineHeight.tight * typography.fontSize.xl,
        color: colors.text.primary,
        letterSpacing: -0.2,
    },
    mainQuestionTransparent: {
        fontSize: typography.fontSize['2xl'],
        lineHeight: typography.lineHeight.tight * typography.fontSize['2xl'],
    },
    // Container para título com ícone
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    titleIcon: {
        marginRight: 8,
    },
    headerTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semiBold,
        lineHeight: typography.lineHeight.tight * typography.fontSize.xl,
        color: colors.text.primary,
        flex: 1,
        letterSpacing: -0.2,
    },
    // Info da igreja
    churchInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    churchLogo: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.15)',
    },
    churchName: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semiBold,
        lineHeight: typography.lineHeight.tight * typography.fontSize.xl,
        color: colors.text.primary,
        flex: 1,
        letterSpacing: -0.2,
    },
    // Avatar discreto
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.15)',
        // Removido shadow completamente
    },
    avatarContainerTransparent: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatar: {
        width: 37,
        height: 37,
        borderRadius: 18.5,
    },
    avatarTransparent: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
    },
    avatarPlaceholder: {
        width: 37,
        height: 37,
        borderRadius: 18.5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderTransparent: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
    },
    avatarInitial: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal * typography.fontSize.base,
        color: colors.text.primary,
    },
    avatarInitialTransparent: {
        fontSize: typography.fontSize.lg,
        lineHeight: typography.lineHeight.normal * typography.fontSize.lg,
    },
    // Botão de menu circular com glass effect
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    menuButtonBlur: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.15)',
    },
    menuIconGrid: {
        width: 18,
        height: 18,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignContent: 'space-between',
    },
    menuDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: colors.text.primary,
        opacity: 0.5,
    },
})

export default PageHeader
