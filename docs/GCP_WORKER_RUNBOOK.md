# GCP Worker Runbook

## Objetivo

Mover o pipeline stateful de noticias para a VM do GCP sem depender do schedule do GitHub Actions.

## O que ja esta pronto

- VM `michael-news-worker-test`
- bucket de remote state no GCS
- service account dedicada anexada a VM
- Docker ativo
- deploy script para publicar o snapshot atual do repositorio na VM
- timers do systemd para o ciclo horario e o briefing diario
- `.env.worker.local` como registro local das variaveis do worker
- bootstrap opcional de PostgreSQL local para shadow database

## Status atual

- a VM foi provisionada e esta acessivel por `gcloud compute ssh`
- o runtime Node 22 + pnpm foi instalado na VM
- os units do systemd foram instalados
- os timers continuam desligados para evitar duplicidade com GitHub Actions
- o primeiro teste mostrou que o env remoto estava sendo montado com placeholders vazios
- o deploy script foi ajustado para priorizar valores locais nao vazios e usar `.env.worker.local` por padrao
- o deploy agora filtra apenas as variaveis necessarias para o worker antes de enviar o env para a VM
- o deploy agora consegue subir um PostgreSQL local com `ENABLE_POSTGRES=1`
- o bootstrap do PostgreSQL detecta o UID/GID do usuario `postgres` da imagem para evitar drift de permissao no volume
- existem scripts para sincronizar `Supabase -> PostgreSQL` e verificar consistencia antes do cutover

## Como publicar o worker na VM

```bash
cd /Users/michaelsantos/Documents/GitHub/portfolio-michael-santos
ENABLE_TIMERS=0 ./ops/gcp/worker/deploy-to-vm.sh
```

## Como subir o PostgreSQL sombra

```bash
cd /Users/michaelsantos/Documents/GitHub/portfolio-michael-santos
ENABLE_TIMERS=0 ENABLE_POSTGRES=1 ./ops/gcp/worker/deploy-to-vm.sh
```

Depois disso, o banco fica disponivel apenas dentro da VM em `127.0.0.1:5432`.

## Como testar manualmente

```bash
gcloud compute ssh michael-news-worker-test --zone us-central1-a --project astute-veld-370221 --command='sudo systemctl start michael-news-cycle.service'
gcloud compute ssh michael-news-worker-test --zone us-central1-a --project astute-veld-370221 --command='sudo journalctl -u michael-news-cycle.service -n 100 --no-pager'
```

## Como habilitar os timers

```bash
cd /Users/michaelsantos/Documents/GitHub/portfolio-michael-santos
ENABLE_TIMERS=1 ./ops/gcp/worker/deploy-to-vm.sh
```

## Segredos

O deploy tenta montar `/etc/michael-business/worker.env` a partir de:

1. envs de producao da Vercel
2. `.env.local`
3. `.env.worker.local`
4. `EXTRA_ENV_FILE`, se informado

Na VM OCI do bot, o worker deve rodar como `DATABASE_PROVIDER=postgres` e usar apenas Gemini ou Groq para tarefas com LLM. Os passos opcionais de enrichment e social ficam em modo skip quando `GEMINI_API_KEY`/`GROQ_API_KEY`, `X_*` ou `LINKEDIN_*` nao estiverem presentes.

As variaveis replicadas para a VM sao intencionalmente restritas a:

- `NEXT_PUBLIC_SITE_URL`
- `DATABASE_PROVIDER`
- `DATABASE_URL`
- `DATABASE_SSL`
- `POSTGRES_IMAGE`
- `POSTGRES_CONTAINER_NAME`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `INDEXNOW_KEY`
- `LLM_PROVIDER`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `GROQ_BASE_URL`
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`
- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_PERSON_URN`
- `LINKEDIN_ORGANIZATION_URN`

## Registro local recomendado

Use [`.env.worker.local.example`](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.env.worker.local.example) como referencia e mantenha o arquivo real `.env.worker.local` fora do Git.

## Como sincronizar e validar o banco sombra legado

```bash
gcloud compute ssh michael-news-worker-test --zone us-central1-a --project astute-veld-370221 --command='cd /opt/michael-business/portfolio-michael-santos && set -a && source /etc/michael-business/worker.env && set +a && pnpm db:shadow:sync'

gcloud compute ssh michael-news-worker-test --zone us-central1-a --project astute-veld-370221 --command='cd /opt/michael-business/portfolio-michael-santos && set -a && source /etc/michael-business/worker.env && set +a && pnpm db:shadow:verify'
```

Esse fluxo era usado durante a transicao Supabase -> PostgreSQL. Para a VM OCI atual do bot, mantenha o worker em PostgreSQL e nao configure Supabase como provider secundario.

## Modo de transicao do worker (historico)

O Supabase foi removido em runtime (#122). Hoje ha um unico PostgreSQL,
configurado por `DATABASE_URL`, do qual tanto a Vercel quanto o worker leem e
escrevem -- nao ha read replica nem espelhamento. `SECONDARY_DATABASE_PROVIDER`
e `DATABASE_PROVIDER` nao sao lidos por nenhum codigo de runtime (config morta) e
podem ser ignorados.

## Bloqueador para a virada da Vercel

Hoje o `DATABASE_URL` do worker aponta para `127.0.0.1` dentro da VM. Isso funciona para o worker local, mas nao para a Vercel. Antes de mover o frontend para PostgreSQL, sera preciso expor o banco de forma segura para a Vercel ou mover o frontend para um ambiente com acesso de rede ao banco.

## Observacao operacional

Quando a VM assumir de vez os jobs horarios e diarios, pause os schedules equivalentes em:

- [news-sync.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/news-sync.yml)
- [news-auto-publish.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/news-auto-publish.yml)
- [daily-trend-briefing.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/daily-trend-briefing.yml)

## Transicao atual recomendada

Enquanto `GEMINI_API_KEY`/`GROQ_API_KEY`, `X_*` e `LINKEDIN_*` ainda nao estiverem configurados na VM:

- a VM fica responsavel pelo `sync-news` horario
- o GitHub Actions continua com enrichment e postagem social em [news-sync.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/news-sync.yml)
- o briefing diario continua no GitHub Actions em [daily-trend-briefing.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/daily-trend-briefing.yml)

Isso evita duplicidade no sync de RSS e mantem as integracoes sociais no caminho que ja tem credenciais configuradas.

### Ownership VM x GitHub Actions

Os pipelines de conteudo do GitHub Actions ficam DORMENTES por padrao. Para
ativa-los (como fallback), defina a repository variable `ACTIONS_PIPELINE_ENABLED=true`
(Settings -> Secrets and variables -> Actions -> Variables). Estado seguro padrao
(variavel ausente) = so a VM executa; nenhuma execucao dupla.

Com o Actions ligado, os flags por step abaixo devolvem steps especificos a VM
(defina `=true` para a VM assumir aquele step):

- `VM_OWNS_NEWS_SYNC=true`
- `VM_OWNS_NEWS_ENRICHMENT=true`
- `VM_OWNS_X_POSTING=true`
- `VM_OWNS_DAILY_BRIEFING=true`
- `VM_OWNS_LINKEDIN_POSTING=true`
