import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { verificaPix } from '../services/payment';

type Result = {
  pedido_id: string;
  valor_total?: number;
  pix_key?: string;
  pix_qrcode?: string;
  boleto_linhadigitavel?: string;
  boleto_impressao?: string;
  data_vencimento?: string;
  status_compra?: string;
  status_mensagem?: string;
};

type RouteParams = { PaymentResult: { result: Result } };

export default function PaymentResultScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'PaymentResult'>>();
  const { result } = route.params;
  const [statusMsg, setStatusMsg] = useState<string | undefined>(result.status_mensagem);
  const [paid, setPaid] = useState<boolean>(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (result.pix_qrcode && result.pedido_id) {
      const started = Date.now();
      pollRef.current = setInterval(async () => {
        if (Date.now() - started > 120000) { if (pollRef.current) clearInterval(pollRef.current); return; }
        try {
          const r = await verificaPix(result.pedido_id);
          if (r?.status_compra === 3) {
            if (pollRef.current) clearInterval(pollRef.current);
            setPaid(true);
            setStatusMsg('Pagamento confirmado');
          }
        } catch {}
      }, 6000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [result.pix_qrcode, result.pedido_id]);

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#00591f' }}>
        <StatusBar style="light" backgroundColor="#00591f" />
      </SafeAreaView>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('Home' as never)} style={styles.backBtn}>
            <Icon name="home" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Confirmação</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <View style={[styles.card, { borderColor: paid ? '#bbf7d0' : '#bfdbfe', backgroundColor: paid ? '#ecfdf5' : '#eff6ff' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={paid ? 'check-decagram' : 'progress-clock'} size={20} color={paid ? '#16a34a' : '#2563eb'} />
              <Text style={[styles.titleBold, { color: paid ? '#065f46' : '#1e40af' }]}>{paid ? 'Pagamento confirmado' : 'Aguardando pagamento'}</Text>
            </View>
            <Text style={{ color: paid ? '#065f46' : '#1e40af', marginTop: 4 }}>#{result.pedido_id || '—'}</Text>
            {!!result.valor_total && <Text style={{ color: paid ? '#065f46' : '#1f2937', fontWeight: '700', marginTop: 4 }}>Total: {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.valor_total)}</Text>}
            {!!statusMsg && <Text style={{ color: '#6b7280', marginTop: 4 }}>{statusMsg}</Text>}
          </View>

          {result.pix_qrcode && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pague com Pix</Text>
              <View style={{ alignItems: 'center', marginTop: 10 }}>
                <Image source={{ uri: result.pix_qrcode }} style={{ width: 220, height: 220 }} />
              </View>
              {!!result.pix_key && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: '#6b7280', marginBottom: 6 }}>Chave Pix</Text>
                  <View style={styles.copyRow}>
                    <Text style={styles.copyCode} numberOfLines={1}>{result.pix_key}</Text>
                    <TouchableOpacity style={styles.copyBtn} onPress={async () => {
                      try { await Clipboard.setStringAsync(result.pix_key || ''); Alert.alert('Copiado', 'Chave Pix copiada.'); } catch {}
                    }}>
                      <Icon name="content-copy" size={16} color="#00591f" />
                      <Text style={styles.copyBtnText}>Copiar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={styles.linkBtn} onPress={async () => {
                  try { const r = await verificaPix(result.pedido_id as string); if (r?.status_compra === 3) { setPaid(true); setStatusMsg('Pagamento confirmado'); } else { Alert.alert('Pix', 'Ainda não compensou seu pagamento. Tente novamente em instantes.'); } } catch { Alert.alert('Pix', 'Não foi possível verificar o pagamento.'); }
                }}>
                  <Icon name="refresh" size={16} color="#00591f" />
                  <Text style={styles.linkBtnText}>Confirmar pagamento</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {result.boleto_linhadigitavel && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Boleto</Text>
              <View style={{ marginTop: 8 }}>
                <View style={styles.copyRow}>
                  <Text style={styles.copyCode} numberOfLines={1}>{result.boleto_linhadigitavel}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={async () => {
                    try { await Clipboard.setStringAsync(result.boleto_linhadigitavel || ''); Alert.alert('Copiado', 'Linha digitável copiada.'); } catch {}
                  }}>
                    <Icon name="content-copy" size={16} color="#00591f" />
                    <Text style={styles.copyBtnText}>Copiar</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {!!result.boleto_impressao && (
                <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(result.boleto_impressao as string)}>
                  <Icon name="open-in-new" size={16} color="#00591f" />
                  <Text style={styles.linkBtnText}>Abrir boleto</Text>
                </TouchableOpacity>
              )}
              {!!result.data_vencimento && (
                <Text style={{ marginTop: 6, color: '#6b7280' }}>Vencimento: {result.data_vencimento}</Text>
              )}
            </View>
          )}

          <View style={{ height: 8 }} />
          <TouchableOpacity style={{ height: 44, borderRadius: 10, backgroundColor: '#00591f', alignItems: 'center', justifyContent: 'center' }} onPress={() => navigation.navigate('Home' as never)}>
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>Voltar ao início</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  topBar: { height: 56, backgroundColor: '#00591f', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#eef1f4', padding: 12, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  titleBold: { fontSize: 16, fontWeight: '800', color: '#111827' }
});
// Extra styles for copy rows and links
(styles as any).copyRow = { flexDirection: 'row', alignItems: 'center', gap: 8 };
(styles as any).copyCode = { flex: 1, fontFamily: undefined, color: '#111827', fontWeight: '700' };
(styles as any).copyBtn = { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f0f6f2', borderWidth: 1, borderColor: '#cfe5d8' };
(styles as any).copyBtnText = { color: '#00591f', fontWeight: '700' };
(styles as any).linkBtn = { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe', alignSelf: 'flex-start' };
(styles as any).linkBtnText = { color: '#1d4ed8', fontWeight: '700' };


