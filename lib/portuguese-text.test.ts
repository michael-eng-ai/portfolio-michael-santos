import assert from "node:assert/strict";

import { restorePortugueseDiacritics } from "@/lib/portuguese-text";

function run() {
  assert.equal(
    restorePortugueseDiacritics("Michael Santos | Estrategia de Dados e IA"),
    "Michael Santos | Estratégia de Dados e IA",
  );
  assert.equal(
    restorePortugueseDiacritics("Publicacao no LinkedIn continua poderosa, mas depende de aprovacao"),
    "Publicação no LinkedIn continua poderosa, mas depende de aprovação",
  );
  assert.equal(
    restorePortugueseDiacritics("Esta publicacao da TechCrunch AI aborda um avanco relevante."),
    "Esta publicação da TechCrunch AI aborda um avanço relevante.",
  );
  assert.equal(
    restorePortugueseDiacritics("Nova publicacao explora como o tema esta redefinindo prioridades."),
    "Nova publicação explora como o tema está redefinindo prioridades.",
  );
  assert.equal(
    restorePortugueseDiacritics("Isso importa porque streaming so tem valor estrategico."),
    "Isso importa porque streaming só tem valor estratégico.",
  );
  assert.equal(restorePortugueseDiacritics("engenharia de dados e cloud-native"), "engenharia de dados e cloud-native");

  const already = "A decisão da OpenAI não arquiteta pipelines.";
  assert.equal(restorePortugueseDiacritics(already), already);
  assert.equal(restorePortugueseDiacritics(restorePortugueseDiacritics("decisoes de negocio")), "decisões de negócio");

  console.log("portuguese-text.test.ts: all assertions passed");
}

run();
