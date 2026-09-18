import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Droplets, Sun, Utensils } from "lucide-react";


const INTERVALO_MS = 20 * 60 * 1000;

const LEMBRETES = [
  {
    Icone: Droplets,
    titulo: "Hidrate-se!",
    texto:
      "Beba água com frequência ao longo do dia. Não espere sentir sede para procurar um bebedouro.",
    cor: "from-sky-500 to-blue-600",
  },
  {
    Icone: Sun,
    titulo: "Proteção solar",
    texto:
      "Reaplique o protetor solar e quando possível, aproveite as pausas entre os jogos na sombra.",
    cor: "from-amber-400 to-orange-500",
  },
  {
    Icone: Utensils,
    titulo: "Alimente-se bem",
    texto:
      "Não pule as refeições. Coma algo leve entre os jogos para manter o gás até o fim do dia.",
    cor: "from-emerald-500 to-green-600",
  },
];

export function LembretesPopup() {
  const [aberto, setAberto] = useState(false);
  const [indice, setIndice] = useState(0);
  

  useEffect(() => {
  if (aberto) return;

  const AGORA = Date.now();
  const ULTIMO_LEMBRETE = Number(
    localStorage.getItem("jeszone_ultimo_lembrete") || 0
  );

  const primeiraAbertura = ULTIMO_LEMBRETE === 0;
  const tempoDecorrido = AGORA - ULTIMO_LEMBRETE;

  const tempoEspera = primeiraAbertura
    ? 0.6 * 60 * 1000
    : Math.max(0, INTERVALO_MS - tempoDecorrido);

  const id = setTimeout(() => {
    localStorage.setItem("jeszone_ultimo_lembrete", String(Date.now()));
    setIndice(0);
    setAberto(true);
  }, tempoEspera);

  return () => clearTimeout(id);
}, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto]);


  const ultimo = indice === LEMBRETES.length - 1;
  const atual = LEMBRETES[indice];

  const avancar = () => {
    if (ultimo) {
      setAberto(false);
    } else {
      setIndice((i) => i + 1);
    }
  };

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] grid place-items-center p-4 bg-foreground/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Lembretes de bem-estar"
        >
          <motion.div
            initial={{ y: 16, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative w-full max-w-sm rounded-3xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Fundo com o mesmo esquema de cores do telão, pulsando bem sutilmente */}
            <motion.div
              aria-hidden
              className="absolute inset-0 lembrete-fundo"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative p-5">
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar lembretes"
                className="absolute top-4 right-4 size-9 grid place-items-center rounded-full bg-foreground/5 hover:bg-foreground/10 transition"
              >
                <X className="size-4" />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={indice}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="pt-4"
                >
                  <div
                    className={`mx-auto size-16 rounded-2xl grid place-items-center bg-gradient-to-br ${atual.cor} shadow-lg`}
                  >
                    <atual.Icone className="size-8 text-white" />
                  </div>
                  <h2 className="mt-4 text-center font-display text-2xl tracking-wider">
                    {atual.titulo}
                  </h2>
                  <p className="mt-2 text-center text-sm text-muted-foreground leading-relaxed">
                    {atual.texto}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex items-center justify-center gap-1.5">
                {LEMBRETES.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === indice ? "w-6 bg-accent" : "w-1.5 bg-foreground/15"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={avancar}
                  className="min-h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 transition"
                >
                  {ultimo ? "Entendi" : "Próximo"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
