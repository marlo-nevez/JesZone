import "dotenv/config"
import { describe, test, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../../app.js"
import { popularTabela } from "../../utils/popularTurmas.js"
import { Turma } from "../../models/index.js"

beforeAll(async () => {
    await popularTabela()
    process.env.JWT_SECRET = "segredo-teste";
    process.env.ADMIN_EMAIL = "admin@jeszone.com";
    process.env.ADMIN_PASSWORD = "dd7fb587e50e1fdc60d0e5e98ffed3c02acdd1547be6d8264f3ea9ebf6bbde306e3dd935ee648b06c16bba748386064c2188e0f57a85b202ecb26cdeb7b108176891b871f8df54e33378c0ae7e068be4934ee8222447d0cee659da9d2a1c21e2ea4f43fa8ee70118fa3ee0f90fb4f4cbcc6bf9f9c21013403f8cd17d8a602d10"
    process.env.JWT_ISSUER = "jeszone-api";
    process.env.JWT_AUDIENCE = "jeszone-admin";
})

describe("TURMA ROTAS", async () => {
    const login = await request(app)
        .post("/api/auth/entrar")
        .send({
            email: process.env.ADMIN_EMAIL,
            senha: process.env.ADMIN_PASSWORD,
        });
    const token = login.body.token
    const turma = await Turma.findOne()
    test("Salva turma", async () => {
        const response = await request(app)
            .put(`/api/turmas/${turma.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                nome: "Turma A",
                serie: "1A",
                letra: "A",
                categoria: "Fundamental",
                paisKey: "br"
            })

            console.log(turma.id)
       
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("ok")
    })
    test("Exclui turma", async () => {
        const response = await request(app)
            .delete(`/api/turmas/${turma.id}`)
            .set("Authorization", `Bearer ${token}`)
        
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("ok")
    })
})
