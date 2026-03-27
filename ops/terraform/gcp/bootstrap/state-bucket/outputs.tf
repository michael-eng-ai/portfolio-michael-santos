output "bucket_name" {
  description = "Nome do bucket criado para remote state."
  value       = google_storage_bucket.terraform_state.name
}
