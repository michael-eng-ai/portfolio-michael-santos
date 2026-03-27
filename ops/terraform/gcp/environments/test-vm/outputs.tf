output "instance_name" {
  description = "Nome da VM."
  value       = module.compute_vm.instance_name
}

output "zone" {
  description = "Zona da VM."
  value       = module.compute_vm.instance_zone
}

output "public_ip" {
  description = "IP publico da VM."
  value       = module.compute_vm.public_ip
}

output "private_ip" {
  description = "IP privado da VM."
  value       = module.compute_vm.private_ip
}

output "ssh_command" {
  description = "Comando recomendado para acesso via gcloud."
  value       = "gcloud compute ssh ${module.compute_vm.instance_name} --zone ${module.compute_vm.instance_zone} --project ${var.project_id}"
}

output "service_account_email" {
  description = "Service account dedicada anexada a VM."
  value       = module.compute_vm.service_account_email
}
