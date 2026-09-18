import "dotenv/config"
import { describe, test, vi, expect } from "vitest"
import request from "supertest"
import app from "../../../app"
import { Turma, ResultadoUnico, Notificacao } from "../../models/index.js";
import turmaController from "../../controllers/turmaController.js";

describe("Funcionalidade da API - Resuktados únicos", () => {
    test("PUT /api/resultadoUnico deve rejeitar dados inválidos", async () => {

        const login = await request(app)
        .post("/api/auth/entrar")
        .send({
            email: "suporte.admjeszone@sesi.senai.com.br",
            senha: "0e1e6c5d1e2e7c1c6e9e9d5e0e7b6a5f",
        })

        expect(login.status).toBe(200)

        const token = login.body.token

        const resposta = await request(app)
        .put("/api/resultadoUnicos")
        .set("Authorization", `Bearer ${token}`)
        .send({
            modalidadeSlug: "",
            categoria: "Medio",
            campeaoTurmaId: "",
        })

        
        expect(resposta.status).toBe(404)
        expect(resposta.body).toHaveProperty("erro");
        
    })
    test("Put /api/resultadosUnicos deve salvar um resultado válido", async () =>{
        const idTurma = `Campeo-${Date.now()}`

        const login = await request(app)
        .post("/api/auth/entrar")
        .send({
            email: "suporte.admjeszone@sesi.senai.com.br",
            senha: "0e1e6c5d1e2e7c1c6e9e9d5e0e7b6a5f", 
        })

        expect(login.status).toBe(200)

        const token = login.body.token

        try{
            await Turma.create({
                id: idTurma,
                nome: "Turma Campeã teste",
                serie: "1°E",
                letra: "A",
                categoria: "Medio",
                paisKey: "br", 
            })

            const resposta = await request(app)
            .put("/api/resultados-unicos")
            .set("Authorization", `Bearer ${token}`)
            .send({
                modalidadeSlug: "Queimado teste",
                categoria: "Medio",
                campeaoTurmaId: idTurma,
                observacoes: "Resultado criado durante teste automatizado"
            })
            
            expect(resposta.status).toBe(200)
            expect(resposta.body).toEqual({
                ok: true
            })

            const resultado = await ResultadoUnico.findOne({
                where:{
                    modalidadeSlug: "Queimado teste",
                    categoria: "Medio"
                }
            })
            expect(resultado).not.toBeNull()
            expect(resultado.campeaoTurmaId).toBe(idTurma)
            expect(resultado.observacoes).toBe(
                `Resultado criado durante teste automatizado`
            )
        }finally{
            await ResultadoUnico.destroy({
                where: {
                    modalidadeSlug: `Xadrez-teste`,
                    categoria: "medio"
                }
            })

            await Notificacao.destroy({
                where:{
                    titulo: `Campeões definidos: Turma campeão teste`
                }
            })

            await Turma.destroy({
                where:{
                    id: idTurma,
                }
            })
        }
    })
    test("DELETE /api/resultadoUnicos deve rejeitar parametros inválidos", async () => {
        const login = await request(app)
        .post("/api/auth/entrar")
        .send({
            email:"suporte.admjeszone@sesi.senai.com.br",
            senha: "0e1e6c5d1e2e7c1c6e9e9d5e0e7b6a5f"
        })

        expect(login.status).toBe(200)

        const token = login.body.token

        const resposta = await request(app)
        .delete("/api/resultados-unicos")
        .set("Authorization", `Beare ${token}`)
        .query({
            modalidadeSlug: "",
            categorio: "Medio"
        })

    
        expect(resposta.status).toBe(401)
        expect(resposta.body).toHaveProperty("erro")
    })
    test("DELETE /api/resultadosUnicos deve excluir um resultado existente", async () => {
  const idTurma = `EXC-${Date.now()}`;
  const modalidadeTeste = `xadrez-exclusao-${Date.now()}`;

  await Turma.create({
    id: idTurma,
    nome: "Turma Exclusão Teste",
    serie: "1EM",
    letra: "A",
    categoria: "Medio",
    paisKey: "br",
  });

  await ResultadoUnico.create({
    modalidadeSlug: modalidadeTeste,
    categoria: "Medio",
    campeaoTurmaId: idTurma,
    observacoes: "Resultado para teste de exclusão",
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
      .delete("/api/resultados-unicos")
      .set("Authorization", `Bearer ${token}`)
      .query({
        modalidadeSlug: modalidadeTeste,
        categoria: "Medio",
      });

    expect(resposta.status).toBe(200);

    expect(resposta.body).toEqual({
      ok: true,
    });

    const resultado = await ResultadoUnico.findOne({
      where: {
        modalidadeSlug: modalidadeTeste,
        categoria: "Medio",
      },
    });

    expect(resultado).toBeNull();
  } finally {
    await ResultadoUnico.destroy({
      where: {
        modalidadeSlug: modalidadeTeste,
        categoria: "Medio",
      },
    });

    await Turma.destroy({
      where: {
        id: idTurma,
      },
    });
  }
});
})