import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { listarCarrinho } from '../services/cart';
import { 
  listarPedidosConsumo, 
  listarPedidosAfiliado,
  formatarDataPedido,
  formatarValor,
  getStatusColor,
  getStatusText,
  getProdutoImageUrl,
  Pedido,
  ProdutoPedido
} from '../services/orders';

// Função para garantir que valores sejam strings válidas
const safeText = (value: any, fallback: string = ''): string => {
  // Se o valor for null, undefined ou vazio, retorna fallback
  if (value === null || value === undefined) {
    return fallback;
  }
  
  // Se for string vazia, retorna fallback
  if (typeof value === 'string' && value.trim() === '') {
    return fallback;
  }
  
  // Se o valor for um objeto (exceto Date), retorna fallback
  if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
    return fallback;
  }
  
  // Converte para string de forma segura
  try {
    const result = String(value);
    return result || fallback;
  } catch (error) {
    return fallback;
  }
};

type TipoPedido = 'consumo' | 'afiliado' | 'todos';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [cartCount, setCartCount] = useState<number>(0);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoPedido>('todos');
  const [pedidosConsumo, setPedidosConsumo] = useState<Pedido[]>([]);
  const [pedidosAfiliado, setPedidosAfiliado] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paginationConsumo, setPaginationConsumo] = useState<any>(null);
  const [paginationAfiliado, setPaginationAfiliado] = useState<any>(null);

  // Refs para evitar dependências no useCallback
  const paginationConsumoRef = React.useRef<any>(null);
  const paginationAfiliadoRef = React.useRef<any>(null);

  React.useEffect(() => {
    paginationConsumoRef.current = paginationConsumo;
  }, [paginationConsumo]);

  React.useEffect(() => {
    paginationAfiliadoRef.current = paginationAfiliado;
  }, [paginationAfiliado]);

  // Carrega dados dos pedidos
  const carregarPedidos = React.useCallback(async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      const offsetConsumo = loadMore && paginationConsumoRef.current ? paginationConsumoRef.current.next_offset : 0;
      const offsetAfiliado = loadMore && paginationAfiliadoRef.current ? paginationAfiliadoRef.current.next_offset : 0;
      
      const [consumoData, afiliadoData] = await Promise.all([
        listarPedidosConsumo(offsetConsumo),
        listarPedidosAfiliado(offsetAfiliado)
      ]);
      
      if (loadMore) {
        setPedidosConsumo(prev => [...prev, ...consumoData.pedidos]);
        setPedidosAfiliado(prev => [...prev, ...afiliadoData.pedidos]);
      } else {
        setPedidosConsumo(consumoData.pedidos);
        setPedidosAfiliado(afiliadoData.pedidos);
      }
      
      setPaginationConsumo(consumoData.pagination);
      setPaginationAfiliado(afiliadoData.pagination);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
      if (!loadMore) {
        setPedidosConsumo([]);
        setPedidosAfiliado([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    carregarPedidos();
  }, []); // Apenas na montagem do componente

  useEffect(() => {
    const updateCart = async () => {
      try {
        const data = await listarCarrinho();
        setCartCount((data.itens || []).reduce((acc: number, it: any) => acc + Number(it.quantidade || 0), 0));
      } catch {}
    };
    updateCart();
    const unsub = (navigation as any).addListener?.('focus', updateCart);
    return unsub;
  }, [navigation]);

  const handleRefresh = React.useCallback(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  // Filtra pedidos baseado no tipo selecionado
  const getPedidosFiltrados = (): Pedido[] => {
    switch (tipoSelecionado) {
      case 'consumo':
        return pedidosConsumo;
      case 'afiliado':
        return pedidosAfiliado;
      case 'todos':
      default:
        return [...pedidosConsumo, ...pedidosAfiliado].sort((a, b) => 
          new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime()
        );
    }
  };

  // Obtém a paginação atual baseada no tipo selecionado
  const getPaginationAtual = () => {
    switch (tipoSelecionado) {
      case 'consumo':
        return paginationConsumo;
      case 'afiliado':
        return paginationAfiliado;
      case 'todos':
      default:
        // Para 'todos', considera a paginação que tem mais dados
        const totalConsumo = paginationConsumo?.total_records || 0;
        const totalAfiliado = paginationAfiliado?.total_records || 0;
        return totalConsumo > totalAfiliado ? paginationConsumo : paginationAfiliado;
    }
  };

  // Componente para o produto do pedido
  const ProdutoItem = ({ produto }: { produto: ProdutoPedido }) => {
    const imageUrl = getProdutoImageUrl(produto.imagem);
    const hasValidImage = imageUrl && imageUrl !== '';
    
    return (
      <View style={styles.produtoItem}>
        <View style={styles.produtoImageContainer}>
          {hasValidImage ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.produtoImage}
              resizeMode="cover"
              onError={() => {
                // Se a imagem falhar ao carregar, será renderizado o placeholder
              }}
            />
          ) : (
            <View style={styles.produtoImagePlaceholder}>
              <Icon name="package-variant" size={20} color="#9CA3AF" />
            </View>
          )}
        </View>
        <View style={styles.produtoInfo}>
          <Text style={styles.produtoNome} numberOfLines={2}>
            {safeText(produto?.nome, 'Produto sem nome')}
          </Text>
          <Text style={styles.produtoQuantidade}>
            Qtd: {safeText(produto?.quantidade, '0')}
          </Text>
        </View>
        <Text style={styles.produtoValor}>
          {safeText(formatarValor(produto?.valor_total || 0), 'R$ 0,00')}
        </Text>
      </View>
    );
  };

  // Componente para o card do pedido
  const PedidoCard = ({ pedido }: { pedido: Pedido }) => (
    <View style={styles.pedidoCard}>
      <View style={styles.pedidoHeader}>
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoNumero}>
            #{safeText(pedido?.numero_pedido, '000')}
          </Text>
          <Text style={styles.pedidoData}>
            {safeText(formatarDataPedido(pedido?.data_pedido), 'Data não disponível')}
          </Text>
        </View>
        <View style={styles.pedidoStatusContainer}>
          <View style={[
            styles.pedidoStatus,
            { backgroundColor: getStatusColor(pedido?.status || 'pendente') + '20' }
          ]}>
            <Text style={[
              styles.pedidoStatusText,
              { color: getStatusColor(pedido?.status || 'pendente') }
            ]}>
              {safeText(getStatusText(pedido?.status || 'pendente'), 'Pendente')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.pedidoTipoContainer}>
        <View style={[
          styles.pedidoTipo,
          pedido?.tipo === 'consumo' ? styles.tipoConsumo : styles.tipoAfiliado
        ]}>
          <Icon 
            name={pedido?.tipo === 'consumo' ? 'shopping' : 'account-group'} 
            size={14} 
            color="#ffffff" 
          />
          <Text style={styles.pedidoTipoText}>
            {safeText(pedido?.tipo === 'consumo' ? 'Meu Pedido' : 'Venda Afiliado', 'Pedido')}
          </Text>
        </View>
        {!!(pedido?.cliente_nome && String(pedido.cliente_nome).trim() !== '') && (
          <Text style={styles.clienteNome}>
            Cliente: {safeText(pedido.cliente_nome, 'Não informado')}
          </Text>
        )}
      </View>

      <View style={styles.produtosContainer}>
        {!!(pedido?.produtos && pedido.produtos.length > 0) ? (
          pedido.produtos.map((produto, index) => (
            <ProdutoItem key={produto.id || index} produto={produto} />
          ))
        ) : (
          <View style={styles.produtoItem}>
            <View style={styles.produtoImagePlaceholder}>
              <Icon name="package-variant" size={20} color="#9CA3AF" />
            </View>
            <View style={styles.produtoInfo}>
              <Text style={styles.produtoNome}>
                {safeText(pedido?.quantidade_itens, '0')} {Number(safeText(pedido?.quantidade_itens, '0')) === 1 ? 'item' : 'itens'}
              </Text>
              <Text style={styles.produtoQuantidade}>
                {safeText(pedido?.forma_pagamento, 'Não informado')}
              </Text>
            </View>
            <Text style={styles.produtoValor}>
              {safeText(formatarValor(pedido?.valor_total || 0), 'R$ 0,00')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.pedidoFooter}>
        <View style={styles.valoresContainer}>
          <Text style={styles.valorTotalLabel}>Total:</Text>
          <Text style={styles.valorTotal}>
            {safeText(formatarValor(pedido?.valor_total || 0), 'R$ 0,00')}
          </Text>
        </View>
        {!!(pedido?.comissao && Number(pedido.comissao) > 0) && (
          <View style={styles.comissaoContainer}>
            <Icon name="cash-multiple" size={16} color="#10B981" />
            <Text style={styles.comissaoText}>
              Comissão: {safeText(formatarValor(Number(pedido.comissao) || 0), 'R$ 0,00')}
            </Text>
          </View>
        )}
      </View>

      {!!(pedido?.tipo === 'consumo' && pedido.endereco_entrega && pedido.endereco_entrega.cidade && pedido.endereco_entrega.estado) && (
        <View style={styles.enderecoContainer}>
          <Icon name="map-marker" size={16} color="#6B7280" />
          <Text style={styles.enderecoText}>
            {safeText(pedido.endereco_entrega.cidade, 'Cidade')}, {safeText(pedido.endereco_entrega.estado, 'Estado')}
          </Text>
        </View>
      )}
    </View>
  );

  const pedidosFiltrados = getPedidosFiltrados();

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#00591f' }}>
        <StatusBar style="light" backgroundColor="#00591f" />
      </SafeAreaView>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>Meus Pedidos</Text>
            <Text style={styles.subtitle}>Acompanhe seus pedidos e vendas</Text>
          </View>
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Icon name="bell-outline" size={20} color="#2a2a2a" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => (navigation as any).navigate('Cart')}>
              <Icon name="cart-outline" size={20} color="#2a2a2a" />
              {!!(cartCount > 0) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {Number(cartCount) > 99 ? '99+' : String(Number(cartCount) || 0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                tipoSelecionado === 'todos' && styles.filterBtnActive
              ]}
              onPress={() => setTipoSelecionado('todos')}
            >
              <Icon name="format-list-bulleted" size={16} color={tipoSelecionado === 'todos' ? '#ffffff' : '#6B7280'} />
              <Text style={[
                styles.filterBtnText,
                tipoSelecionado === 'todos' && styles.filterBtnTextActive
              ]}>
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterBtn,
                tipoSelecionado === 'consumo' && styles.filterBtnActive
              ]}
              onPress={() => setTipoSelecionado('consumo')}
            >
              <Icon name="shopping" size={16} color={tipoSelecionado === 'consumo' ? '#ffffff' : '#6B7280'} />
              <Text style={[
                styles.filterBtnText,
                tipoSelecionado === 'consumo' && styles.filterBtnTextActive
              ]}>
                Meus Pedidos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterBtn,
                tipoSelecionado === 'afiliado' && styles.filterBtnActive
              ]}
              onPress={() => setTipoSelecionado('afiliado')}
            >
              <Icon name="account-group" size={16} color={tipoSelecionado === 'afiliado' ? '#ffffff' : '#6B7280'} />
              <Text style={[
                styles.filterBtnText,
                tipoSelecionado === 'afiliado' && styles.filterBtnTextActive
              ]}>
                Vendas Afiliado
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 + insets.bottom }}>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#00591f" />
              <Text style={styles.loadingText}>Carregando pedidos...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Icon name="alert-circle-outline" size={64} color="#EF4444" />
              <Text style={styles.emptyStateTitle}>Erro ao carregar pedidos</Text>
              <Text style={styles.emptyStateSubtitle}>{safeText(error, 'Erro desconhecido')}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                <Icon name="refresh" size={16} color="#ffffff" />
                <Text style={styles.retryBtnText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : pedidosFiltrados.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="package-variant" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>
                {tipoSelecionado === 'consumo' ? 'Nenhum pedido encontrado' : tipoSelecionado === 'afiliado' ? 'Nenhuma venda encontrada' : 'Nenhum pedido encontrado'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {tipoSelecionado === 'consumo' ? 'Você ainda não fez nenhum pedido.' : tipoSelecionado === 'afiliado' ? 'Você ainda não tem vendas através do seu link de afiliado.' : 'Você ainda não tem pedidos ou vendas.'}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.pedidosList}>
                {pedidosFiltrados.map((pedido, index) => (
                  <PedidoCard key={pedido.id || index} pedido={pedido} />
                ))}
              </View>
              
              {!!getPaginationAtual()?.has_more && (
                <View style={styles.loadMoreContainer}>
                  <TouchableOpacity 
                    style={styles.loadMoreBtn} 
                    onPress={() => carregarPedidos(true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.loadMoreBtnText}>Carregando...</Text>
                      </>
                    ) : (
                      <>
                        <Icon name="refresh" size={18} color="#ffffff" />
                        <Text style={styles.loadMoreBtnText}>
                          {tipoSelecionado === 'consumo' ? 'Carregar mais pedidos' : tipoSelecionado === 'afiliado' ? 'Carregar mais vendas' : 'Carregar mais'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.loadMoreInfo}>
                    Mostrando {safeText(pedidosFiltrados.length, '0')} de {safeText(getPaginationAtual()?.total_records, '0')} registros
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  topBar: { 
    height: 72, 
    backgroundColor: '#00591f', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 14 
  },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#e4ffe8', fontSize: 12, marginTop: 2 },
  rightIcons: { flexDirection: 'row', gap: 6 },
  iconBtn: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    backgroundColor: '#ffffff', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: '#e0e0e0' 
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
    justifyContent: 'center' 
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  
  // Filtros
  filtersContainer: { 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12 
  },
  filtersScroll: { paddingHorizontal: 14, gap: 8 },
  filterBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#f3f4f6', 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  filterBtnActive: { 
    backgroundColor: '#00591f', 
    borderColor: '#00591f' 
  },
  filterBtnText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#6B7280' 
  },
  filterBtnTextActive: { 
    color: '#ffffff' 
  },
  
  // Estados
  loadingState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 40, 
    paddingHorizontal: 20 
  },
  loadingText: { 
    fontSize: 16, 
    color: '#6b7280', 
    marginTop: 12, 
    fontWeight: '600' 
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 40, 
    paddingHorizontal: 20 
  },
  emptyStateTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#374151', 
    marginTop: 16, 
    marginBottom: 8 
  },
  emptyStateSubtitle: { 
    fontSize: 14, 
    color: '#6b7280', 
    textAlign: 'center', 
    lineHeight: 20,
    marginBottom: 16
  },
  retryBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#00591f', 
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 20 
  },
  retryBtnText: { 
    color: '#ffffff', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  
  // Lista de pedidos
  pedidosList: { gap: 16 },
  pedidoCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#eef1f4', 
    padding: 16, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2 
  },
  pedidoHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  pedidoInfo: { flex: 1 },
  pedidoNumero: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#111827', 
    marginBottom: 4 
  },
  pedidoData: { 
    fontSize: 14, 
    color: '#6B7280' 
  },
  pedidoStatusContainer: { marginLeft: 12 },
  pedidoStatus: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  pedidoStatusText: { 
    fontSize: 12, 
    fontWeight: '700' 
  },
  
  // Tipo do pedido
  pedidoTipoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  pedidoTipo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  tipoConsumo: { backgroundColor: '#3B82F6' },
  tipoAfiliado: { backgroundColor: '#10B981' },
  pedidoTipoText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#ffffff' 
  },
  clienteNome: { 
    fontSize: 12, 
    color: '#6B7280', 
    fontWeight: '600' 
  },
  
  // Produtos
  produtosContainer: { marginBottom: 16 },
  produtoItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    paddingBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6' 
  },
  produtoImageContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: 8, 
    marginRight: 12, 
    overflow: 'hidden' 
  },
  produtoImage: { 
    width: '100%', 
    height: '100%' 
  },
  produtoImagePlaceholder: { 
    width: '100%', 
    height: '100%', 
    backgroundColor: '#f3f4f6', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  produtoInfo: { flex: 1 },
  produtoNome: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#111827', 
    marginBottom: 4 
  },
  produtoQuantidade: { 
    fontSize: 12, 
    color: '#6B7280' 
  },
  produtoValor: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#111827' 
  },
  
  // Footer
  pedidoFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  valoresContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  valorTotalLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#374151' 
  },
  valorTotal: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#111827' 
  },
  comissaoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  comissaoText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#10B981' 
  },
  
  // Endereço
  enderecoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#f3f4f6' 
  },
  enderecoText: { 
    fontSize: 12, 
    color: '#6B7280' 
  },
  
  // Carregar Mais
  loadMoreContainer: { 
    alignItems: 'center', 
    paddingVertical: 30, 
    paddingHorizontal: 20 
  },
  loadMoreBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#00591f', 
    borderRadius: 12, 
    paddingVertical: 14, 
    paddingHorizontal: 24,
    minWidth: 200
  },
  loadMoreBtnText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  loadMoreInfo: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginTop: 12, 
    textAlign: 'center' 
  }
});
