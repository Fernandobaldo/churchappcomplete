import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import DashboardScreen from '../screens/DashboardScreen'
import EventsScreen from '../screens/EventsScreen'
import ContributionsScreen from '../screens/ContributionsScreen'
import NoticesScreen from '../screens/NoticesScreen'
import { Ionicons } from '@expo/vector-icons'
import MoreScreen from "../screens/MoreScreen";





const Tab = createBottomTabNavigator()

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    let iconName = 'home'

                    if (route.name === 'Dashboard') iconName = 'home'
                    else if (route.name === 'Events') iconName = 'calendar'
                    else if (route.name === 'Contributions') iconName = 'heart'
                    else if (route.name === 'Mais') iconName = 'menu'

                    return <Ionicons name={iconName} size={size} color={color} />
                },
                tabBarActiveTintColor: '#000',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Events" component={EventsScreen} />
            <Tab.Screen name="Contributions" component={ContributionsScreen} />
            <Tab.Screen name="Mais" component={MoreScreen} />

        </Tab.Navigator>
    )
}
