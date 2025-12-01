import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export type Tab = {
  key: string
  label: string
  badge?: number | string
}

type TabsProps = {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
  style?: object
}

export default function Tabs({ tabs, activeTab, onTabChange, style }: TabsProps) {
  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
          {tab.badge !== undefined && tab.badge > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{tab.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3366FF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3366FF',
    fontWeight: 'bold',
  },
  tabBadge: {
    backgroundColor: '#3366FF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
})

