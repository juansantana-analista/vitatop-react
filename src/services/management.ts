import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Success<T> = { status: 'success'; data: T };

export type DashboardData = {
  bonus_total_geral?: number;
  valor_venda_mes?: number;
  rede_geral?: number;
};

export type WalletTotals = {
  total?: number;
  disponivel?: number;
  bloqueado?: number;
};

export async function obterDashboard(): Promise<DashboardData> {
  const pessoa_id = await AsyncStorage.getItem('pessoaId');
  const body = {
    class: 'PessoaContadorRest',
    method: 'RetornaDados',
    dados: { pessoa_id }
  } as Record<string, unknown>;
  const res = await api.request<Success<{ status?: string; dados?: DashboardData }>>(body);
  const payload: any = (res as any).data;
  if (payload?.status === 'success') return payload.dados || {};
  return (res as any).data || {};
}

export async function obterWalletTotals(): Promise<WalletTotals> {
  const pessoa_id = await AsyncStorage.getItem('pessoaId');
  const body = {
    class: 'BonusPremioService',
    method: 'SaldoTotal',
    pessoa_id
  } as Record<string, unknown>;
  const res = await api.request<Success<any[]>>(body);
  const list: any[] = (res as any).data || [];
  let disponivel = 0;
  let bloqueado = 0;
  let total = 0;
  list.forEach((item) => {
    const tipo = String(item.bloqueado ?? '');
    const valor = Number(item.valor_comissao ?? 0);
    if (tipo === '0') disponivel = valor;
    else if (tipo === '1') bloqueado = valor;
    else if (tipo === 'total') total = valor;
  });
  if (!total) total = disponivel + bloqueado;
  return { total, disponivel, bloqueado };
}

export type LinkIndicacao = { link_cadastro?: string; link_lp?: string };

export async function obterLinkIndicacao(): Promise<LinkIndicacao> {
  const pessoa_id = await AsyncStorage.getItem('pessoaId');
  const body = {
    class: 'PessoaRestService',
    method: 'LinkIndicador',
    dados: { pessoa_id }
  } as Record<string, unknown>;
  const res = await api.request<Success<{ data?: LinkIndicacao } & LinkIndicacao>>(body);
  const d: any = (res as any).data;
  // API às vezes embrulha em data.data
  return (d?.data as LinkIndicacao) || (res as any).data || {};
}


