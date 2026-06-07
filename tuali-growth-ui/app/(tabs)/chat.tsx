import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ChatBubble } from '@/components/ChatBubble';
import { api, Message } from '@/services/api';
import { useAuth } from '../../api/authContext';

const SUGGESTIONS = [
  '¿Qué debería pedir esta semana?',
  '¿Cómo puedo aumentar mi ticket?',
  '¿Qué venden mis vecinos que yo no tengo?',
  'No me llegó la Coca-Cola, ¿qué vendo?',
];

const FOLLOW_UPS = [
  '¿Cómo lo aplico esta semana?',
  '¿Puedes darme más detalle?',
  '¿Cuánto podría ganar con eso?',
  '¿Qué más puedo mejorar?',
  '¿Tienes otra recomendación?',
];

export default function ChatScreen() {
  const params  = useLocalSearchParams<{ prefill?: string }>();
  const { user } = useAuth();
  const customerId  = user?.customer_id ?? 0;
  const personaType = user?.persona_type;

  const greeting = personaType === 'asistido'
    ? `¡Hola! Soy tu agente de Tuali 🤖\n¿Qué necesitas hoy?`
    : personaType === 'familiar'
    ? `¡Hola! Soy tu agente de crecimiento 🤖\n¿En qué te ayudo hoy?`
    : `¡Hola! Soy tu agente de crecimiento 🤖\n¿En qué te puedo ayudar hoy?`;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: greeting },
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
        customerId,
        msg,
        history,
        undefined,
        personaType,
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

      {/* Sugerencias: todas al inicio, 1 follow-up tras cada respuesta del agente */}
      {messages.length === 1 ? (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity key={i} style={styles.chip} onPress={() => send(s)}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : messages[messages.length - 1]?.role === 'assistant' && !loading ? (
        <View style={styles.suggestions}>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => send(FOLLOW_UPS[Math.floor(messages.length / 2) % FOLLOW_UPS.length])}
          >
            <Text style={styles.chipText}>
              {FOLLOW_UPS[Math.floor(messages.length / 2) % FOLLOW_UPS.length]}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

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
          onPress={() => send()}
          disabled={!input.trim() || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={(!input.trim() || loading)
              ? [Colors.border, Colors.border]
              : [Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendBtn}
          >
            <Ionicons name="send" size={18} color={Colors.white} />
          </LinearGradient>
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
    backgroundColor:   Colors.white,
    borderRadius:      20,
    borderWidth:       1.5,
    borderColor:       Colors.primary + '60',
    paddingHorizontal: 14,
    paddingVertical:   7,
    shadowColor:       Colors.primary,
    shadowOpacity:     0.1,
    shadowRadius:      4,
    shadowOffset:      { width: 0, height: 1 },
    elevation:         1,
  },
  chipText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  inputRow: {
    flexDirection:   'row',
    alignItems:      'flex-end',
    padding:         12,
    gap:             8,
    backgroundColor: Colors.white,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
  },
  input: {
    flex:              1,
    backgroundColor:   Colors.background,
    borderRadius:      22,
    paddingHorizontal: 16,
    paddingVertical:   10,
    fontSize:          14,
    color:             Colors.text,
    maxHeight:         100,
    borderWidth:       1,
    borderColor:       Colors.border,
  },
  sendBtn: {
    width:          42,
    height:         42,
    borderRadius:   21,
    justifyContent: 'center',
    alignItems:     'center',
    shadowColor:    Colors.primary,
    shadowOpacity:  0.3,
    shadowRadius:   6,
    shadowOffset:   { width: 0, height: 2 },
    elevation:      3,
  },
});
