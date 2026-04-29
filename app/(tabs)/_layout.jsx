import { Tabs } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.teal,
      tabBarInactiveTintColor: '#999',
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.blanc,
        borderTopColor: '#eee',
        height: 60,
        paddingBottom: 8,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="planning" options={{ title: 'Planning', tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} /> }} />
      <Tabs.Screen name="absences" options={{ title: 'Absences', tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle" size={size} color={color} /> }} />
      <Tabs.Screen name="disponibilites" options={{ title: 'Dispos', tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />

      {/* Écrans cachés de la tab bar mais accessibles */}
      <Tabs.Screen name="devoirs" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="finance" options={{ href: null }} />
    </Tabs>
  );
}
