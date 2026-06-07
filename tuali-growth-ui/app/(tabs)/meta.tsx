import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { api, Goal, DEMO_CUSTOMER_ID } from '@/services/api';

const GOAL_TYPES = [
  { key: 'ventas',          label: '📈 Aumentar ventas' },
  { key: 'ticket',          label: '🎫 Subir ticket promedio' },
  { key: 'nuevo_producto',  label: '📦 Agregar nuevos productos' },
];

export default function MetaScreen() {
  const [goal,        setGoal]        = useState<Goal | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [goalText,    setGoalText]    = useState('');
  const [goalType,    setGoalType]    = useState('ventas');
  const [targetValue, setTargetValue] = useState('20');
  const [showForm,    setShowForm]    = useState(false);

  useEffect(() => { loadGoal(); }, []);

  const loadGoal = async () => {
    try {
      const g = await api.getGoal(DEMO_CUSTOMER_ID);
      setGoal(g);
      if (g) {
        setGoalText(g.goal_text);
        setGoalType(g.goal_type);
        setTargetValue(String(g.target_value ?? 20));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveGoal = async () => {
    if (!goalText.trim()) {
      Alert.alert('Falta la meta', 'Escribe cuál es tu meta de negocio.');
      return;
    }
    setSaving(true);
    try {
      await api.setGoal(DEMO_CUSTOMER_ID, goalText, goalType, Number(targetValue));
      await loadGoal();
      setShowForm(false);
      Alert.alert('¡Meta guardada! 🎯', 'El agente usará esta meta para todas sus recomendaciones.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la meta. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Meta activa */}
      {goal && !showForm ? (
        <View style={styles.activeCard}>
          <Text style={styles.activeLabel}>🎯 Tu meta activa</Text>
          <Text style={styles.activeText}>{goal.goal_text}</Text>

          {/* Progreso */}
          <View style={styles.progressSection}>
            <View style={styles.statsRow}>
              <Stat label="Acciones" value={String(goal.progreso.total_acciones)} />
              <Stat label="Completadas" value={String(goal.progreso.acciones_completadas)} color={Colors.success} />
              <Stat label="Pendientes" value={String(goal.progreso.acciones_pendientes)} color={Colors.warning} />
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${goal.progreso.tasa_completitud_pct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{goal.progreso.tasa_completitud_pct}% completado</Text>
          </View>

          <TouchableOpacity style={styles.changeBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.changeBtnText}>Cambiar meta</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Formulario */}
      {(!goal || showForm) && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {goal ? 'Cambiar mi meta' : '¿Cuál es tu meta de negocio?'}
          </Text>
          <Text style={styles.formSubtitle}>
            El agente personalizará todas sus recomendaciones para ayudarte a llegar a ella.
          </Text>

          {/* Tipo de meta */}
          <Text style={styles.label}>Tipo de meta</Text>
          <View style={styles.typeRow}>
            {GOAL_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeBtn, goalType === t.key && styles.typeBtnActive]}
                onPress={() => setGoalType(t.key)}
              >
                <Text style={[styles.typeBtnText, goalType === t.key && styles.typeBtnTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Descripción */}
          <Text style={styles.label}>Describe tu meta</Text>
          <TextInput
            style={styles.textArea}
            value={goalText}
            onChangeText={setGoalText}
            placeholder="Ej: Quiero vender un 20% más de refrescos este mes"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />

          {/* Porcentaje objetivo */}
          <Text style={styles.label}>Objetivo (%)</Text>
          <TextInput
            style={styles.numberInput}
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="numeric"
            placeholder="20"
            placeholderTextColor={Colors.textMuted}
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={saveGoal}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.saveBtnText}>Guardar meta 🎯</Text>}
          </TouchableOpacity>

          {showForm && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: color ?? Colors.text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: Colors.textMuted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: 16, paddingBottom: 32 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

  activeCard: {
    backgroundColor: Colors.primary,
    borderRadius:    16,
    padding:         20,
    marginBottom:    20,
  },
  activeLabel:   { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  activeText:    { color: Colors.white, fontSize: 18, fontWeight: '700', marginBottom: 16 },

  progressSection: { marginBottom: 16 },
  statsRow:        { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  progressBar:  { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, height: 8, marginBottom: 6 },
  progressFill: { backgroundColor: Colors.white, borderRadius: 4, height: 8 },
  progressLabel:{ color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'center' },

  changeBtn:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 10, alignItems: 'center' },
  changeBtnText: { color: Colors.white, fontWeight: '600' },

  form:         { backgroundColor: Colors.card, borderRadius: 16, padding: 20 },
  formTitle:    { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  formSubtitle: { fontSize: 13, color: Colors.textLight, marginBottom: 20, lineHeight: 18 },
  label:        { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 12 },

  typeRow: { gap: 8 },
  typeBtn: {
    borderWidth:   1,
    borderColor:   Colors.border,
    borderRadius:  10,
    padding:       12,
    backgroundColor: Colors.background,
  },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: '#FFF0F0' },
  typeBtnText:   { fontSize: 14, color: Colors.textLight },
  typeBtnTextActive: { color: Colors.primary, fontWeight: '700' },

  textArea: {
    backgroundColor: Colors.background,
    borderRadius:    10,
    padding:         12,
    fontSize:        14,
    color:           Colors.text,
    borderWidth:     1,
    borderColor:     Colors.border,
    minHeight:       80,
    textAlignVertical: 'top',
  },
  numberInput: {
    backgroundColor: Colors.background,
    borderRadius:    10,
    padding:         12,
    fontSize:        16,
    color:           Colors.text,
    borderWidth:     1,
    borderColor:     Colors.border,
    width:           100,
  },

  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius:    12,
    padding:         16,
    alignItems:      'center',
    marginTop:       20,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { color: Colors.white, fontSize: 16, fontWeight: '700' },

  cancelBtn:     { padding: 12, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: Colors.textMuted, fontSize: 14 },
});
