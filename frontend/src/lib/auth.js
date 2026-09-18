// Autenticação da organização: login tradicional (e-mail + senha) contra a API,
// com sessão mantida por JWT em localStorage (sem magic link, sem cadastro).
import { useEffect, useState } from "react";
import * as api from "@/services/api.js";

// Disparado após login/logout para avisar toda instância de useSessao() (o
// SosBanner, o NotificationBell, o layout do /admin, etc.) que precisa
// reconferir a sessão agora — sem isso, cada useSessao() só lia o token uma
// vez ao montar, então quem já estava na tela antes do login continuava
// "achando" que não era admin até um reload manual da página.
const EVENTO_SESSAO = "jes-sessao-mudou";

export async function entrar(email, senha) {
  const { token, email: emailConfirmado } = await api.entrar(email, senha);
  api.definirToken(token);
  window.dispatchEvent(new Event(EVENTO_SESSAO));
  return { email: emailConfirmado };
}

export async function sair() {
  try {
    await api.sair();
  } catch {
    // Mesmo se o backend falhar/já estiver expirado, limpamos a sessão local.
  } finally {
    api.definirToken(null);
    window.dispatchEvent(new Event(EVENTO_SESSAO));
  }
}

/** Sessão atual do navegador (null enquanto carrega ou sem login). */
export function useSessao() {
  const [sessao, setSessao] = useState(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;

    function conferir() {
      const token = api.obterToken();
      if (!token) {
        if (ativo) {
          setSessao(null);
          setPronto(true);
        }
        return;
      }
      api
        .verificarAcesso()
        .then(({ email, admin }) => {
          if (ativo) setSessao({ email, admin: admin === true });
        })
        .catch(() => {
          api.definirToken(null);
          if (ativo) setSessao(null);
        })
        .finally(() => {
          if (ativo) setPronto(true);
        });
    }

    conferir();
    window.addEventListener(EVENTO_SESSAO, conferir);
    return () => {
      ativo = false;
      window.removeEventListener(EVENTO_SESSAO, conferir);
    };
  }, []);

  return { sessao, pronto };
}
