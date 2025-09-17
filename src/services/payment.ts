import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FormaPagamento = 'pix' | 'boleto' | 'cartao';

export type IncluirVendaInput = {
  forma_pagamento: FormaPagamento;
  endereco_id: string;
  frete?: number;
  cartao?: { titular: string; numero: string; data_expiracao: string; cvc: string };
};

export type IncluirVendaResult = {
  pedido_id: string;
  valor_total?: number;
  boleto_linhadigitavel?: string;
  boleto_impressao?: string;
  pix_key?: string;
  pix_qrcode?: string;
  data_vencimento?: string;
  status_compra?: string;
  status_mensagem?: string;
  bandeira?: string;
  cartao_numero?: string;
  nome_cartao?: string;
};

export async function incluirVenda(input: IncluirVendaInput): Promise<IncluirVendaResult> {
  const pessoa_id = await AsyncStorage.getItem('pessoaId');
  const forma = input.forma_pagamento === 'cartao' ? 1 : input.forma_pagamento === 'boleto' ? 2 : 3;
  const body: any = {
    class: 'PagamentoSafe2payRest',
    method: 'IncluirVenda',
    dados: {
      pessoa_id,
      pagamento: {
        forma_pagamento: forma,
        titular: input.cartao?.titular,
        numero_cartao: input.cartao?.numero,
        data_expiracao: input.cartao?.data_expiracao,
        cvc: input.cartao?.cvc
      },
      destinatario: {
        pessoa_id,
        endereco_id: input.endereco_id,
        frete: input.frete ?? 0
      }
    }
  };
  const res = await api.request<{ status: 'success'; data: { status: 'success' | string; data: any } }>(body);
  const d = (res as any).data?.data || {};
  return {
    pedido_id: String(d.pedido_id || ''),
    valor_total: d.valor_total ? Number(d.valor_total) : undefined,
    boleto_linhadigitavel: d.boleto_linhadigitavel,
    boleto_impressao: d.boleto_impressao,
    pix_key: d.pix_key,
    pix_qrcode: d.pix_qrcode,
    data_vencimento: d.data_vencimento,
    status_compra: d.status_compra,
    status_mensagem: d.status_mensagem,
    bandeira: d.bandeira,
    cartao_numero: d.cartao_numero,
    nome_cartao: d.nome_cartao
  };
}

export async function pagamentoPedido(pedido_id: string, forma_pagamento: FormaPagamento, cartao?: { titular: string; numero: string; data_expiracao: string; cvc: string }): Promise<IncluirVendaResult> {
  const forma = forma_pagamento === 'cartao' ? 1 : forma_pagamento === 'boleto' ? 2 : 3;
  const body: any = {
    class: 'PagamentoSafe2payRest',
    method: 'PagamentoPedido',
    dados: {
      pedido_id,
      pagamento: {
        forma_pagamento: forma,
        titular: cartao?.titular,
        numero_cartao: cartao?.numero,
        data_expiracao: cartao?.data_expiracao,
        cvc: cartao?.cvc
      }
    }
  };
  const res = await api.request<{ status: 'success'; data: { status: 'success' | string; data: any } }>(body);
  const d = (res as any).data?.data || {};
  return {
    pedido_id: String(d.pedido_id || pedido_id),
    valor_total: d.valor_total ? Number(d.valor_total) : undefined,
    boleto_linhadigitavel: d.boleto_linhadigitavel,
    boleto_impressao: d.boleto_impressao,
    pix_key: d.pix_key,
    pix_qrcode: d.pix_qrcode,
    data_vencimento: d.data_vencimento,
    status_compra: d.status_compra,
    status_mensagem: d.status_mensagem,
    bandeira: d.bandeira,
    cartao_numero: d.cartao_numero,
    nome_cartao: d.nome_cartao
  };
}

export async function verificaPix(pedido_id: string): Promise<{ status_compra?: number; status_mensagem?: string }> {
  const body: any = {
    class: 'PagamentoSafe2payRest',
    method: 'VerificaPix',
    pedido_id
  };
  const res = await api.request<{ status: 'success'; data: { data: { status_compra?: number; status_mensagem?: string } } }>(body);
  const d = (res as any).data?.data || {};
  return { status_compra: d.status_compra, status_mensagem: d.status_mensagem };
}


