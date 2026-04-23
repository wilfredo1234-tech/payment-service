variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "stage" {
  type    = string
  default = "dev"
}

variable "vpc_id" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "key_pair_name" {
  type = string
}

variable "sqs_queue_url" {
  type = string
}

variable "dynamo_table_name" {
  type    = string
  default = "payment-table-dev"
}