import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  ICONE_NOTIFICACAO,
  MAX_NOTIFICACOES_USUARIO,
  notificacoesQueryOptions,
} from "@/lib/jesDados.js";
import {
  getLidas,
  marcarLidas,
  EVENTO_PREFERENCIAS,
} from "@/lib/preferencias.js";
import { useSessao } from "@/lib/auth.js";
import { useCategoria } from "@/context/categoria.jsx";

export function NotificationBell({ open, onOpenChange }) {
  const [lidas, setLidas] = useState([]);
  const { data } = useQuery(notificacoesQueryOptions(MAX_NOTIFICACOES_USUARIO));
  const { sessao } = useSessao();
  const souAdmin = sessao?.admin === true;
  const { categoria } = useCategoria();

  useEffect(() => {
    const sync = () => setLidas(getLidas());
    sync();
    window.addEventListener(EVENTO_PREFERENCIAS, sync);
    return () => window.removeEventListener(EVENTO_PREFERENCIAS, sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const itens = useMemo(() => {
  const todas = data ?? [];

  if (souAdmin) {
    return todas;
  }

  return todas.filter(
    (n) =>
      n.tipo !== "sos" &&
      (n.escopo === "todos" || n.escopo === categoria),
  );
}, [data, souAdmin, categoria]);

  const nao = itens.filter((n) => !lidas.includes(n.id)).length;

  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        aria-label={`Notificações${nao ? `: ${nao} não lidas` : ""}`}
        aria-expanded={open}
        className="relative p-2.5 rounded-lg hover:bg-foreground/5 transition"
      >
        <Bell className="size-5" />
        <AnimatePresence>
          {nao > 0 && (
            <motion.span
              key={nao}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 grid place-items-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold"
            >
              {nao}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              className="fixed inset-0 z-[55] cursor-default bg-foreground/40 sm:bg-transparent"
              aria-label="Fechar notificações"
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="dialog"
              aria-label="Notificações"
              className="fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-1.5rem)] max-w-sm z-[60] panel-solid rounded-2xl p-2 max-h-[70vh] overflow-y-auto sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-auto sm:mt-2 sm:w-[22rem]"
            >
              <div className="flex items-center justify-between px-2 py-1">
                <span className="font-display tracking-wider text-sm">
                  NOTIFICAÇÕES
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => marcarLidas(itens.map((n) => n.id))}
                    title="Marcar todas como lidas"
                    aria-label="Marcar todas como lidas"
                    className="p-2 rounded hover:bg-foreground/5"
                  >
                    <CheckCheck className="size-4" />
                  </button>
                  <button
                    onClick={() => onOpenChange(false)}
                    aria-label="Fechar"
                    className="p-2 rounded hover:bg-foreground/5 sm:hidden"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {itens.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Nenhuma notificação por enquanto.
                </p>
              )}

              <ul className="space-y-1">
                {itens.map((n) => {
                  const lido = lidas.includes(n.id);
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => marcarLidas([n.id])}
                        className={`w-full text-left flex gap-2 rounded-xl px-2 py-2.5 hover:bg-foreground/5 transition ${lido ? "opacity-60" : ""}`}
                      >
                        <div
                          className="size-6 shrink-0 grid place-items-center"
                          aria-hidden
                        >
                          <img
                            src={
                              ICONE_NOTIFICACAO[n.tipo] ||
                              "/assets/notificacoes/default.png"
                            }
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <span className="min-w-0">
                          <span className="block text-sm">{n.titulo}</span>
                          {n.descricao && (
                            <span className="block text-xs text-muted-foreground">
                              {n.descricao}
                            </span>
                          )}
                          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                            {new Date(n.criadoEm).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                        {!lido && (
                          <span className="ml-auto mt-1 size-2 rounded-full bg-accent shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="px-2 pt-1 pb-2 text-[10px] text-muted-foreground">
                Mostrando os {MAX_NOTIFICACOES_USUARIO} avisos mais recentes.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
