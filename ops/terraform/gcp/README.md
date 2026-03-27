# GCP Terraform

Infraestrutura reproduzivel para a camada stateful do pipeline editorial.

## Estrutura

```text
ops/terraform/gcp/
  bootstrap/state-bucket/    # bucket GCS para remote state
  modules/compute-vm/        # modulo reutilizavel da VM
  environments/test-vm/      # ambiente inicial de teste no GCP
```

## Fluxo recomendado

1. Configure o projeto GCP no `gcloud`.
2. Faça login com credenciais do Terraform:

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project <PROJECT_ID>
```

3. Crie o bucket de state:

```bash
terraform -chdir=ops/terraform/gcp/bootstrap/state-bucket init
terraform -chdir=ops/terraform/gcp/bootstrap/state-bucket apply \
  -var="project_id=<PROJECT_ID>" \
  -var="bucket_name=<UNIQUE_BUCKET_NAME>"
```

4. Crie `backend.hcl` em `ops/terraform/gcp/environments/test-vm/` com:

```hcl
bucket = "<UNIQUE_BUCKET_NAME>"
prefix = "terraform/environments/test-vm"
```

5. Aplique a VM:

```bash
cp ops/terraform/gcp/environments/test-vm/terraform.tfvars.example \
   ops/terraform/gcp/environments/test-vm/terraform.tfvars

terraform -chdir=ops/terraform/gcp/environments/test-vm init \
  -backend-config=backend.hcl

terraform -chdir=ops/terraform/gcp/environments/test-vm plan
terraform -chdir=ops/terraform/gcp/environments/test-vm apply
```

## Notas

- A configuracao de teste usa `e2-micro` em `us-central1-a`, que costuma ser o melhor ponto de partida para validar custo baixo no GCP.
- O modulo ativa `compute.googleapis.com` e `oslogin.googleapis.com` automaticamente no projeto.
- A VM usa `OS Login`, entao o acesso recomendado e via `gcloud compute ssh`.
- A porta 22 fica restrita pelos CIDRs informados em `allowed_ssh_cidrs`.
