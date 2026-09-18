import { Notificacao } from "../models/index.js";
import { avisoEsquema } from "../utils/esquemas.js";
import { assincrono } from "../utils/assincrono.js";
import { publicarNotificacao } from "../services/notificacaoService.js";
import { z } from "zod";

export const listarNotificacoes = assincrono(async (req, res) => {
  const limite = req.query.limite
    ? z.coerce.number().int().positive().parse(req.query.limite)
    : undefined;

  const tipo = req.query.tipo
    ? z.string().min(1).parse(req.query.tipo)
    : undefined;

  const souAdmin = Boolean(req.admin);

  const notificacoes = await Notificacao.findAll({
    where: tipo ? { tipo } : undefined,
    order: [["criado_em", "DESC"]],
    limit: limite,
  });

  const visiveis = souAdmin
    ? notificacoes
    : notificacoes.filter((n) => n.tipo !== "sos");

  const resposta = visiveis.map((n) => {
    const notificacao = {
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      descricao: n.descricao,
      escopo: n.escopo,
      criadoEm: n.criado_em ?? n.createdAt,
    };

    if (souAdmin) {
      notificacao.autorEmail = n.autorEmail;
      notificacao.sosLocal = n.sosLocal;
      notificacao.sosNecessidade = n.sosNecessidade;
      notificacao.sosUrgencia = n.sosUrgencia;
    }

    return notificacao;
  });

  res.json(resposta);
});

export const publicarAviso = assincrono(async (req, res) => {
  const dados = avisoEsquema.parse(req.body);

  await publicarNotificacao({
    tipo: dados.tipo,
    titulo: dados.titulo,
    descricao: dados.descricao || null,
    escopo: dados.escopo,
    autorEmail: req.admin?.email,
    sosLocal: dados.sosLocal,
    sosNecessidade: dados.sosNecessidade,
    sosUrgencia: dados.sosUrgencia,
  });

  res.status(201).json({ ok: true });
});

export default { listarNotificacoes, publicarAviso };
