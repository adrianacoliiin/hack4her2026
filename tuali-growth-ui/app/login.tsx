import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Image, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../api/authContext';
import { login as loginApi } from '../api/dataProvider';

const PERSONAS = [
  {
    email:       'fernanda@tuali.com',
    password:    '123456',
    nombre:      'Fernanda',
    descripcion: 'Madre emprendedora',
    emoji:       '👩‍💼',
    detalle:     'Eficiente, poco tiempo, busca acciones directas',
  },
  {
    email:       'rosario@tuali.com',
    password:    '123456',
    nombre:      'Rosario',
    descripcion: 'Familiar comprometida',
    emoji:       '🛍️',
    detalle:     'Repite flujos, necesita claridad y ahorros en pesos',
  },
  {
    email:       'raul@tuali.com',
    password:    '123456',
    nombre:      'Raúl',
    descripcion: 'Dueño apoyado',
    emoji:       '🏪',
    detalle:     'Poca adopción digital, prefiere lenguaje simple',
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const { login: setUserContext } = useAuth();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  const handleLogin = async (emailOverride?: string, passwordOverride?: string) => {
    const e = (emailOverride ?? email).trim();
    const p = passwordOverride ?? password;

    if (!e || !p) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      const userData = await loginApi(e, p);
      setUserContext(userData);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Credenciales incorrectas. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsPersona = (persona: typeof PERSONAS[0]) => {
    setEmail(persona.email);
    setPassword(persona.password);
    handleLogin(persona.email, persona.password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Image
          source={require('../assets/images/logo-rojo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Ingresa a tu cuenta</Text>

        {/* Demo personas */}
        <Text style={styles.demoLabel}>Acceso rápido — Demo</Text>
        <View style={styles.personasRow}>
          {PERSONAS.map(p => (
            <TouchableOpacity
              key={p.email}
              style={styles.personaCard}
              onPress={() => loginAsPersona(p)}
              disabled={isLoading}
            >
              <Text style={styles.personaEmoji}>{p.emoji}</Text>
              <Text style={styles.personaNombre}>{p.nombre}</Text>
              <Text style={styles.personaDesc}>{p.descripcion}</Text>
              <Text style={styles.personaDetalle}>{p.detalle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.orLabel}>— o ingresa con tu cuenta —</Text>

        <TextInput
          placeholder="Correo electrónico"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Contraseña"
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={() => handleLogin()}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.buttonText}>Iniciar sesión</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scroll:    { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 },

  logo:     { width: 100, height: 40, marginBottom: 24 },
  title:    { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 20, textAlign: 'center' },

  demoLabel: { fontSize: 12, color: '#999', fontWeight: '600', marginBottom: 10, alignSelf: 'flex-start' },

  personasRow: { flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%' },
  personaCard: {
    flex:            1,
    backgroundColor: '#fafafa',
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     '#e0e0e0',
    padding:         10,
    alignItems:      'center',
    gap:             3,
  },
  personaEmoji:  { fontSize: 24, marginBottom: 2 },
  personaNombre: { fontSize: 13, fontWeight: '700', color: '#111', textAlign: 'center' },
  personaDesc:   { fontSize: 10, color: '#d91c34', fontWeight: '600', textAlign: 'center' },
  personaDetalle:{ fontSize: 9, color: '#888', textAlign: 'center', lineHeight: 13 },

  orLabel: { color: '#bbb', fontSize: 12, marginBottom: 16 },

  input: {
    width: '100%', backgroundColor: '#f8f8f8', padding: 12,
    borderRadius: 10, marginBottom: 12, fontSize: 16,
  },
  passwordContainer: {
    width: '100%', backgroundColor: '#f8f8f8', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  passwordInput:  { flex: 1, fontSize: 16 },
  button:         { backgroundColor: '#d91c34', paddingVertical: 14, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText:     { color: '#fff', fontWeight: '600', fontSize: 16 },
});
