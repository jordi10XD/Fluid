import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
// using Supabase OAuth directly
import { makeRedirectUri } from 'expo-auth-session';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { useRole, UserRole } from '../../context/RoleContext';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const ROLES: { key: UserRole; label: string; desc: string; color: string }[] = [
  { key: 'pasajero', label: 'Pasajero', desc: 'Consultar rutas y rastrear buses', color: Colors.accent },
  { key: 'conductor', label: 'Conductor', desc: 'Gestionar ruta asignada', color: Colors.success },
  { key: 'admin', label: 'Administrador', desc: 'Panel de control logístico', color: Colors.warning },
];

export default function LoginScreen({ navigation }: any) {
  const { setRole, setUserName } = useRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('pasajero');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      setError(true);
      return;
    }
    setError(false);
    setRole(selectedRole);
    setUserName(email.split('@')[0] || 'Usuario');
    navigation.replace('App');
  };

  const handleQuickLogin = (role: UserRole, label: string) => {
    setRole(role);
    setUserName(`Dev ${label}`);
    navigation.replace('App');
  };

  const redirectUri = makeRedirectUri({
    scheme: 'com.logicube.fluidapp',
  });

  const getParamsFromUrl = (url: string) => {
    const hash = url.split('#')[1];
    if (!hash) return {};
    return hash.split('&').reduce((acc, item) => {
      const [key, value] = item.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  };

  const handleUserRedirection = async (user: any) => {
    if (!user || !user.email) return;
    
    try {
      // 1) Verificar directamente en driver_profiles si el correo es de conductor
      const { data: driverMatch } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();

      const isDriver = !!driverMatch;

      // 2) Actualizar/crear el registro en public.users con el rol correcto
      const newRole = isDriver ? 'operator' : 'passenger';
      await supabase
        .from('users')
        .upsert(
          { id: user.id, email: user.email, role: newRole },
          { onConflict: 'id' }
        );

      // 3) Redirigir según el rol
      if (isDriver) {
        setRole('conductor');
        setUserName(user.email.split('@')[0]);
        Alert.alert('¡Bienvenido Conductor!', 'Se ha detectado tu perfil de conductor.');
      } else {
        setRole('pasajero');
        setUserName(user.email.split('@')[0]);
      }
      navigation.replace('App');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo verificar el rol del usuario.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) return;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success' && result.url) {
        const params = getParamsFromUrl(result.url);

        if (params.access_token && params.refresh_token) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          
          if (sessionError) throw sessionError;
          
          if (sessionData.user) {
            handleUserRedirection(sessionData.user);
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="radio-outline" size={20} color={Colors.white} />
            </View>
            <Text style={styles.logoText}>Logística Fluida</Text>
          </View>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>Gestiona tus operaciones con autoridad técnica.</Text>
        </View>

        {/* Role Selector */}
        <View style={styles.roleContainer}>
          <Text style={styles.sectionLabel}>SELECCIONE SU ROL</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.roleChip,
                  selectedRole === r.key && { backgroundColor: r.color, borderColor: r.color },
                ]}
                onPress={() => handleQuickLogin(r.key, r.label)}
              >
                <Text style={[
                  styles.roleChipText,
                  selectedRole === r.key && { color: Colors.white },
                ]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.roleInfo}>
            <Ionicons name="information-circle" size={18} color={Colors.primaryLight} />
            <Text style={styles.roleInfoText}>
              <Text style={{ fontWeight: '700' }}>Acceso Rápido (Dev): </Text>
              Presiona cualquier rol para entrar directamente y probar las interfaces sin escribir credenciales.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.sectionLabel}>CORREO ELECTRÓNICO</Text>
          <TextInput
            style={styles.input}
            placeholder="nombre@terminal.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>CONTRASEÑA</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Olvidé mi contraseña</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputRow, error && styles.inputError]}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye' : 'eye-off'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          {error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={Colors.danger} />
              <Text style={styles.errorText}>Completa todos los campos para continuar.</Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>Entrar</Text>
        </TouchableOpacity>

        {/* Social */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>O CONTINUAR CON</Text>
          <View style={styles.divider} />
        </View>
        <View style={styles.socialRow}>
          <TouchableOpacity 
            style={[styles.socialBtn, { flex: undefined, width: '100%' }]}
            onPress={handleGoogleLogin}
          >
            <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
            <Text style={styles.socialText}>Continuar con Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Nuevo en el sistema? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Registrar nueva cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: Spacing.xl },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  logoIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  logoText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 36, fontWeight: '800', color: Colors.primary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  roleContainer: { marginBottom: Spacing.lg },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  roleChip: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
    backgroundColor: Colors.white,
  },
  roleChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  roleInfo: {
    flexDirection: 'row', backgroundColor: '#EEF2FF', borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm,
  },
  roleInfoText: { flex: 1, fontSize: 13, color: Colors.primaryLight, lineHeight: 18 },
  form: { marginBottom: Spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  forgotText: { fontSize: 14, color: Colors.accent, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  inputError: { borderColor: Colors.danger, borderLeftWidth: 4 },
  eyeBtn: { padding: Spacing.md },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  errorText: { fontSize: 13, color: Colors.danger },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: 18, alignItems: 'center', marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  loginBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 11, color: Colors.textMuted, marginHorizontal: Spacing.sm, letterSpacing: 1 },
  socialRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.white, borderRadius: Radius.md, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  socialText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
