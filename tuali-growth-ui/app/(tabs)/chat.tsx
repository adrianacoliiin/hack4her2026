import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ChatBubble } from '@/components/ChatBubble';
import { api, Message, DEMO_CUSTOMER_ID } from '@/services/api';

const SUGGESTIONS = [
  '¿Qué debería pedir esta semana?',
  '¿Cómo puedo aumentar mi ticket?',
  '¿Qué venden mis vecinos que yo no tengo?',
  'No me llegó la Coca-Cola, ¿qué vendo?',
];

export default function ChatScreen() {
  const params             = useLocalSearchParams<{ prefill?: string }>();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu agente de crecimiento 🤖\n¿En qué te puedo ayudar hoy?' },
  ]);
  const [input,   setInput]   = useState(params.prefill ?? '');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (params.prefill) setInput(params.prefill);
  }, [params.prefill]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg };
    const history = messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0);

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { reply } = await api.sendMessage(
        DEMO_CUSTOMER_ID,
        msg,
        history,
      );
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: 'Hubo un error. Intenta de nuevo 🙏',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Mensajes */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Indicador de carga */}
      {loading && (
        <View style={styles.thinkingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.thinkingText}>El agente está pensando...</Text>
        </View>
      )}

      {/* Sugerencias rápidas (solo al inicio) */}
      {messages.length === 1 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity key={i} style={styles.chip} onPress={() => send(s)}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu pregunta..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={300}
          onSubmitEditing={() => send()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  messages:     { padding: 16, paddingBottom: 8 },

  thinkingRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    paddingHorizontal: 16,
    paddingBottom:  6,
  },
  thinkingText: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },

  suggestions: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            8,
    padding:        12,
    paddingBottom:  4,
  },
  chip: {
    backgroundColor: Colors.card,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     Colors.primary,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  chipText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  inputRow: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    padding:        12,
    gap:            8,
    backgroundColor: Colors.white,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
  },
  input: {
    flex:            1,
    backgroundColor: Colors.background,
    borderRadius:    20,
    paddingHorizontal: 16,
    paddingVertical:   10,
    fontSize:        14,
    color:           Colors.text,
    maxHeight:       100,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width:           42,
    height:          42,
    borderRadius:    21,
    justifyContent:  'center',
    alignItems:      'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendIcon:        { color: Colors.white, fontSize: 16 },
});
