import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'

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
      <BlurView intensity={20} tint="light" style={styles.blurContainer}>
        <View style={styles.tabsWrapper}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.activeTabBadge]}>
                  <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    ...colors.shadow.glassLight,
  },
  blurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  tabsWrapper: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.gradients.primary[1],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.gradients.primary[1],
    fontWeight: typography.fontWeight.semiBold,
  },
  tabBadge: {
    backgroundColor: colors.text.tertiary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  activeTabBadge: {
    backgroundColor: colors.gradients.primary[1],
    borderColor: colors.gradients.primary[1],
  },
  tabBadgeText: {
    color: colors.text.light,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: typography.lineHeight.tight * typography.fontSize.xs,
  },
})

