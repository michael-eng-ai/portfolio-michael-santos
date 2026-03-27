provider "google" {
  project = var.project_id
}

locals {
  labels = merge(
    {
      managed_by  = "terraform"
      environment = var.environment
      component   = "tf-state"
    },
    var.labels
  )
}

resource "google_storage_bucket" "terraform_state" {
  name                        = var.bucket_name
  project                     = var.project_id
  location                    = var.location
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  labels                      = local.labels

  versioning {
    enabled = true
  }
}
