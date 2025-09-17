import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CartItem = {
  produto_id: string;
  nome: string;
  foto?: string;
  quantidade: number;
  preco_unitario: number;
};

export type CartData = {
  pessoa_id: string;
  itens: CartItem[];
  total: number;
};

type SuccessEnvelope<T> = { status: 'success'; data: T } | { status: 'success'; data: { status: 'sucess'; data: any } };

export async function listarCarrinho(pessoaId?: string): Promise<CartData> {
  const pid = pessoaId || await AsyncStorage.getItem('pessoaId');
  const body = {
    class: 'PagamentoSafe2payRest',
    method: 'ListarCarrinho',
    dados: { pessoa_id: pid }
  } as Record<string, unknown>;
  const res = await api.request<SuccessEnvelope<any>>(body);
  const payload = (res as any).data?.data ?? (res as any).data;
  const data = payload?.data ?? payload;
  const itens: CartItem[] = (data?.itens || []).map((it: any) => ({
    produto_id: String(it.produto_id),
    nome: it.nome,
    foto: it.foto,
    quantidade: Number(it.quantidade || 0),
    preco_unitario: Number(it.preco_unitario || 0)
  }));
  return {
    pessoa_id: String(data?.pessoa_id || ''),
    itens,
    total: Number(data?.total || 0)
  };
}

export async function adicionarItemCarrinho(produtoId: string, quantidade = 1): Promise<void> {
  const pessoaId = await AsyncStorage.getItem('pessoaId');
  const body = {
    class: 'PagamentoSafe2payRest',
    method: 'IncluirCarrinho',
    dados: { pessoa_id: pessoaId, produto_id: produtoId, quantidade }
  } as Record<string, unknown>;
  await api.request<SuccessEnvelope<any>>(body);
}

export async function alterarCarrinho(produtoId: string, quantidade: number): Promise<void> {
  const pessoa_id = await AsyncStorage.getItem('pessoaId');
  const body = {
    class: 'PagamentoSafe2payRest',
    method: 'AlterarCarrinho',
    dados: { pessoa_id, produto_id: produtoId, quantidade }
  };
  await api.request<SuccessEnvelope<any>>(body);
}

export async function removerItemCarrinho(produtoId: string): Promise<void> {
  const pessoa_id = await AsyncStorage.getItem('pessoaId');
  const body = {
    class: 'PagamentoSafe2payRest',
    method: 'RemoverItemCarrinho',
    dados: { pessoa_id, produto_id: produtoId }
  };
  await api.request<SuccessEnvelope<any>>(body);
}

export async function limparCarrinho(): Promise<void> {
  const pessoa_id = await AsyncStorage.getItem('pessoaId');
  const body = {
    class: 'PagamentoSafe2payRest',
    method: 'LimparCarrinho'
  };
  await api.request<SuccessEnvelope<any>>(body);
}


