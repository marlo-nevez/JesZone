const MAX_TENTATIVAS = 5;
const JANELA_MS = 5 * 60 * 1000;
const BLOQUEIO_MS = 5 * 60 * 1000;

const tentativas = new Map();

function obterChave(req) {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  return `${req.ip}:${email}`;
}

export function verificarLockout(req, res, next) {
  const chave = obterChave(req);
  const registro = tentativas.get(chave);

  if (!registro) {
    return next();
  }

  const agora = Date.now();

  if (agora - registro.inicio >= JANELA_MS) {
    tentativas.delete(chave);
    return next();
  }

  if (registro.bloqueadoAte && agora < registro.bloqueadoAte) {
    return res.status(429).json({
      erro: "Muitas tentativas de login. Tente novamente mais tarde.",
    });
  }

  return next();
}

export function registrarFalhaLogin(req) {
  const chave = obterChave(req);
  const agora = Date.now();

  let registro = tentativas.get(chave);

  if (!registro || agora - registro.inicio >= JANELA_MS) {
    registro = {
      tentativas: 0,
      inicio: agora,
      bloqueadoAte: null,
    };
  }

  registro.tentativas += 1;

  if (registro.tentativas >= MAX_TENTATIVAS) {
    registro.bloqueadoAte = agora + BLOQUEIO_MS;
  }

  tentativas.set(chave, registro);
}

export function limparTentativasLogin(req) {
  const chave = obterChave(req);
  tentativas.delete(chave);
}