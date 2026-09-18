import jwt from "jsonwebtoken";
import { tokenRevogado } from "./blocklistToken.js";
import { ErroApi } from "../utils/ErroApi.js";

/**
 * Exige um JWT válido no cabeçalho Authorization (Bearer <token>).
 * Em caso de sucesso, disponibiliza req.admin = { email }.
 */
export function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization || "";

    const [tipo, token] = cabecalho.split(" ");

    if (tipo !== "Bearer" || !token) {
        return next(
            new ErroApi("Token de acesso ausente.", 401)
        );
    }

    try {
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"],
                issuer: process.env.JWT_ISSUER,
                audience: process.env.JWT_AUDIENCE
            }
        );

        if (
            payload.email?.toLowerCase() !==
            process.env.ADMIN_EMAIL?.toLowerCase()
        ) {
            return next(
                new ErroApi("Acesso não autorizado.", 401)
            );
        }

        if (tokenRevogado(payload.jti)) {
            return next(
                new ErroApi("Token inválido ou expirado.", 401)
            );
        }

        req.admin = {
            email: payload.email,
            jti: payload.jti,
        };

        next();

    } catch {
        next(
            new ErroApi("Token inválido ou expirado.", 401)
        );
    }
}

export default autenticar;
