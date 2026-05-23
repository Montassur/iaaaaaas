variable "region" {
  type    = string
  default = "us-east-1"
}

variable "ssh_key_name" {
  type        = string
  description = "Name of an existing EC2 key pair in AWS"
}

variable "server_count" {
  type    = number
  default = 2
}

variable "server_type" {
  type    = string
  default = "t3.micro"
}

variable "app_name" {
  type    = string
  default = "marketplace-devops-lab"
}
