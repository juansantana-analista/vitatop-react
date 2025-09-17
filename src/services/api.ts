export type AuthTokenProvider = () => string | undefined;

const API_BASE_URL = 'https://vitatop.tecskill.com.br/rest.php';

let getAuthToken: AuthTokenProvider = () => (globalThis as any)?.auth?.token;

export function setAuthTokenProvider(provider: AuthTokenProvider) {
  getAuthToken = provider;
}

async function request<T>(body: Record<string, unknown>): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const json = await response.json();
  
  // Verifica se a resposta tem a estrutura correta (igual ao app antigo)
  if (json.status !== 'success') {
    throw new Error(json.message || 'Falha na requisição');
  }
  
  // Para editarPessoa, verifica se data.status é success
  if (json.data && json.data.status && json.data.status !== 'success' && json.data.status !== 'sucess') {
    throw new Error(json.data.message || 'Falha na operação');
  }
  
  return json as T;
}

export const api = { request };


