import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Success<T> = { status: 'success'; data: T };

export interface Pedido {
  id: string;
  numero_pedido: string;
  data_pedido: string;
  status: 'pendente' | 'confirmado' | 'enviado' | 'entregue' | 'cancelado';
  valor_total: number;
  produtos: ProdutoPedido[];
  endereco_entrega?: EnderecoEntrega;
  tipo: 'consumo' | 'afiliado';
  comissao?: number; // Apenas para pedidos de afiliado
  cliente_nome?: string; // Apenas para pedidos de afiliado
  forma_pagamento?: string;
  quantidade_itens?: number;
}

export interface ProdutoPedido {
  id: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  imagem?: string;
}

export interface EnderecoEntrega {
  nome_destinatario: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

// Helper para resolver pessoaId de múltiplas fontes (mesmo usado no user.ts)
async function resolvePessoaId(pessoaId?: string): Promise<string> {
  if (pessoaId) return pessoaId;
  
  // Tenta buscar do AsyncStorage
  const stored = await AsyncStorage.getItem('pessoaId');
  if (stored) return stored;
  
  // Tenta extrair do JWT já decodificado (mesmo padrão do user.ts)
  try {
    const decoded = (globalThis as any)?.auth?.decoded;
    const fromJwt = String(decoded?.data?.pessoa_id || decoded?.pessoa_id || '');
    if (fromJwt && fromJwt !== 'null' && fromJwt !== 'undefined') {
      // Salva no AsyncStorage para próximas consultas
      try { await AsyncStorage.setItem('pessoaId', fromJwt); } catch {}
      return fromJwt;
    }
  } catch {}
  
  throw new Error('ID da pessoa não encontrado');
}

/**
 * Lista pedidos de consumo próprio (pedidos que o usuário fez para si)
 * Baseado na função listarPedidos do app antigo
 */
export async function listarPedidosConsumo(offset = 0, limit = 15): Promise<{ pedidos: Pedido[], pagination: any }> {
  try {
    const pessoaId = await resolvePessoaId();

    const body = {
      class: 'PedidoVendaRest',
      method: 'ListarPedidos',
      pessoa_id: pessoaId,
      limit: limit,
      offset: offset
    } as Record<string, unknown>;

    const res = await api.request<any>(body);
    
    
    // Verifica se o status é 'success' e se há dados de pedidos (mesmo padrão do app antigo)
    if (
      res.status === 'success' &&
      res.data &&
      res.data.data &&
      res.data.data.data
    ) {
      const pedidos = res.data.data.data;
      const pagination = res.data.data.pagination;
      
      // Marca todos como tipo 'consumo' e mapeia para interface
      const pedidosMapeados = pedidos.map((pedido: any) => ({
        id: String(pedido.id || ''),
        numero_pedido: String(pedido.id || ''),
        data_pedido: String(pedido.data_emissao || ''),
        status: mapearStatusPedido(pedido.status_compra == 3 ? pedido.status_pedido : pedido.mensagem_compra),
        valor_total: Number(pedido.valor_total || 0),
        produtos: pedido.itens ? pedido.itens.map((item: any) => ({
          id: String(item.item || ''),
          nome: String(item.descricao || 'Produto sem nome'),
          quantidade: Number(item.quantidade || 0),
          valor_unitario: Number(item.preco_unitario || 0),
          valor_total: Number(item.preco_total || 0),
          imagem: String(item.foto || '')
        })) : [],
        tipo: 'consumo' as const,
        forma_pagamento: String(pedido.forma_pagamento || 'Não informado'),
        quantidade_itens: Number(pedido.quantidade_itens || 0),
        endereco_entrega: pedido.endereco_entrega ? {
          nome_destinatario: String(pedido.nome_cliente || ''),
          endereco: String(pedido.endereco_entrega.rua || ''),
          numero: String(pedido.endereco_entrega.numero || ''),
          complemento: String(pedido.endereco_entrega.complemento || ''),
          bairro: String(pedido.endereco_entrega.bairro || ''),
          cidade: String(pedido.endereco_entrega.cidade || ''),
          estado: String(pedido.endereco_entrega.estado || ''),
          cep: String(pedido.endereco_entrega.cep || '')
        } : undefined
      }));

      return { pedidos: pedidosMapeados, pagination };
    } else {
      console.log('Estrutura de resposta inválida para pedidos consumo:', res);
      throw new Error('Formato de dados inválido');
    }
  } catch (error) {
    console.error('Erro ao listar pedidos de consumo:', error);
    throw error;
  }
}

/**
 * Lista pedidos de vendas afiliado (vendas realizadas através do link de indicação)
 * Baseado na função listarVendas do app antigo
 */
export async function listarPedidosAfiliado(offset = 0, limit = 15): Promise<{ pedidos: Pedido[], pagination: any }> {
  try {
    const pessoaId = await resolvePessoaId();

    const dados = {
      vendedor: pessoaId,
      limit: limit,
      offset: offset
    };

    const body = {
      class: 'PedidoDigitalRest',
      method: 'MinhasVendasDigitais',
      dados: dados
    } as Record<string, unknown>;

    const res = await api.request<any>(body);
    
    
    // Verifica se o status é 'success' e se há dados de vendas (mesmo padrão do app antigo)
    if (
      res.status === 'success' &&
      res.data.status === 'success' &&
      res.data.data.status === 'success'
    ) {
      const vendas = res.data.data.data;
      const pagination = res.data.data.pagination;
      
      // Marca todos como tipo 'afiliado' e mapeia para interface
      const pedidosMapeados = vendas.map((venda: any) => ({
        id: String(venda.venda_id || ''),
        numero_pedido: String(venda.venda_id || ''),
        data_pedido: String(venda.data_criacao || ''),
        status: mapearStatusPedido(venda.status_compra),
        valor_total: Number(venda.valor_total || 0),
        produtos: venda.itens ? venda.itens.map((item: any) => ({
          id: String(item.produto_id || ''),
          nome: String(item.descricao || 'Produto sem nome'),
          quantidade: Number(item.qtde || 0),
          valor_unitario: Number(item.preco || 0),
          valor_total: Number(item.total || 0),
          imagem: String(item.foto || '')
        })) : [],
        tipo: 'afiliado' as const,
        forma_pagamento: String(venda.forma_pagamento?.forma || 'Não informado'),
        quantidade_itens: Number(venda.quantidade_itens || 0),
        cliente_nome: String(venda.cliente?.nome_completo || 'Cliente não informado'),
        comissao: Number(venda.comissao || 0) // Se houver campo de comissão
      }));

      return { pedidos: pedidosMapeados, pagination };
    } else {
      console.log('Estrutura de resposta inválida para pedidos afiliado:', res);
      throw new Error('Formato de dados inválido');
    }
  } catch (error) {
    console.error('Erro ao listar pedidos de afiliado:', error);
    throw error;
  }
}

/**
 * Mapeia o status do pedido para o formato padrão
 */
function mapearStatusPedido(status: string): Pedido['status'] {
  const statusLower = status?.toLowerCase() || '';
  
  if (statusLower.includes('pendente') || statusLower.includes('aguardando') || statusLower.includes('pagamento pendente')) {
    return 'pendente';
  } else if (statusLower.includes('confirmado') || statusLower.includes('pago') || statusLower.includes('autorizado')) {
    return 'confirmado';
  } else if (statusLower.includes('enviado') || statusLower.includes('transito') || statusLower.includes('em transito')) {
    return 'enviado';
  } else if (statusLower.includes('entregue') || statusLower.includes('concluido')) {
    return 'entregue';
  } else if (statusLower.includes('cancelado') || statusLower.includes('cancel')) {
    return 'cancelado';
  }
  
  return 'pendente'; // Default
}

/**
 * Formata a data do pedido
 */
export function formatarDataPedido(dataString?: string): string {
  if (!dataString) {
    return 'Data não disponível';
  }

  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Data inválida';
  }
}

/**
 * Formata o valor monetário
 */
export function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

/**
 * Obtém a cor do status do pedido
 */
export function getStatusColor(status: Pedido['status']): string {
  const statusColors = {
    pendente: '#F59E0B',
    confirmado: '#3B82F6',
    enviado: '#8B5CF6',
    entregue: '#10B981',
    cancelado: '#EF4444'
  };
  return statusColors[status] || '#6B7280';
}

/**
 * Obtém o texto do status do pedido
 */
export function getStatusText(status: Pedido['status']): string {
  const statusTexts = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    enviado: 'Enviado',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
  };
  return statusTexts[status] || 'Desconhecido';
}

/**
 * Obtém a URL da imagem do produto
 */
export function getProdutoImageUrl(imagem?: string): string {
  if (!imagem || imagem === 'default-product.png') {
    return '';
  }
  
  // Se a imagem já tem uma URL completa, retorna ela
  if (imagem.startsWith('http://') || imagem.startsWith('https://')) {
    return imagem;
  }
  
  // Assumindo que as imagens estão hospedadas em algum servidor
  // Ajuste a URL base conforme necessário
  const baseUrl = 'https://vitatop.tecskill.com.br'; // URL base do servidor
  return `${baseUrl}/${imagem}`;
}
