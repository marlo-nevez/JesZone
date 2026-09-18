// Avanço automático de fase: quando todos os jogos da fase de grupos de uma
// modalidade/categoria terminam, gera sozinho a primeira fase do mata-mata; e,
// quando uma fase do mata-mata termina, gera sozinho a fase seguinte, até a final
// (e a disputa de 3º lugar, junto com a final). Espelha a lógica "pura" do
// frontend (frontend/src/lib/bracket.js e jesConfig.js), mas lendo/gravando
// diretamente no banco.
import { Jogo, Turma, sequelize } from "../models/index.js";
import { locaisDaModalidade } from "../config/locais.js";
import { publicarNotificacao } from "./notificacaoService.js";

const ORDEM_FASES = ["oitavas", "quartas", "semi", "final"];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function gruposDaCategoria(categoria, transaction) {
  const turmas = await Turma.findAll({
    where: { categoria },
    order: [
      ["serie", "ASC"],
      ["letra", "ASC"],
    ],
    transaction,
  });
  return chunk(turmas, 4).map((g, i) => ({
    grupo: String.fromCharCode(65 + i),
    turmas: g.map((t) => t.id),
  }));
}

/** Classificação (pontos/saldo/gols pró) de um grupo, a partir dos jogos de grupo encerrados. */
function classificacao(jogosGrupos, grupo) {
  const linhas = new Map();
  const linha = (id) => {
    if (!linhas.has(id)) linhas.set(id, { turmaId: id, pontos: 0, saldo: 0, pro: 0 });
    return linhas.get(id);
  };

  for (const j of jogosGrupos) {
    if (j.status !== "encerrado") continue;
    if (grupo && j.grupo !== grupo) continue;

    const a = linha(j.turmaA);
    const b = linha(j.turmaB);
    a.pro += j.placarA;
    b.pro += j.placarB;
    a.saldo += j.placarA - j.placarB;
    b.saldo += j.placarB - j.placarA;

    if (j.placarA === j.placarB) {
      a.pontos += 1;
      b.pontos += 1;
    } else if (j.placarA > j.placarB) {
      a.pontos += 3;
    } else {
      b.pontos += 3;
    }
  }

  return [...linhas.values()].sort(
    (x, y) => y.pontos - x.pontos || y.saldo - x.saldo || y.pro - x.pro,
  );
}

function vencedor(j) {
  if (j.status !== "encerrado") return null;
  if (j.wo) return j.wo === "A" ? j.turmaA : j.turmaB;
  if (j.placarA === j.placarB) return null;
  return j.placarA > j.placarB ? j.turmaA : j.turmaB;
}

function perdedor(j) {
  const v = vencedor(j);
  if (!v) return null;
  return v === j.turmaA ? j.turmaB : j.turmaA;
}

/**
 * Verifica se a fase de grupos (ou a fase atual do mata-mata) de uma
 * modalidade/categoria acabou de ser concluída e, se sim, cria e publica
 * automaticamente a próxima fase — avançando sozinho até a final.
 * Chamada sempre que um jogo passa a "encerrado".
 *
 * IMPORTANTE: esta verificação é do tipo "ler o estado atual, decidir, then
 * gravar" (check-then-act), então precisa rodar de forma serializada por
 * modalidade/categoria. Quando o organizador encerra vários jogos da mesma
 * rodada em sequência rápida (ex.: as 4 partidas das quartas, uma atrás da
 * outra), múltiplas requisições PATCH concorrentes chamam esta função quase
 * ao mesmo tempo; sem serialização, cada chamada pode ler o banco antes da
 * última atualização ser commitada pelas demais, nenhuma delas enxerga
 * "todos os jogos da fase encerrados" e a próxima fase nunca é gerada. Para
 * evitar essa condição de corrida, a leitura dos jogos é feita dentro de uma
 * transação com lock pessimista (SELECT ... FOR UPDATE) nas linhas da
 * modalidade/categoria: chamadas concorrentes passam a ser executadas uma
 * de cada vez pelo próprio banco, e a última a rodar sempre enxerga o
 * estado mais atualizado.
 */
