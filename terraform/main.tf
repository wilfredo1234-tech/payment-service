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

data "aws_caller_identity" "current" {}

# ZIP del código incluyendo node_modules
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../"
  output_path = "${path.module}/payment-service.zip"
  excludes    = ["terraform", ".git", ".env", "*.pem", ".gitignore"]
}

# IAM Role para Lambda
resource "aws_iam_role" "payment_lambda_role" {
  name = "payment-service-lambda-role-${var.stage}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "dynamo_access" {
  role       = aws_iam_role.payment_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "sqs_access" {
  role       = aws_iam_role.payment_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSQSFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.payment_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda
resource "aws_lambda_function" "payment_service" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "payment-service-${var.stage}"
  role             = aws_iam_role.payment_lambda_role.arn
  handler          = "src/app.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 30

  environment {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      SQS_QUEUE_URL                       = var.sqs_queue_url
      DYNAMO_TABLE_NAME                   = var.dynamo_table_name
    }
  }
}

# API Gateway
resource "aws_apigatewayv2_api" "payment_api" {
  name          = "payment-service-api-${var.stage}"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.payment_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.payment_service.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "post_payment" {
  api_id    = aws_apigatewayv2_api.payment_api.id
  route_key = "POST /api/payment"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "get_payment" {
  api_id    = aws_apigatewayv2_api.payment_api.id
  route_key = "GET /api/payment/{traceId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.payment_api.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.payment_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.payment_api.execution_arn}/*/*"
}