import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../../api/authContext';

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Salir', 
          style: 'destructive',
          onPress: () => {
            logout(); // Borra los datos del usuario del estado global
            router.replace('/login'); // Te regresa a la pantalla de inicio de sesión
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Tarjeta de Información del Usuario */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color={Colors.white} />
        </View>
        
        {/* Aquí mostramos los datos que vienen del Login (o textos por defecto) */}
        <Text style={styles.name}>{user?.name || 'Usuario Tuali'}</Text>
        <Text style={styles.email}>{user?.email || 'usuario@tuali.com'}</Text>
        
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'admin' ? 'Administrador' : 'Dueño de negocio'}
          </Text>
        </View>
      </View>

      {/* Menú de Opciones */}
      <Text style={styles.sectionTitle}>Ajustes de cuenta</Text>
      
      <View style={styles.optionsCard}>
        <OptionItem icon="notifications-outline" title="Notificaciones" />
        <OptionItem icon="shield-checkmark-outline" title="Privacidad y Seguridad" />
        <OptionItem icon="help-circle-outline" title="Centro de Ayuda" />
      </View>

      <Text style={styles.sectionTitle}>Acerca de</Text>
      
      <View style={styles.optionsCard}>
        <OptionItem icon="document-text-outline" title="Términos y Condiciones" />
        <OptionItem icon="information-circle-outline" title="Versión de la App (1.0.0)" noArrow />
      </View>

      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={Colors.primary} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// Componente reutilizable para las filas del menú
function OptionItem({ icon, title, noArrow }: { icon: keyof typeof Ionicons.glyphMap; title: string; noArrow?: boolean }) {
  return (
    <TouchableOpacity style={styles.optionRow} disabled={noArrow}>
      <View style={styles.optionLeft}>
        <Ionicons name={icon} size={22} color={Colors.textLight} />
        <Text style={styles.optionTitle}>{title}</Text>
      </View>
      {!noArrow && <Ionicons name="chevron-forward" size={20} color={Colors.border} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: 16, paddingBottom: 40 },

  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  email: { fontSize: 14, color: Colors.textLight, marginBottom: 12 },
  roleBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'capitalize' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12, marginLeft: 4 },
  
  optionsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionTitle: { fontSize: 15, color: Colors.text, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFF0F0', // Un toque rojizo para el borde
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
});