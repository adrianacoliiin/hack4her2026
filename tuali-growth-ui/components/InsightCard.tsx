import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Insight } from '@/services/api';

const ICONS = { pedido: '🛒', promo: '🎁', zona: '📍' };

type Props = {
  insight: Insight;
  onPress?: () => void;
};

export function InsightCard({ insight, onPress }: Props) {
  const tipo = insight.tipo as keyof typeof ICONS;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: Colors.insight.border[tipo] }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.icon}>{ICONS[tipo] ?? '💡'}</Text>
      <View style={styles.content}>
        <Text style={styles.titulo}>{insight.titulo}</Text>
        <Text style={styles.accion}>{insight.accion}</Text>
        <Text style={styles.impacto}>📈 {insight.impacto}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius:    12,
    borderLeftWidth: 4,
    padding:         14,
    marginBottom:    12,
    flexDirection:   'row',
    gap:             12,
    shadowColor:     '#000',
    shadowOpacity:   0.06,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  icon:    { fontSize: 28, marginTop: 2 },
  content: { flex: 1 },
  titulo:  { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  accion:  { fontSize: 13, color: Colors.textLight, lineHeight: 18, marginBottom: 6 },
  impacto: { fontSize: 12, color: Colors.success, fontWeight: '600' },
});
