import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity, ActivityIndicator, ScrollView, Share, Platform, ToastAndroid, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { FontAwesome5 } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { obterProdutoCompleto, ProdutoDetalhe, listarLinksProduto, ProdutoLink } from '../services/catalog';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ProdutoDetalhe | null>(null);
  const [idx, setIdx] = useState(0);
  const listRef = useRef<FlatList<string>>(null);
  const [imageHeights, setImageHeights] = useState<number[]>([]);
  const [links, setLinks] = useState<ProdutoLink[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const d = await obterProdutoCompleto(id);
        setData(d);
        // calcular alturas reais das imagens para exibir 100% sem corte
        const heights: number[] = await Promise.all(
          (d.fotos || []).map((uri) => new Promise<number>((resolve) => {
            Image.getSize(
              uri,
              (w, h) => {
                const displayHeight = w > 0 ? Math.round((h / w) * width) : width;
                resolve(displayHeight || width);
              },
              () => resolve(width)
            );
          }))
        );
        setImageHeights(heights);
        try {
          const ls = await listarLinksProduto(id);
          setLinks(ls);
        } catch {}
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const lucro = useMemo(() => {
    if (!data) return 0;
    return Math.max(0, (data.preco_lojavirtual || 0) - (data.preco || 0));
  }, [data]);

  const mapFa5Name = (cls?: string): any => {
    if (!cls) return 'check';
    // examples: "fas fa-capsules", "fa-solid fa-triangle-exclamation"
    const parts = cls.split(/\s+/).filter(Boolean);
    const fa = parts.find(p => p.startsWith('fa-') && p !== 'fa-solid' && p !== 'fas' && p !== 'far' && p !== 'fab');
    let name = fa ? fa.replace(/^fa-/, '') : 'check';
    if (name === 'triangle-exclamation') name = 'exclamation-triangle';
    return name as any;
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
          <Text style={styles.title} numberOfLines={1}>{data?.nome || 'Detalhes'}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.navigate('ShareProduct', { id })}
            style={styles.shareBtn}
          >
            <Icon name="share-variant" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 + insets.bottom + 96 }}>
          {loading ? (
            <View style={{ paddingTop: 32, alignItems: 'center' }}>
              <ActivityIndicator color="#00591f" />
            </View>
          ) : data ? (
            <View>
              <ScrollView
                horizontal
                pagingEnabled
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const i = Math.round(x / width);
                  setIdx(i);
                }}
                showsHorizontalScrollIndicator={false}
              >
                {(data.fotos || []).map((uri, i) => (
                  <View key={`${uri}-${i}`} style={{ width }}>
                    <Image
                      source={{ uri: uri }}
                      style={{ width, height: imageHeights[i] || width, backgroundColor: '#ffffff' }}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </ScrollView>
              {data.fotos.length > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', paddingTop: 8, gap: 6 }}>
                  {data.fotos.map((_, i) => (
                    <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {data && (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <Text style={styles.productName}>{data.nome}</Text>

              <View style={styles.pricesBox}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Pague</Text>
                  <Text style={styles.priceCurrent}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.preco)}</Text>
                </View>
                <View style={styles.separator} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Revenda</Text>
                  <Text style={styles.priceValue}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.preco_lojavirtual)}</Text>
                </View>
                <View style={styles.separator} />
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { fontWeight: '700' }]}>Lucre</Text>
                  <Text style={styles.priceProfit}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lucro)}</Text>
                </View>
              </View>

              <View style={{ height: 12 }} />

              <Text style={styles.sectionTitle}>Benefícios do Produto</Text>
              <View style={{ height: 8 }} />
              {data.beneficios && data.beneficios.length > 0 ? (
                <View style={{ gap: 10 }}>
                  {data.beneficios.map((b) => (
                    <View key={b.id} style={styles.benefitItem}>
                      <View style={[styles.benefitIcon, { backgroundColor: b.cor_icone || '#00a676' }]}>
                        <FontAwesome5 name={mapFa5Name(b.icone)} size={14} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.benefitTitle}>{b.nome}</Text>
                        {!!b.descricao && <Text style={styles.benefitDesc}>{b.descricao}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Nenhum benefício cadastrado.</Text>
              )}

              <View style={{ height: 16 }} />

              <Text style={styles.sectionTitle}>Contra Indicação</Text>
              <View style={{ height: 8 }} />
              {data.contra_indicacoes && data.contra_indicacoes.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {data.contra_indicacoes.map((c, i) => (
                    <View key={i} style={styles.contraItem}>
                      <FontAwesome5 name="exclamation-triangle" size={14} color="#b45309" />
                      <Text style={styles.contraText}>{c.titulo}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Nenhuma contra indicação cadastrada.</Text>
              )}
            </View>
          )}
        </ScrollView>

        {data && (
          <View style={[styles.bottomBar, { paddingBottom: 8 + insets.bottom }] }>
            <TouchableOpacity style={styles.buyBtn}
              onPress={async () => {
                try {
                  const { adicionarItemCarrinho } = await import('../services/cart');
                  await adicionarItemCarrinho(id, 1);
                  if (Platform.OS === 'android') ToastAndroid.show('Adicionado ao carrinho', ToastAndroid.SHORT);
                  else Alert.alert('Carrinho', 'Adicionado ao carrinho');
                  // Redireciona para o carrinho
                  // @ts-ignore
                  navigation.navigate('Cart');
                } catch (e) {
                  if (Platform.OS === 'android') ToastAndroid.show('Falha ao adicionar', ToastAndroid.SHORT);
                  else Alert.alert('Erro', 'Falha ao adicionar ao carrinho');
                }
              }}
            >
              <Icon name="cart" size={18} color="#fff" />
              <Text style={styles.buyText}>Adicionar ao carrinho</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  topBar: { height: 56, backgroundColor: '#00591f', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '700', flex: 1, marginHorizontal: 8 },
  shareBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', top: 56 + 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e5e7eb' },
  dotActive: { backgroundColor: '#00591f' },
  productName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  pricesBox: { marginTop: 10, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#eef1f4', padding: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  priceLabel: { fontSize: 14, color: '#6b7280' },
  priceCurrent: { fontSize: 16, fontWeight: '700', color: '#00591f' },
  priceValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  priceProfit: { fontSize: 16, fontWeight: '700', color: '#15803d' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  benefitItem: { flexDirection: 'row', gap: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#eef1f4', borderRadius: 10, padding: 10 },
  benefitIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  benefitDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  emptyText: { fontSize: 13, color: '#6b7280' },
  contraItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#ffedd5', borderRadius: 8, padding: 10 },
  contraText: { fontSize: 13, color: '#7c2d12' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8, paddingHorizontal: 12 },
  buyBtn: { height: 44, borderRadius: 10, backgroundColor: '#00591f', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buyText: { color: '#ffffff', fontSize: 15, fontWeight: '700' }
});


