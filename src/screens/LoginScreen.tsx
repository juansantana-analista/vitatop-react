import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obterPessoaIdPorUserId } from '../services/user';
import { setAuthTokenProvider } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      return Alert.alert('Erro!', 'Por favor, verifique seu Email e Senha e tente novamente.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      return Alert.alert('Erro!', 'E-mail inválido.');
    }

    try {
      const response = await fetch('https://vitatop.tecskill.com.br/api/auth_app.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: emailTrim, userPassword: password })
      });
      const data = await response.json();
      if (data.status === 'success') {
        const token: string = data.data;
        // Decodifica token e salva infos essenciais
        const decoded: any = jwtDecode(token);
        try {
          await AsyncStorage.setItem('auth_token', token);
          await AsyncStorage.setItem('auth_claims', JSON.stringify(decoded));
          const userId = String(decoded?.data?.id || decoded?.sub || decoded?.id || '');
          const pessoaIdFromJwt = String(decoded?.data?.pessoa_id || decoded?.pessoa_id || '');
          if (userId) await AsyncStorage.setItem('userId', userId);
          if (pessoaIdFromJwt) await AsyncStorage.setItem('pessoaId', pessoaIdFromJwt);
        } catch {}
        (globalThis as any).auth = { token, decoded };
        setAuthTokenProvider(() => (globalThis as any)?.auth?.token);
        navigation.replace('Home');
      } else {
        Alert.alert('Falha no Login', `Erro no login: ${data.message || 'Dados inválidos'}`);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível completar o login.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      {/* Paint top safe area to white to match screen background and keep icons visible */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#ffffff' }}>
        <StatusBar style="dark" backgroundColor="#ffffff" />
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.inner}>
        <Image source={require('../../assets/logo.png')} resizeMode="contain" style={styles.logo} />

        <View style={styles.inputGroup}>
          <TextInput
            placeholder="E-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#00591f', marginBottom: 15 }]} onPress={onSubmit}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgot}>Esqueceu a senha?</Text>
        </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logo: { width: 160, height: 80, marginBottom: 24 },
  inputGroup: { width: '100%', marginBottom: 12 },
  input: {
    width: '100%',
    backgroundColor: '#f4f6f8',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#e3e7eb'
  },
  button: { width: '100%', height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  forgot: { color: '#e64400', fontWeight: '600' }
});


