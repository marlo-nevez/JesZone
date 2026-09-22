// Configuração e regras do JES 2026 (puro, sem estado): etapas, séries, seleções,
// modalidades e motores de classificação. Os dados vivem no banco (ver jesDados.js).
import futebol from "../assets/fut7.png";
import voleibol from "../assets/voleibol.png";
import queimado from "../assets/handebol.png";
import futmesa from "../assets/futmesa.png";
import atletismo from "../assets/atletismo.png";
import xadrez from "../assets/xadrez.png";
import dama from "../assets/jogo-de-damas.png";

export const CATEGORIAS = ["Fundamental", "Medio"];

export const FASES = [
  "grupos",
  "oitavas",
  "quartas",
  "semi",
  "final",
  "terceiro",
];

export const FASE_LABEL = {
  grupos: "Fase de grupos",
  oitavas: "Oitavas de final",
  quartas: "Quartas de final",
  semi: "Semifinal",
  final: "Final",
  terceiro: "Disputa de 3º lugar",
};

export function catLabel(c) {
  return c === "Fundamental" ? "Ensino Fundamental" : "Ensino Médio";
}
export function catLabelCurto(c) {
  return c === "Fundamental" ? "Fundamental" : "Médio";
}

export const EMPTY_STATE = {
  turmas: [],
  jogos: [],
  serieSelecao: {},
  regulamento: {},
  resultadosUnicos: [],
};

const PAISES = {
  br: { pais: "Brasil", code: "br", cor: "#009c3b" },
  ar: { pais: "Argentina", code: "ar", cor: "#75aadb" },
  de: { pais: "Alemanha", code: "de", cor: "#000000" },
  it: { pais: "Itália", code: "it", cor: "#008c45" },
  fr: { pais: "França", code: "fr", cor: "#0055a4" },
  uy: { pais: "Uruguai", code: "uy", cor: "#5cbcea" },
  eng: { pais: "Inglaterra", code: "gb-eng", cor: "#ce1124" },
  es: { pais: "Espanha", code: "es", cor: "#c60b1e" },
};

// Ensino Fundamental: 6º-9º | Ensino Médio: 1º-3º
export const SERIES_FUND = ["6EF", "7EF", "8EF", "9EF"];
export const SERIES_MEDIO = ["1EM", "2EM", "3EM"];
export const TURMAS_LETRAS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

export function serieLabel(s) {
  const map = {
    "6EF": "6º Ano",
    "7EF": "7º Ano",
    "8EF": "8º Ano",
    "9EF": "9º Ano",
    "1EM": "1º EM",
    "2EM": "2º EM",
    "3EM": "3º EM",
  };
  return map[s] ?? s;
}

export function categoriaDaSerie(serie) {
  return SERIES_FUND.includes(serie) ? "Fundamental" : "Medio";
}

export function allSeries() {
  return [...SERIES_FUND, ...SERIES_MEDIO].map((s) => ({
    serie: s,
    label: serieLabel(s),
    categoria: categoriaDaSerie(s),
  }));
}

export function listPaises() {
  return Object.entries(PAISES).map(([key, sel]) => ({ key, sel }));
}
export function paisByKey(k) {
  return PAISES[k] ?? PAISES.br;
}

