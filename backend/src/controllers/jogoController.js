import { Jogo, Turma } from "../models/index.js";
import { criarJogosEsquema, atualizarJogoEsquema, categoriaEsquema } from "../utils/esquemas.js";
import { assincrono } from "../utils/assincrono.js";
import { ErroApi } from "../utils/ErroApi.js";
import { publicarNotificacao } from "../services/notificacaoService.js";
import { avancarFaseSeNecessario } from "../services/mataMataService.js";
import { z } from "zod";
import { Op } from "sequelize";

// Placar pré-definido do sistema para vitória por W.O. (o vencedor sempre sai
// com a diferença mínima possível: 1 x 0). Mantido em um único lugar para que
// o placar do W.O. nunca fique fora de sincronia com a regra de pontuação.
const PLACAR_WO = {
  A: { placarA: 1, placarB: 0 },
  B: { placarA: 0, placarB: 1 },
};

/** Cria vários jogos de uma vez (publicação de tabela/agenda). */
export const criarJogosEmLote = assincrono(async (req, res) => {
  const { jogos } = criarJogosEsquema.parse(req.body);

  const chaveConfronto = (j) =>
    [j.modalidadeSlug, j.categoria, j.fase, j.grupo ?? "", [j.turmaA, j.turmaB].sort().join("::")].join("|");

  const vistos = new Set();
  for (const j of jogos) {
    const chave = chaveConfronto(j);
    if (vistos.has(chave)) {
      throw new ErroApi(`Confronto duplicado no lote: ${j.turmaA} x ${j.turmaB}.`, 400);
    }
    vistos.add(chave);
  }

  const existentes = await Jogo.findAll({
    where: { modalidadeSlug: { [Op.in]: jogos.map((j) => j.modalidadeSlug) } },
  });
  const chavesExistentes = new Set(existentes.map(chaveConfronto));
  const conflito = jogos.find((j) => chavesExistentes.has(chaveConfronto(j)));
  if (conflito) {
    throw new ErroApi(`Confronto já cadastrado: ${conflito.turmaA} x ${conflito.turmaB}.`, 409);
  }

  const criados = await Jogo.bulkCreate(jogos, { validate: true });

  await publicarNotificacao({
    tipo: "agenda",
    titulo: `${criados.length} jogo(s) publicado(s) na tabela`,
    descricao: "Confira os novos horários na página da modalidade.",
    escopo: jogos[0]?.categoria ?? "todos",
  });

  res.status(201).json({ ok: true, total: criados.length });
});

