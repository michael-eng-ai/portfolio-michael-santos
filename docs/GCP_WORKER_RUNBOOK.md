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

## Como publicar o worker na VM

```bash
cd /Users/michaelsantos/Documents/GitHub/portfolio-michael-santos
ENABLE_TIMERS=0 ./ops/gcp/worker/deploy-to-vm.sh
```

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
3. `EXTRA_ENV_FILE`, se informado

Hoje isso cobre bem o sync com Supabase. Os passos opcionais de enrichment e social ficam em modo skip enquanto `ANTHROPIC_API_KEY`, `X_*` e `LINKEDIN_*` nao estiverem presentes.

## Observacao operacional

Quando a VM assumir de vez os jobs horarios e diarios, pause os schedules equivalentes em:

- [news-sync.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/news-sync.yml)
- [news-auto-publish.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/news-auto-publish.yml)
- [daily-trend-briefing.yml](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/.github/workflows/daily-trend-briefing.yml)
