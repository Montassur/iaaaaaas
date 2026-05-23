output "server_public_ips" {
  value = aws_instance.web[*].public_ip
}

output "lb_dns_name" {
  value = aws_lb.main.dns_name
}

output "lb_url" {
  value = "http://${aws_lb.main.dns_name}"
}
