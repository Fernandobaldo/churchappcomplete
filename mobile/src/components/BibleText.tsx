import { ActivityIndicator, View, Text } from 'react-native';
import { useBiblePassage } from '../hooks/useBiblePassage';

/**
 * BibleText Component
 * 
 * Displays Bible passage text fetched from A Biblia Digital API.
 * Uses useBiblePassage hook internally to fetch and manage state.
 */
export function BibleText({ passage }: { passage: string }) {
    const { text, loading, error } = useBiblePassage(passage);

    if (loading) {
        return (
            <View style={{ marginTop: 8, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#3366FF" />
            </View>
        );
    }

    // Handle error or missing text
    const displayText = error 
        ? 'Erro ao carregar passagem.'
        : !text
        ? 'Passagem inválida.'
        : text;

    return (
        <View style={{ marginTop: 1 }}>
            <Text style={{ fontSize: 14, lineHeight: 15, color: '#333', fontWeight: '500', }}>
                {displayText}
            </Text>
        </View>
    );
}
