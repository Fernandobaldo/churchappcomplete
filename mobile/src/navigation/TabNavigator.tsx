import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Platform, View } from 'react-native'
import { BlurView } from 'expo-blur'
import DashboardScreen from '../screens/DashboardScreen'
import EventsScreen from '../screens/EventsScreen'
import NoticesScreen from '../screens/NoticesScreen'
import DevotionalsScreen from '../screens/DevotionalsScreen'
import ContributionsScreen from '../screens/ContributionsScreen'
import { Ionicons } from '@expo/vector-icons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import MoreScreen from "../screens/MoreScreen"
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'

const Tab = createBottomTabNavigator()

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size, focused }) => {
                    if (route.name === 'Página Inicial') {
                        return <Ionicons name="home" size={focused ? 26 : 24} color={color} />
                    } else if (route.name === 'Agenda') {
                        return <Ionicons name="calendar" size={focused ? 26 : 24} color={color} />
                    } else if (route.name === 'Avisos') {
                        return <Ionicons name="notifications" size={focused ? 26 : 24} color={color} />
                    } else if (route.name === 'Devocionais') {
                        return <Ionicons name="book" size={focused ? 26 : 24} color={color} />
                    } else if (route.name === 'Contribuições') {
                        return <Ionicons name="heart" size={focused ? 26 : 24} color={color} />
                    } else if (route.name === 'Mais') {
                        return <Ionicons name="menu" size={focused ? 26 : 24} color={color} />
                    }
                    return <Ionicons name="home" size={focused ? 26 : 24} color={color} />
                },
                tabBarActiveTintColor: colors.gradients.primary[1], // #818CF8
                tabBarInactiveTintColor: colors.text.tertiary, // #64748B
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 90 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                    paddingTop: 10,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    overflow: 'hidden',
                    ...colors.shadow.glass,
                },
                tabBarBackground: () => (
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            overflow: 'hidden',
                            backgroundColor: 'rgba(255, 255, 255, 0.35)',
                            borderTopWidth: 1,
                            borderTopColor: colors.glass.border,
                        }}
                    >
                        <BlurView
                            intensity={20}
                            tint="light"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                            }}
                        />
                    </View>
                ),
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    lineHeight: 18,
                    marginTop: 4,
                },
            })}
        >
            <Tab.Screen 
                name="Página Inicial" 
                component={DashboardScreen}
                options={{ 
                    tabBarLabel: 'Página Inicial',
                    gestureEnabled: false,
                }}
            />
            <Tab.Screen 
                name="Agenda" 
                component={EventsScreen}
                options={{ tabBarLabel: 'Agenda' }}
            />
            <Tab.Screen 
                name="Avisos" 
                component={NoticesScreen}
                options={{ tabBarLabel: 'Avisos' }}
            />
            <Tab.Screen 
                name="Devocionais" 
                component={DevotionalsScreen}
                options={{ tabBarLabel: 'Devocionais' }}
            />
            <Tab.Screen 
                name="Contribuições" 
                component={ContributionsScreen}
                options={{ tabBarLabel: 'Contribuições' }}
            />
            <Tab.Screen 
                name="Mais" 
                component={MoreScreen}
                options={{ tabBarLabel: 'Mais' }}
            />
        </Tab.Navigator>
    )
}
