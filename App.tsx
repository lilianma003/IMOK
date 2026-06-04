
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CheckinTimer from './screens/checkin_timer';
import MyContacts from './screens/my_contacts';
import Resources from './screens/resources';
import UserProfile from './screens/user_profile';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={CheckinTimer}/>
        <Tab.Screen name="Contacts" component={MyContacts} />
        <Tab.Screen name="Profile" component={UserProfile}/>
        <Tab.Screen name="Resources" component={Resources}/>

      </Tab.Navigator>
    </NavigationContainer>
  );
}