import "dotenv/config";
import { describe, expect, test } from "vitest";
import request from "supertest";
import { Notificacao } from "../../models/index.js";
import app from "../../../app.js";

beforeAll(() => {
  process.env.JWT_SECRET = "segredo-teste";
  process.env.ADMIN_EMAIL = "admin@jeszone.com";
  process.env.ADMIN_PASSWORD = "dd7fb587e50e1fdc60d0e5e98ffed3c02acdd1547be6d8264f3ea9ebf6bbde306e3dd935ee648b06c16bba748386064c2188e0f57a85b202ecb26cdeb7b108176891b871f8df54e33378c0ae7e068be4934ee8222447d0cee659da9d2a1c21e2ea4f43fa8ee70118fa3ee0f90fb4f4cbcc6bf9f9c21013403f8cd17d8a602d10"
  process.env.JWT_ISSUER = "jeszone-api";
  process.env.JWT_AUDIENCE = "jeszone-admin";
});

describe("Funcionalidade da API - Notificações", () => {
  test("POST /api/notificacoes deve rejeitar dados inválidos", async () => {
    const login = await request(app)
      .post("/api/auth/entrar")
      .send({
        email: process.env.ADMIN_EMAIL,
        senha: process.env.ADMIN_PASSWORD,
      });

    expect(login.status).toBe(200);

    const token = login.body.token;

    const resposta = await request(app)
      .post("/api/notificacoes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipo: "aviso",
        titulo: "",
        descricao: "Notificação inválida para teste",
        escopo: "todos",
      });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toHaveProperty("erro");
  });
  test("POST /api/notificacoes deve publicar uma notificação válida", async () => {
  const login = await request(app)
    .post("/api/auth/entrar")
    .send({
        email: process.env.ADMIN_EMAIL,
        senha: process.env.ADMIN_PASSWORD,
    });

  expect(login.status).toBe(200);

  const token = login.body.token;

  try {
    const resposta = await request(app)
      .post("/api/notificacoes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipo: "aviso",
        titulo: "Aviso de teste",
        descricao: "Notificação criada durante teste automatizado",
        escopo: "todos",
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({
      ok: true,
    });

    const notificacao = await Notificacao.findOne({
      where: {
        titulo: "Aviso de teste",
      },
      order: [["criado_em", "DESC"]],
    });

    expect(notificacao).not.toBeNull();
    expect(notificacao.tipo).toBe("aviso");
    expect(notificacao.descricao).toBe(
      "Notificação criada durante teste automatizado",
    );
  } finally {
    await Notificacao.destroy({
      where: {
        titulo: "Aviso de teste",
      },
    });
  }
});
});