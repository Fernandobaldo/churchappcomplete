import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
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
import InviteLinksScreen from '../screens/InviteLinksScreen'
import RegisterInviteScreen from '../screens/RegisterInviteScreen'
import MemberLimitReachedScreen from '../screens/MemberLimitReachedScreen'
import TabNavigator from './TabNavigator'
import MoreScreen from '../screens/MoreScreen'
import AddContributions from '../screens/AddContributionsScreen'
import EditContributionScreen from '../screens/EditContributionScreen'
import ProfileScreen from '../screens/ProfileScreen'
import MembersListScreen from '../screens/MembersListScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import EventDetailsScreen from '../screens/EventDetailsScreen'
import EditEventScreen from '../screens/EditEventScreen'
import StartOnboardingScreen from '../screens/onboarding/StartScreen'
import ChurchOnboardingScreen from '../screens/onboarding/ChurchScreen'
import BranchesOnboardingScreen from '../screens/onboarding/BranchesScreen'
import ConcluidoOnboardingScreen from '../screens/onboarding/ConcluidoScreen'
import ChurchSettingsScreen from '../screens/ChurchSettingsScreen'
import ServiceScheduleFormScreen from '../screens/ServiceScheduleFormScreen'
import EditTransactionScreen from '../screens/EditTransactionScreen'
import TransactionDetailsScreen from '../screens/TransactionDetailsScreen'
import MemberDetailsScreen from '../screens/MemberDetailsScreen'
import BemVindoScreen from '../screens/onboarding/BemVindoScreen'
import ConvitesScreen from '../screens/onboarding/ConvitesScreen'
import SettingsScreen from '../screens/onboarding/SettingsScreen'
import ForbiddenScreen from '../screens/ForbiddenScreen'
import SubscriptionScreen from '../screens/SubscriptionScreen'
import SubscriptionSuccessScreen from '../screens/SubscriptionSuccessScreen'
import PositionsScreen from '../screens/PositionsScreen'





const Stack = createNativeStackNavigator()

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{animation: 'slide_from_right', headerShown: false }}>
                <Stack.Screen 
                    name="Login" 
                    component={LoginScreen}
                    options={{ 
                        gestureEnabled: false,
                    }}
                />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen 
                    name="Dashboard" 
                    component={DashboardScreen}
                    options={{ gestureEnabled: false }}
                />
                <Stack.Screen name="Events" component={EventsScreen} />
                <Stack.Screen name="AddEvent" component={AddEventScreen} />
                <Stack.Screen name="Finances" component={FinancesScreen} />
                <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
                <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
                <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
                <Stack.Screen name="Contributions" component={ContributionsScreen} />
                <Stack.Screen name="ContributionDetail" component={ContributionDetailScreen} />
                <Stack.Screen name="EditContributionScreen" component={EditContributionScreen} />
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
                <Stack.Screen name="InviteLinks" component={InviteLinksScreen} />
                <Stack.Screen name="RegisterInvite" component={RegisterInviteScreen} />
                <Stack.Screen name="MemberLimitReached" component={MemberLimitReachedScreen} />
                <Stack.Screen 
                    name="Main" 
                    component={TabNavigator}
                    options={{ 
                        gestureEnabled: false,
                    }}
                />
                <Stack.Screen name="More" component={MoreScreen} />
                <Stack.Screen name="AddContributions" component={AddContributions} />
                <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                <Stack.Screen name="MembersListScreen" component={MembersListScreen} />
                <Stack.Screen name="MemberDetails" component={MemberDetailsScreen} />
                <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
                <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="EditEventScreen" component={EditEventScreen}  />
                <Stack.Screen name="BemVindoOnboarding" component={BemVindoScreen} />
                <Stack.Screen name="StartOnboarding" component={StartOnboardingScreen} />
                <Stack.Screen name="ChurchOnboarding" component={ChurchOnboardingScreen} />
                <Stack.Screen name="BranchesOnboarding" component={BranchesOnboardingScreen} />
                <Stack.Screen name="SettingsOnboarding" component={SettingsScreen} />
                <Stack.Screen name="ConvitesOnboarding" component={ConvitesScreen} />
                <Stack.Screen name="ConcluidoOnboarding" component={ConcluidoOnboardingScreen} />
                <Stack.Screen name="ChurchSettings" component={ChurchSettingsScreen} />
                <Stack.Screen name="ServiceScheduleForm" component={ServiceScheduleFormScreen} />
                <Stack.Screen name="Forbidden" component={ForbiddenScreen} />
                <Stack.Screen name="Subscription" component={SubscriptionScreen} />
                <Stack.Screen name="SubscriptionSuccess" component={SubscriptionSuccessScreen} />
                <Stack.Screen name="Positions" component={PositionsScreen} />




            </Stack.Navigator>
        </NavigationContainer>
    )
}
