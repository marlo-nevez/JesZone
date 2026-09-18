import { randomUUID } from "crypto";
import { revogarToken } from "../middlewares/blocklistToken.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import { loginEsquema } from "../utils/esquemas.js";
import { assincrono } from "../utils/assincrono.js";
import { registrarFalhaLogin, limparTentativasLogin } from "../middlewares/lockoutLogin.js";

export const entrar = assincrono(async (req, res) => {
  const { email, senha } = loginEsquema.parse(req.body);
  
  const emailValido = email.trim().toLowerCase() === (process.env.ADMIN_EMAIL || "").toLowerCase();
  const senhaValida = await bcrypt.compare(senha, process.env.ADMIN_PASSWORD).catch(err => console.log(err))

  if (!emailValido || !senhaValida) {
    registrarFalhaLogin(req);

    return res.status(401).json({
      erro: "E-mail ou senha inválidos.",
    });
  }

  limparTentativasLogin(req);
 
 const jti = randomUUID();
 const token = jwt.sign(
    {
        email: process.env.ADMIN_EMAIL,
        jti
    },
    process.env.JWT_SECRET,
    {
        algorithm: "HS256",
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE
    }
);

  res.json({ token, email: process.env.ADMIN_EMAIL });
});

export const verificar = assincrono(async (req, res) => {
  res.json({ admin: true, email: req.admin.email });
});

export const sair = assincrono(async (req, res) => {
  revogarToken(req.admin.jti);
  res.status(204).end();
});

export default { entrar, verificar, sair };