export const MODALIDADES = [
  {
    slug: "fut7-m",
    nome: "Fut7 Masculino",
    tipo: "coletivo",
    genero: "M",
    icon: futebol,
    regrasWO: `• A vitória garante **3 pontos** e a derrota resulta em **0 pontos** na fase de grupos.
• Jogos empatados são decididos por **pênaltis ou shoot-out** de forma alternada.
• A primeira fase classifica os **dois melhores times** de cada grupo para as semifinais.`,
    formato: "confrontos",
  },
  {
    slug: "fut7-f",
    nome: "Fut7 Feminino",
    tipo: "coletivo",
    genero: "F",
    icon: futebol,
    regrasWO: `• A vitória garante **3 pontos** e a derrota resulta em **0 pontos** na fase de grupos.
• Jogos empatados são decididos por **pênaltis ou shoot-out** de forma alternada.
• A primeira fase classifica os **dois melhores times** de cada grupo para as semifinais.`,
    formato: "confrontos",
  },
  {
    slug: "volei-m",
    nome: "Voleibol Masculino",
    tipo: "coletivo",
    genero: "M",
    icon: voleibol,
    regrasWO: `• As partidas são disputadas em um **único set de 12 pontos**.
• Para vencer o set, é obrigatório abrir uma **diferença mínima de 2 pontos**.
• O time pode jogar incompleto desde que tenha no **mínimo 4 atletas** em quadra.`,
    formato: "confrontos",
  },
  {
    slug: "volei-f",
    nome: "Voleibol Feminino",
    tipo: "coletivo",
    genero: "F",
    icon: voleibol,
    regrasWO: `• As partidas são disputadas em um **único set de 12 pontos**.
• Para vencer o set, é obrigatório abrir uma **diferença mínima de 2 pontos**.
• O time pode jogar incompleto desde que tenha no **mínimo 4 atletas** em quadra.`,
    formato: "confrontos",
  },
  {
    slug: "queimado-m",
    nome: "Queimado Masculino",
    tipo: "coletivo",
    genero: "M",
    icon: queimado,
    regrasWO: `• O tempo oficial da partida é de **1 tempo de 10 minutos**.
• Empates geram uma **prorrogação de 2 minutos com morte súbita** (quem queimar primeiro vence).
• O atleta pode reter a posse de bola por no máximo **5 segundos**.`,
    formato: "confrontos",
  },
  {
    slug: "queimado-f",
    nome: "Queimado Feminino",
    tipo: "coletivo",
    genero: "F",
    icon: queimado,
    regrasWO: `• O tempo oficial da partida é de **1 tempo de 10 minutos**.
• Empates geram uma **prorrogação de 2 minutos com morte súbita** (quem queimar primeiro vence).
• O atleta pode reter a posse de bola por no máximo **5 segundos**.`,
    formato: "confrontos",
  },
  {
    slug: "futmesa",
    nome: "Futmesa",
    tipo: "duplas",
    genero: "Misto",
    icon: futmesa,
    regrasWO: `• As competições são jogadas em **duplas mistas obrigatórias** da mesma turma.
• O jogo é disputado em **set único** e vence quem chegar primeiro aos **15 pontos**.
• As duplas devem **mudar de lado na mesa** assim que o **7º ponto** for atingido.`,
    formato: "confrontos",
  },
  {
    slug: "atletismo-100m",
    nome: "Atletismo 100m",
    tipo: "individual",
    genero: "Misto",
    icon: atletismo,
    regrasWO:
      `• A modalidade de pista consiste na corrida rápida de **100 metros rasos**.
• O quantitativo de alunos inscritos por turma é **totalmente ilimitado**.
• **Condutas antidesportivas** ou **dificultar a corrida dos rivais** gera desclassificação.`,
    formato: "unico",
  },
  {
    slug: "xadrez",
    nome: "Xadrez",
    tipo: "individual",
    genero: "Misto",
    icon: xadrez,
    regrasWO:
      `• Cada partida tem uma **duração média de 15 minutos**.
• A organização exige **conhecimento prévio básico** e **não vai ensinar as regras do jogo**.
• O competidor que **burlar as regras será desclassificado imediatamente**.`,
    formato: "unico",
  },
  {
    slug: "dama",
    nome: "Dama",
    tipo: "individual",
    genero: "Misto",
    icon: dama,
    regrasWO:
      `• As disputas seguem o **sistema de 64 casas** com **12 pedras para cada lado**.
• A **captura de peças é obrigatória** e o regulamento reforça que **não existe "sopro"**.
• A partida é declarada empatada após **10 lances sucessivos de damas sem capturas**.`,
    formato: "unico",
  },
];

export function modalidadeBySlug(slug) {
  return MODALIDADES.find((m) => m.slug === slug);
}

/**
 * Distribui as turmas de uma categoria em grupos de até 4,
 * mesclando as séries sempre que houver possibilidade.
 *
 * A ordem de cadastro das turmas não influencia mais a composição dos grupos.
 * A prioridade é:
 * 1. manter no máximo 4 turmas por grupo;
 * 2. evitar repetir a mesma série dentro do mesmo grupo;
 * 3. manter os grupos o mais equilibrados possível.
 */
