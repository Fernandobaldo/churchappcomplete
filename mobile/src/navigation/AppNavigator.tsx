import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import EventsScreen from '../screens/EventsScreen'
import AddEventScreen from '../screens/AddEventScreen'
import FinancesScreen from '../screens/FinancesScreen'
import AddTransactionScreen from '../screens/AddTransactionScreen'
import ContributionsScreen from '../screens/ContributionsScreen'
import ContributionDetailScreen from '../screens/ContributionDetailScreen'
import DevotionalsScreen from '../screens/DevotionalsScreen'
import DevotionalDetailScreen from '../screens/DevotionalDetailScreen'
import AddDevotionalScreen from '../screens/AddDevotionalScreen'
import NoticesScreen from '../screens/NoticesScreen'
import AddNoticeScreen from '../screens/AddNoticeScreen'
import PermissionsScreen from '../screens/PermissionsScreen'
import ManagePermissionsScreen from '../screens/ManagePermissionsScreen'
import EditMemberPermissionsScreen from '../screens/EditMemberPermissionsScreen'
import MemberRegistrationScreen from '../screens/MemberRegistrationScreen'
import InviteLinkScreen from '../screens/InviteLinkScreen'
import TabNavigator from './TabNavigator'
import MoreScreen from '../screens/MoreScreen'
import AddContributions from '../screens/AddContributionsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import MembersListScreen from '../screens/MembersListScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import EventDetailsScreen from '../screens/EventDetailsScreen'
import EditEventScreen from '../screens/EditEventScreen'





const Stack = createNativeStackNavigator()

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{animation: 'slide_from_right', headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="Events" component={EventsScreen} />
                <Stack.Screen name="AddEvent" component={AddEventScreen} />
                <Stack.Screen name="Finances" component={FinancesScreen} />
                <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
                <Stack.Screen name="Contributions" component={ContributionsScreen} />
                <Stack.Screen name="ContributionDetail" component={ContributionDetailScreen} />
                <Stack.Screen name="Devotionals" component={DevotionalsScreen} />
                <Stack.Screen
                    name="DevotionalDetails"
                    component={DevotionalDetailScreen}
                    options={{ title: 'Detalhes do Devocional'}}
                />
                <Stack.Screen name="AddDevotional" component={AddDevotionalScreen} />
                <Stack.Screen name="Notices" component={NoticesScreen} />
                <Stack.Screen name="AddNotice" component={AddNoticeScreen} />
                <Stack.Screen name="Permissions" component={PermissionsScreen} />
                <Stack.Screen name="ManagePermissions" component={ManagePermissionsScreen} />
                <Stack.Screen name="EditMemberPermissions" component={EditMemberPermissionsScreen} />
                <Stack.Screen name="MemberRegistrationScreen" component={MemberRegistrationScreen} />
                <Stack.Screen name="InviteLink" component={InviteLinkScreen} />
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="More" component={MoreScreen} />
                <Stack.Screen name="AddContributions" component={AddContributions} />
                <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                <Stack.Screen name="MembersListScreen" component={MembersListScreen} />
                <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
                <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="EditEventScreen" component={EditEventScreen}  />




            </Stack.Navigator>
        </NavigationContainer>
    )
}
