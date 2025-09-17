import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Linking, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { listarPessoa, getFotoUrl, editarPessoaPerfil, editarFotoPerfil } from '../services/user';
import { useUser } from '../hooks/useUser';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { logout } = useUser();
  const [pessoa, setPessoa] = useState<any | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(undefined);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await listarPessoa();
        setPessoa(p);
        setFotoUrl(getFotoUrl(p?.foto));
        setNome(p?.nome || '');
        setEmail(p?.email || '');
        setTelefone(p?.celular || '');
      } catch (e) {}
    })();
  }, []);

  const onEditPhoto = () => {
    Alert.alert(
      'Trocar foto',
      'Escolha uma opção',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Câmera', onPress: () => pickImage('camera') },
        { text: 'Galeria', onPress: () => pickImage('gallery') },
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      } as any;

      let result: any;
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permissão negada', 'É necessário permitir acesso à câmera.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0] as any;
        if (asset.base64) {
          let mime: string | undefined = asset.mimeType;
          if (!mime && asset.fileName) {
            const name: string = String(asset.fileName).toLowerCase();
            if (name.endsWith('.png')) mime = 'image/png';
            else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mime = 'image/jpeg';
            else if (name.endsWith('.heic') || name.endsWith('.heif')) mime = 'image/heic';
          }
          if (!mime) mime = 'image/jpeg';
          await uploadPhoto(asset.base64, mime);
        } else {
          Alert.alert('Erro', 'Não foi possível processar a imagem.');
        }
      }
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao selecionar imagem: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const uploadPhoto = async (base64: string, mime: string) => {
    try {
      setUploadingPhoto(true);
      const dataUrl = `data:${mime};base64,${base64}`;
      await editarFotoPerfil({ fotoBase64: dataUrl });
      setFotoUrl(dataUrl);
      Alert.alert('Sucesso', 'Foto atualizada com sucesso.');
      try {
        const p = await listarPessoa();
        setPessoa(p);
        const apiFotoUrl = getFotoUrl((p as any)?.foto || (p as any)?.foto_perfil);
        if (apiFotoUrl) setFotoUrl(apiFotoUrl);
      } catch {}
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao atualizar foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSaveProfile = async () => {
    if (!nome?.trim() || !telefone?.trim()) {
      return Alert.alert('Atenção', 'Preencha Nome e Telefone.');
    }
    try {
      setSaving(true);
      await editarPessoaPerfil({ nome: nome.trim(), celular: telefone.trim() });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = () => {
    const phone = '554399049868';
    const url = `https://wa.me/${phone}`;
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp'));
  };

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#00591f' }}>
        <StatusBar style="light" backgroundColor="#00591f" />
      </SafeAreaView>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>Meu Perfil</Text>
            <Text style={styles.subtitle}>Atualize suas informações</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 + insets.bottom }}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {fotoUrl ? (
                <Image source={{ uri: fotoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Icon name="account" size={48} color="#9CA3AF" />
                </View>
              )}
              <TouchableOpacity 
                style={[styles.editPhotoBtn, uploadingPhoto && { opacity: 0.7 }]} 
                onPress={onEditPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Icon name="camera" size={18} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" />

            <Text style={styles.label}>E-mail</Text>
            <TextInput style={[styles.input, { backgroundColor: '#F3F4F6' }]} value={email} editable={false} />

            <Text style={styles.label}>Telefone</Text>
            <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} placeholder="Seu telefone" keyboardType="phone-pad" />

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={onSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Salvar alterações</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opções</Text>
            <TouchableOpacity style={styles.optionItem} onPress={() => (navigation as any).navigate('ChangePassword')}>
              <Icon name="lock-reset" size={22} color="#374151" />
              <Text style={styles.optionText}>Alterar senha</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={openWhatsApp}>
              <Icon name="whatsapp" size={22} color="#22C55E" />
              <Text style={styles.optionText}>Suporte (WhatsApp)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionItem, { marginTop: 12 }]} onPress={() => {
              Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: async () => { await logout(); (navigation as any).replace('Login'); } },
              ]);
            }}>
              <Icon name="logout" size={22} color="#DC2626" />
              <Text style={[styles.optionText, { color: '#DC2626' }]}>Sair da conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  topBar: { height: 72, backgroundColor: '#00591f', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#e4ffe8', fontSize: 12, marginTop: 2 },
  avatarSection: { alignItems: 'center', marginBottom: 16, marginTop: 14 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  editPhotoBtn: { position: 'absolute', right: -2, bottom: -2, backgroundColor: '#00591f', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  form: { marginTop: 8 },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#FFFFFF' },
  saveBtn: { marginTop: 16, backgroundColor: '#00591f', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 8 },
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  optionText: { marginLeft: 12, fontSize: 16, color: '#374151', fontWeight: '500' },
});


