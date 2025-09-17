import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { incluirVenda, pagamentoPedido, FormaPagamento } from '../services/payment';

type RouteParams = { Checkout: { endereco_id: string; total: number } };

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'Checkout'>>();
  const { endereco_id, total } = route.params;
  const [method, setMethod] = useState<FormaPagamento>('pix');
  const [titular, setTitular] = useState('');
  const [numero, setNumero] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requiresCard = useMemo(() => method === 'cartao', [method]);

  const submit = async () => {
    try {
      setSubmitting(true);
      const venda = await incluirVenda({ forma_pagamento: method, endereco_id, frete: 0, cartao: requiresCard ? { titular, numero, data_expiracao: exp, cvc } : undefined });
      navigation.navigate('PaymentResult' as never, { result: venda } as never);
    } catch (e) {
      Alert.alert('Pagamento', 'Não foi possível finalizar a compra');
    } finally {
      setSubmitting(false);
    }
  };

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
          <Text style={styles.title}>Finalizar Compra</Text>
          <View style={{ width: 36 }} />
        </View>
        {/* Steps */}
        <View style={styles.stepsWrap}>
          <View style={[styles.stepItem, styles.stepActive]}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <Text style={[styles.stepText, styles.stepTextActive]}>Pagamento</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>Confirmação</Text>
          </View>
        </View>

        <View style={[styles.card, styles.cardElevated]}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Forma de Pagamento</Text>
            <View style={styles.securePill}>
              <Icon name="shield-check" size={14} color="#10b981" />
              <Text style={styles.securePillText}>Ambiente seguro</Text>
            </View>
          </View>
          <View style={styles.methodsRow}>
            <TouchableOpacity onPress={() => setMethod('pix')} style={[styles.methodTile, styles.methodShadow, method === 'pix' && styles.methodTileActive]}>
              <View style={[styles.methodIconWrap, method === 'pix' && styles.methodIconWrapActive]}>
                <Icon name="qrcode" size={20} color={method === 'pix' ? '#00591f' : '#6b7280'} />
              </View>
              <Text style={[styles.methodTileText, method === 'pix' && styles.methodTileTextActive]}>Pix</Text>
              <Text style={styles.methodTileSub}>Aprovação imediata</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMethod('boleto')} style={[styles.methodTile, styles.methodShadow, method === 'boleto' && styles.methodTileActive]}>
              <View style={[styles.methodIconWrap, method === 'boleto' && styles.methodIconWrapActive]}>
                <Icon name="barcode" size={20} color={method === 'boleto' ? '#00591f' : '#6b7280'} />
              </View>
              <Text style={[styles.methodTileText, method === 'boleto' && styles.methodTileTextActive]}>Boleto</Text>
              <Text style={styles.methodTileSub}>Compensa em 1-2 dias úteis</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMethod('cartao')} style={[styles.methodTile, styles.methodShadow, method === 'cartao' && styles.methodTileActive]}>
              <View style={[styles.methodIconWrap, method === 'cartao' && styles.methodIconWrapActive]}>
                <Icon name="credit-card-outline" size={20} color={method === 'cartao' ? '#00591f' : '#6b7280'} />
              </View>
              <Text style={[styles.methodTileText, method === 'cartao' && styles.methodTileTextActive]}>Cartão</Text>
              <Text style={styles.methodTileSub}>Pagamento no cartão de crédito</Text>
            </TouchableOpacity>
          </View>

          {requiresCard && (
            <View style={{ marginTop: 14, gap: 10 }}>
              <TextInput placeholder="Titular" value={titular} onChangeText={setTitular} style={styles.input} />
              <TextInput placeholder="Número do cartão" value={numero} onChangeText={setNumero} style={styles.input} keyboardType="number-pad" maxLength={19} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput placeholder="MM/AA" value={exp} onChangeText={setExp} style={[styles.input, { flex: 1 }]} maxLength={5} />
                <TextInput placeholder="CVV" value={cvc} onChangeText={setCvc} style={[styles.input, { flex: 1 }]} keyboardType="number-pad" maxLength={4} />
              </View>
              <View style={styles.hintRow}>
                <Icon name="information-outline" size={14} color="#6b7280" />
                <Text style={styles.hintText}>Seus dados são protegidos com criptografia.</Text>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.card, styles.cardElevated]}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Resumo do Pedido</Text>
          </View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Frete</Text><Text style={[styles.summaryValue, { color: '#16a34a' }]}>Grátis</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}><Text style={styles.summaryTotal}>Total</Text><Text style={styles.summaryTotal}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</Text></View>
          <View style={styles.trustRow}>
            <Icon name="lock-outline" size={16} color="#6b7280" />
            <Text style={styles.trustText}>Seus dados são criptografados e protegidos.</Text>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.payBtn} onPress={submit} disabled={submitting}>
            <Text style={styles.payText}>{submitting ? 'Processando...' : 'Pagar agora'}</Text>
          </TouchableOpacity>
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
  card: { backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#eef1f4', padding: 14, margin: 12 },
  cardElevated: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  securePill: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  securePillText: { color: '#047857', fontSize: 12, fontWeight: '700' },
  methodsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  methodTile: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff', borderRadius: 12, padding: 12 },
  methodShadow: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  methodTileActive: { borderColor: '#cfe5d8', backgroundColor: '#f7fbf9' },
  methodIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  methodIconWrapActive: { backgroundColor: '#e8f3ed' },
  methodTileText: { fontWeight: '800', color: '#111827' },
  methodTileTextActive: { color: '#00591f' },
  methodTileSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  input: { backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, height: 44 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  summaryLabel: { color: '#6b7280' },
  summaryValue: { color: '#111827', fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: '#eef1f4', marginVertical: 8 },
  summaryTotal: { fontWeight: '800', color: '#111827' },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  trustText: { color: '#6b7280' },
  stepsWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 10, marginBottom: 2, gap: 10 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepActive: {},
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb' },
  stepDotActive: { backgroundColor: '#00591f' },
  stepText: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  stepTextActive: { color: '#00591f' },
  stepLine: { width: 32, height: 2, backgroundColor: '#e5e7eb' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 12 },
  payBtn: { height: 44, borderRadius: 10, backgroundColor: '#00591f', alignItems: 'center', justifyContent: 'center' },
  payText: { color: '#ffffff', fontSize: 15, fontWeight: '700' }
});


