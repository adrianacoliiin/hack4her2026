import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useAuth } from '../../api/authContext';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'tendero';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor:  Colors.border,
          paddingBottom:   4,
          height:          58,
        },
        tabBarItemStyle:  { flex: 1 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIconStyle:  { marginBottom: -2 },
        headerStyle:      { backgroundColor: Colors.primary },
        headerTintColor:  Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="notificaciones"
        options={{
          headerTitle: 'Notificaciones',
          href:        null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title:       'Inicio',
          tabBarIcon:  ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
          headerTitle: `¡Hola, ${firstName}! 👋`,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title:       'Agente',
          tabBarIcon:  ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={24} color={color} />,
          headerTitle: 'Tu Agente de Crecimiento',
        }}
      />
      <Tabs.Screen
        name="meta"
        options={{
          title:       'Meta',
          tabBarIcon:  ({ color }) => <Ionicons name="rocket" size={22} color={color} />,
          headerTitle: 'Mi Meta de Negocio',
        }}
      />
      <Tabs.Screen
        name="progreso"
        options={{
          title:       'Progreso',
          tabBarIcon:  ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
          headerTitle: 'Mi Progreso Semanal',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
