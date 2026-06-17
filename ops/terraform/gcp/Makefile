TFVARS_DIR := environments/test-vm
PROJECT_ID := $(shell grep 'project_id' $(TFVARS_DIR)/terraform.tfvars | cut -d'"' -f2)
ZONE := $(shell grep 'zone' $(TFVARS_DIR)/terraform.tfvars | cut -d'"' -f2)
INSTANCE := $(shell grep 'instance_name' $(TFVARS_DIR)/terraform.tfvars | cut -d'"' -f2)
DEPLOY_SCRIPT := ../../gcp/worker/deploy-to-vm.sh

.PHONY: init plan apply destroy deploy-worker deploy-worker-live ssh logs-news logs-daily status sync-shadow help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

init: ## terraform init with backend
	cd $(TFVARS_DIR) && terraform init -backend-config=backend.hcl

plan: ## terraform plan
	cd $(TFVARS_DIR) && terraform plan

apply: ## terraform apply (auto-approve)
	cd $(TFVARS_DIR) && terraform apply -auto-approve

destroy: ## terraform destroy (requires confirmation)
	cd $(TFVARS_DIR) && terraform destroy

deploy-worker: ## Deploy worker to VM (timers disabled)
	ENABLE_TIMERS=0 \
	PROJECT_ID=$(PROJECT_ID) \
	ZONE=$(ZONE) \
	INSTANCE_NAME=$(INSTANCE) \
	bash $(DEPLOY_SCRIPT)

deploy-worker-live: ## Deploy worker to VM (timers enabled)
	ENABLE_TIMERS=1 \
	PROJECT_ID=$(PROJECT_ID) \
	ZONE=$(ZONE) \
	INSTANCE_NAME=$(INSTANCE) \
	bash $(DEPLOY_SCRIPT)

ssh: ## SSH into the worker VM
	gcloud compute ssh $(INSTANCE) \
		--project $(PROJECT_ID) \
		--zone $(ZONE)

logs-news: ## Show news-cycle logs
	gcloud compute ssh $(INSTANCE) \
		--project $(PROJECT_ID) \
		--zone $(ZONE) \
		--command 'sudo journalctl -u michael-news-cycle.service -n 80 --no-pager'

logs-daily: ## Show daily-briefing logs
	gcloud compute ssh $(INSTANCE) \
		--project $(PROJECT_ID) \
		--zone $(ZONE) \
		--command 'sudo journalctl -u michael-daily-briefing.service -n 80 --no-pager'

status: ## Show timer status
	gcloud compute ssh $(INSTANCE) \
		--project $(PROJECT_ID) \
		--zone $(ZONE) \
		--command 'sudo systemctl list-timers michael-*'

sync-shadow: ## Check the PostgreSQL database is reachable and has active news
	# TODO: this recipe invoked scripts/sync-supabase-to-postgres.ts and
	# scripts/verify-postgres-shadow.ts, which were deleted with Supabase. The
	# Postgres-only replacement is `pnpm db:cutover:check` (scripts/check-postgres-ready.ts),
	# wired below. Confirm before relying on this target.
	gcloud compute ssh $(INSTANCE) \
		--project $(PROJECT_ID) \
		--zone $(ZONE) \
		--command 'cd /opt/michael-business/portfolio-michael-santos && sudo -u michaelworker pnpm db:cutover:check'
