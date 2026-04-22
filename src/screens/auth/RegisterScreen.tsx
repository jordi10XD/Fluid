import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

export default function RegisterScreen({ navigation }: any) {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <View style={styles.iconBox}>
            <Ionicons name="git-network-outline" size={32} color={Colors.white} />
          </View>
        </View>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Únete a la red de transporte más eficiente.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>NOMBRES</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tus nombres"
            placeholderTextColor={Colors.textMuted}
            value={nombres}
            onChangeText={setNombres}
          />
          <Text style={styles.label}>APELLIDOS</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tus apellidos"
            placeholderTextColor={Colors.textMuted}
            value={apellidos}
            onChangeText={setApellidos}
          />
          <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
          <TextInput
            style={styles.input}
            placeholder="usuario@ejemplo.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>TELÉFONO</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phoneCode}>
              <Text style={styles.phoneCodeText}>+593</Text>
            </View>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="099 999 9999"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.protocolBadge}>
            <Text style={styles.protocolText}>RF-G04 SECURE PROTOCOL</Text>
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.registerBtnText}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  iconWrap: { marginBottom: Spacing.md },
  iconBox: {
    width: 80, height: 80, borderRadius: Radius.lg, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', ...Shadow.md,
  },
  title: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.xl, textAlign: 'center' },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg,
    width: '100%', ...Shadow.md, marginBottom: Spacing.lg,
  },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 6, marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: 15, color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  phoneCode: {
    backgroundColor: Colors.borderLight, borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  phoneCodeText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  protocolBadge: { alignItems: 'center', marginBottom: Spacing.md },
  protocolText: { fontSize: 10, letterSpacing: 2, color: Colors.textMuted },
  registerBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: 18, alignItems: 'center', ...Shadow.sm,
  },
  registerBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.sm },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
