// Cliente HTTP central do JES 2026. Todas as requisições ao backend passam por aqui.

const BASE_URL = "http://localhost:3000/api";
const CHAVE_TOKEN = "jes-token";

export function obterToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function definirToken(token) {
  try {
    if (token) localStorage.setItem(CHAVE_TOKEN, token);
    else localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // localStorage indisponível (modo privado, etc.) — ignora silenciosamente.
  }
}

async function requisitar(caminho, opcoes = {}) {
  const token = obterToken();
  const cabecalhos = {
    ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opcoes.headers || {}),
  };

  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    ...opcoes,
    headers: cabecalhos,
  });

  const ehJson = (resposta.headers.get("content-type") || "").includes("application/json");
  const dados = ehJson ? await resposta.json().catch(() => null) : null;

  if (!resposta.ok) {
    const mensagem = dados?.erro || `Erro na requisição (${resposta.status}).`;
    throw new Error(mensagem);
  }

  return dados;
}

function get(caminho) {
  return requisitar(caminho, { method: "GET" });
}
function post(caminho, corpo) {
  return requisitar(caminho, { method: "POST", body: JSON.stringify(corpo ?? {}) });
}
function put(caminho, corpo) {
  return requisitar(caminho, { method: "PUT", body: JSON.stringify(corpo ?? {}) });
}
function patch(caminho, corpo) {
  return requisitar(caminho, { method: "PATCH", body: JSON.stringify(corpo ?? {}) });
}
function del(caminho) {
  return requisitar(caminho, { method: "DELETE" });
}

// ===== Autenticação =====
export function entrar(email, senha) {
  return post("/auth/entrar", { email, senha });
}
export function verificarAcesso() {
  return get("/auth/verificar");
}

export function sair() {
  return post("/auth/sair");
}

// ===== Estado público (turmas, jogos, séries, regulamento, resultados) =====
export function buscarEstado() {
  return get("/estado");
}

// ===== Notificações =====
export function buscarNotificacoes(limite, tipo) {
  const params = new URLSearchParams();
  if (limite) params.set("limite", limite);
  if (tipo) params.set("tipo", tipo);
  const query = params.toString();
  return get(`/notificacoes${query ? `?${query}` : ""}`);
}
export function publicarAviso(dados) {
  return post("/notificacoes", dados);
}

// ===== Turmas =====
export function salvarTurma(id, dados) {
  return put(`/turmas/${encodeURIComponent(id)}`, dados);
}
export function excluirTurma(id) {
  return del(`/turmas/${encodeURIComponent(id)}`);
}

// ===== Séries/seleções =====
export function definirSerieSelecao(serie, paisKey) {
  return put(`/series/${encodeURIComponent(serie)}`, { paisKey });
}

// ===== Regulamento =====
export function salvarRegulamento(chave, texto) {
  return put(`/regulamento/${encodeURIComponent(chave)}`, { texto });
}

// ===== Jogos =====
export function criarJogos(jogos) {
  return post("/jogos/lote", { jogos });
}
export function atualizarJogo(id, patchDados, notificar = true) {
  return patch(`/jogos/${id}`, { patch: patchDados, notificar });
}
export function excluirJogo(id) {
  return del(`/jogos/${id}`);
}
export function excluirJogosDaFase(modalidadeSlug, categoria) {
  return del(
    `/jogos/fase?modalidadeSlug=${encodeURIComponent(modalidadeSlug)}&categoria=${encodeURIComponent(categoria)}`,
  );
}

// ===== Resultados únicos (pódios) =====
export function salvarResultadoUnico(dados) {
  return put("/resultados-unicos", dados);
}
export function excluirResultadoUnico(modalidadeSlug, categoria) {
  return del(
    `/resultados-unicos?modalidadeSlug=${encodeURIComponent(modalidadeSlug)}&categoria=${encodeURIComponent(categoria)}`,
  );
}

export default {
  obterToken,
  definirToken,
  entrar,
  verificarAcesso,
  sair,
  buscarEstado,
  buscarNotificacoes,
  publicarAviso,
  salvarTurma,
  excluirTurma,
  definirSerieSelecao,
  salvarRegulamento,
  criarJogos,
  atualizarJogo,
  excluirJogo,
  excluirJogosDaFase,
  salvarResultadoUnico,
  excluirResultadoUnico,
};
