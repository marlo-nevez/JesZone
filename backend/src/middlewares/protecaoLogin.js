import rateLimit from "express-rate-limit";

export const rateLimitLogin = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  handler: (req, res) => {
    return res.status(429).json({
      erro: "Muitas tentativas de login. Tente novamente mais tarde.",
    });
  },
});