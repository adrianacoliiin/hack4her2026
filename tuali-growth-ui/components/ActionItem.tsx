import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Action } from '@/services/api';

type Props = {
  action:     Action;
  onComplete: (id: string) => void;
  onSkip:     (id: string) => void;
};

const STATUS_LABEL: Record<string, string> = {
  pending:   '⏳ Pendiente',
  completed: '✅ Completada',
  skipped:   '⏭ Saltada',
};

export function ActionItem({ action, onComplete, onSkip }: Props) {
  const isPending = action.status === 'pending';

  return (
    <View style={[styles.card, !isPending && styles.cardDone]}>
      <Text style={styles.status}>{STATUS_LABEL[action.status]}</Text>
      <Text style={styles.recommendation} numberOfLines={3}>
        {action.recommendation}
      </Text>

      {isPending && (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, styles.btnComplete]}
            onPress={() => onComplete(action.action_id)}
          >
            <Text style={styles.btnCompleteText}>Lo hice ✓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSkip]}
            onPress={() => onSkip(action.action_id)}
          >
            <Text style={styles.btnSkipText}>Saltar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius:    12,
    padding:         14,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  cardDone: { opacity: 0.6 },
  status: {
    fontSize:     11,
    fontWeight:   '600',
    color:        Colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendation: {
    fontSize:   14,
    color:      Colors.text,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap:           8,
    marginTop:     12,
  },
  btn: {
    flex:           1,
    borderRadius:   8,
    paddingVertical: 8,
    alignItems:     'center',
  },
  btnComplete: { backgroundColor: Colors.primary },
  btnSkip:     { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  btnCompleteText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  btnSkipText:     { color: Colors.textLight, fontSize: 13 },
});
