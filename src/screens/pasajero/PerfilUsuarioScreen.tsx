import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { useRole } from '../../context/RoleContext';
import { supabase } from '../../lib/supabase';

const MENU_ITEMS = [
  { icon: 'person-outline', title: 'Mis Datos', desc: 'Información personal y operativa' },
  { icon: 'settings-outline', title: 'Configuración de Cuenta', desc: 'Privacidad y credenciales' },
  { icon: 'notifications-outline', title: 'Notificaciones', desc: 'Alertas y mensajes de sistema' },
  { icon: 'headset-outline', title: 'Ayuda', desc: 'Soporte técnico 24/7' },
];

export default function PerfilUsuarioScreen({ navigation }: any) {
  const { role, setRole, setUserName, setSupabaseUserId } = useRole();
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (userData) {
        if (userData.role === 'operator') {
          const { data: driverData } = await supabase.from('driver_profiles').select('*').eq('id', user.id).maybeSingle();
          if (driverData) {
            setProfileData({ ...userData, ...driverData, realName: driverData.nombre });
          } else {
            setProfileData({ ...userData, realName: userData.nombres });
          }
        } else {
          setProfileData({ ...userData, realName: userData.nombres || user.email?.split('@')[0] });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole('pasajero');
    setUserName('Usuario');
    setSupabaseUserId(null);
    navigation.replace('Login');
  };

  const displayName = profileData?.realName || 'Cargando...';
  const displayEmail = profileData?.email || '...';
  const displayPhone = profileData?.telefono || '...';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>Logística Fluida</Text>
          <Ionicons name="radio-outline" size={20} color={Colors.white} />
        </View>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarFrame}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={50} color={Colors.primary} />
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={12} color={Colors.white} />
          </View>
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        <View style={styles.idRow}>
          <Ionicons name="mail-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.idText}>{displayEmail}</Text>
        </View>
        <View style={styles.idRow}>
          <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.idText}>{displayPhone}</Text>
        </View>
        <View style={styles.secureBadge}>
          <Ionicons name="lock-closed-outline" size={12} color={Colors.primary} />
          <Text style={styles.secureBadgeText}>CONEXIÓN SEGURA</Text>
        </View>
      </View>

      {/* Network Status */}
      <View style={styles.networkCard}>
        <Text style={styles.networkLabel}>ESTADO DE RED</Text>
        <Text style={styles.networkTitle}>Enlace Satelital Activo</Text>
        <Text style={styles.networkStat}>98%</Text>
        <Text style={styles.networkDesc}>Estabilidad de Señal</Text>
        <Ionicons name="bus" size={80} color="rgba(255,255,255,0.08)" style={styles.busWatermark} />
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <Ionicons name={item.icon as any} size={22} color={Colors.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
      <Text style={styles.version}>VERSIÓN DEL SISTEMA 4.2.0-ALPHA</Text>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoText: { fontSize: 18, fontWeight: '700', color: Colors.white },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarFrame: { position: 'relative', marginBottom: Spacing.md },
  avatarPlaceholder: {
    width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: Colors.primary,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white,
  },
  userName: { fontSize: 24, fontWeight: '800', color: Colors.primary, textAlign: 'center', marginBottom: 6 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  idText: { fontSize: 14, color: Colors.textSecondary },
  secureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accentLight + '40', borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  secureBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
  networkCard: {
    backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg, overflow: 'hidden', position: 'relative',
  },
  networkLabel: { fontSize: 10, color: Colors.accentLight, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  networkTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, marginBottom: Spacing.sm },
  networkStat: { fontSize: 40, fontWeight: '900', color: Colors.white },
  networkDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  busWatermark: { position: 'absolute', right: -10, bottom: -10 },
  menuSection: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.xl,
    overflow: 'hidden', ...Shadow.sm, marginBottom: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuIconBox: {
    width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  menuTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  menuDesc: { fontSize: 12, color: Colors.textMuted },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing.lg, backgroundColor: '#FEF2F2', borderRadius: Radius.md,
    padding: 16, marginBottom: Spacing.sm,
  },
  logoutText: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.danger },
  logoutBadge: { backgroundColor: Colors.danger + '20', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  logoutBadgeText: { fontSize: 11, color: Colors.danger, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 11, color: Colors.textMuted, letterSpacing: 1 },
});
