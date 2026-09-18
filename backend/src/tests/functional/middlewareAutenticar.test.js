import { describe, it, expect, beforeEach, vi } from "vitest";
import jwt from "jsonwebtoken";

import { autenticar } from "../../middlewares/autenticar.js";

describe("Middleware autenticar", () => {

    beforeEach(() => {
        process.env.JWT_SECRET = "segredo-teste";
        process.env.ADMIN_EMAIL = "admin@jeszone.com";
        process.env.JWT_ISSUER = "jeszone-api";
        process.env.JWT_AUDIENCE = "jeszone-admin";
    });

    it("deve rejeitar JWT válido com e-mail diferente do administrador", () => {

        const token = jwt.sign(
            {
                email: "usuario@jeszone.com"
            },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256"
            }
        );

        const req = {
            headers: {
                authorization: `Bearer ${token}`
            }
        };

        const res = {};

        const next = vi.fn();

        autenticar(req, res, next);

        expect(next).toHaveBeenCalled();

        const erro = next.mock.calls[0][0];

        expect(erro.status).toBe(401);
        expect(erro.message).toBe("Token inválido ou expirado.");

        expect(req.admin).toBeUndefined();
    });
    it("deve aceitar JWT válido do administrador", () => {

    const token = jwt.sign(
        {
            email: process.env.ADMIN_EMAIL
        },
        process.env.JWT_SECRET,
        {
            algorithm: "HS256",
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE
        }
    );

    const req = {
        headers: {
            authorization: `Bearer ${token}`
        }
    };

    const res = {};

    const next = vi.fn();

    autenticar(req, res, next);

    expect(next).toHaveBeenCalledWith();

    expect(req.admin).toEqual({
        email: process.env.ADMIN_EMAIL
    });
});
});