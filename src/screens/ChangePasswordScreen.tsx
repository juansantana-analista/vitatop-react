import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { editarSenha } from '../services/user';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [reNovaSenha, setReNovaSenha] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    if (!senhaAtual || !novaSenha || !reNovaSenha) {
      return Alert.alert('Atenção', 'Preencha todos os campos.');
    }
    if (novaSenha !== reNovaSenha) {
      return Alert.alert('Atenção', 'As senhas não coincidem.');
    }
    try {
      setSaving(true);
      await editarSenha({ senhaAtual, novaSenha });
      Alert.alert('Sucesso', 'Senha alterada com sucesso.');
      setSenhaAtual('');
      setNovaSenha('');
      setReNovaSenha('');
      (navigation as any).navigate('Profile');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao alterar a senha');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#00591f' }}>
        <StatusBar style="light" backgroundColor="#00591f" />
      </SafeAreaView>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => (navigation as any).goBack?.()}>
            <Icon name="arrow-left" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Alterar Senha</Text>
            <Text style={styles.subtitle}>Mantenha sua conta segura</Text>
          </View>
        </View>

        <View style={[styles.content, { paddingBottom: 16 + insets.bottom }]}>
          <Text style={styles.label}>Senha atual</Text>
          <TextInput style={styles.input} value={senhaAtual} onChangeText={setSenhaAtual} secureTextEntry />

          <Text style={styles.label}>Nova senha</Text>
          <TextInput style={styles.input} value={novaSenha} onChangeText={setNovaSenha} secureTextEntry />

          <Text style={styles.label}>Confirmar nova senha</Text>
          <TextInput style={styles.input} value={reNovaSenha} onChangeText={setReNovaSenha} secureTextEntry />

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={onSubmit} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  topBar: { height: 72, backgroundColor: '#00591f', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#e4ffe8', fontSize: 12, marginTop: 2 },
  content: { padding: 14 },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#FFFFFF' },
  saveBtn: { marginTop: 16, backgroundColor: '#00591f', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700' },
});


