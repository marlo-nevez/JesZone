import jwt from "jsonwebtoken";

export function autenticarOpcional(req, res, next) {
  req.admin = undefined;

  const cabecalho = req.headers.authorization || "";
  const [tipo, token] = cabecalho.split(" ");

  if (tipo !== "Bearer" || !token) {
    return next();
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      },
    );

    const emailToken = payload.email?.trim().toLowerCase();
    const emailAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (emailToken === emailAdmin) {
      req.admin = { email: payload.email, };
    }
  } catch {

  }
  next();
}

export default autenticarOpcional;