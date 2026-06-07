import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { ActionItem } from '@/components/ActionItem';
import { api, Action, Progress, DEMO_CUSTOMER_ID } from '@/services/api';

export default function ProgresoScreen() {
  const [actions,  setActions]  = useState<Action[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [acts, prog] = await Promise.all([
        api.getActions(DEMO_CUSTOMER_ID),
        api.getProgress(DEMO_CUSTOMER_ID),
      ]);
      setActions(acts);
      setProgress(prog);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (actionId: string) => {
    Alert.prompt(
      '¡Bien hecho! 🎉',
      '¿Cómo te fue? (opcional)',
      async (feedback) => {
        await api.updateAction(actionId, 'completed', feedback ?? undefined);
        load();
      },
      'plain-text',
      '',
    );
  };

  const handleSkip = async (actionId: string) => {
    await api.updateAction(actionId, 'skipped');
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const pct = progress?.semana_actual.tasa_completitud_pct ?? 0;

  return (
    <FlatList
      data={actions}
      keyExtractor={(item, i) => item.action_id ?? String(i)}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
      }
      ListHeaderComponent={() => (
        <View style={styles.header}>
          {/* Resumen semanal */}
          {progress && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryMeta}>🎯 {progress.meta_activa}</Text>

              <View style={styles.statsRow}>
                <StatBox label="Total" value={progress.semana_actual.total_recomendaciones} />
                <StatBox label="✅ Hechas" value={progress.semana_actual.completadas} color={Colors.success} />
                <StatBox label="⏳ Pendientes" value={progress.semana_actual.pendientes} color={Colors.warning} />
              </View>

              {/* Barra de progreso */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{pct}% completado esta semana</Text>

              <View style={styles.mensajeBadge}>
                <Text style={styles.mensajeText}>{progress.semana_actual.mensaje}</Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Mis acciones</Text>
          {actions.length === 0 && (
            <Text style={styles.empty}>
              Aún no hay acciones. Ve al chat y pregúntale al agente qué hacer esta semana.
            </Text>
          )}
        </View>
      )}
      renderItem={({ item }) => (
        <ActionItem
          action={item}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}
      contentContainerStyle={styles.content}
    />
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: color ?? Colors.white }}>{value}</Text>
      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },

  header: { marginBottom: 8 },

  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius:    16,
    padding:         20,
    marginBottom:    20,
  },
  summaryMeta: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', marginBottom: 14 },
  statsRow:    { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },

  progressTrack:{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6, height: 10, marginBottom: 6 },
  progressFill: { backgroundColor: Colors.white, borderRadius: 6, height: 10 },
  progressLabel:{ color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'center', marginBottom: 12 },

  mensajeBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 10 },
  mensajeText:  { color: Colors.white, fontSize: 13, textAlign: 'center', fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  empty:        { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 20 },
});
