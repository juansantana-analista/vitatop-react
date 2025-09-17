import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [step, setStep] = useState<'email' | 'code' | 'newpass'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const sendCode = async () => {
    try {
      const response = await fetch('https://vitatop.tecskill.com.br/api/request_reset.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.status === 'success' && data.data?.status === 'success') {
        setStep('code');
      } else {
        Alert.alert('Erro', data.message || 'Falha ao solicitar código.');
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar o código.');
    }
  };

  const verifyCode = async () => {
    try {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      };
      const response = await fetch('https://vitatop.tecskill.com.br/api/validate_code.php', options);
      const data = await response.json();
      if (data.status === 'success' && data.data?.status === 'success') {
        setStep('newpass');
      } else {
        Alert.alert('Código Inválido', data.message || 'Código informado inválido ou expirado.');
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível validar o código.');
    }
  };

  const resetPassword = async () => {
    if (!password || !password2 || password !== password2) {
      return Alert.alert('Erro', 'As senhas não coincidem. Por favor, tente novamente');
    }
    try {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password })
      } as RequestInit;
      const response = await fetch('https://vitatop.tecskill.com.br/api/reset_password.php', options);
      const data = await response.json();
      if (data.status === 'success' && data.data?.status === 'success') {
        Alert.alert('Sucesso', 'Sucesso, Senha alterada.');
        navigation.replace('Login');
      } else {
        Alert.alert('Erro', data.message || 'Não foi possível alterar a senha.');
      }
    } catch (e) {
      Alert.alert('Erro', 'Falha ao redefinir senha.');
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
        {step === 'email' && (
          <View style={styles.card}>
            <Text style={styles.title}>Recuperar Senha</Text>
            <Text style={styles.subtitle}>Digite seu e-mail para recuperar sua senha</Text>
            <TextInput
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: '#e64400' }]} onPress={sendCode}>
              <Text style={styles.buttonText}>Enviar Código</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Voltar para o login</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'code' && (
          <View style={styles.card}>
            <Text style={styles.title}>Verificação</Text>
            <Text style={styles.subtitle}>Digite o código de 6 dígitos enviado para seu e-mail</Text>
            <TextInput
              placeholder="Código de verificação"
              autoCapitalize="characters"
              value={code}
              onChangeText={setCode}
              maxLength={6}
              style={styles.input}
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: '#e64400' }]} onPress={verifyCode}>
              <Text style={styles.buttonText}>Verificar Código</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Voltar para o login</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'newpass' && (
          <View style={styles.card}>
            <Text style={styles.title}>Nova Senha</Text>
            <Text style={styles.subtitle}>Digite sua nova senha</Text>
            <TextInput placeholder="Nova Senha" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
            <TextInput placeholder="Confirmar Nova Senha" secureTextEntry value={password2} onChangeText={setPassword2} style={styles.input} />
            <TouchableOpacity style={[styles.button, { backgroundColor: '#e64400' }]} onPress={resetPassword}>
              <Text style={styles.buttonText}>Redefinir Senha</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { width: '100%', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#f4f6f8', borderRadius: 10, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: '#e3e7eb', marginBottom: 12 },
  button: { width: '100%', height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#e64400', fontWeight: '600', marginTop: 12 }
});


