import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { colors } from './theme/colors'

export const toastConfig = {
    success: (props: any) => (
        <View style={styles.toastContainer}>
            <BlurView intensity={25} tint="light" style={styles.blurView}>
                <View style={[styles.toastContent, styles.successBorder]}>
                    <View style={styles.toastTextContainer}>
                        {props.text1 && (
                            <Text style={[styles.text1, !props.text2 && styles.text1NoMargin]} numberOfLines={2}>
                                {props.text1}
                            </Text>
                        )}
                        {props.text2 && (
                            <Text style={styles.text2} numberOfLines={3}>
                                {props.text2}
                            </Text>
                        )}
                    </View>
                </View>
            </BlurView>
        </View>
    ),
    error: (props: any) => (
        <View style={styles.toastContainer}>
            <BlurView intensity={25} tint="light" style={styles.blurView}>
                <View style={[styles.toastContent, styles.errorBorder]}>
                    <View style={styles.toastTextContainer}>
                        {props.text1 && (
                            <Text style={[styles.text1, !props.text2 && styles.text1NoMargin]} numberOfLines={2}>
                                {props.text1}
                            </Text>
                        )}
                        {props.text2 && (
                            <Text style={styles.text2} numberOfLines={3}>
                                {props.text2}
                            </Text>
                        )}
                    </View>
                </View>
            </BlurView>
        </View>
    ),
    info: (props: any) => (
        <View style={styles.toastContainer}>
            <BlurView intensity={25} tint="light" style={styles.blurView}>
                <View style={[styles.toastContent, styles.infoBorder]}>
                    <View style={styles.toastTextContainer}>
                        {props.text1 && (
                            <Text style={[styles.text1, !props.text2 && styles.text1NoMargin]} numberOfLines={2}>
                                {props.text1}
                            </Text>
                        )}
                        {props.text2 && (
                            <Text style={styles.text2} numberOfLines={3}>
                                {props.text2}
                            </Text>
                        )}
                    </View>
                </View>
            </BlurView>
        </View>
    ),
}

const styles = StyleSheet.create({
    toastContainer: {
        width: '90%',
        alignSelf: 'center',
        marginHorizontal: 20,
    },
    blurView: {
        borderRadius: 16,
        overflow: 'hidden',
        ...colors.shadow.glass,
    },
    toastContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 16,
        paddingLeft: 20,
        minHeight: 60,
        borderLeftWidth: 5,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    successBorder: {
        borderLeftColor: colors.status.success,
    },
    errorBorder: {
        borderLeftColor: colors.status.error,
    },
    infoBorder: {
        borderLeftColor: colors.status.info,
    },
    toastTextContainer: {
        flex: 1,
        paddingRight: 8,
    },
    text1: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 22,
        color: '#0F172A',
        marginBottom: 4,
    },
    text1NoMargin: {
        marginBottom: 0,
    },
    text2: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        color: '#475569',
        marginTop: 4,
    },
})
