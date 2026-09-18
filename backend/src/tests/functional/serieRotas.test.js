import "dotenv/config";
import { describe, test, expect, vi } from "vitest";
import { SerieSelecao, Turma } from "../../models/index.js";
import request from "supertest";
import app from "../../../app";

beforeAll(() => {
  process.env.JWT_SECRET = "segredo-teste";
  process.env.ADMIN_EMAIL = "admin@jeszone.com";
  process.env.ADMIN_PASSWORD = "dd7fb587e50e1fdc60d0e5e98ffed3c02acdd1547be6d8264f3ea9ebf6bbde306e3dd935ee648b06c16bba748386064c2188e0f57a85b202ecb26cdeb7b108176891b871f8df54e33378c0ae7e068be4934ee8222447d0cee659da9d2a1c21e2ea4f43fa8ee70118fa3ee0f90fb4f4cbcc6bf9f9c21013403f8cd17d8a602d10"
  process.env.JWT_ISSUER = "jeszone-api";
  process.env.JWT_AUDIENCE = "jeszone-admin";
});

describe("Funcionalidade da Api - séries", () => {
  test("PUT api/series/: series deve rejeitar dados inválidos", async () => {
    const login = await request(app).post("/api/auth/entrar/").send({
        email: process.env.ADMIN_EMAIL,
        senha: process.env.ADMIN_PASSWORD,
    });

    expect(login.status).toBe(200);

    const token = login.body.token;

    const resposta = await request(app)
      .delete("/api/resultados-unicos")
      .set("Authorization", `Bearer${token}`)
      .query({
        modalidadeSlug: "",
        categoria: "Medio",
      });

    expect(resposta.status).toBe(401);
    expect(resposta.body).toHaveProperty("erro");
  });
  test("PUT /api/series/:serie deve definir a seleção e atualizar as turmas", async () => {
  const serie = `T${Date.now()}`.slice(0, 8);
  const idTurma = `TESTE-${Date.now()}`.slice(0, 20);

  await Turma.create({
    id: idTurma,
    nome: "Turma Série Teste",
    serie,
    letra: "A",
    categoria: "Medio",
    paisKey: "br",
  });

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
      .put(`/api/series/${serie}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        paisKey: "pt",
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      ok: true,
    });

    const serieSalva = await SerieSelecao.findByPk(serie);

    expect(serieSalva).not.toBeNull();
    expect(serieSalva.paisKey).toBe("pt");

    const turmaAtualizada = await Turma.findByPk(idTurma);

    expect(turmaAtualizada).not.toBeNull();
    expect(turmaAtualizada.paisKey).toBe("pt");
  } finally {
    await SerieSelecao.destroy({
      where: {
        serie,
      },
    });

    await Turma.destroy({
      where: {
        id: idTurma,
      },
    });
  }
});
});
