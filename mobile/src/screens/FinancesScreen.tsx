import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../api/api'
import Protected from '../components/Protected'
import { PieChart } from 'react-native-chart-kit'
import { Dimensions } from 'react-native'

export default function FinancesScreen() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [summary, setSummary] = useState({ total: 0, entries: 0, exits: 0 })
    const navigation = useNavigation()


        return (
            <Protected permission="finance_manage">
                <View style={{ padding: 20 }}>
                    <Text style={{ fontSize: 18 }}>Página de Finanças</Text>
                    {/* ... restante da tela ... */}
                </View>
            </Protected>
        )


    useEffect(() => {
        api.get('/finances').then((res) => {
            setTransactions(res.data.transactions)
            setSummary(res.data.summary)
        })
    }, [])

    const chartData = [
        { key: 1, amount: summary.entries, svg: { fill: '#4CAF50' }, label: 'Entradas' },
        { key: 2, amount: summary.exits, svg: { fill: '#F44336' }, label: 'Gastos' },
    ]

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Resumo Financeiro</Text>
            <Text style={styles.balance}>Saldo Atual: R$ {summary.total.toFixed(2)}</Text>

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

            <Text style={styles.subheader}>Transações</Text>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
                        <Text style={{ color: item.type === 'entry' ? '#4CAF50' : '#F44336' }}>
                            R$ {item.amount.toFixed(2)}
                        </Text>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddTransaction')}>
                <Text style={styles.buttonText}>+ Adicionar Transação</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { fontSize: 20, fontWeight: 'bold' },
    subheader: { marginTop: 20, fontSize: 16, fontWeight: '600' },
    balance: { fontSize: 18, color: '#333', marginVertical: 10 },
    item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
    button: {
        marginTop: 20,
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
})
