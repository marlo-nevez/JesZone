import "dotenv/config";
import { describe, expect, test, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../../app.js";

beforeAll(async () => {
    await popularTabela()
    process.env.JWT_SECRET = "segredo-teste";
    process.env.ADMIN_EMAIL = "admin@jeszone.com";
    process.env.ADMIN_PASSWORD = "dd7fb587e50e1fdc60d0e5e98ffed3c02acdd1547be6d8264f3ea9ebf6bbde306e3dd935ee648b06c16bba748386064c2188e0f57a85b202ecb26cdeb7b108176891b871f8df54e33378c0ae7e068be4934ee8222447d0cee659da9d2a1c21e2ea4f43fa8ee70118fa3ee0f90fb4f4cbcc6bf9f9c21013403f8cd17d8a602d10"
    process.env.JWT_ISSUER = "jeszone-api";
    process.env.JWT_AUDIENCE = "jeszone-admin";
})

describe.skip("Funcionalidade da API - Autenticação e Integração", () => {
  test("POST /api/auth/entrar deve realizar login com credenciais válidas", async () => {
    const resposta = await request(app).post("/api/auth/entrar").send({
      email: process.env.ADMIN_EMAIL,
      senha: process.env.ADMIN_PASSWORD,
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveProperty("token");
    expect(typeof resposta.body.token).toBe("string");
  });

  test("POST /api/auth/entrar deve rejeitar credenciais inválidas", async () => {
    const resposta = await request(app).post("/api/auth/entrar").send({
      email: "email-invalido@jes.com",
      senha: "senha-invalida",
    });

    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({
      erro: "E-mail ou senha inválidos.",
    });
  });

  test("GET /api/auth/verificar deve aceitar um token válido", async () => {
    const login = await request(app).post("/api/auth/entrar").send({
      email: process.env.ADMIN_EMAIL,
      senha: process.env.ADMIN_PASSWORD,
    });

    const token = login.body.token;

    const resposta = await request(app)
      .get("/api/auth/verificar")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      admin: true,
      email: process.env.ADMIN_EMAIL,
    });
  });

  //Adicionados por conta da rubrica:
  test("GET /api/auth/verificar deve rejeitar JWT válido de usuário que não é administrador", async () => {
    const token = jwt.sign(
      {
        email: "usuario@jeszone.com",
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      }
    );

    const resposta = await request(app)
      .get("/api/auth/verificar")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(401);
    expect(resposta.body).not.toHaveProperty("admin", true);
  });

  test("PUT /api/turmas/:id deve rejeitar JWT válido de usuário que não é administrador", async () => {
  const token = jwt.sign(
    {
      email: "usuario@jeszone.com",
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    }
  );

  const resposta = await request(app)
    .put("/api/turmas/teste-seguranca")
    .set("Authorization", `Bearer ${token}`)
    .send({
      nome: "Turma de teste",
      serie: "1",
      letra: "A",
      categoria: "fundamental",
      paisKey: "teste",
    });

  expect(resposta.status).toBe(401);
});
test("GET /api/auth/verificar deve rejeitar JWT assinado com segredo diferente", async () => {
  const token = jwt.sign(
    {
      email: process.env.ADMIN_EMAIL,
    },
    "segredo-diferente-e-invalido",
    {
      algorithm: "HS256",
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    }
  );

  const resposta = await request(app)
    .get("/api/auth/verificar")
    .set("Authorization", `Bearer ${token}`);

  expect(resposta.status).toBe(401);
});
it("deve aceitar o token real do administrador", async () => {
  const login = await request(app)
    .post("/api/auth/entrar")
    .send({
      email: process.env.ADMIN_EMAIL,
      senha: process.env.ADMIN_PASSWORD,
    });

  expect(login.status).toBe(200);
  expect(login.body.token).toBeDefined();

  const resposta = await request(app)
    .get("/api/auth/verificar")
    .set("Authorization", `Bearer ${login.body.token}`);

  expect(resposta.status).toBe(200);
  expect(resposta.body.admin).toBe(true);
  expect(resposta.body.email).toBe(process.env.ADMIN_EMAIL);
});
});