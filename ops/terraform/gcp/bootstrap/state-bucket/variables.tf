variable "project_id" {
  description = "Projeto GCP que vai hospedar o bucket de state."
  type        = string
}

variable "bucket_name" {
  description = "Nome globalmente unico do bucket de Terraform state."
  type        = string
}

variable "location" {
  description = "Regiao do bucket."
  type        = string
  default     = "US"
}

variable "environment" {
  description = "Label de ambiente."
  type        = string
  default     = "shared"
}

variable "labels" {
  description = "Labels extras para o bucket."
  type        = map(string)
  default     = {}
}
