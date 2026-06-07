import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../../api/authContext';

const PERSONA_LABEL: Record<string, string> = {
  eficiencia: 'Modo eficiencia — respuestas directas',
  asistido:   'Modo asistido — lenguaje simple',
  familiar:   'Modo familiar — paso a paso',
};

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [notifPedido,  setNotifPedido]  = useState(true);
  const [notifAgente,  setNotifAgente]  = useState(true);
  const [notifSemanal, setNotifSemanal] = useState(true);
  const [notifStock,   setNotifStock]   = useState(false);

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
            logout();
            router.replace('/login');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Tarjeta de usuario */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color={Colors.white} />
        </View>
        <Text style={styles.name}>{user?.name || 'Usuario Tuali'}</Text>
        <Text style={styles.email}>{user?.email || 'usuario@tuali.com'}</Text>
        <View style={styles.personaBadge}>
          <Text style={styles.personaText}>
            {PERSONA_LABEL[user?.persona_type ?? ''] ?? 'Agente de crecimiento'}
          </Text>
        </View>
      </View>

      {/* Preferencias de notificaciones */}
      <Text style={styles.sectionTitle}>Notificaciones</Text>
      <View style={styles.optionsCard}>
        <ToggleItem
          icon="bicycle-outline"
          title="Alertas de entrega"
          subtitle="Cuando tu pedido esté en camino"
          value={notifPedido}
          onToggle={setNotifPedido}
        />
        <ToggleItem
          icon="bulb-outline"
          title="Recomendaciones del agente"
          subtitle="Nuevas estrategias para tu tienda"
          value={notifAgente}
          onToggle={setNotifAgente}
        />
        <ToggleItem
          icon="calendar-outline"
          title="Resumen semanal"
          subtitle="Cada lunes a las 9 am"
          value={notifSemanal}
          onToggle={setNotifSemanal}
        />
        <ToggleItem
          icon="warning-outline"
          title="Alertas de stock"
          subtitle="Cuando un producto se pueda agotar"
          value={notifStock}
          onToggle={setNotifStock}
          last
        />
      </View>

      {/* Ajustes de la app */}
      <Text style={styles.sectionTitle}>Ajustes de cuenta</Text>
      <View style={styles.optionsCard}>
        <OptionItem icon="shield-checkmark-outline" title="Privacidad y Seguridad" />
        <OptionItem icon="help-circle-outline"      title="Centro de Ayuda" />
        <OptionItem icon="document-text-outline"    title="Términos y Condiciones" last />
      </View>

      <Text style={styles.sectionTitle}>Acerca de</Text>
      <View style={styles.optionsCard}>
        <OptionItem
          icon="information-circle-outline"
          title="Versión de la App"
          subtitle="1.0.0 — Hack4Her 2026"
          noArrow
          last
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={Colors.primary} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function ToggleItem({
  icon, title, subtitle, value, onToggle, last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.optionRow, last && styles.optionRowLast]}>
      <View style={styles.optionLeft}>
        <Ionicons name={icon} size={22} color={Colors.textLight} />
        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
      />
    </View>
  );
}

function OptionItem({
  icon, title, subtitle, noArrow, last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  noArrow?: boolean;
  last?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.optionRow, last && styles.optionRowLast]} disabled={noArrow}>
      <View style={styles.optionLeft}>
        <Ionicons name={icon} size={22} color={Colors.textLight} />
        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
        </View>
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
    borderRadius:    16,
    padding:         24,
    alignItems:      'center',
    marginBottom:    24,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 2,
  },
  name:        { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  email:       { fontSize: 14, color: Colors.textLight, marginBottom: 12 },
  personaBadge:{
    backgroundColor: Colors.background, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  personaText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12, marginLeft: 4 },

  optionsCard: {
    backgroundColor: Colors.card,
    borderRadius:    16,
    marginBottom:    24,
    borderWidth:     1,
    borderColor:     Colors.border,
    overflow:        'hidden',
  },
  optionRow: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingVertical:  14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  optionRowLast: { borderBottomWidth: 0 },
  optionLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  optionTitle:   { fontSize: 15, color: Colors.text, fontWeight: '500' },
  optionSubtitle:{ fontSize: 12, color: Colors.textMuted, marginTop: 1 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.card, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#FFF0F0', marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
});
