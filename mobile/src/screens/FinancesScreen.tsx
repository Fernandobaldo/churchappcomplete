import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/api'
import Protected from '../components/Protected'
import PermissionGuard from '../components/PermissionGuard'
import { PieChart } from 'react-native-chart-kit'
import { Dimensions } from 'react-native'
import ViewScreenLayout from '../components/layouts/ViewScreenLayout'
import GlassCard from '../components/GlassCard'
import TextInputField from '../components/TextInputField'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import Toast from 'react-native-toast-message'
import { Transaction, FinanceSummary, FinanceResponse, MonthPreset, FilterType, ActiveFilter } from '../types'
import { colors } from '../theme/colors'

export default function FinancesScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [summary, setSummary] = useState<FinanceSummary>({ total: 0, entries: 0, exits: 0 })
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<'ENTRY' | 'EXIT' | ''>('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [monthPreset, setMonthPreset] = useState<MonthPreset>('current')
    const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
    const [showFilters, setShowFilters] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null)
    const [page, setPage] = useState(1)
    const [loadingMore, setLoadingMore] = useState(false)
    const ITEMS_PER_PAGE = 10
    const navigation = useNavigation()

    // Função para calcular datas do preset
    const calculatePresetDates = useCallback((preset: MonthPreset) => {
        const now = new Date()
        let start: Date
        let end: Date

        switch (preset) {
            case 'current':
                start = startOfMonth(now)
                end = endOfMonth(now)
                break
            case 'last':
                start = startOfMonth(subMonths(now, 1))
                end = endOfMonth(subMonths(now, 1))
                break
            case 'last3':
                start = startOfMonth(subMonths(now, 2))
                end = endOfMonth(now)
                break
            case 'last6':
                start = startOfMonth(subMonths(now, 5))
                end = endOfMonth(now)
                break
            case 'year':
                start = startOfYear(now)
                end = endOfMonth(now)
                break
            case 'custom':
                return { startStr: startDate, endStr: endDate }
            default:
                start = startOfMonth(now)
                end = endOfMonth(now)
        }

        const startStr = format(start, 'yyyy-MM-dd')
        const endStr = format(end, 'yyyy-MM-dd')
        return { startStr, endStr }
    }, [startDate, endDate])

    // Função para aplicar preset de mês
    const applyMonthPreset = useCallback((preset: MonthPreset) => {
        if (preset === 'custom') {
            return null
        }

        const { startStr, endStr } = calculatePresetDates(preset)
        setStartDate(startStr)
        setEndDate(endStr)
        return { startStr, endStr }
    }, [calculatePresetDates])

    const fetchTransactions = useCallback(async () => {
        try {
            setError(null)
            const params: Record<string, string | number> = {}
            
            params.monthPreset = monthPreset
            
            if (startDate) {
                params.startDate = new Date(startDate).toISOString()
            }
            if (endDate) {
                params.endDate = new Date(endDate + 'T23:59:59').toISOString()
            }
            if (categoryFilter) {
                params.category = categoryFilter
            }
            if (typeFilter) {
                params.type = typeFilter
            }
            if (search) {
                params.search = search
            }

            const res = await api.get('/finances', { params })
            setTransactions(res.data.transactions || [])
            setSummary(res.data.summary || { total: 0, entries: 0, exits: 0 })
        } catch (err: unknown) {
            console.error('Erro ao buscar transações:', err)
            const apiError = err as { response?: { data?: { message?: string } } }
            const errorMessage = apiError.response?.data?.message || 'Erro ao carregar finanças'
            setError(errorMessage)
            Toast.show({ 
                type: 'error', 
                text1: 'Erro ao carregar finanças',
                text2: errorMessage
            })
        } finally {
            setLoading(false)
        }
    }, [startDate, endDate, categoryFilter, typeFilter, search, monthPreset])

    useEffect(() => {
        const loadTransactions = async () => {
            setLoading(true)
            await fetchTransactions()
        }
        loadTransactions()
    }, [fetchTransactions])

    // Recarrega quando a tela ganha foco (após voltar de criar/editar transação)
    useFocusEffect(
        useCallback(() => {
            // Evita requisições duplicadas se já estiver carregando ou refrescando
            if (!loading && !refreshing) {
                fetchTransactions()
            }
        }, [fetchTransactions, loading, refreshing])
    )

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        setPage(1)
        await fetchTransactions()
        setRefreshing(false)
    }, [fetchTransactions])

    const handleRetry = useCallback(() => {
        setLoading(true)
        fetchTransactions().finally(() => setLoading(false))
    }, [fetchTransactions])
    
    // Paginação: mostra apenas os primeiros N itens
    const paginatedTransactions = useMemo(() => 
        transactions.slice(0, page * ITEMS_PER_PAGE),
        [transactions, page]
    )
    
    const loadMore = useCallback(() => {
        if (!loadingMore && paginatedTransactions.length < transactions.length) {
            setLoadingMore(true)
            setTimeout(() => {
                setPage(prev => prev + 1)
                setLoadingMore(false)
            }, 300)
        }
    }, [loadingMore, paginatedTransactions.length, transactions.length])

    // Debounce para busca
    useEffect(() => {
        if (searchDebounce) {
            clearTimeout(searchDebounce)
        }
        
        if (search === '') {
            fetchTransactions()
            return
        }
        
        const timeout = setTimeout(() => {
            fetchTransactions()
        }, 500)
        
        setSearchDebounce(timeout)
        
        return () => {
            if (timeout) clearTimeout(timeout)
        }
    }, [search])

    const handleMonthPresetChange = (preset: MonthPreset) => {
        setMonthPreset(preset)
        if (preset !== 'custom') {
            const dates = applyMonthPreset(preset)
            if (dates) {
                setStartDate(dates.startStr)
                setEndDate(dates.endStr)
            }
        }
    }

    const handleRemoveFilter = useCallback((filterType: FilterType) => {
        switch (filterType) {
            case 'category':
                setCategoryFilter('')
                break
            case 'type':
                setTypeFilter('')
                break
            case 'search':
                setSearch('')
                break
            case 'date':
                setMonthPreset('current')
                const now = new Date()
                const newStart = format(startOfMonth(now), 'yyyy-MM-dd')
                const newEnd = format(endOfMonth(now), 'yyyy-MM-dd')
                setStartDate(newStart)
                setEndDate(newEnd)
                break
        }
    }, [])

    const activeFilters = useMemo((): ActiveFilter[] => {
        const filters: ActiveFilter[] = []
        
        if (categoryFilter) {
            filters.push({ label: `Categoria: ${categoryFilter}`, type: 'category' })
        }
        if (typeFilter) {
            filters.push({ label: `Tipo: ${typeFilter === 'ENTRY' ? 'Entrada' : 'Saída'}`, type: 'type' })
        }
        if (search) {
            filters.push({ label: `Pesquisa: ${search}`, type: 'search' })
        }
        const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
        const currentMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')
        if (monthPreset !== 'current' || startDate !== currentMonthStart || endDate !== currentMonthEnd) {
            const presetLabels: Record<MonthPreset, string> = {
                current: 'Este mês',
                last: 'Mês passado',
                last3: 'Últimos 3 meses',
                last6: 'Últimos 6 meses',
                year: 'Este ano',
                custom: `Período: ${format(new Date(startDate), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(endDate), 'dd/MM/yyyy', { locale: ptBR })}`,
            }
            filters.push({ label: presetLabels[monthPreset] || 'Período personalizado', type: 'date' })
        }
        
        return filters
    }, [categoryFilter, typeFilter, search, monthPreset, startDate, endDate])

    // Obter categorias únicas para o filtro
    const categories = useMemo(() => 
        Array.from(new Set(transactions.map(t => t.category).filter(Boolean))) as string[],
        [transactions]
    )

    const isEmpty = !loading && transactions.length === 0 && !error

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

    // Componente para renderizar o header do FlatList (conteúdo estático)
    const renderListHeader = () => (
        <View style={styles.listHeaderContainer}>
            <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.summaryCard}>
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
            </GlassCard>

            {summary.entries > 0 || summary.exits > 0 ? (
                <GlassCard opacity={0.4} blurIntensity={20} borderRadius={20} style={styles.chartContainer}>
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
                </GlassCard>
            ) : null}

            <View style={styles.filtersContainer}>
                <View style={styles.searchRow}>
                    <View style={styles.searchInputContainer}>
                        <TextInputField
                            fieldKey="search"
                            label=""
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Buscar transações..."
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.filterToggleButton}
                        onPress={() => setShowFilters(!showFilters)}
                    >
                        <Ionicons name="filter" size={20} color="#3366FF" />
                        <Text style={styles.filterToggleText}>Filtros</Text>
                    </TouchableOpacity>
                </View>

                {/* Filtros Ativos */}
                {activeFilters.length > 0 && (
                    <View style={styles.activeFiltersContainer}>
                        {activeFilters.map((filter, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.activeFilterTag}
                                onPress={() => handleRemoveFilter(filter.type)}
                            >
                                <Text style={styles.activeFilterText}>{filter.label}</Text>
                                <Ionicons name="close-circle" size={16} color="#3366FF" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <Text style={styles.subheader}>Transações ({transactions.length})</Text>
        </View>
    )

    return (
        <Protected permission="finances_manage">
            <ViewScreenLayout
                headerProps={{
                    title: "Finanças",
                    Icon: FontAwesome5,
                    iconName: "dollar-sign",
                    rightButtonIcon: <Ionicons name="add" size={24} color="white" />,
                    onRightButtonPress: () => navigation.navigate('AddTransaction' as never),
                }}
                scrollable={false}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                contentContainerStyle={styles.viewContent}
                loading={loading}
                error={error}
                empty={isEmpty}
                emptyTitle="Nenhuma transação encontrada"
                emptySubtitle="Quando houver transações no período selecionado, elas aparecerão aqui"
                onRetry={handleRetry}
            >
                <FlatList
                    data={paginatedTransactions}
                    keyExtractor={(item) => item.id}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator size="small" color={colors.gradients.primary[1]} />
                            </View>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <GlassCard
                            onPress={() => navigation.navigate('TransactionDetails' as never, { id: item.id } as never)}
                            opacity={0.4}
                            blurIntensity={20}
                            borderRadius={20}
                            style={styles.transactionItem}
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
                                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                            </View>
                        </GlassCard>
                    )}
                    ListHeaderComponent={renderListHeader}
                    style={styles.flatList}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    nestedScrollEnabled={true}
                />

                {/* Modal de Filtros Avançados */}
                <Modal
                    visible={showFilters}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowFilters(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Filtros Avançados</Text>
                                <TouchableOpacity onPress={() => setShowFilters(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalScrollView}>
                                {/* Presets de Período */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterSectionTitle}>Período</Text>
                                    <View style={styles.presetButtons}>
                                        {(['current', 'last', 'last3', 'last6', 'year'] as MonthPreset[]).map((preset) => (
                                            <TouchableOpacity
                                                key={preset}
                                                style={[
                                                    styles.presetButton,
                                                    monthPreset === preset && styles.presetButtonActive
                                                ]}
                                                onPress={() => handleMonthPresetChange(preset)}
                                            >
                                                <Text style={[
                                                    styles.presetButtonText,
                                                    monthPreset === preset && styles.presetButtonTextActive
                                                ]}>
                                                    {preset === 'current' ? 'Este Mês' :
                                                     preset === 'last' ? 'Mês Passado' :
                                                     preset === 'last3' ? 'Últimos 3 Meses' :
                                                     preset === 'last6' ? 'Últimos 6 Meses' :
                                                     'Este Ano'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Filtro por Tipo */}
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterSectionTitle}>Tipo</Text>
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

                                {/* Filtro por Categoria */}
                                {categories.length > 0 && (
                                    <View style={styles.filterSection}>
                                        <Text style={styles.filterSectionTitle}>Categoria</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
                                            <TouchableOpacity
                                                style={[styles.categoryButton, !categoryFilter && styles.categoryButtonActive]}
                                                onPress={() => setCategoryFilter('')}
                                            >
                                                <Text style={[styles.categoryButtonText, !categoryFilter && styles.categoryButtonTextActive]}>
                                                    Todas
                                                </Text>
                                            </TouchableOpacity>
                                            {categories.map((category) => (
                                                <TouchableOpacity
                                                    key={category}
                                                    style={[styles.categoryButton, categoryFilter === category && styles.categoryButtonActive]}
                                                    onPress={() => setCategoryFilter(category)}
                                                >
                                                    <Text style={[styles.categoryButtonText, categoryFilter === category && styles.categoryButtonTextActive]}>
                                                        {category}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={() => {
                                        setShowFilters(false)
                                        fetchTransactions()
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>Aplicar Filtros</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ViewScreenLayout>
        </Protected>
    )
}

const styles = StyleSheet.create({
    viewContent: {
        flex: 1,
        padding: 0,
    },
    flatList: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    listHeaderContainer: {
        marginBottom: 16,
    },
    summaryCard: {
        padding: 20,
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
        marginBottom: 12,
    },
    balance: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
        color: '#0F172A',
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
        fontWeight: '400',
        lineHeight: 20,
        color: '#475569',
        marginBottom: 4,
    },
    summaryValueEntry: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
        color: colors.status.success,
    },
    summaryValueExit: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
        color: colors.status.error,
    },
    chartContainer: {
        padding: 20,
        marginBottom: 16,
    },
    filtersContainer: {
        marginBottom: 16,
    },
    searchInputContainer: {
        flex: 1,
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        flex: 1,
        padding: 10,
        borderRadius: 16,
        backgroundColor: colors.glass.overlay,
        borderWidth: 1,
        borderColor: colors.glass.border,
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: colors.gradients.primary[1],
        borderColor: colors.gradients.primary[1],
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
        color: '#475569',
    },
    filterButtonTextActive: {
        color: '#FFFFFF',
    },
    subheader: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
        marginBottom: 12,
    },
    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    transactionItem: {
        padding: 20,
        marginBottom: 16,
    },
    transactionContent: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        color: '#0F172A',
        marginBottom: 4,
    },
    transactionCategory: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        color: '#475569',
    },
    transactionAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
    },
    transactionAmountEntry: {
        color: colors.status.success,
    },
    transactionAmountExit: {
        color: colors.status.error,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    filterToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3366FF',
        gap: 6,
    },
    filterToggleText: {
        color: '#3366FF',
        fontWeight: '500',
        fontSize: 14,
    },
    activeFiltersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    activeFilterTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#E0E7FF',
        gap: 6,
    },
    activeFilterText: {
        color: '#3366FF',
        fontSize: 12,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalScrollView: {
        padding: 16,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    presetButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    presetButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    presetButtonActive: {
        backgroundColor: '#3366FF',
        borderColor: '#3366FF',
    },
    presetButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    presetButtonTextActive: {
        color: '#fff',
    },
    categoryScrollView: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginRight: 8,
    },
    categoryButtonActive: {
        backgroundColor: '#3366FF',
        borderColor: '#3366FF',
    },
    categoryButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    categoryButtonTextActive: {
        color: '#fff',
    },
    modalFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    modalButton: {
        backgroundColor: '#3366FF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
