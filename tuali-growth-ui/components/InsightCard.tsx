import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Insight } from '@/services/api';

const ICONS  = { pedido: '🛒', promo: '🎁', zona: '📍' };
const LABELS = { pedido: 'Qué pedir', promo: 'Promoción', zona: 'Tu zona' };
const ACCENT = {
  pedido: Colors.insight.border.pedido,
  promo:  Colors.insight.border.promo,
  zona:   Colors.insight.border.zona,
};

type Props = {
  insight: Insight;
  onPress?: () => void;
};

export function InsightCard({ insight, onPress }: Props) {
  const tipo   = insight.tipo as keyof typeof ICONS;
  const color  = ACCENT[tipo] ?? Colors.primary;
  const bg     = Colors.insight[tipo]  ?? '#FFF';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color, backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Text style={styles.icon}>{ICONS[tipo] ?? '💡'}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.labelRow}>
          <View style={[styles.tipoBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.tipoText, { color }]}>{LABELS[tipo] ?? 'Recomendación'}</Text>
          </View>
        </View>
        <Text style={styles.titulo}>{insight.titulo}</Text>
        <Text style={styles.accion} numberOfLines={2}>{insight.accion}</Text>
        <View style={styles.impactoRow}>
          <Text style={styles.impactoIcon}>📈</Text>
          <Text style={styles.impacto}>{insight.impacto}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius:    14,
    borderLeftWidth: 4,
    padding:         14,
    marginBottom:    12,
    flexDirection:   'row',
    gap:             12,
    alignItems:      'flex-start',
    shadowColor:     '#000',
    shadowOpacity:   0.08,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 3 },
    elevation:       3,
  },
  iconWrap: {
    width:          48,
    height:         48,
    borderRadius:   12,
    justifyContent: 'center',
    alignItems:     'center',
    flexShrink:     0,
  },
  icon:    { fontSize: 26 },
  content: { flex: 1, gap: 5 },

  labelRow:  { flexDirection: 'row' },
  tipoBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tipoText:  { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },

  titulo:  { fontSize: 15, fontWeight: '800', color: Colors.text, lineHeight: 20 },
  accion:  { fontSize: 12, color: Colors.textLight, lineHeight: 17 },

  impactoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  impactoIcon:{ fontSize: 13 },
  impacto:    { fontSize: 12, color: Colors.success, fontWeight: '700' },
});
