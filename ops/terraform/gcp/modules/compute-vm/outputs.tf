output "instance_name" {
  description = "Nome da VM."
  value       = google_compute_instance.this.name
}

output "instance_zone" {
  description = "Zona da VM."
  value       = google_compute_instance.this.zone
}

output "private_ip" {
  description = "IP privado da VM."
  value       = google_compute_instance.this.network_interface[0].network_ip
}

output "public_ip" {
  description = "IP publico da VM."
  value       = try(google_compute_address.public_ip[0].address, null)
}

output "self_link" {
  description = "Self link da instância."
  value       = google_compute_instance.this.self_link
}

output "service_account_email" {
  description = "Service account anexada a VM."
  value       = try(google_compute_instance.this.service_account[0].email, null)
}
