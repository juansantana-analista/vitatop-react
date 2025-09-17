import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { listarCarrinho } from '../services/cart';
import { obterDashboard, obterWalletTotals, obterLinkIndicacao } from '../services/management';

export default function ManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [showBalance, setShowBalance] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  // Estados dinâmicos
  const [saldoTotal, setSaldoTotal] = useState<number>(0);
  const [saldoDisp, setSaldoDisp] = useState<number>(0);
  const [saldoBloq, setSaldoBloq] = useState<number>(0);
  const [vendasMes, setVendasMes] = useState<number>(0);
  const [indicadosAtivos, setIndicadosAtivos] = useState<number>(0);
  const [ticketMedio, setTicketMedio] = useState<number>(0);
  const [conversao, setConversao] = useState<number>(0);
  const [ranking, setRanking] = useState<number>(0);
  const [metaMensalValor, setMetaMensalValor] = useState<number>(2000);
  const [metaAtual, setMetaAtual] = useState<number>(0);
  const [linkIndicacao, setLinkIndicacao] = useState<string>('');

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
        const [dash, wallet, links] = await Promise.all([
          obterDashboard(),
          obterWalletTotals(),
          obterLinkIndicacao()
        ]);
        if (!mounted) return;
        // Wallet
        setSaldoTotal(Number(wallet.total || 0));
        setSaldoDisp(Number(wallet.disponivel || 0));
        setSaldoBloq(Number(wallet.bloqueado || 0));
        setMetaAtual(Number(wallet.total || 0));
        // Dashboard
        setVendasMes(Number((dash as any).valor_venda_mes || 0));
        setIndicadosAtivos(Number((dash as any).rede_geral || 0));
        // Heurísticas para ticket, conversão e ranking quando não houver campos específicos
        setTicketMedio(Math.max(0, Math.round((Number((dash as any).bonus_total_geral || 0) / Math.max(1, Number((dash as any).rede_geral || 1))) * 100) / 100));
        setConversao(0);
        setRanking(0);
        // Links
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
            <Text style={styles.title}>Gestão</Text>
            <Text style={styles.subtitle}>Acompanhe sua performance e ganhos</Text>
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
          {/* Wallet Card */}
          <View style={styles.walletCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.walletTitle}>Carteira</Text>
              <View style={styles.verifiedBadge}>
                <Icon name="check-circle" size={16} color="#065f46" />
                <Text style={styles.verifiedText}>Conta Verificada</Text>
              </View>
            </View>
            <Text style={styles.balanceLabel}>Saldo total</Text>
            <View style={styles.balanceValueRow}>
              <Text style={styles.balanceValue}>{showBalance ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoTotal) : '••••••'}</Text>
              <TouchableOpacity onPress={() => setShowBalance((s) => !s)} style={styles.eyeBtnSmall}>
                <Icon name={showBalance ? 'eye-off' : 'eye'} size={18} color="#0b5132" />
              </TouchableOpacity>
            </View>
            <View style={styles.balanceRow}>
              <View style={styles.balancePill}><Text style={styles.balancePillLabel}>Disponível</Text><Text style={styles.balancePillValue}>{showBalance ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoDisp) : '••••'}</Text></View>
              <View style={[styles.balancePill, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#fecaca' }]}><Text style={[styles.balancePillLabel, { color: '#7f1d1d' }]}>Bloqueado</Text><Text style={[styles.balancePillValue, { color: '#991b1b' }]}>{showBalance ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoBloq) : '••••'}</Text></View>
            </View>
            <View style={styles.walletActions}>
              <TouchableOpacity style={styles.walletBtn}><Icon name="file-document-outline" size={16} color="#0b5132" /><Text style={styles.walletBtnText}>Extrato</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.walletBtn, { backgroundColor: '#0b5132', borderColor: '#064e3b' }]}><Icon name="cash-fast" size={16} color="#ffffff" /><Text style={[styles.walletBtnText, { color: '#ffffff' }]}>Sacar</Text></TouchableOpacity>
            </View>
          </View>

          {/* Resumo */}
          <Text style={styles.sectionTitle}>Resumo</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}><Icon name="sale" size={18} color="#1e40af" /></View>
              <Text style={styles.summaryValue}>{vendasMes}</Text>
              <Text style={styles.summaryLabel}>Vendas no mês</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}><Icon name="account-multiple" size={18} color="#047857" /></View>
              <Text style={styles.summaryValue}>{indicadosAtivos}</Text>
              <Text style={styles.summaryLabel}>Indicados ativos</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}><Icon name="cash-multiple" size={18} color="#166534" /></View>
              <Text style={styles.summaryValue}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}</Text>
              <Text style={styles.summaryLabel}>Ticket médio</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#ecfeff', borderColor: '#a5f3fc' }]}><Icon name="chart-line" size={18} color="#0e7490" /></View>
              <Text style={styles.summaryValue}>{conversao}%</Text>
              <Text style={styles.summaryLabel}>Conversão</Text>
            </View>
          </View>

          {/* Metas */}
          <View style={styles.goalsCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.goalsTitle}>Meta mensal</Text>
              <View style={styles.rankPill}>
                <Icon name="star" size={14} color="#065f46" />
                <Text style={styles.rankPillText}>Ranking #{ranking}</Text>
              </View>
            </View>
            <Text style={styles.goalsSubtitle}>Objetivo: {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metaMensalValor)}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, Math.round((metaAtual / metaMensalValor) * 100))}%` }]} />
            </View>
            <View style={styles.progressFooter}>
              <Text style={styles.progressText}>{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metaAtual)}</Text>
              <Text style={[styles.progressText, { color: '#6b7280' }]}>de {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metaMensalValor)}</Text>
            </View>
          </View>

          {/* Ações rápidas */}
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickItem}>
              <View style={[styles.quickIcon, { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' }]}>
                <Icon name="share-variant" size={18} color="#065f46" />
              </View>
              <Text style={styles.quickLabel}>Indicar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickItem}>
              <View style={[styles.quickIcon, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                <Icon name="file-document-outline" size={18} color="#1e40af" />
              </View>
              <Text style={styles.quickLabel}>Extrato</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickItem}>
              <View style={[styles.quickIcon, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                <Icon name="cash-fast" size={18} color="#92400e" />
              </View>
              <Text style={styles.quickLabel}>Sacar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickItem}>
              <View style={[styles.quickIcon, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}>
                <Icon name="headset" size={18} color="#7f1d1d" />
              </View>
              <Text style={styles.quickLabel}>Suporte</Text>
            </TouchableOpacity>
          </View>

          {/* Link de indicação */}
          <Text style={styles.sectionTitle}>Link de indicação</Text>
          <View style={styles.refCard}>
            <View style={styles.refHeader}>
              <View style={styles.refIconContainer}>
                <Icon name="share-variant" size={20} color="#00591f" />
              </View>
              <View style={styles.refTitleContainer}>
                <Text style={styles.refTitle}>Compartilhe e ganhe</Text>
                <Text style={styles.refSubtitle}>Indique amigos e receba comissões</Text>
              </View>
            </View>
            <View style={styles.refLinkContainer}>
              <Text style={styles.refLink} numberOfLines={2}>{linkIndicacao || '—'}</Text>
            </View>
            <TouchableOpacity disabled={!linkIndicacao} onPress={handleShare} style={styles.shareBtn}>
              <Icon name="share" size={18} color="#ffffff" />
              <Text style={styles.shareBtnText}>Compartilhar Link</Text>
            </TouchableOpacity>
          </View>

          {/* Atividades recentes */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Atividades recentes</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}><Icon name="cart-check" size={16} color="#047857" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>Venda confirmada</Text>
                <Text style={styles.activitySubtitle}>Pedido recente</Text>
              </View>
              <Text style={styles.activityValue}>+ R$ 0,00</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  topBar: { height: 72, backgroundColor: '#00591f', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#e4ffe8', fontSize: 12, marginTop: 2 },
  rightIcons: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  walletCard: { backgroundColor: '#ecfdf5', borderRadius: 16, borderWidth: 1, borderColor: '#a7f3d0', padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  walletTitle: { color: '#065f46', fontSize: 14, fontWeight: '800' },
  eyeBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#a7f3d0', backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  eyeBtnSmall: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#a7f3d0', backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  balanceLabel: { marginTop: 6, color: '#065f46' },
  balanceValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  balanceValue: { color: '#065f46', fontSize: 24, fontWeight: '900' },
  balanceRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  balancePill: { flex: 1, backgroundColor: '#e8f3ed', borderRadius: 12, borderWidth: 1, borderColor: '#cfe5d8', padding: 10 },
  balancePillLabel: { color: '#0b5132', fontWeight: '700' },
  balancePillValue: { color: '#0b5132', fontWeight: '900', marginTop: 4 },
  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#a7f3d0', backgroundColor: '#d1fae5' },
  walletBtnText: { color: '#0b5132', fontSize: 13, fontWeight: '800' },
  walletActions: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#d9f7ea', borderWidth: 1, borderColor: '#b6ebd4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999 },
  verifiedText: { color: '#065f46', fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  summaryCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#eef1f4', padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  summaryIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  summaryValue: { fontSize: 18, fontWeight: '900', color: '#111827' },
  summaryLabel: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  goalsCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e8efe9', padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  goalsTitle: { color: '#0b5132', fontWeight: '800' },
  goalsSubtitle: { color: '#6b7280', marginTop: 6 },
  progressTrack: { height: 10, backgroundColor: '#e5efe9', borderRadius: 9999, overflow: 'hidden', marginTop: 10, borderWidth: 1, borderColor: '#d5e7dc' },
  progressFill: { height: '100%', backgroundColor: '#0b5132' },
  progressFooter: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { color: '#0b5132', fontWeight: '800' },
  rankPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e1f3ea', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999, borderWidth: 1, borderColor: '#bfe3d0' },
  rankPillText: { color: '#065f46', fontWeight: '800', fontSize: 12 },
  quickGrid: { flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'space-between' },
  quickItem: { width: '22%', backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#eef1f4', paddingVertical: 12, alignItems: 'center', gap: 8 },
  quickIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, color: '#111827', fontWeight: '700' },
  refCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e8f3ed', padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  refHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  refIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8f3ed', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  refTitleContainer: { flex: 1 },
  refTitle: { fontSize: 16, fontWeight: '800', color: '#0b5132', marginBottom: 2 },
  refSubtitle: { fontSize: 12, color: '#6b7280' },
  refLinkContainer: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  refLink: { color: '#111827', fontWeight: '600', fontSize: 13, lineHeight: 18 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#00591f', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  shareBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 }
  ,activityCard: { backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#eef1f4', padding: 4 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  activityIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginRight: 10 },
  activityTitle: { color: '#111827', fontWeight: '800' },
  activitySubtitle: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  activityValue: { color: '#065f46', fontWeight: '900' },
  activityDivider: { height: 1, backgroundColor: '#eef1f4' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 8 },
  bottomItem: { alignItems: 'center', width: 70 },
  bottomIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' },
  bottomIconActive: { backgroundColor: '#e8f3ed', borderWidth: 1, borderColor: '#cfe5d8' },
  bottomLabel: { fontSize: 11, color: '#374151', marginTop: 4 },
  bottomActive: { },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#19c463', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' }
});


