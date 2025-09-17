import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Platform } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import ManageAddressesScreen from '../screens/ManageAddressesScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentResultScreen from '../screens/PaymentResultScreen';
import ManagementScreen from '../screens/ManagementScreen';
import CampaignScreen from '../screens/CampaignScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ReferralsScreen from '../screens/ReferralsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import BottomNav from '../components/BottomNav';
import SideMenu from '../components/SideMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthTokenProvider } from '../services/api';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  ProductDetails: { id: string };
  ShareProduct: { id: string };
  Cart: undefined;
  ManageAddresses: undefined;
  Checkout: { endereco_id: string; total: number };
  PaymentResult: { result: any };
  Management: undefined;
  Campaign: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  Referrals: undefined;
  Orders: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const navigationRef = useNavigationContainerRef();
  const [currentRouteName, setCurrentRouteName] = React.useState<string | undefined>(undefined);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  useEffect(() => {
    // Provisiona token do AsyncStorage no boot
    setAuthTokenProvider(() => {
      const token = (globalThis as any)?.auth?.token;
      return token;
    });
    (async () => {
      try {
        const t = await AsyncStorage.getItem('auth_token');
        if (t) {
          (globalThis as any).auth = { ...(globalThis as any).auth, token: t };
        }
      } catch {}
    })();
  }, []);
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        try {
          setCurrentRouteName(navigationRef.getCurrentRoute()?.name);
        } catch {}
      }}
      onStateChange={() => {
        try {
          setCurrentRouteName(navigationRef.getCurrentRoute()?.name);
        } catch {}
      }}
    >
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          screenOptions={{
            animation: 'none',
            gestureEnabled: false,
            headerShown: false,
            statusBarStyle: 'light',
            contentStyle: { backgroundColor: '#f7f9fa' },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false, animationTypeForReplace: 'push' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ProductDetails" component={require('../screens/ProductDetailsScreen').default} options={{ headerShown: false }} />
          <Stack.Screen name="ShareProduct" component={require('../screens/ShareProductScreen').default} options={{ headerShown: false }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />

          {/* Telas apresentadas como modal para fluxos de checkout/endereços */}
          <Stack.Group screenOptions={{ presentation: 'modal', animation: 'none' }}>
            <Stack.Screen name="ManageAddresses" component={ManageAddressesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PaymentResult" component={PaymentResultScreen} options={{ headerShown: false }} />
          </Stack.Group>

          <Stack.Screen name="Management" component={ManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Campaign" component={CampaignScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Referrals" component={ReferralsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Orders" component={OrdersScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
        <BottomNav 
          currentRouteName={currentRouteName} 
          onMenuPress={() => setIsMenuVisible(true)}
        />
        <SideMenu 
          isVisible={isMenuVisible} 
          onClose={() => setIsMenuVisible(false)} 
          onNavigateToLogin={() => {
            setIsMenuVisible(false);
            try {
              navigationRef.reset({ index: 0, routes: [{ name: 'Login' as never }] });
            } catch {
              // Fallback
              navigationRef.navigate('Login' as never);
            }
          }}
        />
      </View>
    </NavigationContainer>
  );
}


