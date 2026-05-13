import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen({ navigation }: any) {
  const [password, setPassword] = useState('');

  const handleUpdate = async () => {
    if (!password) {
      Alert.alert('Error', 'Debes ingresar una contraseña');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      Alert.alert('Éxito', 'Tu contraseña ha sido actualizada.');
      await supabase.auth.signOut();
      navigation.replace('Login');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar la contraseña.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.inner}>
        <View style={styles.iconBox}>
          <Ionicons name="key-outline" size={36} color={Colors.white} />
        </View>
        <Text style={styles.title}>Nueva Clave</Text>
        <Text style={styles.subtitle}>
          Escribe tu nueva contraseña para recuperar el acceso a tu cuenta.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleUpdate}
          >
            <Text style={styles.sendBtnText}>Actualizar Contraseña</Text>
            <Ionicons name="checkmark" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
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
  label: { fontSize: 11, fontWeight: '700', color: Colors.accent, letterSpacing: 1, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.success, borderRadius: Radius.md, padding: 18, marginBottom: Spacing.md,
  },
  sendBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
