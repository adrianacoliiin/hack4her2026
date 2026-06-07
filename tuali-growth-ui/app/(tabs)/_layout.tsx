import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '@/constants/Colors';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor:  Colors.border,
          paddingBottom:   4,
          height:          62,
        },
        headerStyle:      { backgroundColor: Colors.primary },
        headerTintColor:  Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:       'Inicio',
          tabBarIcon:  () => <TabIcon emoji="🏠" />,
          headerTitle: '¡Hola, tendero! 👋',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title:       'Agente',
          tabBarIcon:  () => <TabIcon emoji="🤖" />,
          headerTitle: 'Tu Agente de Crecimiento',
        }}
      />
      <Tabs.Screen
        name="meta"
        options={{
          title:       'Mi Meta',
          tabBarIcon:  () => <TabIcon emoji="🎯" />,
          headerTitle: 'Mi Meta de Negocio',
        }}
      />
      <Tabs.Screen
        name="progreso"
        options={{
          title:       'Progreso',
          tabBarIcon:  () => <TabIcon emoji="📈" />,
          headerTitle: 'Mi Progreso Semanal',
        }}
      />
    </Tabs>
  );
}