/** Atualiza um jogo (placar, status, horário, etc.) e publica notificações relevantes. */
export const atualizarJogo = assincrono(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const { patch, notificar } = atualizarJogoEsquema.parse(req.body);

  const antes = await Jogo.findByPk(id, {
    include: [
      { model: Turma, as: "dadosTurmaA", attributes: ["nome"] },
      { model: Turma, as: "dadosTurmaB", attributes: ["nome"] },
    ],
  });
  if (!antes) throw new ErroApi("Jogo não encontrado.", 404);

  const statusAnterior = antes.status;
  const placarAAnterior = antes.placarA;
  const placarBAnterior = antes.placarB;

  const definindoWO = patch.wo === "A" || patch.wo === "B";
  const removendoWO = patch.wo === null;

  // Um jogo já encerrado por W.O. tem o placar travado: só é possível
  // alterá-lo removendo o W.O. primeiro (ou reenviando o mesmo W.O., o que é
  // inofensivo pois o placar é sempre recalculado a partir dele, abaixo).
  if (antes.wo && !definindoWO && !removendoWO) {
    const tentaAlterarPlacarOuStatus =
      (patch.placarA !== undefined && patch.placarA !== antes.placarA) ||
      (patch.placarB !== undefined && patch.placarB !== antes.placarB) ||
      (patch.status !== undefined && patch.status !== antes.status);
    if (tentaAlterarPlacarOuStatus) {
      throw new ErroApi(
        "Este jogo foi encerrado por W.O.; remova o W.O. antes de alterar o placar manualmente.",
        400,
      );
    }
  }

  const linha = {};
  if (patch.placarA !== undefined) linha.placarA = patch.placarA;
  if (patch.placarB !== undefined) linha.placarB = patch.placarB;
  if (patch.setsA !== undefined) linha.setsA = patch.setsA;
  if (patch.setsB !== undefined) linha.setsB = patch.setsB;
  if (patch.status !== undefined) linha.status = patch.status;
  if (patch.data !== undefined) linha.data = patch.data;
  if (patch.local !== undefined) linha.local = patch.local;
  if (patch.fase !== undefined) linha.fase = patch.fase;
  if (patch.grupo !== undefined) linha.grupo = patch.grupo;
  if (patch.wo !== undefined) linha.wo = patch.wo;

  // Ao definir (ou reafirmar) o W.O., o placar e o status são sempre os do
  // sistema/regulamento — nunca o que veio do cliente — para impedir
  // inconsistências entre status, placar e pontuação da fase de grupos.
  if (definindoWO) {
    linha.placarA = PLACAR_WO[patch.wo].placarA;
    linha.placarB = PLACAR_WO[patch.wo].placarB;
    linha.status = "encerrado";
  }

  await antes.update(linha);

  if (linha.status === "encerrado" && statusAnterior !== "encerrado") {
  try {
    await avancarFaseSeNecessario(antes.modalidadeSlug, antes.categoria);
  } catch (erroAvanco) {
    console.error("Falha ao avançar fase automaticamente do mata-mata:", erroAvanco);
    return res.json({ ok: true, avisoAvanco: "Fase não avançou automaticamente; verifique manualmente." });
  }
}

  if (notificar) {
    const nomeA = antes.dadosTurmaA?.nome ?? antes.turmaA;
    const nomeB = antes.dadosTurmaB?.nome ?? antes.turmaB;
    const placarA = patch.placarA ?? placarAAnterior;
    const placarB = patch.placarB ?? placarBAnterior;
    const novoStatus = patch.status ?? statusAnterior;
    const confronto = `${nomeA} ${placarA} x ${placarB} ${nomeB}`;

    if (patch.status && patch.status !== statusAnterior && patch.status === "ao-vivo") {
      await publicarNotificacao({
        tipo: "jogo-iniciado",
        titulo: `Começou: ${nomeA} x ${nomeB}`,
        descricao: `Acompanhe o placar ao vivo em ${antes.local}.`,
        escopo: antes.categoria,
      });
    } else if (patch.status && patch.status !== statusAnterior && patch.status === "encerrado") {
      await publicarNotificacao({
        tipo: "resultado",
        titulo: `Encerrado: ${confronto}`,
        descricao: patch.wo ? `Vitória por W.O. (${patch.wo}).` : "Resultado final publicado.",
        escopo: antes.categoria,
      });
    } else if (
      novoStatus === "ao-vivo" &&
      (placarA !== placarAAnterior || placarB !== placarBAnterior)
    ) {
      await publicarNotificacao({
        tipo: "resultado",
        titulo: `Placar atualizado: ${confronto}`,
        escopo: antes.categoria,
      });
    }
  }

  res.json({ ok: true });
});

/** Remove um jogo específico. */
export const excluirJogo = assincrono(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const linhas = await Jogo.destroy({ where: { id } });
  if (!linhas) throw new ErroApi("Jogo não encontrado.", 404);
  res.json({ ok: true });
});

/** Remove todos os jogos de mata-mata (não-grupos) de uma modalidade/categoria. */
export const excluirJogosDaFase = assincrono(async (req, res) => {
  const modalidadeSlug = z.string().min(1).parse(req.query.modalidadeSlug);
  const categoria = categoriaEsquema.parse(req.query.categoria);

  await Jogo.destroy({
    where: {
      modalidadeSlug,
      categoria,
      fase: { [Op.ne]: "grupos" },
    },
  });

  res.json({ ok: true });
});

export default { criarJogosEmLote, atualizarJogo, excluirJogo, excluirJogosDaFase };
