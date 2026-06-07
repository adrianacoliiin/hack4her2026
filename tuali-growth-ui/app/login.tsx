import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Image, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../api/authContext';
import { login as loginApi } from '../api/dataProvider';
import { Colors } from '@/constants/Colors';

const PERSONAS = [
  {
    email:       'fernanda@tuali.com',
    password:    '123456',
    nombre:      'Fernanda',
    descripcion: 'Madre emprendedora',
    emoji:       '👩‍💼',
    detalle:     'Eficiente, poco tiempo, busca acciones directas',
    color:       '#378ADD',
  },
  {
    email:       'rosario@tuali.com',
    password:    '123456',
    nombre:      'Rosario',
    descripcion: 'Familiar comprometida',
    emoji:       '🛍️',
    detalle:     'Repite flujos, necesita claridad y ahorros en pesos',
    color:       '#7F77DD',
  },
  {
    email:       'raul@tuali.com',
    password:    '123456',
    nombre:      'Raúl',
    descripcion: 'Dueño apoyado',
    emoji:       '🏪',
    detalle:     'Poca adopción digital, prefiere lenguaje simple',
    color:       '#1D9E75',
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

        {/* Hero con degradado */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryMid, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Image
            source={require('../assets/images/logo-rojo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Crece tu tienda</Text>
          <Text style={styles.heroSubtitle}>Tu agente de negocio personal</Text>
        </LinearGradient>

        <View style={styles.form}>
          <Text style={styles.title}>Ingresa a tu cuenta</Text>

          {/* Demo personas */}
          <Text style={styles.demoLabel}>Acceso rápido — Demo</Text>
          <View style={styles.personasRow}>
            {PERSONAS.map(p => (
              <TouchableOpacity
                key={p.email}
                style={[styles.personaCard, { borderTopColor: p.color }]}
                onPress={() => loginAsPersona(p)}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.personaEmoji}>{p.emoji}</Text>
                <Text style={styles.personaNombre}>{p.nombre}</Text>
                <Text style={[styles.personaDesc, { color: p.color }]}>{p.descripcion}</Text>
                <Text style={styles.personaDetalle}>{p.detalle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.orLabel}>o ingresa con tu cuenta</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Correo electrónico"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Contraseña"
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 4 }}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => handleLogin()}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, isLoading && styles.buttonDisabled]}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="log-in-outline" size={20} color={Colors.white} />
                    <Text style={styles.buttonText}>Iniciar sesión</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll:    { flexGrow: 1 },

  hero: {
    paddingTop:    60,
    paddingBottom: 36,
    alignItems:    'center',
    gap:           6,
  },
  logo:        { width: 120, height: 48, marginBottom: 8, tintColor: Colors.white },
  heroTitle:   { fontSize: 26, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  heroSubtitle:{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  form: {
    paddingHorizontal: 20,
    paddingTop:        28,
    paddingBottom:     40,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 20, letterSpacing: -0.3 },

  demoLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },

  personasRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  personaCard: {
    flex:            1,
    backgroundColor: Colors.white,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderTopWidth:  3,
    padding:         12,
    alignItems:      'center',
    gap:             4,
    shadowColor:     '#000',
    shadowOpacity:   0.06,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  personaEmoji:  { fontSize: 34, marginBottom: 2 },
  personaNombre: { fontSize: 13, fontWeight: '800', color: Colors.text },
  personaDesc:   { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  personaDetalle:{ fontSize: 9, color: Colors.textMuted, textAlign: 'center', lineHeight: 13 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orLabel:    { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  inputWrapper: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  Colors.background,
    borderRadius:     12,
    paddingHorizontal: 14,
    paddingVertical:   4,
    marginBottom:     12,
    borderWidth:      1,
    borderColor:      Colors.border,
  },
  inputIcon: { marginRight: 8 },
  input:     { fontSize: 15, color: Colors.text, paddingVertical: 10, flex: 1 },

  button: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    paddingVertical: 15,
    borderRadius:   14,
    marginTop:      8,
    shadowColor:    Colors.primary,
    shadowOpacity:  0.35,
    shadowRadius:   10,
    shadowOffset:   { width: 0, height: 4 },
    elevation:      4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: Colors.white, fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
});
