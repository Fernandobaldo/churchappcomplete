import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, ImageBackground, TouchableOpacity, Share} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BibleText } from '../components/BibleText';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import EvilIcons from '@expo/vector-icons/EvilIcons';
import api from "../api/api";


export default function DevotionalDetailsScreen() {

    const navigation = useNavigation();
    const route = useRoute();
    const { devotional } = route.params || {};

    if (!devotional) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Devocional não encontrado.</Text>
            </View>
        );
    }

    const handleShare = async () => {
        const text = `📖 ${devotional.passage}\n\n🇧🇷 ${devotional.textPt}\n\n🇫🇷 ${devotional.textFr}`
        await Share.share({ message: text })
    }

    const formattedDate = new Date(devotional.createdAt).toLocaleDateString('pt-BR', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
    });

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Imagem de topo */}
            <ImageBackground
                source={require('../../assets/devotionalimage.png')}
                style={styles.image}
            >
            </ImageBackground>

            {/* Card branco */}
            <View style={styles.card}>
                {/* Título */}
                <Text style={styles.title}>{devotional.title}</Text>

                {/* Data */}
                <Text style={styles.date}>{formattedDate}</Text>

                {/* Autor */}
                <Text style={styles.author}>por {devotional.author?.name ?? 'Autor desconhecido'}</Text>

                {/* Versículo */}
                <Text style={styles.passage}>
                    <BibleText passage={devotional.passage} />
                </Text>

                {/* Referência */}
                <Text style={styles.reference}>{devotional.passage}</Text>

                {/* Conteúdo/reflexão */}
                <Text style={styles.content}>{devotional.content}</Text>

                {/* Botões Curtir / Compartilhar */}
                <View style={styles.actions}>
                    <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                        <EvilIcons name="share-apple" size={40} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f9f9f9',
        flexGrow: 1,
    },
    image: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -40, // sobrepõe a imagem
        padding: 24,
        flexGrow: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 8,
    },
    date: {
        fontSize: 12,
        color: '#666',
        textAlign: 'left',
        marginBottom: 4,
    },
    author: {
        fontSize: 12,
        color: '#666',
        textAlign: 'left',
        marginBottom: 16,
    },
    passage: {
        fontSize: 18,
        fontStyle: 'italic',
        color: '#444',
        textAlign: 'left',
        marginBottom: 4,
    },
    reference: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#777',
        textAlign: 'left',
        marginBottom: 30,
    },
    content: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        textAlign: 'left',
        marginBottom: 30,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 300,
    },
    actionButton: {
        textAlign: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    actionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
    },
});
