# GCP Worker

Arquivos para transformar a VM do GCP em um worker stateful do pipeline editorial.

## O que este worker faz

- executa o ciclo horario de noticias
- executa o briefing diario
- instala Node.js 22 e pnpm na VM
- publica o snapshot atual do repositorio na VM
- instala services e timers do systemd
- pode subir um PostgreSQL local na VM para shadow database

## Fluxo sugerido

1. Garanta que a VM ja exista via Terraform.
2. Atualize `.env.worker.local` com as credenciais do worker.
3. Rode o deploy local:

```bash
ENABLE_TIMERS=0 ./ops/gcp/worker/deploy-to-vm.sh
```

4. Verifique o env remoto em `/etc/michael-business/worker.env`.
5. Se quiser subir o PostgreSQL sombra na VM, rode:

```bash
ENABLE_TIMERS=0 ENABLE_POSTGRES=1 ./ops/gcp/worker/deploy-to-vm.sh
```

6. Teste manualmente:

```bash
gcloud compute ssh michael-news-worker-test --zone us-central1-a --project astute-veld-370221 --command='sudo systemctl start michael-news-cycle.service'
gcloud compute ssh michael-news-worker-test --zone us-central1-a --project astute-veld-370221 --command='sudo journalctl -u michael-news-cycle.service -n 100 --no-pager'
```

7. Quando o worker estiver validado, habilite os timers:

```bash
ENABLE_TIMERS=1 ./ops/gcp/worker/deploy-to-vm.sh
```

8. Para validar o banco sombra:

```bash
gcloud compute ssh michael-news-worker-test --zone us-central1-a --project astute-veld-370221 --command='cd /opt/michael-business/portfolio-michael-santos && set -a && source /etc/michael-business/worker.env && set +a && pnpm db:shadow:sync && pnpm db:shadow:verify'
```

## Observacoes

- O deploy copia o snapshot atual do workspace para a VM, sem depender de merge ou push imediato.
- `.env.worker.local` e o registro local das variaveis e chaves do worker nesta maquina.
- O deploy envia para a VM apenas as chaves allowlisted do worker para evitar metadados e tokens extras da Vercel.
- Para LinkedIn, o worker aceita `LINKEDIN_ORGANIZATION_URN` ou `LINKEDIN_PERSON_URN`.
- Os passos opcionais do worker sao ignorados quando as credenciais ainda nao existem.
- O PostgreSQL sombra fica local a VM em `127.0.0.1:5432` e nao substitui o Supabase ate o cutover.
- Enquanto os timers da VM estiverem ativos, o ideal e remover ou pausar os schedules equivalentes do GitHub Actions para evitar duplicidade.
