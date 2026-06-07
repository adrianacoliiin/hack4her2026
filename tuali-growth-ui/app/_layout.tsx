import { Stack } from 'expo-router';
import { AuthProvider } from '../api/authContext'; // <-- Importamos el Provider

export default function RootLayout() {
  return (
    // Envolvemos toda la navegación con el AuthProvider
    <AuthProvider>
      <Stack>
        {/* Tu pantalla de login sin encabezado */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        
        {/* Tus pestañas sin encabezado extra */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}