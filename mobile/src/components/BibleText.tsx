import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { bookTranslation } from '../utils/translateBooks';

function formatPassage(passage: string) {
    if (!passage) return '';

    const [first, second, third] = passage.split(' ');

    let book, chapterAndVerse;

    if (third) {
        book = `${first} ${second}`;
        chapterAndVerse = third;
    } else {
        book = first;
        chapterAndVerse = second;
    }

    const translatedBook = bookTranslation[book.trim()];
    if (!translatedBook) {
        console.warn('Livro não encontrado:', book);
        return '';
    }

    return `${translatedBook}/${chapterAndVerse.replace(':', '/')}`;
}

export function BibleText({ passage }: { passage: string }) {
    const [bibleText, setBibleText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBibleText() {
            try {
                const formatted = formatPassage(passage);
                if (!formatted) {
                    setBibleText('Passagem inválida.');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`https://www.abibliadigital.com.br/api/verses/nvi/${formatted}`, {
                    headers: {
                        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJNb24gQXByIDI4IDIwMjUgMTk6NTA6MzMgR01UKzAwMDAuZmVybmFuZG9iYWxkby53MUBnbWFpbC5jb20iLCJpYXQiOjE3NDU4Njk4MzN9.oVjX6k7iH_tCiihSjsC6m2DtC8b411xST1qzITJiIek',
                    },
                });

                const data = await response.json();

                if (data.text) {
                    setBibleText(data.text);
                } else if (data.verses) {
                    setBibleText(data.verses.map(v => v.text).join(' '));
                } else {
                    setBibleText('Texto não encontrado.');
                }
            } catch (error) {
                console.error('Erro buscando texto:', error);
                setBibleText('Erro ao carregar passagem.');
            } finally {
                setLoading(false);
            }
        }

        fetchBibleText();
    }, [passage]);

    if (loading) {
        return (
            <View style={{ marginTop: 8, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#3366FF" />
            </View>
        );
    }

    return (
        <View style={{ marginTop: 1 }}>
            <Text style={{ fontSize: 14, lineHeight: 15, color: '#333', fontWeight: '500', }}>
                {bibleText}
            </Text>
        </View>
    );
}
