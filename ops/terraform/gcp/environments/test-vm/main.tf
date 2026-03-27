provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

locals {
  labels = merge(
    {
      managed_by  = "terraform"
      project     = "michael-business"
      environment = var.environment
      component   = "news-worker-vm"
    },
    var.labels
  )
}

resource "google_project_service" "required" {
  for_each = toset([
    "compute.googleapis.com",
    "iam.googleapis.com",
    "oslogin.googleapis.com"
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_service_account" "worker" {
  account_id   = var.worker_service_account_id
  display_name = "Michael Business News Worker"
  description  = "Identidade dedicada da VM de automacao editorial."
  project      = var.project_id
}

resource "google_project_iam_member" "worker_roles" {
  for_each = toset(var.worker_service_account_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.worker.email}"
}

module "compute_vm" {
  source = "../../modules/compute-vm"

  depends_on = [
    google_project_service.required,
    google_project_iam_member.worker_roles
  ]

  project_id               = var.project_id
  name                     = var.instance_name
  region                   = var.region
  zone                     = var.zone
  machine_type             = var.machine_type
  network                  = var.network
  assign_public_ip         = var.assign_public_ip
  allowed_ssh_cidrs        = var.allowed_ssh_cidrs
  allowed_web_cidrs        = var.allowed_web_cidrs
  enable_web_ports         = var.enable_web_ports
  deletion_protection      = var.deletion_protection
  boot_image               = var.boot_image
  boot_disk_size_gb        = var.boot_disk_size_gb
  boot_disk_type           = var.boot_disk_type
  labels                   = local.labels
  metadata                 = var.metadata
  enable_oslogin           = true
  enable_startup_bootstrap = var.enable_startup_bootstrap
  install_docker           = var.install_docker
  service_account_email    = google_service_account.worker.email
  service_account_scopes   = var.worker_service_account_scopes
}
