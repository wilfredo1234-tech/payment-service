variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "stage" {
  type    = string
  default = "dev"
}

variable "sqs_queue_url" {
  type = string
}

variable "dynamo_table_name" {
  type    = string
  default = "payment-table-dev"
}