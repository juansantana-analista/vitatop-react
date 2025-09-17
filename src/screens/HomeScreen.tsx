import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Dimensions, ActivityIndicator, Platform, ToastAndroid, Alert, FlatList, ListRenderItem, PixelRatio } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { listarCarrinho } from '../services/cart';
import { useEffect, useState, useCallback } from 'react';
import { listarBanners, listarCategorias, listarProdutos, Banner as BannerT, Categoria as CategoriaT, Produto as ProdutoT } from '../services/catalog';

const { width } = Dimensions.get('window');
const pageWidth = Math.round(PixelRatio.roundToNearestPixel(width));

const mockBanners = [
  require('../../assets/banner-01.jpg'),
  require('../../assets/banner-02.jpg'),
  require('../../assets/banner-03.jpg')
];

const mockCategories = [
  { id: '1', name: 'Vitaminas' },
  { id: '2', name: 'Bem-estar' },
  { id: '3', name: 'Cosméticos' },
  { id: '4', name: 'Fitness' },
  { id: '5', name: 'Kits' },
];

const mockProducts = [
  { id: 'p1', name: 'Produto 1', price: 'R$ 49,90', image: require('../../assets/produto-1.jpg') },
  { id: 'p2', name: 'Produto 2', price: 'R$ 69,90', image: require('../../assets/produto-2.jpg') },
  { id: 'p3', name: 'Produto 3', price: 'R$ 89,90', image: require('../../assets/produto-3.jpg') },
];

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const bannerWidth = useMemo(() => pageWidth, []);
  const bannerHeight = useMemo(() => Math.round(pageWidth * (550 / 1080)), []);
  const [banners, setBanners] = useState<BannerT[]>([]);
  const [categorias, setCategorias] = useState<CategoriaT[]>([]);
  const [produtos, setProdutos] = useState<ProdutoT[]>([]);
  const normalizeUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = 'https://vitatop.tecskill.com.br/';
    if (url.startsWith('/')) return base.replace(/\/$/, '') + url;
    return base + url;
  };
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | undefined>(undefined);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [paginando, setPaginando] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const productIdsRef = React.useRef<Set<string>>(new Set());
  const PAGE_SIZE = 20;
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const lastEndReachedRef = React.useRef<number>(0);
  const bannersRef = React.useRef<FlatList<any>>(null);
  const [bannerIndex, setBannerIndex] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [cartCount, setCartCount] = useState<number>(0);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const notifyError = (msg: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert('Erro', msg);
  };

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      const [b, c, p] = await Promise.all([
        listarBanners(),
        listarCategorias(),
        listarProdutos({ limit: PAGE_SIZE, offset: 0 })
      ]);
      setBanners(b);
      setCategorias([{ id: 'todas', nome: 'Todas' }, ...c]);
      productIdsRef.current = new Set(p.map(it => String(it.id)));
      setProdutos(p);
      setOffset(p.length);
      setHasMore(p.length >= PAGE_SIZE);
    } catch (e) {
      notifyError('Falha ao carregar dados.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const data = await listarCarrinho();
        setCartCount((data.itens || []).reduce((acc, it) => acc + Number(it.quantidade || 0), 0));
      } catch {}
    };
    updateCartCount();
    const unsub = (navigation as any).addListener('focus', updateCartCount);
    return unsub;
  }, [navigation]);

  const onSelectCategoria = async (id?: string) => {
    setCategoriaSelecionada(id);
    try {
      setCarregando(true);
      const list = await listarProdutos({ categoriaId: id === 'todas' ? undefined : id, limit: PAGE_SIZE, offset: 0 });
      productIdsRef.current = new Set(list.map(it => String(it.id)));
      setProdutos(list);
      setOffset(list.length);
      setHasMore(list.length >= PAGE_SIZE);
    } catch {
      notifyError('Falha ao carregar produtos.');
    } finally {
      setCarregando(false);
    }
  };

  const onSearchChange = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setCarregando(true);
        const list = await listarProdutos({ categoriaId: categoriaSelecionada === 'todas' ? undefined : categoriaSelecionada, search: text, limit: PAGE_SIZE, offset: 0 });
        productIdsRef.current = new Set(list.map(it => String(it.id)));
        setProdutos(list);
        setOffset(list.length);
        setHasMore(list.length >= PAGE_SIZE);
      } catch {
        notifyError('Falha ao buscar produtos.');
      } finally {
        setCarregando(false);
      }
    }, 400);
  };

  const loadMore = async () => {
    if (paginando || !hasMore) return;
    try {
      setPaginando(true);
      const more = await listarProdutos({ categoriaId: categoriaSelecionada === 'todas' ? undefined : categoriaSelecionada, search, limit: PAGE_SIZE, offset });
      const filtered = more.filter(it => {
        const id = String(it.id);
        if (productIdsRef.current.has(id)) return false;
        productIdsRef.current.add(id);
        return true;
      });
      if (filtered.length > 0) {
        setProdutos(prev => [...prev, ...filtered]);
        setOffset(offset + filtered.length);
      }
      if (more.length < PAGE_SIZE) setHasMore(false);
    } catch {
      // silencioso
    } finally {
      setPaginando(false);
    }
  };

  const onEndReachedThrottled = () => {
    const now = Date.now();
    if (now - lastEndReachedRef.current < 800) return;
    lastEndReachedRef.current = now;
    loadMore();
  };

  const renderItem: ListRenderItem<ProdutoT> = ({ item: p }) => (
    <TouchableOpacity style={styles.productRow} activeOpacity={0.8} onPress={() => navigation.navigate('ProductDetails', { id: String(p.id) })}>
      {p.imagem_url ? (
        <Image source={{ uri: normalizeUrl(p.imagem_url) }} style={styles.productThumb} />
      ) : (
        <View style={[styles.productThumb, { alignItems: 'center', justifyContent: 'center' }]}>
          <Icon name="image-off-outline" size={24} color="#9ca3af" />
        </View>
      )}
      <View style={styles.productDetails}>
        <Text numberOfLines={2} style={styles.productName}>{p.nome}</Text>
        <Text style={styles.productPrice}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.preco_lojavirtual || 0))}</Text>
      </View>
    </TouchableOpacity>
  );

  const ROW_HEIGHT = 132; // 100 thumb + ~20 padding + 12 separator
  const getItemLayout = (_: unknown, index: number) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });

  // Banner layout helper for precise paging
  const getBannerItemLayout = (_: unknown, index: number) => ({ length: pageWidth, offset: pageWidth * index, index });

  const bannerOffsets = useMemo(() => banners.map((_, i) => i * pageWidth), [banners]);

  // Auto scroll banners
  useEffect(() => {
    if (!banners || banners.length === 0) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % banners.length;
        bannersRef.current?.scrollToOffset({ offset: pageWidth * next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const list = await listarProdutos({ categoriaId: categoriaSelecionada === 'todas' ? undefined : categoriaSelecionada, search, limit: PAGE_SIZE, offset: 0 });
      productIdsRef.current = new Set(list.map(it => String(it.id)));
      setProdutos(list);
      setOffset(list.length);
      setHasMore(list.length >= PAGE_SIZE);
    } catch {
      notifyError('Falha ao atualizar lista.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      {/* Top safe area with header color to ensure Android/iOS status bar background matches */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#00591f' }}>
        <StatusBar style="light" backgroundColor="#00591f" />
      </SafeAreaView>
      <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Image source={require('../../assets/logo-nav.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
            <Icon name="bell-outline" size={20} color="#2a2a2a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
            <Icon name="cart-outline" size={20} color="#2a2a2a" />
            {cartCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{cartCount > 99 ? '99+' : String(cartCount)}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <TextInput placeholder="Qual produto você procura?" style={styles.search} onChangeText={onSearchChange} returnKeyType="search" />
      </View>

      {/* Products (Virtualized root) */}
      {carregando && produtos.length === 0 ? (
        <View style={{ width: '100%', alignItems: 'center', paddingVertical: 24 }}>
          <ActivityIndicator color="#00591f" />
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 96 + insets.bottom }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReachedThreshold={0.4}
          onEndReached={onEndReachedThrottled}
          removeClippedSubviews
          windowSize={10}
          getItemLayout={getItemLayout}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={paginando ? <View style={{ paddingVertical: 16 }}><ActivityIndicator color="#00591f" /></View> : null}
          ListHeaderComponent={
            <>
              {/* Swiper banners (simple horizontal scroll) */}
              <View style={{ marginHorizontal: -14 }}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                  overScrollMode="never"
                  scrollEventThrottle={16}
                  snapToInterval={pageWidth}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentInset={{ left: 0, right: 0 }}
                  contentInsetAdjustmentBehavior="never"
                  automaticallyAdjustContentInsets={false}
                  onScroll={(e) => {
                    const x = e.nativeEvent.contentOffset.x;
                    const idx = Math.round(x / pageWidth);
                    if (idx !== bannerIndex) setBannerIndex(idx);
                  }}
                  style={{ width: '100%', margin: 0, padding: 0 }}
                  contentContainerStyle={{ padding: 0, margin: 0 }}
                >
                  {banners.map((item, idx) => (
                    <View key={`banner-${idx}`} style={{ width: pageWidth }}>
                      <Image
                        source={{ uri: item.url_arquivo }}
                        style={{ width: '100%', height: undefined, aspectRatio: 1080 / 550 }}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Categories */}
              <View style={styles.categoriesContainer}>
                <Text style={styles.sectionTitle}>Categorias</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categorias.map((cat) => (
                    <TouchableOpacity key={cat.id} style={[styles.categoryChip, categoriaSelecionada === cat.id && { backgroundColor: '#f0f6f2', borderColor: '#00591f' }]} onPress={() => onSelectCategoria(cat.id)}>
                      <Text style={[styles.categoryText, categoriaSelecionada === cat.id && { color: '#00591f', fontWeight: '700' }]}>{cat.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          }
        />
      )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  topBar: { height: 72, backgroundColor: '#00591f', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  logo: { width: 120, height: 32 },
  rightIcons: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  iconText: { fontSize: 16, color: '#000' },
  searchWrapper: { backgroundColor: '#f7f9fa', paddingHorizontal: 14, paddingVertical: 10 },
  search: { backgroundColor: '#ffffff', borderRadius: 10, height: 44, paddingHorizontal: 14, borderWidth: 1, borderColor: '#e3e7eb' },
  categoriesContainer: { paddingHorizontal: 14, paddingVertical: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#ffffff', borderRadius: 18, marginRight: 8, borderWidth: 1, borderColor: '#e3e7eb' },
  categoryText: { fontSize: 14, color: '#111827' },
  productsContainer: { paddingHorizontal: 14, flexDirection: 'column', gap: 12 },
  productRow: { width: '100%', backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#eef1f4', padding: 10, flexDirection: 'row' },
  productThumb: { width: 100, height: 100, backgroundColor: '#f3f4f6', borderRadius: 8, marginRight: 12 },
  productDetails: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  productPrice: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#00591f' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8 },
  bottomItem: { alignItems: 'center', width: 70 },
  bottomIcon: { fontSize: 18 },
  bottomIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' },
  bottomIconActive: { backgroundColor: '#e8f3ed', borderWidth: 1, borderColor: '#cfe5d8' },
  bottomLabel: { fontSize: 11, color: '#374151', marginTop: 4 },
  bottomActive: { },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#19c463', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' }
});


