import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Action } from '@/services/api';

type Props = {
  action:     Action;
  onComplete: (id: string) => void;
  onSkip:     (id: string) => void;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending:   { label: 'Pendiente',  color: Colors.warning,   icon: 'time-outline' },
  completed: { label: 'Completada', color: Colors.success,   icon: 'checkmark-circle-outline' },
  skipped:   { label: 'Saltada',    color: Colors.textMuted, icon: 'play-skip-forward-outline' },
};

export function ActionItem({ action, onComplete, onSkip }: Props) {
  const isPending = action.status === 'pending';
  const cfg = STATUS_CONFIG[action.status] ?? STATUS_CONFIG.pending;

  return (
    <View style={[styles.card, !isPending && styles.cardDone]}>
      <View style={styles.statusRow}>
        <Ionicons name={cfg.icon} size={14} color={cfg.color} />
        <Text style={[styles.status, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      <Text style={styles.recommendation} numberOfLines={4}>
        {action.recommendation}
      </Text>

      {isPending && (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.btnSkip}
            onPress={() => onSkip(action.action_id)}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward-outline" size={14} color={Colors.textLight} />
            <Text style={styles.btnSkipText}>Saltar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onComplete(action.action_id)}
            activeOpacity={0.85}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnComplete}
            >
              <Ionicons name="checkmark-outline" size={16} color={Colors.white} />
              <Text style={styles.btnCompleteText}>Lo hice</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius:    14,
    padding:         16,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     Colors.border,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  cardDone: { opacity: 0.55 },

  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    marginBottom:  8,
  },
  status: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },

  recommendation: { fontSize: 14, color: Colors.text, lineHeight: 21, fontWeight: '500' },

  buttons: { flexDirection: 'row', gap: 8, marginTop: 14 },

  btnSkip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    borderRadius:    10,
    paddingVertical:  9,
    paddingHorizontal: 14,
    backgroundColor: Colors.background,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  btnSkipText: { color: Colors.textLight, fontSize: 13, fontWeight: '600' },

  btnComplete: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             6,
    borderRadius:    10,
    paddingVertical:  9,
    shadowColor:     Colors.primary,
    shadowOpacity:   0.3,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       3,
  },
  btnCompleteText: { color: Colors.white, fontWeight: '800', fontSize: 13 },
});
