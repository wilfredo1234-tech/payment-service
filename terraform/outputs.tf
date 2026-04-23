output "ec2_public_ip" {
  value = aws_instance.payment_service.public_ip
}