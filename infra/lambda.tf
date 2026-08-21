# LambdaのコードをZIPにまとめる
data "archive_file" "hello" {
  type        = "zip"
  source_file = "${path.module}/../apps/backend/dist/lambda/hello.js"
  output_path = "${path.module}/.terraform/hello-lambda.zip"
}

# Lambdaが引き受けるIAM Role
resource "aws_iam_role" "hello_lambda" {
  name = "${local.project_name}-hello-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# CloudWatch Logsへログを出すための権限
resource "aws_iam_role_policy_attachment" "hello_lambda_logs" {
  role       = aws_iam_role.hello_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda本体
resource "aws_lambda_function" "hello" {
  function_name = "${local.project_name}-hello"

  role    = aws_iam_role.hello_lambda.arn
  handler = "hello.handler"
  runtime = "nodejs24.x"

  architectures = ["arm64"]
  memory_size   = 128
  timeout       = 3

  filename         = data.archive_file.hello.output_path
  source_code_hash = data.archive_file.hello.output_base64sha256

  depends_on = [
    aws_iam_role_policy_attachment.hello_lambda_logs
  ]

  tags = {
    Name = "${local.project_name}-hello"
  }
}
