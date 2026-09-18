import { useJesState } from "@/context/jesContext.jsx";
import { createFileRoute } from "@tanstack/react-router";
import { catLabel, liderGeral, turmaById } from "@/lib/jesConfig.js";
import { GlassCard } from "@/components/GlassCard.jsx";
import { TeamCard } from "@/components/TeamBadge.jsx";
import { Trophy, Medal } from "lucide-react";
import { useEffect, useState } from "react";
import { useCategoria } from "@/context/categoria.jsx";

export const Route = createFileRoute("/lider-geral")({
  component: LiderGeralView,
});

function LiderGeralView() {
  const { categoria } = useCategoria();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("jes-data-changed", h);
    return () => window.removeEventListener("jes-data-changed", h);
  }, []);
  void tick;

  const state = useJesState();
  const rk = liderGeral(state, categoria);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6">
      <h1 className="font-display text-4xl tracking-wider mb-2 flex items-center gap-3">
        <Trophy className="size-8 text-[#f3bb1f]" />
        LÍDER GERAL
      </h1>

      {rk.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-8 items-end">
          {[1, 0, 2].map((idx, pos) => {
            const r = rk[idx];
            const t = turmaById(state, r.turmaId);
            if (!t) return null;
            const heights = ["h-32", "h-44", "h-24"];
            const colors = [
              "from-secondary to-border",
              "from-accent to-gold-hover",
              "from-sesi-blue-2/25 to-sesi-blue-2/55",
            ];
            const medal = ["🥈", "🥇", "🥉"];
            return (
              <div key={r.turmaId} className="flex flex-col items-center gap-2">
                <TeamCard turma={t}>
                  <div className="text-center mt-2">
                    <div className="text-3xl">{medal[pos]}</div>
                    <div className="font-display text-2xl text-accent">
                      {r.pontos}
                      <span className="text-sm text-muted-foreground ml-1">pts</span>
                    </div>
                  </div>
                </TeamCard>
                <div
                  className={`w-full ${heights[pos]} rounded-t-lg bg-gradient-to-t ${colors[pos]} grid place-items-center font-display text-3xl text-foreground shadow-xl`}
                >
                  {idx + 1}º
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GlassCard>
        <h3 className="font-display text-xl tracking-wider mb-3 flex items-center gap-2">
          <Trophy className="size-5 text-accent" /> Classificação
        </h3>
        <div className="space-y-2">
          {rk.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma pontuação consolidada ainda.
            </p>
          )}
          {rk.map((r, i) => {
            const t = turmaById(state, r.turmaId);
            if (!t) return null;

            if (i < 3) return null;
            return (
              <div
                key={r.turmaId}
                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`font-display text-xl w-8 text-center ${i < 3 ? "text-accent" : "text-muted-foreground"}`}
                  >
                    {i + 1}º
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{t.nome}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {t.selecao.pais}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {i < 3 && <Medal className="size-4 text-accent" />}
                  <div className="font-display text-xl">
                    {r.pontos}
                    <span className="text-xs text-muted-foreground ml-1">pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
