import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen({ navigation, route }: any) {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);

  useEffect(() => {
    if (route.params?.prefillEmail) {
      setEmail(route.params.prefillEmail);
      setIsGoogleFlow(true);
    }
  }, [route.params]);

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

  const handleGoogleRegister = async () => {
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
            const { data: existingUser } = await supabase
              .from('users')
              .select('id')
              .eq('id', sessionData.user.id)
              .maybeSingle();

            if (existingUser) {
              await supabase.auth.signOut();
              Alert.alert('Cuenta registrada', 'Esta cuenta ya está registrada. Por favor, inicia sesión.');
              navigation.navigate('Login', { prefillEmail: sessionData.user.email });
            } else {
              setEmail(sessionData.user.email || '');
              setIsGoogleFlow(true);
              Alert.alert('Casi listo', 'Por favor, completa tus datos y elige una contraseña para tu cuenta.');
            }
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión con Google');
    }
  };

  const handleRegister = async () => {
    if (!nombres || !email || !password) {
      Alert.alert('Error', 'Nombres, email y contraseña son obligatorios.');
      return;
    }

    try {
      let userId: string | undefined;

      if (isGoogleFlow) {
        const { data, error: updateError } = await supabase.auth.updateUser({
          password: password,
        });
        if (updateError) throw updateError;
        userId = data.user?.id;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;
        userId = data.user?.id;
      }

      if (userId) {
        const { error: insertError } = await supabase.from('users').insert({
          id: userId,
          email: email.trim(),
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          telefono: phone.trim(),
          role: 'passenger',
        });

        if (insertError) throw insertError;

        Alert.alert('Éxito', 'Cuenta creada exitosamente.');
        await supabase.auth.signOut();
        navigation.navigate('Login', { prefillEmail: email });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear la cuenta.');
    }
  };

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

        {!isGoogleFlow && (
          <View style={{ width: '100%', marginBottom: Spacing.lg }}>
            <TouchableOpacity 
              style={[styles.socialBtn, { marginBottom: Spacing.md }]}
              onPress={handleGoogleRegister}
            >
              <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
              <Text style={styles.socialText}>Registrarse con Google</Text>
            </TouchableOpacity>
            
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>O REGISTRAR CON CORREO</Text>
              <View style={styles.divider} />
            </View>
          </View>
        )}

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
            style={[styles.input, isGoogleFlow && { backgroundColor: Colors.borderLight }]}
            placeholder="usuario@ejemplo.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isGoogleFlow}
          />
          <Text style={styles.label}>CONTRASEÑA</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
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
            onPress={handleRegister}
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
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.white, borderRadius: Radius.md, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  socialText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 11, color: Colors.textMuted, marginHorizontal: Spacing.sm, letterSpacing: 1 },
});
