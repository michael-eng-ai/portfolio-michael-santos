# Credential Backup Policy

## Rule

If any new key, token, certificate, or credential is generated for this project:

1. Save the live secret locally inside the ignored `secrets/` directory.
2. Never commit the raw secret to the repository.
3. Add or update a non-secret inventory record in project docs.

## Local Backup Location

- Local backup directory: `secrets/`
- Suggested naming:
  - `secrets/<service>/<credential-name>-YYYY-MM-DD.json`
  - `secrets/<service>/<credential-name>-YYYY-MM-DD.md`
  - `secrets/<service>/<credential-name>-YYYY-MM-DD.txt`

## Minimum Backup Metadata

For each generated credential, record:

- service
- purpose
- owner
- created_at
- rotation_due_at
- where it is configured
- local backup path

## Git Safety

The repository already ignores `secrets/` and common credential patterns through `.gitignore`.

## Documentation Pairing Rule

Whenever a credential is created or rotated:

- update this policy only if the process changes
- update the secret inventory reference without exposing the value
