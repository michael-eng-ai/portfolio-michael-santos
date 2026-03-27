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

Hoje isso cobre bem o sync com Supabase. Os passos opcionais de enrichment e social ficam em modo skip enquanto `ANTHROPIC_API_KEY`, `X_*` e `LINKEDIN_*` nao estiverem presentes.

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
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INDEXNOW_KEY`
- `ANTHROPIC_API_KEY`
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`
- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_PERSON_URN`
- `LINKEDIN_ORGANIZATION_URN`

## Registro local recomendado

Use [`.env.worker.local.example`](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.env.worker.local.example) como referencia e mantenha o arquivo real `.env.worker.local` fora do Git.

## Como sincronizar e validar o banco sombra

```bash
gcloud compute ssh michael-news-worker-test --zone us-central1-a --project astute-veld-370221 --command='cd /opt/michael-business/portfolio-michael-santos && set -a && source /etc/michael-business/worker.env && set +a && pnpm db:shadow:sync'

gcloud compute ssh michael-news-worker-test --zone us-central1-a --project astute-veld-370221 --command='cd /opt/michael-business/portfolio-michael-santos && set -a && source /etc/michael-business/worker.env && set +a && pnpm db:shadow:verify'
```

Esse fluxo mantem o site e os workers apontando para Supabase enquanto o PostgreSQL na VM e validado com dados reais.

## Observacao operacional

Quando a VM assumir de vez os jobs horarios e diarios, pause os schedules equivalentes em:

- [news-sync.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/news-sync.yml)
- [news-auto-publish.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/news-auto-publish.yml)
- [daily-trend-briefing.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/daily-trend-briefing.yml)
