
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import CheckinTimer from './screens/checkin_timer';
import MyContacts from './screens/my_contacts';
import Resources from './screens/resources';
import UserProfile from './screens/user_profile';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size, focused }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Contacts') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else if (route.name === 'Resources') {
              iconName = focused ? 'book' : 'book-outline';
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#1565c0', // color when tab is selected
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={CheckinTimer} />
        <Tab.Screen name="Contacts" component={MyContacts} />
        <Tab.Screen name="Profile" component={UserProfile} />
        <Tab.Screen name="Resources" component={Resources} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}