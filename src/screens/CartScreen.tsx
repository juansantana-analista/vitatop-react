import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { listarCarrinho, alterarCarrinho, removerItemCarrinho, limparCarrinho, CartItem } from '../services/cart';
import { listarEnderecos, selecionarEndereco, Address } from '../services/address';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressVisible, setAddressVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listarCarrinho();
      setItems(data.itens);
      setTotal(data.total);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('focus', async () => {
      try {
        const list = await listarEnderecos();
        setAddresses(list);
        // Prioriza id vindo via params caso exista
        const params = (navigation as any).getState()?.routes?.find((r: any) => r.name === 'Cart')?.params;
        let selectedId = params?.selectedAddressId as string | undefined;
        if (!selectedId) {
          try { selectedId = await AsyncStorage.getItem('selectedAddressId') || undefined; } catch {}
        }
        let current = list.find(e => e.id === selectedId) || selectedAddress || list.find(e => e.principal === 'S') || list[0] || null;
        if (current) setSelectedAddress(current);
      } catch {}
    });
    return unsubscribe;
  }, [navigation, selectedAddress]);

  const openAddresses = async () => {
    try {
      const list = await listarEnderecos();
      setAddresses(list);
      const principal = list.find(e => e.principal === 'S') || list[0] || null;
      if (principal) setSelectedAddress(principal);
      setAddressVisible(true);
    } catch {}
  };

  const onInc = async (id: string, q: number) => {
    const next = q + 1;
    setItems(prev => prev.map(it => it.produto_id === id ? { ...it, quantidade: next } : it));
    try {
      await alterarCarrinho(id, next);
      await load();
    } catch {
      await load();
    }
  };
  const onDec = async (id: string, q: number) => {
    if (q <= 1) {
      Alert.alert('Remover', 'Deseja remover este item?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: async () => { await removerItemCarrinho(id); await load(); } }
      ]);
      return;
    }
    const next = q - 1;
    setItems(prev => prev.map(it => it.produto_id === id ? { ...it, quantidade: next } : it));
    try {
      await alterarCarrinho(id, next);
      await load();
    } catch {
      await load();
    }
  };

  const onClear = async () => {
    Alert.alert('Esvaziar carrinho', 'Tem certeza que deseja esvaziar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Esvaziar', style: 'destructive', onPress: async () => { await limparCarrinho(); await load(); } }
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      {item.foto ? (
        <Image source={{ uri: `https://vitatop.tecskill.com.br/${item.foto}` }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, { alignItems: 'center', justifyContent: 'center' }]}>
          <Icon name="image-off-outline" size={20} color="#9ca3af" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={styles.itemName}>{item.nome}</Text>
        <View style={styles.itemControls}>
          <View style={styles.counter}>
            <TouchableOpacity onPress={() => onDec(item.produto_id, item.quantidade)} style={styles.circle}><Text style={styles.circleText}>-</Text></TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantidade}</Text>
            <TouchableOpacity onPress={() => onInc(item.produto_id, item.quantidade)} style={styles.circle}><Text style={styles.circleText}>+</Text></TouchableOpacity>
          </View>
          <Text style={styles.itemPrice}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_unitario)}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => onDec(item.produto_id, 1)} style={styles.removeBtn}>
        <Icon name="trash-can-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#00591f' }}>
        <StatusBar style="light" backgroundColor="#00591f" />
      </SafeAreaView>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => (navigation as any).navigate('Home')} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}><Icon name="cart-outline" size={18} color="#fff" /> Carrinho</Text>
          <TouchableOpacity onPress={onClear}>
            <Icon name="delete" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingTop: 24, alignItems: 'center' }}><ActivityIndicator color="#00591f" /></View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.produto_id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ padding: 12, paddingBottom: 140 + insets.bottom }}
            ListEmptyComponent={<View style={{ padding: 24, alignItems: 'center' }}><Text style={{ color: '#6b7280' }}>Nada por enquanto...</Text></View>}
            ListHeaderComponent={
              <>
                <View style={styles.card}>
                  <View style={styles.cardHead}>
                    <Text style={styles.cardTitle}>Endereço de Entrega</Text>
                    <TouchableOpacity onPress={() => (navigation as any).navigate('ManageAddresses')} style={styles.manageBtn}><Text style={styles.manageText}>Gerenciar</Text></TouchableOpacity>
                  </View>
                  {selectedAddress ? (
                    <>
                      <Text style={styles.addrLine}>{selectedAddress.rua}, {selectedAddress.numero ?? ''} - {selectedAddress.bairro ?? ''}</Text>
                      <Text style={styles.addrLine}>{`${typeof selectedAddress.municipio === 'string' ? selectedAddress.municipio : (selectedAddress.municipio as any)?.nome || selectedAddress.cidade}, ${typeof selectedAddress.estado === 'string' ? selectedAddress.estado : (selectedAddress.estado as any)?.sigla}`} {selectedAddress.cep ? `- CEP: ${selectedAddress.cep}` : ''}</Text>
                    </>
                  ) : (
                    <Text style={styles.addrMuted}>Selecione um endereço de entrega</Text>
                  )}
                </View>
              </>
            }
            ListFooterComponent={
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Cupom de Desconto</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <TextInput
                      placeholder="Digite seu cupom"
                      value={coupon}
                      onChangeText={setCoupon}
                      style={styles.couponInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (!coupon.trim()) {
                          Alert.alert('Cupom', 'Digite um cupom de desconto');
                          return;
                        }
                        Alert.alert('Cupom', 'Cupom inválido ou expirado');
                      }}
                      style={styles.couponBtn}
                    >
                      <Text style={styles.couponBtnText}>Aplicar</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Resumo</Text>
                  <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</Text></View>
                  {discount > 0 && (
                    <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Desconto</Text><Text style={[styles.summaryValue, { color: '#ef4444' }]}>- {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discount)}</Text></View>
                  )}
                  <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Frete</Text><Text style={[styles.summaryValue, { color: '#16a34a' }]}>Grátis</Text></View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}><Text style={styles.summaryTotal}>Total</Text><Text style={styles.summaryTotal}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, total - discount))}</Text></View>
                </View>
              </>
            }
          />
        )}

        <View style={[styles.bottomBar, { paddingBottom: 8 + insets.bottom }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#6b7280' }}>Total</Text>
            <Text style={{ fontWeight: '800', fontSize: 16 }}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, total - discount))}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => {
            if (!selectedAddress) {
              Alert.alert('Endereço', 'Selecione um endereço de entrega');
              return;
            }
            (navigation as any).navigate('Checkout', { endereco_id: selectedAddress.id, total: Math.max(0, total - discount) });
          }}>
            <Text style={styles.checkoutText}>Finalizar Compra</Text>
          </TouchableOpacity>
        </View>

        {addressVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '700' }}>Endereços</Text>
                <TouchableOpacity onPress={() => setAddressVisible(false)}><Icon name="close" size={20} color="#111827" /></TouchableOpacity>
              </View>
              <View style={{ height: 12 }} />
              <FlatList
                data={addresses}
                keyExtractor={(a) => a.id}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={async () => {
                      setSelectedAddress(item);
                      setAddressVisible(false);
                      try {
                        await selecionarEndereco(item.id);
                        await load();
                      } catch {}
                    }}
                    style={styles.addrRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600' }} numberOfLines={1}>{item.nome_endereco || 'Endereço'}</Text>
                      <Text style={{ color: '#6b7280', marginTop: 2 }} numberOfLines={1}>{`${item.rua}, ${item.numero ?? ''} - ${item.bairro ?? ''}`}</Text>
                      <Text style={{ color: '#6b7280' }} numberOfLines={1}>{`${typeof item.municipio === 'string' ? item.municipio : (item.municipio as any)?.nome || item.cidade}, ${typeof item.estado === 'string' ? item.estado : (item.estado as any)?.sigla}`}</Text>
                    </View>
                    {item.principal === 'S' && <View style={styles.badge}><Text style={styles.badgeText}>Principal</Text></View>}
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 380 }}
                contentContainerStyle={{ paddingBottom: 4 }}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              />
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  topBar: { height: 56, backgroundColor: '#00591f', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cartItem: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#eef1f4', padding: 12, alignItems: 'center' },
  thumb: { width: 72, height: 72, backgroundColor: '#f3f4f6', borderRadius: 8, marginRight: 10 },
  itemName: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '600', paddingRight: 8 },
  itemControls: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6', borderRadius: 18, paddingHorizontal: 6, paddingVertical: 4 },
  circle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  circleText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  qtyText: { width: 28, textAlign: 'center', fontWeight: '700', color: '#111827' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#00591f' },
  removeBtn: { marginLeft: 8, padding: 6 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#eef1f4', padding: 12, marginBottom: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  manageBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f0f6f2', borderWidth: 1, borderColor: '#cfe5d8' },
  manageText: { color: '#00591f', fontWeight: '700', fontSize: 12 },
  addrLine: { fontSize: 13, color: '#374151' },
  addrMuted: { fontSize: 13, color: '#6b7280' },
  couponInput: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10, backgroundColor: '#ffffff' },
  couponBtn: { height: 40, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#00591f', alignItems: 'center', justifyContent: 'center' },
  couponBtnText: { color: '#ffffff', fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  summaryLabel: { color: '#6b7280' },
  summaryValue: { color: '#111827', fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: '#eef1f4', marginVertical: 8 },
  summaryTotal: { fontWeight: '800', color: '#111827' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 12 },
  checkoutBtn: { height: 44, borderRadius: 10, backgroundColor: '#00591f', alignItems: 'center', justifyContent: 'center' },
  checkoutText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  modalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 520, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#eef1f4', padding: 12 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eef1f4', backgroundColor: '#ffffff' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, backgroundColor: '#e8f3ed', borderWidth: 1, borderColor: '#cfe5d8' },
  badgeText: { color: '#065f46', fontWeight: '700', fontSize: 12 }
});