export function gruposDaCategoria(turmas, categoria) {
  // Turmas-união (criadas para representar várias turmas jogando juntas em
  // alguma modalidade) não são turmas reais a serem sorteadas em grupos: só
  // entram na disputa através do confronto que já as gerou.
  const pool = turmas.filter((t) => t.categoria === categoria && !t.membros?.length);
  if (pool.length === 0) return [];

  const quantidadeGrupos = Math.ceil(pool.length / 4);
  const grupos = Array.from({ length: quantidadeGrupos }, (_, i) => ({
    grupo: String.fromCharCode(65 + i),
    turmas: [],
  }));

  // Mantém a ordem original das séries (6EF, 7EF... / 1EM, 2EM, 3EM),
  // mas processa primeiro as séries com mais turmas.
  const ordemSeries = new Map(
    [...SERIES_FUND, ...SERIES_MEDIO].map((serie, index) => [serie, index]),
  );
  const porSerie = new Map();

  for (const turma of pool) {
    if (!porSerie.has(turma.serie)) porSerie.set(turma.serie, []);
    porSerie.get(turma.serie).push(turma);
  }

  const series = [...porSerie.entries()].sort((a, b) => {
    const diferencaQuantidade = b[1].length - a[1].length;
    if (diferencaQuantidade !== 0) return diferencaQuantidade;
    return (ordemSeries.get(a[0]) ?? 999) - (ordemSeries.get(b[0]) ?? 999);
  });

  for (const [serie, turmasSerie] of series) {
    for (const turma of turmasSerie) {
      // Primeiro tenta um grupo que ainda não tenha esta série e que esteja
      // entre os menos ocupados. Isso espalha, por exemplo, as turmas do 1EM
      // pelos grupos A/B/C/D antes de repetir 1EM dentro de algum grupo.
      let candidatos = grupos.filter(
        (g) =>
          g.turmas.length < 4 &&
          !g.turmas.some((t) => t.serie === serie),
      );

      // Se não for possível evitar a repetição da série, usa qualquer grupo
      // com vaga, sempre priorizando o grupo menos cheio.
      if (candidatos.length === 0) {
        candidatos = grupos.filter((g) => g.turmas.length < 4);
      }

      candidatos.sort((a, b) => {
        const diferenca = a.turmas.length - b.turmas.length;
        if (diferenca !== 0) return diferenca;
        return a.grupo.localeCompare(b.grupo);
      });

      candidatos[0].turmas.push(turma);
    }
  }

  return grupos.filter((g) => g.turmas.length > 0);
}

// ---- Motor de classificação (preservado: mesma regra de pontuação) ----

export function classificacao(state, modalidadeSlug, categoria, opts = {}) {
  const jogos = state.jogos.filter(
    (j) =>
      j.modalidadeSlug === modalidadeSlug &&
      j.categoria === categoria &&
      j.status === "encerrado" &&
      j.fase === "grupos" &&
      (!opts.grupo || j.grupo === opts.grupo),
  );
  const rows = new Map();
  const ensure = (id) => {
    if (!rows.has(id))
      rows.set(id, {
        turmaId: id,
        jogos: 0,
        vitorias: 0,
        derrotas: 0,
        pontos: 0,
        saldo: 0,
        pro: 0,
        contra: 0,
      });
    return rows.get(id);
  };
  for (const j of jogos) {
    const a = ensure(j.turmaA);
    const b = ensure(j.turmaB);
    a.jogos++;
    b.jogos++;
    a.pro += j.placarA;
    a.contra += j.placarB;
    b.pro += j.placarB;
    b.contra += j.placarA;
    if (j.placarA === j.placarB) {
      a.pontos += 1;
      b.pontos += 1;
    } else if (j.placarA > j.placarB) {
      a.vitorias++;
      a.pontos += 3;
      b.derrotas++;
    } else {
      b.vitorias++;
      b.pontos += 3;
      a.derrotas++;
    }
  }
  for (const r of rows.values()) r.saldo = r.pro - r.contra;
  return [...rows.values()].sort(
    (x, y) => y.pontos - x.pontos || y.saldo - x.saldo || y.pro - x.pro,
  );
}

