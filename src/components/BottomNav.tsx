import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listarCarrinho } from '../services/cart';

type Props = { 
  currentRouteName?: string;
  onMenuPress?: () => void;
};

export default function BottomNav({ currentRouteName, onMenuPress }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const routeName = currentRouteName;
  const [cartCount, setCartCount] = useState<number>(0);

  // Determina qual tela está ativa baseado na rota
  const getActiveTab = () => {
    switch (routeName) {
      case 'Home':
        return 'home';
      case 'Management':
        return 'gestao';
      case 'Cart':
        return 'cart';
      case 'Campaign':
        return 'campaign';
      default:
        return undefined;
    }
  };

  const active = getActiveTab();

  useEffect(() => {
    const updateCart = async () => {
      try {
        const data = await listarCarrinho();
        const count = (data.itens || []).reduce((acc: number, it: any) => acc + Number(it.quantidade || 0), 0);
        console.log('BottomNav - Carrinho data:', data);
        console.log('BottomNav - Itens:', data.itens);
        console.log('BottomNav - Count calculado:', count);
        setCartCount(count);
      } catch (error) {
        console.log('BottomNav - Erro ao carregar carrinho:', error);
      }
    };
    updateCart();
    const unsub = (navigation as any).addListener?.('focus', updateCart);
    return unsub;
  }, [navigation]);

  // Oculta o BottomNav em telas que não devem exibi-lo
  if (!routeName || ['Login', 'ForgotPassword', 'Cart', 'Checkout', 'PaymentResult', 'ProductDetails', 'ShareProduct', 'ManageAddresses'].includes(routeName)) {
    return null;
  }

  return (
    <View style={[styles.bottomNav, { paddingBottom: 8 + insets.bottom, height: 70 + insets.bottom }]}>
      <TouchableOpacity style={styles.bottomItem} onPress={() => (navigation as any).navigate('Cart')}>
        <View style={styles.bottomIconWrap}>
          <Icon name="cart-outline" size={22} color="#374151" />
          {cartCount > 0 && (
            <View style={[styles.badge, { top: -6, right: -6 }]}>
              <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : String(cartCount)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.bottomLabel} numberOfLines={1}>Carrinho ({cartCount})</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.bottomItem, active === 'campaign' && styles.bottomActive]} onPress={() => (navigation as any).navigate('Campaign')}>
        <View style={[styles.bottomIconWrap, active === 'campaign' && styles.bottomIconActive]}><Icon name="bullhorn" size={22} color={active === 'campaign' ? '#00591f' : '#374151'} /></View>
        <Text style={[styles.bottomLabel, active === 'campaign' && { color: '#00591f', fontWeight: '800' }]} numberOfLines={1} adjustsFontSizeToFit={true}>Campanhas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.bottomItem, active === 'home' && styles.bottomActive]} onPress={() => (navigation as any).navigate('Home')}>
        <View style={[styles.bottomIconWrap, active === 'home' && styles.bottomIconActive]}><Icon name="home" size={22} color={active === 'home' ? '#00591f' : '#374151'} /></View>
        <Text style={[styles.bottomLabel, active === 'home' && { color: '#00591f', fontWeight: '800' }]} numberOfLines={1}>Início</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.bottomItem, active === 'gestao' && styles.bottomActive]} onPress={() => (navigation as any).navigate('Management')}>
        <View style={[styles.bottomIconWrap, active === 'gestao' && styles.bottomIconActive]}><Icon name="store" size={22} color={active === 'gestao' ? '#00591f' : '#374151'} /></View>
        <Text style={[styles.bottomLabel, active === 'gestao' && { color: '#00591f', fontWeight: '800' }]} numberOfLines={1}>Gestão</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomItem} onPress={onMenuPress}>
        <View style={styles.bottomIconWrap}><Icon name="menu" size={22} color="#374151" /></View>
        <Text style={styles.bottomLabel} numberOfLines={1}>Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 8, paddingHorizontal: 8, zIndex: 1000 },
  bottomItem: { alignItems: 'center', width: 75 },
  bottomIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' },
  bottomIconActive: { backgroundColor: '#e8f3ed', borderWidth: 1, borderColor: '#cfe5d8' },
  bottomLabel: { fontSize: 11, color: '#374151', marginTop: 4, textAlign: 'center' },
  bottomActive: { },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#19c463', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' }
});


