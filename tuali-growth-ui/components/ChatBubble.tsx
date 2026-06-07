import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

type Props = {
  role:    'user' | 'assistant';
  content: string;
};

export function ChatBubble({ role, content }: Props) {
  const isUser = role === 'user';

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAgent]}>
      {!isUser && <Text style={styles.avatar}>🤖</Text>}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAgent]}>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:      { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  wrapperUser:  { justifyContent: 'flex-end' },
  wrapperAgent: { justifyContent: 'flex-start' },
  avatar:       { fontSize: 22, marginBottom: 2 },
  bubble: {
    maxWidth:     '78%',
    borderRadius: 16,
    padding:      12,
    shadowColor:  '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation:    1,
  },
  bubbleUser:  {
    backgroundColor:     Colors.bubble.user,
    borderBottomRightRadius: 4,
  },
  bubbleAgent: {
    backgroundColor:    Colors.bubble.agent,
    borderBottomLeftRadius: 4,
  },
  text:      { fontSize: 14, lineHeight: 20 },
  textUser:  { color: Colors.bubble.userText },
  textAgent: { color: Colors.bubble.agentText },
});
