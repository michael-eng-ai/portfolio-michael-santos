variable "project_id" {
  description = "Projeto GCP onde a VM sera criada."
  type        = string
}

variable "environment" {
  description = "Ambiente logico."
  type        = string
  default     = "test"
}

variable "instance_name" {
  description = "Nome da VM."
  type        = string
  default     = "michael-news-worker-test"
}

variable "region" {
  description = "Regiao da VM."
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "Zona da VM."
  type        = string
  default     = "us-central1-a"
}

variable "machine_type" {
  description = "Tipo da VM."
  type        = string
  default     = "e2-micro"
}

variable "network" {
  description = "Nome da VPC."
  type        = string
  default     = "default"
}

variable "assign_public_ip" {
  description = "Se a VM deve receber IP publico."
  type        = bool
  default     = true
}

variable "allowed_ssh_cidrs" {
  description = "CIDRs liberados para SSH."
  type        = list(string)
}

variable "allowed_web_cidrs" {
  description = "CIDRs liberados para HTTP/HTTPS."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_web_ports" {
  description = "Se deve liberar 80/443."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Se protege a VM de exclusao."
  type        = bool
  default     = false
}

variable "boot_image" {
  description = "Imagem base do sistema."
  type        = string
  default     = "projects/debian-cloud/global/images/family/debian-12"
}

variable "boot_disk_size_gb" {
  description = "Tamanho do disco em GB."
  type        = number
  default     = 20
}

variable "boot_disk_type" {
  description = "Tipo do disco persistente."
  type        = string
  default     = "pd-balanced"
}

variable "enable_startup_bootstrap" {
  description = "Se instala ferramentas basicas na primeira inicializacao."
  type        = bool
  default     = true
}

variable "install_docker" {
  description = "Se instala Docker no bootstrap."
  type        = bool
  default     = true
}

variable "metadata" {
  description = "Metadata adicional da instância."
  type        = map(string)
  default     = {}
}

variable "labels" {
  description = "Labels adicionais."
  type        = map(string)
  default     = {}
}

variable "worker_service_account_id" {
  description = "Account ID da service account dedicada ao worker."
  type        = string
  default     = "michael-news-worker"
}

variable "worker_service_account_roles" {
  description = "Roles IAM concedidas a service account da VM."
  type        = list(string)
  default = [
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ]
}

variable "worker_service_account_scopes" {
  description = "Scopes OAuth anexados a service account na VM."
  type        = list(string)
  default     = ["https://www.googleapis.com/auth/cloud-platform"]
}
