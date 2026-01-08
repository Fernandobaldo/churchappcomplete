import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard, Platform } from 'react-native'
import api from '../api/api'

interface Member {
  id: string
  name: string
  email?: string
  role?: string
}

interface MemberSearchProps {
  value?: string
  onChange: (memberId: string | null, memberName?: string) => void
  placeholder?: string
}

export default function MemberSearch({ value, onChange, placeholder = 'Buscar membro...' }: MemberSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    // Listener para detectar quando o teclado aparece/desaparece
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true)
      }
    )
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false)
      }
    )

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  useEffect(() => {
    // Buscar membros quando houver termo de busca
    if (searchTerm.trim().length >= 2) {
      setLoading(true)
      
      // Debounce da busca
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await api.get('/members')
          const allMembers = response.data as Member[]
          
          // Filtrar membros localmente baseado no termo de busca
          const filtered = allMembers.filter(member =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          
          setMembers(filtered.slice(0, 10)) // Limitar a 10 resultados
          setIsOpen(true)
        } catch (error) {
          console.error('Erro ao buscar membros:', error)
          setMembers([])
        } finally {
          setLoading(false)
        }
      }, 300)
    } else {
      setMembers([])
      setIsOpen(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member)
    setSearchTerm(member.name)
    setIsOpen(false)
    onChange(member.id, member.name)
    inputRef.current?.blur()
    Keyboard.dismiss()
  }

  const handleClear = () => {
    setSelectedMember(null)
    setSearchTerm('')
    setIsOpen(false)
    onChange(null)
    inputRef.current?.focus()
  }

  // Se houver value inicial, buscar o membro
  useEffect(() => {
    if (value && !selectedMember) {
      // Se value é um ID, buscar o membro
      api.get('/members')
        .then(response => {
          const member = response.data.find((m: Member) => m.id === value)
          if (member) {
            setSelectedMember(member)
            setSearchTerm(member.name)
          }
        })
        .catch(console.error)
    } else if (!value && selectedMember) {
      // Se value foi removido, limpar seleção
      setSelectedMember(null)
      setSearchTerm('')
    }
  }, [value, selectedMember])

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={searchTerm}
          onChangeText={(text) => {
            setSearchTerm(text)
            setSelectedMember(null)
            if (text === '') {
              onChange(null)
            }
          }}
          onFocus={() => {
            if (members.length > 0 || searchTerm.length >= 2) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
        />
        {selectedMember && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isOpen && (members.length > 0 || loading) && (
        <View style={[styles.dropdown, keyboardVisible && styles.dropdownKeyboardVisible]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={styles.loadingText}>Buscando...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {members.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.memberItem}
                  activeOpacity={0.7}
                  onPress={() => handleSelectMember(item)}
                >
                  <Text style={styles.memberName}>{item.name}</Text>
                  {item.email && (
                    <Text style={styles.memberEmail}>{item.email}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {isOpen && !loading && searchTerm.length >= 2 && members.length === 0 && (
        <View style={[styles.dropdown, keyboardVisible && styles.dropdownKeyboardVisible]}>
          <Text style={styles.noResults}>Nenhum membro encontrado</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
    zIndex: 1,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1001,
  },
  dropdownKeyboardVisible: {
    // Quando o teclado está visível, ajustar para aparecer acima
    elevation: 15,
    shadowOpacity: 0.2,
  },
  list: {
    maxHeight: 240,
  },
  memberItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  noResults: {
    padding: 16,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
})


