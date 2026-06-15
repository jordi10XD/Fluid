import { Platform } from 'react-native';
import { OneSignal, LogLevel } from 'react-native-onesignal';

const ONESIGNAL_APP_ID = 'f881f787-edb7-4fd8-8704-4c7143b6682b';

/**
 * Inicializa OneSignal SDK.
 * Debe llamarse UNA sola vez al montar la app (en RoleProvider o App.tsx).
 */
export function initOneSignal() {
  // Debug — quitar en producción
  OneSignal.Debug.setLogLevel(LogLevel.Warn);

  // Inicializar con el App ID
  OneSignal.initialize(ONESIGNAL_APP_ID);

  // Solicitar permisos de notificación (muestra diálogo nativo)
  OneSignal.Notifications.requestPermission(true);
}

/**
 * Vincula el dispositivo con el usuario de Supabase.
 * OneSignal usará este externalId para segmentar envíos.
 * @param supabaseUserId - UUID del usuario en auth.users / public.users
 */
export function loginOneSignal(supabaseUserId: string) {
  OneSignal.login(supabaseUserId);
}

/**
 * Desvincula el dispositivo del usuario actual.
 * Llamar al cerrar sesión.
 */
export function logoutOneSignal() {
  OneSignal.logout();
}
