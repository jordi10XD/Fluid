import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.inner}>
        <View style={styles.iconBox}>
          <Ionicons name="refresh-circle-outline" size={36} color={Colors.white} />
        </View>
        <Text style={styles.title}>Recuperar Clave</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo para recibir un código de verificación
        </Text>

        <View style={styles.card}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>PASO 01 DE 03</Text>
          </View>
          <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="ejemplo@logistica.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => { setSent(true); }}
          >
            <Text style={styles.sendBtnText}>Enviar Código</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>

          {sent && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.successText}>Código enviado a {email}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={16} color={Colors.primary} />
            <Text style={styles.backText}>Volver al Inicio de Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>TERMINAL</Text>
            <Text style={styles.metaValue}>Quitumbe</Text>
          </View>
          <View style={styles.metaSep} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>PROTOCOLO</Text>
            <Text style={styles.metaValue}>RF-G04</Text>
          </View>
        </View>
        <Text style={styles.copyright}>LOGÍSTICA FLUIDA © 2024</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: 80, paddingBottom: 40 },
  iconBox: {
    width: 80, height: 80, borderRadius: Radius.lg, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, ...Shadow.md,
  },
  title: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg,
    width: '100%', ...Shadow.md, marginBottom: Spacing.xl,
  },
  stepBadge: {
    backgroundColor: Colors.borderLight, borderRadius: Radius.full, alignSelf: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginBottom: Spacing.lg,
  },
  stepText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.accent, letterSpacing: 1, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 18, marginBottom: Spacing.md,
  },
  sendBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#DCFCE7', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  successText: { color: Colors.success, fontSize: 13, fontWeight: '600' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: Spacing.sm },
  backText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  footerMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  metaItem: { alignItems: 'center' },
  metaLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 1, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  metaSep: { width: 1, height: 30, backgroundColor: Colors.border },
  copyright: { fontSize: 10, color: Colors.textMuted, letterSpacing: 2, marginTop: Spacing.md },
});
