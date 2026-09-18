
import "dotenv/config";
import app from "./app.js";
import { sequelize, conectarBanco } from "./src/config/banco.js";
import "./src/models/index.js";
import { importarSeBancoVazio } from "./src/services/importarDados.js";

const PORTA = process.env.PORT || 3000;

const CAMPOS_OBRIGATORIOS = [
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "JWT_SECRET",
  "JWT_ISSUER",
  "JWT_AUDIENCE"
];

const faltando = CAMPOS_OBRIGATORIOS.filter(
  (campo) => !process.env[campo]
);

if (faltando.length) {
  console.error(
    `Variáveis de ambiente obrigatórias ausentes: ${faltando.join(", ")}. Copie .env.example para .env e preencha os valores.`
  );
  process.exit(1);
}

const segredosInseguros = [
  "segredo",
  "segredo-teste",
  "secret",
  "changeme",
  "change-me",
  "jwt-secret",
  "123456",
  "senha"
];

const jwtSecretNormalizado = process.env.JWT_SECRET
  .trim()
  .toLowerCase();

const segredoInseguro =
  jwtSecretNormalizado.length < 32 ||
  segredosInseguros.some((valor) =>
    jwtSecretNormalizado.includes(valor)
  );

if (segredoInseguro) {
  console.error(
    "JWT_SECRET inseguro. Gere um segredo aleatório com pelo menos 32 caracteres."
  );
  process.exit(1);
}

async function iniciar() {
  try {
    await conectarBanco();
    console.log("Conexão com o MySQL estabelecida.");

    await sequelize.sync();
    console.log("Modelos sincronizados com o banco de dados.");

    // Banco novo (ex.: outra pessoa que acabou de baixar o projeto): carrega
    // automaticamente os dados do snapshot em dados/dados-jes.json. Se o banco
    // já tiver turmas, nada é sobrescrito.
    await importarSeBancoVazio();

    app.listen(PORTA, () => {
      console.log(`API do JES 2026 rodando em http://localhost:${PORTA}`);
    });
  } catch (erro) {
    console.error("Falha ao iniciar o servidor:", erro);
    process.exit(1);
  }
}

iniciar();
