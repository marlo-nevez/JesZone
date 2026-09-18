import { Router } from "express";
import { listarNotificacoes, publicarAviso } from "../controllers/notificacaoController.js";
import { autenticar } from "../middlewares/autenticar.js";
import { autenticarOpcional } from "../middlewares/autenticarOpcional.js";

const rotas = Router();

rotas.get("/", autenticarOpcional, listarNotificacoes);
rotas.post("/", autenticar, publicarAviso);

export default rotas;
