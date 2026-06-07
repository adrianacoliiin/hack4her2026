import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Device         from 'expo-device';
import { Platform }        from 'react-native';

// ── Configurar cómo se muestran las notificaciones ───────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
});

// ── Pedir permisos ────────────────────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notificaciones solo funcionan en dispositivo físico');
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permisos de notificación denegados');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tuali', {
      name:       'Tuali Growth Agent',
      importance:  Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E8001A',
    });
  }

  return true;
}

// ── Enviar notificación local inmediata ───────────────────────────────────────
export async function sendLocalNotification(
  titulo:  string,
  cuerpo:  string,
  data?:   Record<string, string>,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body:  cuerpo,
      data:  data ?? {},
      sound: true,
    },
    trigger: null, // null = inmediata
  });
}

// ── Notificación de entrega cercana ──────────────────────────────────────────
export async function notifyDeliveryNearby(minutes = 20): Promise<void> {
  await sendLocalNotification(
    '🚚 Tu pedido está en camino',
    `El repartidor estará en tu tienda en ~${minutes} minutos. ¡Prepárate!`,
    { screen: 'progreso' },
  );
}

// ── Notificación de entrega completada ───────────────────────────────────────
export async function notifyDeliveryCompleted(): Promise<void> {
  await sendLocalNotification(
    '📦 ¡Pedido entregado!',
    'Tu pedido fue entregado. Revisa que todo esté completo.',
    { screen: 'progreso' },
  );
}

// ── Notificación de recomendación del agente ─────────────────────────────────
export async function notifyNewRecommendation(texto: string): Promise<void> {
  await sendLocalNotification(
    '💡 Tu agente tiene una recomendación',
    texto.slice(0, 100),
    { screen: 'chat' },
  );
}

// ── Notificación de progreso de meta ─────────────────────────────────────────
export async function notifyGoalProgress(pct: number): Promise<void> {
  const emoji = pct >= 100 ? '🏆' : pct >= 50 ? '🎯' : '📈';
  await sendLocalNotification(
    `${emoji} Progreso de tu meta: ${pct}%`,
    pct >= 100
      ? '¡Felicidades! Completaste tu meta de esta semana.'
      : `Llevas ${pct}% de tu meta. ¡Sigue así!`,
    { screen: 'progreso' },
  );
}

// ── Programar recordatorio semanal (cada lunes 9am) ──────────────────────────
export async function scheduleWeeklyReminder(): Promise<void> {
  // Cancela recordatorios anteriores
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📅 ¡Nueva semana, nuevas recomendaciones!',
      body:  'Tu agente de crecimiento ya preparó tus insights de esta semana.',
      data:  { screen: 'index' },
    },
    trigger: {
      type:    SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2, // Lunes (1=Domingo, 2=Lunes)
      hour:    9,
      minute:  0,
    },
  });
}