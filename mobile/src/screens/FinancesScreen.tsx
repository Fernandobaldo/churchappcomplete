import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import Protected from '../components/Protected'
import { PieChart } from 'react-native-chart-kit'
import { Dimensions } from 'react-native'
import PageHeader from '../components/PageHeader'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'

export default function FinancesScreen() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [summary, setSummary] = useState({ total: 0, entries: 0, exits: 0 })
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<'ENTRY' | 'EXIT' | ''>('')
    const navigation = useNavigation()

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/finances')
            setTransactions(res.data.transactions || [])
            setSummary(res.data.summary || { total: 0, entries: 0, exits: 0 })
        } catch (error) {
            console.error('Erro ao buscar transações:', error)
        }
    }

    const filteredTransactions = transactions.filter((transaction) => {
        const matchesSearch = transaction.title?.toLowerCase().includes(search.toLowerCase()) || false
        const matchesType = !typeFilter || transaction.type === typeFilter
        return matchesSearch && matchesType
    })

    const getEntryTypeLabel = (type: string | null | undefined) => {
        const labels: Record<string, string> = {
            OFERTA: 'Oferta',
            DIZIMO: 'Dízimo',
            CONTRIBUICAO: 'Contribuição',
        }
        return labels[type || ''] || ''
    }

    const getExitTypeLabel = (type: string | null | undefined) => {
        const labels: Record<string, string> = {
            ALUGUEL: 'Aluguel',
            ENERGIA: 'Energia',
            AGUA: 'Água',
            INTERNET: 'Internet',
            OUTROS: 'Outros',
        }
        return labels[type || ''] || ''
    }

    return (
        <Protected permission="finances_manage">
            <View style={styles.container}>
                <PageHeader
                    title="Finanças"
                    Icon={FontAwesome5}
                    iconName="dollar-sign"
                    rightButtonIcon={<Ionicons name="add" size={24} color="white" />}
                    onRightButtonPress={() => navigation.navigate('AddTransaction' as never)}
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Resumo Financeiro</Text>
                        <Text style={styles.balance}>Saldo Atual: R$ {summary.total.toFixed(2).replace('.', ',')}</Text>
                        
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Entradas</Text>
                                <Text style={styles.summaryValueEntry}>R$ {summary.entries.toFixed(2).replace('.', ',')}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Saídas</Text>
                                <Text style={styles.summaryValueExit}>R$ {summary.exits.toFixed(2).replace('.', ',')}</Text>
                            </View>
                        </View>
                    </View>

                    {summary.entries > 0 || summary.exits > 0 ? (
                        <View style={styles.chartContainer}>
                            <PieChart
                                data={[
                                    {
                                        name: 'Entradas',
                                        amount: summary.entries,
                                        color: '#4CAF50',
                                        legendFontColor: '#000',
                                        legendFontSize: 14,
                                    },
                                    {
                                        name: 'Gastos',
                                        amount: summary.exits,
                                        color: '#F44336',
                                        legendFontColor: '#000',
                                        legendFontSize: 14,
                                    },
                                ]}
                                width={Dimensions.get('window').width - 40}
                                height={180}
                                chartConfig={{
                                    color: () => '#000',
                                    backgroundColor: '#fff',
                                    backgroundGradientFrom: '#fff',
                                    backgroundGradientTo: '#fff',
                                }}
                                accessor="amount"
                                backgroundColor="transparent"
                            />
                        </View>
                    ) : null}

                    <View style={styles.filtersContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar transações..."
                            value={search}
                            onChangeText={setSearch}
                        />
                        <View style={styles.filterButtons}>
                            <TouchableOpacity
                                style={[styles.filterButton, typeFilter === '' && styles.filterButtonActive]}
                                onPress={() => setTypeFilter('')}
                            >
                                <Text style={[styles.filterButtonText, typeFilter === '' && styles.filterButtonTextActive]}>
                                    Todas
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterButton, typeFilter === 'ENTRY' && styles.filterButtonActive]}
                                onPress={() => setTypeFilter('ENTRY')}
                            >
                                <Text style={[styles.filterButtonText, typeFilter === 'ENTRY' && styles.filterButtonTextActive]}>
                                    Entradas
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterButton, typeFilter === 'EXIT' && styles.filterButtonActive]}
                                onPress={() => setTypeFilter('EXIT')}
                            >
                                <Text style={[styles.filterButtonText, typeFilter === 'EXIT' && styles.filterButtonTextActive]}>
                                    Saídas
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.subheader}>Transações ({filteredTransactions.length})</Text>
                    {filteredTransactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredTransactions}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.transactionItem}
                                    onPress={() => navigation.navigate('TransactionDetails' as never, { id: item.id } as never)}
                                >
                                    <View style={styles.transactionContent}>
                                        <Text style={styles.transactionTitle}>{item.title}</Text>
                                        <Text style={styles.transactionCategory}>
                                            {item.category || (item.type === 'ENTRY' && item.entryType ? getEntryTypeLabel(item.entryType) : item.type === 'EXIT' && item.exitType ? getExitTypeLabel(item.exitType) : 'Sem categoria')}
                                        </Text>
                                    </View>
                                    <View style={styles.transactionAmountContainer}>
                                        <Text style={[styles.transactionAmount, item.type === 'ENTRY' ? styles.transactionAmountEntry : styles.transactionAmountExit]}>
                                            {item.type === 'ENTRY' ? '+' : '-'}R$ {Math.abs(item.amount).toFixed(2).replace('.', ',')}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={20} color="#999" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </ScrollView>
            </View>
        </Protected>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 16,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    balance: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    summaryValueEntry: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    summaryValueExit: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F44336',
    },
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    filtersContainer: {
        marginBottom: 16,
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    subheader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    transactionItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    transactionContent: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    transactionCategory: {
        fontSize: 14,
        color: '#666',
    },
    transactionAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    transactionAmountEntry: {
        color: '#4CAF50',
    },
    transactionAmountExit: {
        color: '#F44336',
    },
})
