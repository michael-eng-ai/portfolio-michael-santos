# PostgreSQL Database

Arquivos para subir o PostgreSQL local na VM do GCP. PostgreSQL (via `DATABASE_URL`) e o unico banco do projeto.

## Objetivo

- rodar `news`, `newsletter_subscribers` e `analytics_events` em um PostgreSQL na VM
- expor o banco via `DATABASE_URL` para o site e para os workers

## Como funciona

1. O deploy da VM envia as variaveis `DATABASE_URL` e `POSTGRES_*`.
2. Com `ENABLE_POSTGRES=1`, o script [bootstrap-postgres.sh](bootstrap-postgres.sh) sobe um container `postgres:16-alpine`.
   Antes de iniciar, ele detecta automaticamente o UID/GID do usuario `postgres` dentro da imagem e ajusta o volume local para evitar erros de permissao no `pg_filenode.map`.
3. Na primeira inicializacao, o container aplica:
   - [news.sql](../../../../supabase/news.sql)
   - [newsletter_subscribers.sql](../../../../supabase/newsletter_subscribers.sql)
   - [analytics_events.sql](../../../../supabase/analytics_events.sql)
4. Depois disso, popule a tabela de noticias com `pnpm content:sync:news` e valide com `pnpm db:cutover:check`.

## Nota operacional sobre analytics

- O bootstrap do PostgreSQL cria `public.analytics_events` automaticamente.
- Isso evita que o dashboard fique sem dados quando o ambiente for recriado.

## Padrao sugerido para a VM

```env
DATABASE_URL=postgresql://michael_business:change-me@127.0.0.1:5432/michael_business
POSTGRES_DB=michael_business
POSTGRES_USER=michael_business
POSTGRES_PASSWORD=change-me
POSTGRES_PORT=5432
```

O site e os workers leem e escrevem diretamente nesse PostgreSQL via `DATABASE_URL`. Use `DATABASE_SSL=require` quando o servidor exigir TLS.
