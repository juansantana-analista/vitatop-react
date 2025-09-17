import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { listarLinksProduto, ProdutoLink, obterProdutoCompleto } from '../services/catalog';
import QRCode from 'react-native-qrcode-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareProduct'>;

export default function ShareProductScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<ProdutoLink[]>([]);
  const [nome, setNome] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [ls, d] = await Promise.all([
          listarLinksProduto(id),
          obterProdutoCompleto(id)
        ]);
        setLinks(ls || []);
        setNome(d?.nome || 'Produto');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const landing = useMemo(() => links.find(l => l.tipo_link === '1')?.link_url, [links]);
  const checkout = useMemo(() => links.find(l => l.tipo_link === '2')?.link_url, [links]);
  const mainUrl = landing || checkout || '';

  const shareUrl = async (text?: string) => {
    if (!text) return;
    const message = `${nome}\n${text}`.trim();
    await Share.share({ message, url: text });
  };

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#00591f' }}>
        <StatusBar style="light" backgroundColor="#00591f" />
      </SafeAreaView>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="close" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>Compartilhar</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={{ paddingTop: 32, alignItems: 'center' }}>
            <ActivityIndicator color="#00591f" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 + insets.bottom }}>
            <Text style={styles.productName}>{nome}</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>QR Code</Text>
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                {mainUrl ? (
                  <QRCode value={mainUrl} size={200} />
                ) : (
                  <Text style={styles.muted}>Link indisponível</Text>
                )}
              </View>
              {mainUrl ? (
                <TouchableOpacity style={styles.copyBtn} onPress={() => shareUrl(mainUrl)}>
                  <Icon name="share-variant" size={16} color="#00591f" />
                  <Text style={styles.copyText}>Compartilhar link</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Links</Text>
              <View style={{ height: 8 }} />
              <View style={styles.linkRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkLabel}>Landing Page</Text>
                  <Text style={styles.linkValue} numberOfLines={1}>{landing || '—'}</Text>
                </View>
                {landing ? (
                  <TouchableOpacity style={styles.smallBtn} onPress={() => shareUrl(landing)}>
                    <Icon name="share-variant" size={16} color="#00591f" />
                    <Text style={styles.smallBtnText}>Compartilhar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.linkRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkLabel}>Checkout</Text>
                  <Text style={styles.linkValue} numberOfLines={1}>{checkout || '—'}</Text>
                </View>
                {checkout ? (
                  <TouchableOpacity style={styles.smallBtn} onPress={() => shareUrl(checkout)}>
                    <Icon name="share-variant" size={16} color="#00591f" />
                    <Text style={styles.smallBtnText}>Compartilhar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  topBar: { height: 56, backgroundColor: '#00591f', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  productName: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#111827' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#eef1f4', padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  muted: { fontSize: 13, color: '#6b7280' },
  copyBtn: { marginTop: 8, height: 40, borderRadius: 10, backgroundColor: '#f0f6f2', borderWidth: 1, borderColor: '#cfe5d8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  copyText: { color: '#00591f', fontSize: 14, fontWeight: '700' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkLabel: { fontSize: 13, color: '#6b7280' },
  linkValue: { fontSize: 13, color: '#111827', marginTop: 2 },
  smallBtn: { height: 36, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cfe5d8', backgroundColor: '#f0f6f2', flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallBtnText: { color: '#00591f', fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 }
});