export async function avancarFaseSeNecessario(modalidadeSlug, categoria) {
  const evento = await sequelize.transaction(async (transaction) => {
    const todos = await Jogo.findAll({
      where: { modalidadeSlug, categoria },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (todos.length === 0) return null;

    const locais = locaisDaModalidade(modalidadeSlug);
    const inicioBase = Date.now() + 24 * 3600_000;
    const intervalo = 60 * 60_000;

    const jogosGrupos = todos.filter((j) => j.fase === "grupos");
    const mataMata = todos.filter((j) => j.fase !== "grupos");

    // 1) Ainda não existe mata-mata: gera a fase inicial quando a fase de
    //    grupos estiver toda encerrada.
    if (mataMata.length === 0) {
      if (jogosGrupos.length === 0) return null;
      if (!jogosGrupos.every((j) => j.status === "encerrado")) return null;

      const grupos = await gruposDaCategoria(categoria, transaction);
      if (grupos.length === 0) return null;

      const rankPorGrupo = grupos.map((g) => classificacao(jogosGrupos, g.grupo));
      const primeiros = rankPorGrupo.map((r) => r[0]).filter(Boolean);
      const restantes = rankPorGrupo.flatMap((r) => r.slice(1));
      restantes.sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.pro - a.pro);
      const unificado = [...primeiros, ...restantes];
      if (unificado.length < 2) return null;

      let n = 2;
      if (unificado.length >= 8) n = 8;
      else if (unificado.length >= 4) n = 4;
      const classificados = unificado.slice(0, n).map((r) => r.turmaId);

      const fase = n === 8 ? "quartas" : n === 4 ? "semi" : "final";
      const duplas = [];
      for (let i = 0; i < n / 2; i++) duplas.push([classificados[i], classificados[n - 1 - i]]);

      const novos = duplas.map(([turmaA, turmaB], i) => ({
        modalidadeSlug,
        categoria,
        turmaA,
        turmaB,
        placarA: 0,
        placarB: 0,
        status: "agendado",
        data: new Date(inicioBase + i * intervalo),
        local: locais[i % locais.length],
        fase,
        grupo: null,
      }));

      await Jogo.bulkCreate(novos, { validate: true, transaction });
      return {
        titulo: `Mata-mata gerado automaticamente (${categoria})`,
        descricao: "A fase de grupos terminou e o chaveamento já está disponível.",
      };
    }

    // 2) Já existe mata-mata: avança para a próxima fase quando a atual
    //    estiver toda encerrada (e ainda não existir a fase seguinte).
    const ultima = [...ORDEM_FASES].reverse().find((f) => mataMata.some((j) => j.fase === f));
    if (!ultima) return null;

    const jogosFase = mataMata.filter((j) => j.fase === ultima);
    if (!jogosFase.every((j) => j.status === "encerrado")) return null;

    const proxima = ORDEM_FASES[ORDEM_FASES.indexOf(ultima) + 1];
    if (!proxima) return null; // já é a final: nada mais a gerar
    if (mataMata.some((j) => j.fase === proxima)) return null; // já foi gerada

    const vencedores = jogosFase.map(vencedor);
    if (vencedores.some((v) => !v)) return null; // empate ou W.O. pendente: decisão manual
    if (vencedores.length < 2) return null;

    const duplas = [];
    for (let i = 0; i < Math.floor(vencedores.length / 2); i++) {
      duplas.push([vencedores[i * 2], vencedores[i * 2 + 1]]);
    }

    const novos = duplas.map(([turmaA, turmaB], i) => ({
      modalidadeSlug,
      categoria,
      turmaA,
      turmaB,
      placarA: 0,
      placarB: 0,
      status: "agendado",
      data: new Date(inicioBase + i * intervalo),
      local: locais[i % locais.length],
      fase: proxima,
      grupo: null,
    }));

    // Disputa de 3º lugar, junto com a final.
    if (proxima === "final" && !mataMata.some((j) => j.fase === "terceiro")) {
      const perdedores = jogosFase.map(perdedor).filter(Boolean);
      if (perdedores.length === 2) {
        novos.push({
          modalidadeSlug,
          categoria,
          turmaA: perdedores[0],
          turmaB: perdedores[1],
          placarA: 0,
          placarB: 0,
          status: "agendado",
          data: new Date(inicioBase - intervalo),
          local: locais[novos.length % locais.length],
          fase: "terceiro",
          grupo: null,
        });
      }
    }

    await Jogo.bulkCreate(novos, { validate: true, transaction });
    return {
      titulo: `Próxima fase do mata-mata liberada (${categoria})`,
      descricao: "Os confrontos seguintes já foram publicados automaticamente.",
    };
  });

  // A notificação só é publicada depois que a transação acima confirmar
  // (commit) com sucesso a criação dos novos jogos.
  if (evento) {
    await publicarNotificacao({
      tipo: "agenda",
      titulo: evento.titulo,
      descricao: evento.descricao,
      escopo: categoria,
    });
  }
}

export default { avancarFaseSeNecessario };
