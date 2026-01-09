import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard, Platform } from 'react-native'
import { useMembersSearch } from '../hooks/useMembersSearch'
import { membersService, Member } from '../services/members.service'

interface MemberSearchProps {
  value?: string
  onChange: (memberId: string | null, memberName?: string) => void
  placeholder?: string
}

export default function MemberSearch({ value, onChange, placeholder = 'Buscar membro...' }: MemberSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const inputRef = useRef<TextInput>(null)

  // Use hook for searching members with debounce
  const { members, loading } = useMembersSearch(searchTerm, { limit: 10 })

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

  // Open dropdown when search results are available
  useEffect(() => {
    if (searchTerm.trim().length >= 2 && (members.length > 0 || loading)) {
      setIsOpen(true)
    } else if (searchTerm.trim().length < 2) {
      setIsOpen(false)
    }
  }, [members.length, loading, searchTerm])

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

  // If initial value is provided, fetch the member by ID
  useEffect(() => {
    if (value && !selectedMember) {
      membersService
        .getById(value)
        .then((member) => {
          if (member) {
            setSelectedMember(member)
            setSearchTerm(member.name)
          }
        })
        .catch((error) => {
          console.error('Error fetching member by ID:', error)
        })
    } else if (!value && selectedMember) {
      // If value was removed, clear selection
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


