import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { useMe } from '../hooks/useMe'
import { useNextEvent } from '../hooks/useNextEvent'

// Note: user and nextEvent data are fetched but not currently used in the render.
// They are available for future enhancements to the Header component.

/**
 * Header Component
 * 
 * Presentational component that displays church logo, title, and user avatar.
 * Uses hooks internally to fetch user and next event data (for future use).
 */
export default function Header() {
    // Fetch user and next event data (currently not used in render, but available for future use)
    useMe()
    useNextEvent()

    return (
        <View style={styles.headerContainer}>
            <View style={styles.left}>
                <Image
                    source={require('../../assets/logoIgreja.jpg')} // <- sua imagem da igreja
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Resplandecendo as Nações</Text>
            </View>
            <Image
                source={require('../../assets/icon.png')} // <- foto do usuário
                style={styles.avatar}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 5,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#fff',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 45,
        height: 45,
        marginRight: 1,

    },
    title: {
        fontSize: 23,
        fontWeight: '600',
        marginRight: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 32,
        marginRight: 0,
    },
    subheader: {
        fontSize: 40,
        fontWeight: '600',
        marginBottom: 1,
        marginLeft: 0.5,

    },
    header: {
        fontSize: 2,
        fontWeight: 'bold',
        marginBottom: 10,
        marginLeft: 1,
        paddingHorizontal: 20,
        paddingTop: 50,
        flex: 1,
    },
    container: {
        paddingHorizontal: 20,
        paddingTop: 50,
        backgroundColor: '#fff',
        flex: 1,
    },
})

