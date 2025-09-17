import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { listarCarrinho } from '../services/cart';
import { obterLinkIndicacao } from '../services/management';
import { 
  listarRede, 
  calcularEstatisticas, 
  formatarDataCriacao, 
  getFotoUrl,
  Indicado,
  ReferralsStats 
} from '../services/referrals';

// Componente para avatar do indicado com fallback
const IndicadoAvatar = ({ indicado }: { indicado: Indicado }) => {
  const [imageError, setImageError] = useState(false);

  const shouldShowImage = indicado.img && indicado.img !== 'default-avatar.png' && !imageError;

  return (
    <View style={styles.indicadoAvatar}>
      {shouldShowImage ? (
        <Image
          source={{ uri: getFotoUrl(indicado.img) }}
          style={styles.avatarImage}
          resizeMode="cover"
          onError={() => {
            setImageError(true);
          }}
        />
      ) : (
        <View style={styles.avatarIconContainer}>
          <Icon name="account" size={24} color="#6B7280" />
        </View>
      )}
      <View style={[
        styles.statusBadge,
        indicado.status === 'ativo' ? styles.statusBadgeActive : styles.statusBadgeInactive
      ]}>
        <Icon 
          name={indicado.status === 'ativo' ? 'check' : 'close'} 
          size={10} 
          color="#ffffff" 
        />
      </View>
    </View>
  );
};

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [cartCount, setCartCount] = useState<number>(0);
  const [linkIndicacao, setLinkIndicacao] = useState<string>('');
  const [indicados, setIndicados] = useState<Indicado[]>([]);
  const [stats, setStats] = useState<ReferralsStats>({
    totalIndicados: 0,
    indicadosAtivos: 0,
    indicadosInativos: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega dados da rede de indicações
  const carregarIndicados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dados = await listarRede();
      setIndicados(dados);
      
      const estatisticas = calcularEstatisticas(dados);
      setStats(estatisticas);
    } catch (err: any) {
      console.error('Erro ao carregar indicações:', err);
      
      // Se for erro de pessoa_id não encontrado, tenta recarregar após um delay
      if (err.message?.includes('ID da pessoa não encontrado')) {
        setError('Carregando dados do usuário...');
        setTimeout(() => {
          carregarIndicados();
        }, 1000);
        return;
      }
      
      setError(err.message || 'Erro ao carregar dados');
      setIndicados([]);
      setStats({
        totalIndicados: 0,
        indicadosAtivos: 0,
        indicadosInativos: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarIndicados();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Confira os produtos incríveis da VitaTop! Use meu link de indicação: ${linkIndicacao}`,
        url: linkIndicacao,
        title: 'VitaTop - Produtos de Qualidade'
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o link');
    }
  };

  const handleRefresh = () => {
    carregarIndicados();
  };

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const links = await obterLinkIndicacao();
        if (!mounted) return;
        const lk = (links.link_lp || links.link_cadastro || '').trim();
        setLinkIndicacao(lk);
      } catch (e: any) {
        // mantém a tela com estados default caso falhe
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#00591f' }}>
        <StatusBar style="light" backgroundColor="#00591f" />
      </SafeAreaView>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>Minhas Indicações</Text>
            <Text style={styles.subtitle}>Gerencie sua rede de indicações</Text>
          </View>
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Icon name="bell-outline" size={20} color="#2a2a2a" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => (navigation as any).navigate('Cart')}>
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

        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 + insets.bottom }}>
          {/* Resumo de Indicados */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIconContainer}>
                <Icon name="account-multiple-plus" size={24} color="#00591f" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Resumo de Indicados</Text>
                <Text style={styles.summarySubtitle}>Sua rede de indicações</Text>
              </View>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalIndicados}</Text>
                <Text style={styles.statLabel}>Total de Indicados</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.indicadosAtivos}</Text>
                <Text style={styles.statLabel}>Ativos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.indicadosInativos}</Text>
                <Text style={styles.statLabel}>Inativos</Text>
              </View>
            </View>
          </View>

          {/* Lista de Indicados */}
          <Text style={styles.sectionTitle}>Seus Indicados</Text>
          
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#00591f" />
              <Text style={styles.loadingText}>Carregando indicações...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Icon name="alert-circle-outline" size={64} color="#EF4444" />
              <Text style={styles.emptyStateTitle}>Erro ao carregar dados</Text>
              <Text style={styles.emptyStateSubtitle}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                <Icon name="refresh" size={16} color="#ffffff" />
                <Text style={styles.retryBtnText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : indicados.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="account-multiple-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>Nenhum indicado encontrado</Text>
              <Text style={styles.emptyStateSubtitle}>
                Comece compartilhando seu link de indicação para expandir sua rede
              </Text>
            </View>
          ) : (
            <View style={styles.indicadosList}>
              {indicados.map((indicado) => (
                <View key={indicado.id} style={styles.indicadoCard}>
                  <IndicadoAvatar indicado={indicado} />
                  
                  <View style={styles.indicadoInfo}>
                    <Text style={styles.indicadoNome}>{indicado.name}</Text>
                    <View style={styles.indicadoDetails}>
                      <Icon name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.indicadoData}>
                        Indicado em {formatarDataCriacao(indicado.created_at)}
                      </Text>
                    </View>
                    {indicado.title && (
                      <View style={styles.indicadoDetails}>
                        <Icon name="crown-outline" size={14} color="#6B7280" />
                        <Text style={styles.indicadoData}>{indicado.title}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.indicadoActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Icon name="message-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Convide Novos Membros */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Convide Novos Membros</Text>
          <View style={styles.inviteCard}>
            <View style={styles.inviteHeader}>
              <View style={styles.inviteIconContainer}>
                <Icon name="share-variant" size={24} color="#00591f" />
              </View>
              <View style={styles.inviteContent}>
                <Text style={styles.inviteTitle}>Compartilhe e Ganhe</Text>
                <Text style={styles.inviteSubtitle}>
                  Indique amigos e receba comissões por cada venda realizada
                </Text>
              </View>
            </View>
            
            <View style={styles.linkContainer}>
              <Text style={styles.linkLabel}>Seu link de indicação:</Text>
              <View style={styles.linkBox}>
                <Text style={styles.linkText} numberOfLines={2}>
                  {linkIndicacao || 'Carregando link...'}
                </Text>
                <TouchableOpacity style={styles.copyBtn}>
                  <Icon name="content-copy" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              disabled={!linkIndicacao} 
              onPress={handleShare} 
              style={[
                styles.shareBtn,
                !linkIndicacao && styles.shareBtnDisabled
              ]}
            >
              <Icon name="share" size={20} color="#ffffff" />
              <Text style={styles.shareBtnText}>Compartilhar Link</Text>
            </TouchableOpacity>
            
            <View style={styles.inviteBenefits}>
              <View style={styles.benefitItem}>
                <Icon name="cash-multiple" size={16} color="#059669" />
                <Text style={styles.benefitText}>Comissões por vendas</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="account-multiple-plus" size={16} color="#059669" />
                <Text style={styles.benefitText}>Rede em crescimento</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="chart-line" size={16} color="#059669" />
                <Text style={styles.benefitText}>Ganhos escaláveis</Text>
              </View>
            </View>
          </View>
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
  
  // Summary Card
  summaryCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#e8f3ed', 
    padding: 16, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2 
  },
  summaryHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  summaryIconContainer: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#e8f3ed', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  summaryContent: { flex: 1 },
  summaryTitle: { fontSize: 18, fontWeight: '800', color: '#0b5132', marginBottom: 4 },
  summarySubtitle: { fontSize: 14, color: '#6b7280' },
  summaryStats: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center' 
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#0b5132' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: '600' },
  statDivider: { 
    width: 1, 
    height: 40, 
    backgroundColor: '#e5e7eb' 
  },
  
  // Section Title
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#111827', 
    marginBottom: 12 
  },
  
  // Empty State
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
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00591f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  
  // Indicados List
  indicadosList: { gap: 12, marginBottom: 16 },
  indicadoCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: '#eef1f4', 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.03, 
    shadowRadius: 6, 
    shadowOffset: { width: 0, height: 2 }, 
    elevation: 1 
  },
  indicadoAvatar: { 
    position: 'relative', 
    marginRight: 12 
  },
  avatarImage: { 
    width: 50, 
    height: 50, 
    borderRadius: 25 
  },
  avatarIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  statusBadge: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: '#ffffff' 
  },
  statusBadgeActive: { backgroundColor: '#10b981' },
  statusBadgeInactive: { backgroundColor: '#6b7280' },
  indicadoInfo: { flex: 1 },
  indicadoNome: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  indicadoDetails: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  indicadoData: { fontSize: 13, color: '#6b7280' },
  indicadoActions: { marginLeft: 8 },
  actionBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#f8fafc', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  // Invite Card
  inviteCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#e8f3ed', 
    padding: 16, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2 
  },
  inviteHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  inviteIconContainer: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#e8f3ed', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  inviteContent: { flex: 1 },
  inviteTitle: { fontSize: 18, fontWeight: '800', color: '#0b5132', marginBottom: 4 },
  inviteSubtitle: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  linkContainer: { marginBottom: 16 },
  linkLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  linkBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8f9fa', 
    borderRadius: 10, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  linkText: { 
    flex: 1, 
    color: '#111827', 
    fontWeight: '600', 
    fontSize: 13, 
    lineHeight: 18 
  },
  copyBtn: { 
    marginLeft: 8, 
    padding: 4 
  },
  shareBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#00591f', 
    borderRadius: 12, 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    marginBottom: 16 
  },
  shareBtnDisabled: { 
    backgroundColor: '#9ca3af', 
    opacity: 0.6 
  },
  shareBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  inviteBenefits: { 
    flexDirection: 'row', 
    justifyContent: 'space-around' 
  },
  benefitItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  benefitText: { 
    fontSize: 12, 
    color: '#374151', 
    fontWeight: '600' 
  }
});
