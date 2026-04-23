terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# IAM Role para EC2
resource "aws_iam_role" "payment_service_role" {
  name = "payment-service-role-${var.stage}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "dynamo_access" {
  role       = aws_iam_role.payment_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "sqs_access" {
  role       = aws_iam_role.payment_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSQSFullAccess"
}

resource "aws_iam_instance_profile" "payment_service_profile" {
  name = "payment-service-profile-${var.stage}"
  role = aws_iam_role.payment_service_role.name
}

# Security Group
resource "aws_security_group" "payment_service_sg" {
  name        = "payment-service-sg-${var.stage}"
  description = "Security group for payment service EC2"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "payment-service-sg-${var.stage}"
  }
}

# EC2
resource "aws_instance" "payment_service" {
  ami                         = "ami-0c1e21d82fe9c9336" 
  instance_type               = "t3.micro"
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [aws_security_group.payment_service_sg.id]
  iam_instance_profile        = aws_iam_instance_profile.payment_service_profile.name
  associate_public_ip_address = true
  key_name                    = var.key_pair_name

  user_data = <<-EOF
    #!/bin/bash
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs git
    mkdir -p /home/ec2-user/payment-service
    cat > /home/ec2-user/payment-service/.env << 'ENVFILE'
    PORT=3000
    AWS_REGION=${var.aws_region}
    SQS_QUEUE_URL=${var.sqs_queue_url}
    DYNAMO_TABLE_NAME=${var.dynamo_table_name}
    ENVFILE
    npm install -g pm2
  EOF

  tags = {
    Name = "payment-service-${var.stage}"
  }
}