import "dotenv/config";
import { describe, expect, test } from "vitest";
import request from "supertest";
import { Op } from "sequelize";

import app from "../../../app.js";
import { Turma, Jogo, Notificacao } from "../../models/index.js";

describe("Funcionalidade da API - Jogos", () => {
  test("POST /api/jogos/lote deve exigir autenticação", async () => {
    const resposta = await request(app).post("/api/jogos/lote").send({
      jogos: [],
    });

    expect(resposta.status).toBe(401);
    expect(resposta.body).toHaveProperty("erro");
  });

  test("POST /api/jogos/lote deve rejeitar dados inválidos", async () => {
    const login = await request(app).post("/api/auth/entrar").send({
      email: "suporte.admjeszone@sesi.senai.com.br",
      senha: "0e1e6c5d1e2e7c1c6e9e9d5e0e7b6a5f",
    });

    const token = login.body.token;

    const resposta = await request(app)
      .post("/api/jogos/lote")
      .set("Authorization", `Bearer ${token}`)
      .send({
        jogos: [
          {
            modalidadeSlug: "futsal",
            categoria: "Medio",
            turmaA: "MEDIO-A",
            turmaB: "MEDIO-B",
            placarA: -1,
            data: "2026-09-08T15:00:00",
            local: "Quadra 1",
            fase: "grupos",
          },
        ],
      });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toHaveProperty("erro");
  });

  test("POST /api/jogos/lote deve criar um jogo com dados válidos", async () => {
    const idTurmaA = `TA${Date.now()}`;
    const idTurmaB = `TB${Date.now()}`;
    const tituloNotificacao = "1 jogo(s) publicado(s) na tabela";
    const inicioTeste = new Date();

    try {
      await Turma.create({
        id: idTurmaA,
        nome: "Turma Teste A",
        serie: "1EM",
        letra: "A",
        categoria: "Medio",
        paisKey: "br",
      });

      await Turma.create({
        id: idTurmaB,
        nome: "Turma Teste B",
        serie: "1EM",
        letra: "B",
        categoria: "Medio",
        paisKey: "br",
      });

      const login = await request(app).post("/api/auth/entrar").send({
        email: "suporte.admjeszone@sesi.senai.com.br",
        senha: "0e1e6c5d1e2e7c1c6e9e9d5e0e7b6a5f",
      });

      expect(login.status).toBe(200);

      const token = login.body.token;

      const resposta = await request(app)
        .post("/api/jogos/lote")
        .set("Authorization", `Bearer ${token}`)
        .send({
          jogos: [
            {
              modalidadeSlug: "futsal-teste",
              categoria: "Medio",
              turmaA: idTurmaA,
              turmaB: idTurmaB,
              placarA: 0,
              placarB: 0,
              status: "agendado",
              data: "2026-09-08T18:00:00",
              local: "Quadra de Teste",
              fase: "grupos",
            },
          ],
        });

      expect(resposta.status).toBe(201);
      expect(resposta.body).toEqual({
        ok: true,
        total: 1,
      });
    } finally {
      await Jogo.destroy({
        where: {
          turmaA: idTurmaA,
          turmaB: idTurmaB,
          modalidadeSlug: "futsal-teste",
        },
      });

      await Turma.destroy({
        where: {
          id: {
            [Op.in]: [idTurmaA, idTurmaB],
          },
        },
      });

      await Notificacao.destroy({
        where: {
          titulo: tituloNotificacao,
          criado_em: {
            [Op.gte]: inicioTeste,
          },
        },
      });
    }
  });
  test("PATCH /api/jogos/:id deve atualizar o placar de um jogo", async () => {
    const idTurmaA = `PA-${Date.now()}`;
    const idTurmaB = `PB-${Date.now()}`;

    await Turma.create({
      id: idTurmaA,
      nome: "Turma Patch A",
      serie: "1EM",
      letra: "A",
      categoria: "Medio",
      paisKey: "br",
    });

    await Turma.create({
      id: idTurmaB,
      nome: "Turma Patch B",
      serie: "1EM",
      letra: "B",
      categoria: "Medio",
      paisKey: "br",
    });

    const jogo = await Jogo.create({
      modalidadeSlug: "futsal-patch",
      categoria: "Medio",
      turmaA: idTurmaA,
      turmaB: idTurmaB,
      placarA: 0,
      placarB: 0,
      status: "agendado",
      data: "2026-09-09T18:00:00",
      local: "Quadra de Teste",
      fase: "grupos",
    });

    const login = await request(app).post("/api/auth/entrar").send({
      email: "suporte.admjeszone@sesi.senai.com.br",
      senha: "0e1e6c5d1e2e7c1c6e9e9d5e0e7b6a5f",
    });

    expect(login.status).toBe(200);

    const token = login.body.token;

    try {
      const resposta = await request(app)
        .patch(`/api/jogos/${jogo.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          patch: {
            placarA: 3,
            placarB: 1,
          },
          notificar: false,
        });

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({
        ok: true,
      });

      const jogoAtualizado = await Jogo.findByPk(jogo.id);

      expect(jogoAtualizado).not.toBeNull();
      expect(jogoAtualizado.placarA).toBe(3);
      expect(jogoAtualizado.placarB).toBe(1);
    } finally {
      await Jogo.destroy({
        where: {
          id: jogo.id,
        },
      });

      await Turma.destroy({
        where: {
          id: idTurmaA,
        },
      });

      await Turma.destroy({
        where: {
          id: idTurmaB,
        },
      });
    }
  });
  test("DELETE /api/jogos/:id deve excluir um jogo existente", async () => {
  const idTurmaA = `DA-${Date.now()}`;
  const idTurmaB = `DB-${Date.now()}`;

  await Turma.create({
    id: idTurmaA,
    nome: "Turma Delete A",
    serie: "1EM",
    letra: "A",
    categoria: "Medio",
    paisKey: "br",
  });

  await Turma.create({
    id: idTurmaB,
    nome: "Turma Delete B",
    serie: "1EM",
    letra: "B",
    categoria: "Medio",
    paisKey: "br",
  });

  const jogo = await Jogo.create({
    modalidadeSlug: "delete-teste",
    categoria: "Medio",
    turmaA: idTurmaA,
    turmaB: idTurmaB,
    placarA: 0,
    placarB: 0,
    status: "agendado",
    data: "2026-09-09T18:00:00",
    local: "Quadra de Teste",
    fase: "grupos",
  });

  const login = await request(app)
    .post("/api/auth/entrar")
    .send({
      email: "suporte.admjeszone@sesi.senai.com.br",
      senha: "0e1e6c5d1e2e7c1c6e9e9d5e0e7b6a5f",
    });

  expect(login.status).toBe(200);

  const token = login.body.token;

  try {
    const resposta = await request(app)
      .delete(`/api/jogos/${jogo.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      ok: true,
    });

    const jogoExcluido = await Jogo.findByPk(jogo.id);

    expect(jogoExcluido).toBeNull();
  } finally {
    await Jogo.destroy({
      where: {
        id: jogo.id,
      },
    });

    await Turma.destroy({
      where: {
        id: idTurmaA,
      },
    });

    await Turma.destroy({
      where: {
        id: idTurmaB,
      },
    });
  }
});
test("POST /api/jogos/lote deve rejeitar placarA acima do limite permitido", async () => {
  const login = await request(app)
    .post("/api/auth/entrar")
    .send({
      email: "suporte.admjeszone@sesi.senai.com.br",
      senha: "0e1e6c5d1e2e7c1c6e9e9d5e0e7b6a5f",
    });

  expect(login.status).toBe(200);

  const token = login.body.token;

  const resposta = await request(app)
    .post("/api/jogos/lote")
    .set("Authorization", `Bearer ${token}`)
    .send({
      jogos: [
        {
          modalidadeSlug: "futsal",
          categoria: "Medio",
          turmaA: "MEDIO-A",
          turmaB: "MEDIO-B",
          placarA: 1000,
          placarB: 0,
          data: "2026-09-09T18:00:00",
          local: "Quadra 1",
          fase: "grupos",
        },
      ],
    });

  expect(resposta.status).toBe(400);
  expect(resposta.body).toHaveProperty("erro");
});
test("DELETE /api/jogos/:id deve retornar 404 quando o jogo não existir", async () => {
  const login = await request(app)
    .post("/api/auth/entrar")
    .send({senai.com.br",
      senha: "0e1e6c5d1e2
      email: "suporte.admjeszone@sesi.e7c1c6e9e9d5e0e7b6a5f",
    });

  expect(login.status).toBe(200);

  const token = login.body.token;

  const resposta = await request(app)
    .delete("/api/jogos/00000000-0000-4000-8000-000000000000")
    .set("Authorization", `Bearer ${token}`);

  expect(resposta.status).toBe(404);
  expect(resposta.body).toEqual({
    erro: "Jogo não encontrado.",
  });
});

});
