import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Platform } from 'react-native'
import DashboardScreen from '../screens/DashboardScreen'
import EventsScreen from '../screens/EventsScreen'
import NoticesScreen from '../screens/NoticesScreen'
import { Ionicons } from '@expo/vector-icons'
import MoreScreen from "../screens/MoreScreen"

const Tab = createBottomTabNavigator()

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    let iconName = 'home'

                    if (route.name === 'Página Inicial') iconName = 'home'
                    else if (route.name === 'Agenda') iconName = 'calendar'
                    else if (route.name === 'Avisos') iconName = 'notifications'
                    else if (route.name === 'Mais') iconName = 'menu'

                    return <Ionicons name={iconName} size={size} color={color} />
                },
                tabBarActiveTintColor: '#3366FF',
                tabBarInactiveTintColor: 'gray',
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
                name="Mais" 
                component={MoreScreen}
                options={{ tabBarLabel: 'Mais' }}
            />
        </Tab.Navigator>
    )
}
