locals {
  ssh_tag = "${var.name}-ssh"
  web_tag = "${var.name}-web"
}

resource "google_compute_address" "public_ip" {
  count   = var.assign_public_ip ? 1 : 0
  name    = "${var.name}-ip"
  project = var.project_id
  region  = var.region
}

resource "google_compute_firewall" "ssh" {
  name    = "${var.name}-allow-ssh"
  project = var.project_id
  network = var.network

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.allowed_ssh_cidrs
  target_tags   = [local.ssh_tag]
}

resource "google_compute_firewall" "web" {
  count   = var.enable_web_ports ? 1 : 0
  name    = "${var.name}-allow-web"
  project = var.project_id
  network = var.network

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = var.allowed_web_cidrs
  target_tags   = [local.web_tag]
}

resource "google_compute_instance" "this" {
  name                      = var.name
  project                   = var.project_id
  zone                      = var.zone
  machine_type              = var.machine_type
  deletion_protection       = var.deletion_protection
  allow_stopping_for_update = true
  can_ip_forward            = false
  labels                    = var.labels
  tags                      = compact([local.ssh_tag, var.enable_web_ports ? local.web_tag : null])

  boot_disk {
    auto_delete = true

    initialize_params {
      image = var.boot_image
      size  = var.boot_disk_size_gb
      type  = var.boot_disk_type
    }
  }

  metadata = merge(
    var.metadata,
    {
      enable-oslogin = tostring(var.enable_oslogin)
    }
  )

  metadata_startup_script = var.enable_startup_bootstrap ? templatefile(
    "${path.module}/templates/startup.sh.tftpl",
    {
      install_docker = var.install_docker
    }
  ) : null

  network_interface {
    network = var.network

    dynamic "access_config" {
      for_each = var.assign_public_ip ? [1] : []

      content {
        nat_ip = google_compute_address.public_ip[0].address
      }
    }
  }

  dynamic "service_account" {
    for_each = var.service_account_email == null ? [] : [1]

    content {
      email  = var.service_account_email
      scopes = var.service_account_scopes
    }
  }

  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
    provisioning_model  = "STANDARD"
  }

  shielded_instance_config {
    enable_integrity_monitoring = true
    enable_secure_boot          = true
    enable_vtpm                 = true
  }
}
