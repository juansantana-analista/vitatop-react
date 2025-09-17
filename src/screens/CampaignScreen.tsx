import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { 
  carregarCategoriasCampanha, 
  listarCampanhas, 
  Campaign, 
  CampaignCategory,
  getCategoriaClass,
  getCategoriaLabel,
  formatarData,
  getCampaignImageUrl
} from '../services/campaign';
import { listarCarrinho } from '../services/cart';

const { width } = Dimensions.get('window');

export default function CampaignScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [campanhas, setCampanhas] = useState<Campaign[]>([]);
  const [categorias, setCategorias] = useState<CampaignCategory[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);

  const carregarDados = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Carrega categorias e campanhas em paralelo
      const [categoriasData, campanhasData] = await Promise.all([
        carregarCategoriasCampanha(),
        listarCampanhas(categoriaSelecionada === 'all' ? undefined : categoriaSelecionada)
      ]);

      setCategorias(categoriasData);
      setCampanhas(campanhasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar as campanhas. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoriaSelecionada]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregarDados(false);
  }, [carregarDados]);

  const filtrarPorCategoria = useCallback((categoriaId: string) => {
    setCategoriaSelecionada(categoriaId);
  }, []);

  // Recarrega campanhas quando a categoria muda
  useEffect(() => {
    if (categoriaSelecionada) {
      carregarDados(true);
    }
  }, [categoriaSelecionada, carregarDados]);

  // Carrega dados quando a tela é focada
  useFocusEffect(
    useCallback(() => {
      carregarDados(true);
    }, [carregarDados])
  );

  // Atualiza contador do carrinho
  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const data = await listarCarrinho();
        setCartCount((data.itens || []).reduce((acc: number, it: any) => acc + Number(it.quantidade || 0), 0));
      } catch {}
    };
    updateCartCount();
    const unsub = (navigation as any).addListener?.('focus', updateCartCount);
    return unsub;
  }, [navigation]);

  const renderCategoriaPill = (categoria: CampaignCategory, isActive: boolean) => (
    <TouchableOpacity
      key={categoria.id}
      style={[
        styles.categoryPill,
        isActive && styles.categoryPillActive,
        getCategoriaClass(categoria.id) && styles[`categoryPill${getCategoriaClass(categoria.id).charAt(0).toUpperCase() + getCategoriaClass(categoria.id).slice(1)}` as keyof typeof styles]
      ]}
      onPress={() => filtrarPorCategoria(categoria.id)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.categoryPillText,
        isActive && styles.categoryPillTextActive
      ]}>
        {categoria.nome}
      </Text>
    </TouchableOpacity>
  );

  const renderCampanhaCard = (campanha: Campaign) => {
    const dataInicio = new Date(campanha.data_inicio);
    const dataFim = campanha.data_fim ? new Date(campanha.data_fim) : null;
    const dataInicioFormatada = formatarData(dataInicio);
    const dataFimFormatada = dataFim ? formatarData(dataFim) : null;
    
    const tagTexto = campanha.tag || getCategoriaLabel(campanha.categoria_id);
    const categoriaClass = getCategoriaClass(campanha.categoria_id);


    return (
      <TouchableOpacity
        key={campanha.id}
        style={styles.campaignCard}
        activeOpacity={0.8}
        onPress={() => {
          // Aqui você pode navegar para a página específica da campanha
          // ou abrir o link da campanha
          if (campanha.link) {
            // Implementar navegação ou abertura do link
            console.log('Abrir campanha:', campanha.link);
          }
        }}
      >
        <View style={styles.campaignImageContainer}>
          <Image
            source={getCampaignImageUrl(campanha.imagem)}
            style={styles.campaignImage}
            resizeMode="cover"
          />
          <View style={[
            styles.campaignTag,
            categoriaClass && styles[`campaignTag${categoriaClass.charAt(0).toUpperCase() + categoriaClass.slice(1)}` as keyof typeof styles]
          ]}>
            <Text style={styles.campaignTagText}>{tagTexto}</Text>
          </View>
        </View>
        
        <View style={styles.campaignContent}>
          <Text style={styles.campaignTitle} numberOfLines={2}>
            {campanha.titulo}
          </Text>
          
          {campanha.subtitulo && (
            <Text style={styles.campaignSubtitle} numberOfLines={2}>
              {campanha.subtitulo}
            </Text>
          )}
          
          <View style={styles.campaignPeriod}>
            <Icon name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.campaignPeriodText}>
              {dataInicioFormatada}
              {dataFimFormatada && ` até ${dataFimFormatada}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="calendar-blank-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>Nenhuma campanha encontrada</Text>
      <Text style={styles.emptyStateSubtitle}>
        {categoriaSelecionada === 'all' 
          ? 'Não há campanhas disponíveis no momento.'
          : 'Não há campanhas nesta categoria no momento.'
        }
      </Text>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
            <View style={styles.skeletonPeriod} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#00591f' }}>
        <StatusBar style="light" backgroundColor="#00591f" />
      </SafeAreaView>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>Campanhas</Text>
            <Text style={styles.subtitle}>Confira nossas campanhas especiais</Text>
          </View>
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Icon name="bell-outline" size={20} color="#2a2a2a" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => (navigation as any).navigate('Cart')}
            >
              <Icon name="cart-outline" size={20} color="#2a2a2a" />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartCount > 99 ? '99+' : String(cartCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00591f']}
            tintColor="#00591f"
          />
        }
      >
        {/* Categorias */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {/* Opção "Todas" */}
            <TouchableOpacity
              style={[
                styles.categoryPill,
                categoriaSelecionada === 'all' && styles.categoryPillActive,
                categoriaSelecionada === 'all' && styles.categoryPillAll
              ]}
              onPress={() => filtrarPorCategoria('all')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.categoryPillText,
                categoriaSelecionada === 'all' && styles.categoryPillTextActive
              ]}>
                Todas
              </Text>
            </TouchableOpacity>

            {/* Categorias dinâmicas */}
            {categorias.map((categoria) => 
              renderCategoriaPill(categoria, categoriaSelecionada === categoria.id)
            )}
          </ScrollView>
        </View>

        {/* Campanhas */}
        <View style={styles.campaignsContainer}>
          {loading ? (
            renderSkeleton()
          ) : campanhas.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.campaignsGrid}>
              {campanhas.map(renderCampanhaCard)}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
  },
  topBar: {
    height: 72,
    backgroundColor: '#00591f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#e4ffe8',
    fontSize: 12,
    marginTop: 2,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#19c463',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categoriesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  categoriesScrollContent: {
    paddingRight: 20,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryPillActive: {
    backgroundColor: '#00591f',
    borderColor: '#00591f',
  },
  categoryPillAll: {
    backgroundColor: '#00591f',
  },
  categoryPillPromocao: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  categoryPillSaude: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  categoryPillDataEspecial: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  categoryPillLancamento: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  campaignsContainer: {
    paddingHorizontal: 20,
  },
  campaignsGrid: {
    gap: 16,
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  campaignImageContainer: {
    position: 'relative',
    height: 180,
  },
  campaignImage: {
    width: '100%',
    height: '100%',
  },
  campaignTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  campaignTagPromocao: {
    backgroundColor: '#DC2626',
  },
  campaignTagSaude: {
    backgroundColor: '#059669',
  },
  campaignTagDataEspecial: {
    backgroundColor: '#D97706',
  },
  campaignTagLancamento: {
    backgroundColor: '#2563EB',
  },
  campaignTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  campaignContent: {
    padding: 16,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  campaignSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  campaignPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  campaignPeriodText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  skeletonContainer: {
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonImage: {
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  skeletonContent: {
    padding: 16,
    gap: 8,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    width: '80%',
  },
  skeletonSubtitle: {
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    width: '60%',
  },
  skeletonPeriod: {
    height: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    width: '40%',
  },
});
