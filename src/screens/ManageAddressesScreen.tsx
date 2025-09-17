import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { listarEnderecos, selecionarEndereco, Address, consultaCEP, salvarEnderecoEntrega } from '../services/address';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function ManageAddressesScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nome_endereco: '', cep: '', rua: '', numero: '', bairro: '', cidade: '', uf: '', complemento: '', principal: false });
  const ruaRef = useRef<TextInput>(null);

  const load = async () => {
    try {
      setLoading(true);
      const list = await listarEnderecos();
      setAddresses(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#00591f' }}>
        <StatusBar style="light" backgroundColor="#00591f" />
      </SafeAreaView>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Endereços</Text>
          <View style={{ width: 36 }} />
        </View>

        {!adding ? (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={async () => {
                try {
                  await selecionarEndereco(item.id);
                  try { await AsyncStorage.setItem('selectedAddressId', String(item.id)); } catch {}
                  (navigation as any).navigate('Cart', { selectedAddressId: item.id });
                } catch {}
              }}
              style={styles.addrRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.addrName} numberOfLines={1}>{item.nome_endereco || 'Endereço'}</Text>
                <Text style={styles.addrLine} numberOfLines={1}>{`${item.rua}, ${item.numero ?? ''} - ${item.bairro ?? ''}`}</Text>
                <Text style={styles.addrLine} numberOfLines={1}>{`${typeof item.municipio === 'string' ? item.municipio : (item.municipio as any)?.nome || item.cidade}, ${typeof item.estado === 'string' ? item.estado : (item.estado as any)?.sigla}`}</Text>
              </View>
              {item.principal === 'S' && <View style={styles.badge}><Text style={styles.badgeText}>Principal</Text></View>}
              <Icon name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={!loading ? <View style={{ padding: 24, alignItems: 'center' }}><Text style={{ color: '#6b7280' }}>Nenhum endereço cadastrado.</Text></View> : null}
        />
        ) : (
          <View style={{ padding: 14 }}>
            <Text style={{ fontWeight: '700', fontSize: 14, marginBottom: 10 }}>Novo endereço</Text>
            <View style={{ gap: 10 }}>
              <TextInput placeholder="Nome do endereço (Casa, Trabalho)" value={form.nome_endereco} onChangeText={(v) => setForm({ ...form, nome_endereco: v })} style={styles.input} />
              <TextInput
                placeholder="CEP"
                value={form.cep}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, '').slice(0, 8);
                  const masked = digits.length > 5 ? `${digits.slice(0,5)}-${digits.slice(5)}` : digits;
                  setForm({ ...form, cep: masked });
                }}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={9}
                onEndEditing={async () => {
                  const digits = form.cep.replace(/\D/g, '');
                  if (digits.length === 8) {
                    try {
                      const d = await consultaCEP(digits);
                      setForm(prev => ({ ...prev, rua: d.rua, bairro: d.bairro, cidade: d.cidade, uf: d.uf }));
                    } catch { /* silencioso */ }
                  }
                  ruaRef.current?.focus();
                }}
                returnKeyType="next"
              />
              <TextInput ref={ruaRef} placeholder="Rua" value={form.rua} onChangeText={(v) => setForm({ ...form, rua: v })} style={styles.input} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput placeholder="Número" value={form.numero} onChangeText={(v) => setForm({ ...form, numero: v })} style={[styles.input, { flex: 1 }]} />
                <TextInput placeholder="Bairro" value={form.bairro} onChangeText={(v) => setForm({ ...form, bairro: v })} style={[styles.input, { flex: 2 }]} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput placeholder="Cidade" value={form.cidade} onChangeText={(v) => setForm({ ...form, cidade: v })} style={[styles.input, { flex: 2 }]} />
                <TextInput placeholder="UF" value={form.uf} onChangeText={(v) => setForm({ ...form, uf: v })} style={[styles.input, { width: 64 }]} maxLength={2} />
              </View>
              <TextInput placeholder="Complemento" value={form.complemento} onChangeText={(v) => setForm({ ...form, complemento: v })} style={styles.input} />
              <TouchableOpacity onPress={() => setForm({ ...form, principal: !form.principal })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 18, height: 18, borderRadius: 3, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: form.principal ? '#00591f' : '#ffffff' }}>
                  {form.principal ? <Icon name="check" size={14} color="#ffffff" /> : null}
                </View>
                <Text style={{ color: '#111827' }}>Definir como principal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomBar}>
          {!adding ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
              <Text style={styles.addText}>Adicionar novo endereço</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.addBtn, { flex: 1, backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]} onPress={() => setAdding(false)}>
                <Text style={[styles.addText, { color: '#111827' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addBtn, { flex: 1 }]} onPress={async () => {
                try {
                  await salvarEnderecoEntrega({ nome_endereco: form.nome_endereco, cep: form.cep, endereco: form.rua, numero: form.numero, bairro: form.bairro, cidade: form.cidade, estado: form.uf, complemento: form.complemento, principal: form.principal ? 'S' : 'N' });
                  setAdding(false);
                  setForm({ nome_endereco: '', cep: '', rua: '', numero: '', bairro: '', cidade: '', uf: '', complemento: '', principal: false });
                  await load();
                } catch { Alert.alert('Endereço', 'Não foi possível salvar o endereço'); }
              }}>
                <Text style={styles.addText}>Salvar endereço</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  topBar: { height: 56, backgroundColor: '#00591f', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#eef1f4', padding: 12 },
  addrName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  addrLine: { fontSize: 13, color: '#6b7280' },
  badge: { backgroundColor: '#ffedd5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#b45309', fontSize: 12, fontWeight: '700' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 12 },
  addBtn: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#cfe5d8', backgroundColor: '#f0f6f2', alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#00591f', fontSize: 14, fontWeight: '700' },
  input: { backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, height: 44 },
  cepBtn: { paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#cfe5d8', backgroundColor: '#f0f6f2', alignItems: 'center', justifyContent: 'center' },
  cepText: { color: '#00591f', fontWeight: '700' }
});