// Uma "turma-união" (ex.: 7ºA/B/C jogando juntas por falta de gente) é uma
// única entidade que joga e avança de fase — por isso classificacao() acima
// não muda. Mas nenhuma turma real pode "sumir" da pontuação só por ter
// jogado unida: esta função resolve o id de um jogo para a(s) turma(s) real
// (is) que ele representa, para uso em telas de pontuação/classificação.
function resolverMembros(state, id) {
  const t = state.turmas?.find((x) => x.id === id);
  return t?.membros?.length ? t.membros : [id];
}

/**
 * Mesma classificação de `classificacao()`, mas com cada linha de
 * turma-união desdobrada em uma linha por turma real que a compõe (todas
 * recebendo os mesmos jogos/vitórias/pontos/saldo, já que jogaram juntas).
 * Use esta versão para exibir tabelas de classificação; use `classificacao()"
 * (sem desdobrar) para decidir quem avança de fase no mata-mata.
 */
export function classificacaoDetalhada(state, modalidadeSlug, categoria, opts = {}) {
  const linhas = [];
  for (const r of classificacao(state, modalidadeSlug, categoria, opts)) {
    for (const turmaId of resolverMembros(state, r.turmaId)) {
      linhas.push({ ...r, turmaId });
    }
  }
  return linhas;
}

export function resultadoUnico(state, slug, categoria) {
  return state.resultadosUnicos.find(
    (r) => r.modalidadeSlug === slug && r.categoria === categoria,
  );
}

export function liderGeral(state, categoria) {
  const totals = new Map();
  const cats = categoria ? [categoria] : CATEGORIAS;
  const pts = [100, 70, 50];

  const adicionarPontos = (id, pontos) => {
    if (!id) return;

    for (const turmaId of resolverMembros(state, id)) {
      totals.set(
        turmaId,
        (totals.get(turmaId) ?? 0) + pontos,
      );
    }
  };

  const vencedorMataMata = (jogo) => {
    if (!jogo || jogo.status !== "encerrado") return null;

    if (jogo.wo) {
      return jogo.wo === "A" ? jogo.turmaA : jogo.turmaB;
    }

    // Mantém a mesma regra usada pelo chaveamento:
    // empate sem vencedor definido não atribui colocação.
    if (jogo.placarA === jogo.placarB) return null;

    return jogo.placarA > jogo.placarB
      ? jogo.turmaA
      : jogo.turmaB;
  };

  for (const m of MODALIDADES) {
    for (const c of cats) {
      // Modalidades de resultado único continuam usando
      // resultadoUnico(), sem qualquer alteração.
      if (m.formato === "unico") {
        const r = resultadoUnico(state, m.slug, c);
        if (!r) continue;

        [r.campeaoTurmaId, r.viceTurmaId, r.terceiroTurmaId].forEach(
          (id, i) => adicionarPontos(id, pts[i]),
        );

        continue;
      }

      // 1º e 2º lugar: definidos exclusivamente pela FINAL.
      const final = state.jogos.find(
        (j) =>
          j.modalidadeSlug === m.slug &&
          j.categoria === c &&
          j.fase === "final" &&
          j.status === "encerrado",
      );

      if (final) {
        const campeao = vencedorMataMata(final);

        if (campeao) {
          const vice =
            campeao === final.turmaA
              ? final.turmaB
              : final.turmaA;

          adicionarPontos(campeao, 100);
          adicionarPontos(vice, 70);
        }
      }

      // 3º lugar: definido exclusivamente pela disputa de terceiro.
      const terceiro = state.jogos.find(
        (j) =>
          j.modalidadeSlug === m.slug &&
          j.categoria === c &&
          j.fase === "terceiro" &&
          j.status === "encerrado",
      );

      if (terceiro) {
        const terceiroColocado = vencedorMataMata(terceiro);

        if (terceiroColocado) {
          adicionarPontos(terceiroColocado, 50);
        }
      }
    }
  }

  return [...totals.entries()]
    .map(([turmaId, pontos]) => ({ turmaId, pontos }))
    .sort((a, b) => b.pontos - a.pontos);
}

export function turmaById(state, id) {
  return state.turmas.find((t) => t.id === id);
}
