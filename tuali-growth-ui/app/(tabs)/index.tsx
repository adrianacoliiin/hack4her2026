import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router'; // <-- 1. Importamos Redirect
import { Colors } from '@/constants/Colors';
import { InsightCard } from '@/components/InsightCard';
import { api, Insight, DEMO_CUSTOMER_ID } from '@/services/api';
import { useAuth } from '../../api/authContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const isLogged = !!user; 
  
  const [insights,    setInsights]    = useState<Insight[]>([]);
  const [goalText,    setGoalText]    = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = async () => {
    try {
      const [ins, goal, progress] = await Promise.all([
        api.getInsights(DEMO_CUSTOMER_ID),
        api.getGoal(DEMO_CUSTOMER_ID),
        api.getProgress(DEMO_CUSTOMER_ID),
      ]);
      setInsights(ins);
      setGoalText(goal?.goal_text ?? null);
      setProgressPct(progress?.semana_actual.tasa_completitud_pct ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    // Solo cargamos los datos si el usuario ya inició sesión
    if (isLogged) {
      load(); 
    }
  }, [isLogged]);

  // 2. LA SOLUCIÓN: Usar el componente Redirect en lugar de router.replace
  if (!isLogged) {
    return <Redirect href="/login" />;
  }

  // Si está cargando datos, mostramos el ActivityIndicator
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
    >
      {/* Meta activa */}
      {goalText ? (
        <TouchableOpacity style={styles.goalBanner} onPress={() => router.push('/meta')}>
          <Text style={styles.goalLabel}>🎯 Mi meta activa</Text>
          <Text style={styles.goalText}>{goalText}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{progressPct}% completado esta semana</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.goalBannerEmpty} onPress={() => router.push('/meta')}>
          <Text style={styles.goalEmptyText}>🎯 Define tu meta de negocio</Text>
          <Text style={styles.goalEmptySubtext}>El agente te ayudará a llegar →</Text>
        </TouchableOpacity>
      )}

      {/* Insights */}
      <Text style={styles.sectionTitle}>💡 Para ti hoy</Text>
      {insights.length === 0 ? (
        <Text style={styles.empty}>Sin insights por ahora. Regresa más tarde.</Text>
      ) : (
        insights.map((ins, i) => (
          <InsightCard
            key={i}
            insight={ins}
            onPress={() => router.push({ pathname: '/chat', params: { prefill: ins.accion } })}
          />
        ))
      )}

      {/* Botón de chat */}
      <TouchableOpacity style={styles.chatBtn} onPress={() => router.push('/chat')}>
        <Text style={styles.chatBtnText}>🤖 Hablar con el agente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  content:      { padding: 16, paddingBottom: 32 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:  { color: Colors.textLight, fontSize: 14 },

  goalBanner: {
    backgroundColor: Colors.primary,
    borderRadius:    14,
    padding:         16,
    marginBottom:    20,
  },
  goalLabel:    { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  goalText:     { color: Colors.white, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  progressBar:  { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, height: 6, marginBottom: 6 },
  progressFill: { backgroundColor: Colors.white, borderRadius: 4, height: 6 },
  progressLabel:{ color: 'rgba(255,255,255,0.85)', fontSize: 12 },

  goalBannerEmpty: {
    backgroundColor: Colors.card,
    borderRadius:    14,
    borderWidth:     2,
    borderColor:     Colors.primary,
    borderStyle:     'dashed',
    padding:         16,
    marginBottom:    20,
    alignItems:      'center',
  },
  goalEmptyText:    { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  goalEmptySubtext: { fontSize: 13, color: Colors.textLight },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  empty:        { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },

  chatBtn: {
    backgroundColor: Colors.primary,
    borderRadius:    14,
    padding:         16,
    alignItems:      'center',
    marginTop:       8,
  },
  chatBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});