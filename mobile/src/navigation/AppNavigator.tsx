import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/LoginScreen'
import MembersScreen from '../screens/MembersScreen'
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


const Stack = createNativeStackNavigator()

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Members" component={MembersScreen} />
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="Events" component={EventsScreen} />
                <Stack.Screen name="AddEvent" component={AddEventScreen} />
                <Stack.Screen name="Finances" component={FinancesScreen} />
                <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
                <Stack.Screen name="Contributions" component={ContributionsScreen} />
                <Stack.Screen name="ContributionDetail" component={ContributionDetailScreen} />
                <Stack.Screen name="Devotionals" component={DevotionalsScreen} />
                <Stack.Screen name="DevotionalDetail" component={DevotionalDetailScreen} />
                <Stack.Screen name="AddDevotional" component={AddDevotionalScreen} />
                <Stack.Screen name="Notices" component={NoticesScreen} />
                <Stack.Screen name="AddNotice" component={AddNoticeScreen} />
                <Stack.Screen name="Permissions" component={PermissionsScreen} />
                <Stack.Screen name="ManagePermissions" component={ManagePermissionsScreen} />
                <Stack.Screen name="EditMemberPermissions" component={EditMemberPermissionsScreen} />
                <Stack.Screen name="RegisterMember" component={MemberRegistrationScreen} />
                <Stack.Screen name="InviteLink" component={InviteLinkScreen} />
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="More" component={MoreScreen} />

            </Stack.Navigator>
        </NavigationContainer>
    )
}
