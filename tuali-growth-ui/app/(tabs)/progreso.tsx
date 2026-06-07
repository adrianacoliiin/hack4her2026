import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { ActionItem } from '@/components/ActionItem';
import { api, Action, Progress, Ranking } from '@/services/api';
import { useAuth } from '../../api/authContext';

export default function ProgresoScreen() {
  const { user }   = useAuth();
  const customerId = user?.customer_id ?? 0;

  const [actions,   setActions]   = useState<Action[]>([]);
  const [progress,  setProgress]  = useState<Progress | null>(null);
  const [ranking,   setRanking]   = useState<Ranking | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const load = useCallback(async () => {
    try {
      const [acts, prog, rank] = await Promise.all([
        api.getActions(customerId),
        api.getProgress(customerId),
        api.getRanking(customerId),
      ]);
      setActions(acts);
      setProgress(prog);
      setRanking(rank);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={Colors.primary}
        />
      }
      ListHeaderComponent={() => (
        <View style={styles.header}>
          {/* Resumen semanal */}
          {progress && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryMeta}>🎯 {progress.meta_activa}</Text>
              <View style={styles.statsRow}>
                <StatBox label="Total"       value={progress.semana_actual.total_recomendaciones} />
                <StatBox label="✅ Hechas"   value={progress.semana_actual.completadas} color={Colors.success} />
                <StatBox label="⏳ Pendientes" value={progress.semana_actual.pendientes} color={Colors.warning} />
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{pct}% completado esta semana</Text>
              <View style={styles.mensajeBadge}>
                <Text style={styles.mensajeText}>{progress.semana_actual.mensaje}</Text>
              </View>
            </View>
          )}

          {/* Torneo de la zona */}
          {ranking && (
            <View style={styles.torneoCard}>
              <View style={styles.torneoHeader}>
                <Text style={styles.torneoTitle}>🏆 Torneo de tu zona</Text>
                <View style={styles.torneoBadge}>
                  <Text style={styles.torneoBadgeText}>
                    #{ranking.mi_posicion ?? '?'} de {ranking.total_tiendas_zona}
                  </Text>
                </View>
              </View>
              <Text style={styles.torneoCedis}>Región CEDIS {ranking.cedis}</Text>

              {ranking.ranking.slice(0, 5).map((entry) => (
                <View
                  key={entry.posicion}
                  style={[styles.rankRow, entry.es_usuario && styles.rankRowMine]}
                >
                  <Text style={[styles.rankPos, entry.posicion <= 3 && styles.rankPosPodio]}>
                    {entry.posicion === 1 ? '🥇' : entry.posicion === 2 ? '🥈' : entry.posicion === 3 ? '🥉' : `${entry.posicion}.`}
                  </Text>
                  <View style={styles.rankInfo}>
                    <Text style={[styles.rankNombre, entry.es_usuario && styles.rankNombreMine]}>
                      {entry.nombre}
                    </Text>
                    <View style={styles.rankBarTrack}>
                      <View
                        style={[
                          styles.rankBarFill,
                          { width: `${entry.pct_del_lider}%` },
                          entry.es_usuario && { backgroundColor: Colors.primary },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.rankCajas, entry.es_usuario && { color: Colors.primary }]}>
                    {entry.cajas_mes} caj.
                  </Text>
                </View>
              ))}

              {ranking.mi_posicion && ranking.mi_posicion > 5 && (
                <View style={[styles.rankRow, styles.rankRowMine, { marginTop: 4 }]}>
                  <Text style={styles.rankPos}>#{ranking.mi_posicion}</Text>
                  <View style={styles.rankInfo}>
                    <Text style={[styles.rankNombre, styles.rankNombreMine]}>Tu tienda</Text>
                    <View style={styles.rankBarTrack}>
                      <View
                        style={[
                          styles.rankBarFill,
                          {
                            width: `${ranking.ranking.find(r => r.es_usuario)?.pct_del_lider ?? 0}%`,
                            backgroundColor: Colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.rankCajas, { color: Colors.primary }]}>
                    {ranking.ranking.find(r => r.es_usuario)?.cajas_mes} caj.
                  </Text>
                </View>
              )}
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
      <Text style={{ fontSize: 26, fontWeight: '800', color: color ?? Colors.text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: Colors.textMuted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  header:  { marginBottom: 8 },

  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius:    16,
    padding:         20,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  summaryMeta:  { color: Colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 14 },
  statsRow:     { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  progressTrack:{ backgroundColor: Colors.background, borderRadius: 6, height: 10, marginBottom: 6 },
  progressFill: { backgroundColor: Colors.primary, borderRadius: 6, height: 10 },
  progressLabel:{ color: Colors.textLight, fontSize: 12, textAlign: 'center', marginBottom: 12 },
  mensajeBadge: { backgroundColor: Colors.background, borderRadius: 8, padding: 10 },
  mensajeText:  { color: Colors.primary, fontSize: 13, textAlign: 'center', fontWeight: '600' },

  // Torneo
  torneoCard: {
    backgroundColor: Colors.card,
    borderRadius:    16,
    padding:         16,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             10,
  },
  torneoHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  torneoTitle:      { fontSize: 15, fontWeight: '700', color: Colors.text },
  torneoBadge:      { backgroundColor: Colors.primary + '18', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  torneoBadgeText:  { fontSize: 12, fontWeight: '700', color: Colors.primary },
  torneoCedis:      { fontSize: 11, color: Colors.textMuted, marginTop: -4 },

  rankRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    paddingVertical: 4,
  },
  rankRowMine: {
    backgroundColor: Colors.primary + '0D',
    borderRadius:    8,
    paddingHorizontal: 6,
  },
  rankPos:       { width: 28, fontSize: 14, textAlign: 'center', color: Colors.textMuted },
  rankPosPodio:  { fontSize: 18 },
  rankInfo:      { flex: 1, gap: 3 },
  rankNombre:    { fontSize: 12, fontWeight: '600', color: Colors.text },
  rankNombreMine:{ color: Colors.primary },
  rankBarTrack:  { height: 4, backgroundColor: Colors.background, borderRadius: 2 },
  rankBarFill:   { height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  rankCajas:     { fontSize: 11, fontWeight: '700', color: Colors.textMuted, width: 48, textAlign: 'right' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 4 },
  empty:        { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 12 },
});
