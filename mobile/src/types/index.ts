// Tipos compartilhados para o aplicativo mobile

// Tipos de transação financeira
export type TransactionType = 'ENTRY' | 'EXIT'
export type EntryType = 'OFERTA' | 'DIZIMO' | 'CONTRIBUICAO' | null
export type ExitType = 'ALUGUEL' | 'ENERGIA' | 'AGUA' | 'INTERNET' | 'OUTROS' | null

// Tipos de filtro
export type MonthPreset = 'current' | 'last' | 'last3' | 'last6' | 'year' | 'custom'
export type FilterType = 'category' | 'type' | 'search' | 'date'

// Interface de transação financeira
export interface Transaction {
    id: string
    title: string
    amount: number
    type: TransactionType
    category: string | null
    entryType?: EntryType
    exitType?: ExitType
    exitTypeOther?: string | null
    contributionId?: string | null
    tithePayerMemberId?: string | null
    tithePayerName?: string | null
    createdBy?: string | null
    branchId: string
    createdAt: string
    updatedAt: string
    CreatedByUser?: {
        id: string
        name: string
        email: string
    } | null
    Contribution?: {
        id: string
        title: string
    } | null
    TithePayerMember?: {
        id: string
        name: string
        email: string
    } | null
}

// Interface de resumo financeiro
export interface FinanceSummary {
    total: number
    entries: number
    exits: number
}

// Interface de resposta de finanças
export interface FinanceResponse {
    transactions: Transaction[]
    summary: FinanceSummary
}

// Interface de evento
export interface Event {
    id: string
    title: string
    startDate: string
    time?: string
    location?: string
    imageUrl?: string
    description?: string
    endDate?: string
}

// Interface de próximo evento
export interface NextEvent {
    id: string
    title: string
    startDate: string
    location: string
    time?: string
    imageUrl?: string
}

// Interface de aviso/notícia
export interface Notice {
    id: string
    title: string
    message: string
    branchId: string
    viewedBy: string[]
    read: boolean
    createdAt: string
    updatedAt: string
}

// Interface de membro
export interface Member {
    id: string
    name: string
    email: string
    role: string
    permissions: Array<{ id: string; type: string }>
    avatarUrl?: string
    phone?: string
    address?: string
    birthDate?: string
    branch?: {
        id: string
        name: string
        church?: {
            id: string
            name: string
        }
    }
    position?: {
        id: string
        name: string
    }
}

// Interface de perfil
export interface Profile {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
    birthDate?: string
    avatarUrl?: string | null
    role: string
    permissions: Array<{ type: string }>
    branch?: {
        id: string
        name: string
        church?: {
            id: string
            name: string
        }
    }
    position?: {
        id: string
        name: string
    }
}

// Interface de igreja
export interface Church {
    id: string
    name: string
    logoUrl?: string | null
    avatarUrl?: string | null
    isActive?: boolean
    Branch?: Array<{
        id: string
        name: string
    }>
}

// Interface de informação da igreja
export interface ChurchInfo {
    id: string
    name: string
    logoUrl?: string | null
}

// Interface de perfil de membro
export interface MemberProfile {
    avatarUrl?: string | null
    name: string
}

// Interface de erro da API
export interface ApiError {
    message: string
    code?: string
    status?: number
    data?: unknown
}

// Tipo para filtro ativo
export interface ActiveFilter {
    label: string
    type: FilterType
}

// Tipo para opções de pagamento
export interface PaymentMethod {
    id: string
    type: 'PIX' | 'CONTA_BR' | 'IBAN'
    data: Record<string, unknown>
}

// Tipo para contribuição
export interface Contribution {
    id: string
    title: string
    description?: string
}

