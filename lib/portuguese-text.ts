/**
 * Portuguese metadata on this site was often authored without diacritics
 * (`Estrategia`, `Publicacao`, `aprovacao`). `slugify()` strips accents on
 * purpose, but only for URL slugs — never for titles or descriptions.
 * This map restores the ASCII forms that actually show up in page copy and
 * generated news so Open Graph / Twitter stay valid UTF-8.
 * Already-accented text is left alone.
 */

const WORD_MAP: Record<string, string> = {
  adocao: "adoção",
  alem: "além",
  analitica: "analítica",
  analiticas: "analíticas",
  analitico: "analítico",
  analiticos: "analíticos",
  analise: "análise",
  analises: "análises",
  aplicacao: "aplicação",
  aplicacoes: "aplicações",
  aprovacao: "aprovação",
  area: "área",
  areas: "áreas",
  atualizacao: "atualização",
  atualizacoes: "atualizações",
  automacao: "automação",
  automatica: "automática",
  automatico: "automático",
  avanca: "avança",
  avanco: "avanço",
  avancos: "avanços",
  avaliacao: "avaliação",
  avaliacoes: "avaliações",
  basica: "básica",
  basico: "básico",
  cenario: "cenário",
  ciencia: "ciência",
  codigo: "código",
  confiavel: "confiável",
  confianca: "confiança",
  conteudo: "conteúdo",
  conteudos: "conteúdos",
  critica: "crítica",
  critico: "crítico",
  curriculo: "currículo",
  decisao: "decisão",
  decisoes: "decisões",
  dificil: "difícil",
  dinamica: "dinâmica",
  dinamicas: "dinâmicas",
  direcao: "direção",
  discussoes: "discussões",
  disponivel: "disponível",
  disponiveis: "disponíveis",
  eficiencia: "eficiência",
  especifico: "específico",
  especificos: "específicos",
  especifica: "específica",
  especificas: "específicas",
  estao: "estão",
  estrategia: "estratégia",
  estrategias: "estratégias",
  estrategica: "estratégica",
  estrategicas: "estratégicas",
  estrategico: "estratégico",
  estrategicos: "estratégicos",
  evolucao: "evolução",
  execucao: "execução",
  facil: "fácil",
  friccao: "fricção",
  governanca: "governança",
  historica: "histórica",
  historico: "histórico",
  implantacao: "implantação",
  implementacao: "implementação",
  implementacoes: "implementações",
  implicacao: "implicação",
  implicacoes: "implicações",
  imprimivel: "imprimível",
  imprimiveis: "imprimíveis",
  indice: "índice",
  industria: "indústria",
  influencia: "influência",
  informacao: "informação",
  informacoes: "informações",
  ingles: "inglês",
  ingestao: "ingestão",
  inicio: "início",
  integracao: "integração",
  integracoes: "integrações",
  inteligencia: "inteligência",
  lancamento: "lançamento",
  lancamentos: "lançamentos",
  latencia: "latência",
  lideranca: "liderança",
  liderancas: "lideranças",
  maximo: "máximo",
  mensuravel: "mensurável",
  mensuraveis: "mensuráveis",
  metodo: "método",
  metodos: "métodos",
  minimo: "mínimo",
  modernizacao: "modernização",
  movimentacao: "movimentação",
  mudanca: "mudança",
  mudancas: "mudanças",
  nao: "não",
  negocio: "negócio",
  negocios: "negócios",
  noticia: "notícia",
  noticias: "notícias",
  numero: "número",
  numeros: "números",
  operacao: "operação",
  operacoes: "operações",
  otimizacao: "otimização",
  orquestracao: "orquestração",
  organizacao: "organização",
  organizacoes: "organizações",
  padrao: "padrão",
  padroes: "padrões",
  pagina: "página",
  plantao: "plantão",
  politica: "política",
  politicas: "políticas",
  portugues: "português",
  possivel: "possível",
  pratica: "prática",
  praticas: "práticas",
  pressao: "pressão",
  producao: "produção",
  prontidao: "prontidão",
  proxima: "próxima",
  proximo: "próximo",
  publicacao: "publicação",
  publicacoes: "publicações",
  rapida: "rápida",
  rapidas: "rápidas",
  rapido: "rápido",
  rapidos: "rápidos",
  referencia: "referência",
  referencias: "referências",
  reuso: "reúso",
  responsavel: "responsável",
  responsaveis: "responsáveis",
  revisao: "revisão",
  sao: "são",
  servico: "serviço",
  servicos: "serviços",
  simplificacao: "simplificação",
  solucao: "solução",
  solucoes: "soluções",
  tambem: "também",
  tecnica: "técnica",
  tecnicas: "técnicas",
  tecnico: "técnico",
  tecnicos: "técnicos",
  tecnologica: "tecnológica",
  tecnologico: "tecnológico",
  tendencia: "tendência",
  tendencias: "tendências",
  titulo: "título",
  titulos: "títulos",
  transformacao: "transformação",
  transformacoes: "transformações",
  ultima: "última",
  ultimo: "último",
  unica: "única",
  unico: "único",
  usuario: "usuário",
  usuarios: "usuários",
  util: "útil",
  versao: "versão",
  versoes: "versões",
  visao: "visão",
};

const PHRASES: Array<[RegExp, string]> = [
  [/\besta redefinindo\b/gi, "está redefinindo"],
  [/\besta se tornando\b/gi, "está se tornando"],
  [/\bso tem\b/gi, "só tem"],
];

function matchCase(sample: string, replacement: string): string {
  const first = sample[0] ?? "";
  const upper = sample.toLocaleUpperCase("pt-BR");
  const lower = sample.toLocaleLowerCase("pt-BR");

  if (sample === upper && sample !== lower) {
    return replacement.toLocaleUpperCase("pt-BR");
  }

  if (first && first === first.toLocaleUpperCase("pt-BR") && first !== first.toLocaleLowerCase("pt-BR")) {
    return replacement[0].toLocaleUpperCase("pt-BR") + replacement.slice(1);
  }

  return replacement;
}

export function restorePortugueseDiacritics(value: string): string {
  let text = value;

  for (const [pattern, replacement] of PHRASES) {
    text = text.replace(pattern, (match) => matchCase(match, replacement));
  }

  return text.replace(/[A-Za-zÀ-ÿ]+/g, (word) => {
    const replacement = WORD_MAP[word.toLocaleLowerCase("pt-BR")];
    return replacement ? matchCase(word, replacement) : word;
  });
}
