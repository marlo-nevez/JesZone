import { Router } from "express";
import { entrar, verificar, sair } from "../controllers/autenticacaoController.js";
import { autenticar } from "../middlewares/autenticar.js";
import { rateLimitLogin } from "../middlewares/protecaoLogin.js";
import { verificarLockout } from "../middlewares/lockoutLogin.js";

const rotas = Router();

rotas.post(
  "/entrar",
  rateLimitLogin,
  verificarLockout,
  entrar,
);

rotas.get("/verificar", autenticar, verificar);
rotas.post("/sair", autenticar, sair)

export default rotas;
