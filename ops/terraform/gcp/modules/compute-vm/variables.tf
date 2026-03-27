variable "project_id" {
  description = "Projeto GCP."
  type        = string
}

variable "name" {
  description = "Nome da VM."
  type        = string
}

variable "region" {
  description = "Regiao da VM."
  type        = string
}

variable "zone" {
  description = "Zona da VM."
  type        = string
}

variable "machine_type" {
  description = "Tipo da maquina."
  type        = string
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
  description = "CIDRs autorizados para SSH."
  type        = list(string)
}

variable "allowed_web_cidrs" {
  description = "CIDRs autorizados para HTTP/HTTPS."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_web_ports" {
  description = "Se deve liberar 80/443 na VM."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Protege a VM contra exclusao acidental."
  type        = bool
  default     = false
}

variable "boot_image" {
  description = "Imagem base do disco."
  type        = string
  default     = "projects/debian-cloud/global/images/family/debian-12"
}

variable "boot_disk_size_gb" {
  description = "Tamanho do disco em GB."
  type        = number
  default     = 20
}

variable "boot_disk_type" {
  description = "Tipo do disco."
  type        = string
  default     = "pd-balanced"
}

variable "labels" {
  description = "Labels da VM."
  type        = map(string)
  default     = {}
}

variable "metadata" {
  description = "Metadata extra para a VM."
  type        = map(string)
  default     = {}
}

variable "enable_oslogin" {
  description = "Ativa OS Login para SSH com gcloud."
  type        = bool
  default     = true
}

variable "enable_startup_bootstrap" {
  description = "Ativa o script de bootstrap na inicializacao."
  type        = bool
  default     = true
}

variable "install_docker" {
  description = "Instala Docker no bootstrap inicial."
  type        = bool
  default     = true
}

variable "service_account_email" {
  description = "Email da service account anexada a VM."
  type        = string
  default     = null
}

variable "service_account_scopes" {
  description = "Scopes OAuth da service account da VM."
  type        = list(string)
  default     = ["https://www.googleapis.com/auth/cloud-platform"]
}
