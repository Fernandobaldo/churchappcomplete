import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native'
import PageHeader, { PageHeaderProps } from '../PageHeader'

type FormScreenLayoutProps = {
  headerProps: PageHeaderProps
  children: React.ReactNode
  backgroundColor?: string
}

export default function FormScreenLayout({
  headerProps,
  children,
  backgroundColor = '#fff',
}: FormScreenLayoutProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <PageHeader {...headerProps} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: 110, // Altura do header fixo
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
})

