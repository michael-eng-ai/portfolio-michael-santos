# PostgreSQL Shadow Database

Arquivos para subir um PostgreSQL local na VM do GCP como banco sombra do projeto.

## Objetivo

- manter o site em producao no Supabase
- espelhar `news` e `newsletter_subscribers` em um PostgreSQL na VM
- validar consistencia antes do cutover real

## Como funciona

1. O deploy da VM envia as variaveis `DATABASE_URL` e `POSTGRES_*`.
2. Com `ENABLE_POSTGRES=1`, o script [bootstrap-postgres.sh](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/ops/gcp/worker/postgres/bootstrap-postgres.sh) sobe um container `postgres:16-alpine`.
   Antes de iniciar, ele detecta automaticamente o UID/GID do usuario `postgres` dentro da imagem e ajusta o volume local para evitar erros de permissao no `pg_filenode.map`.
3. Na primeira inicializacao, o container aplica:
   - [news.sql](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/supabase/news.sql)
   - [newsletter_subscribers.sql](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/supabase/newsletter_subscribers.sql)
4. Depois disso, use os scripts:
   - `pnpm db:shadow:sync`
   - `pnpm db:shadow:verify`

## Padrao sugerido para a VM

```env
DATABASE_PROVIDER=supabase
DATABASE_URL=postgresql://michael_business:change-me@127.0.0.1:5432/michael_business
POSTGRES_DB=michael_business
POSTGRES_USER=michael_business
POSTGRES_PASSWORD=change-me
POSTGRES_PORT=5432
```

Enquanto `DATABASE_PROVIDER=supabase`, o site e os workers continuam usando Supabase normalmente. O PostgreSQL fica apenas como ambiente sombra para sincronizacao e validacao.
