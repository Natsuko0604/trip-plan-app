locals {
  lambda_functions = {

    signup_post = {
      handler     = "signup_post.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/signup_post.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        COGNITO_USER_POOL_ID = aws_cognito_user_pool.users.id
        DB_SECRET_ARN        = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST              = aws_db_instance.main.address
        DB_PORT              = tostring(aws_db_instance.main.port)
        DB_NAME              = aws_db_instance.main.db_name
      }

      subnet_ids = [
        aws_subnet.private_1.id,
        aws_subnet.private_2.id,
      ]

      security_group_ids = [
        aws_security_group.lambda.id,
      ]

      inline_statements = [
        {
          Effect = "Allow"
          Action = [
            "cognito-idp:AdminCreateUser",
            "cognito-idp:AdminSetUserPassword",
            "cognito-idp:AdminDeleteUser",
          ]
          Resource = aws_cognito_user_pool.users.arn
        },
        {
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_plans_post = {
      handler     = "self_plans_post.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self_plans_post.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        COGNITO_USER_POOL_ID = aws_cognito_user_pool.users.id
        DB_SECRET_ARN        = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST              = aws_db_instance.main.address
        DB_PORT              = tostring(aws_db_instance.main.port)
        DB_NAME              = aws_db_instance.main.db_name
      }

      subnet_ids = [
        aws_subnet.private_1.id,
        aws_subnet.private_2.id,
      ]

      security_group_ids = [
        aws_security_group.lambda.id,
      ]

      inline_statements = [
        {
          Effect = "Allow"
          Action = [
            "cognito-idp:AdminCreateUser",
            "cognito-idp:AdminSetUserPassword",
            "cognito-idp:AdminDeleteUser",
          ]
          Resource = aws_cognito_user_pool.users.arn
        },
        {
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    }
  }

  lambda_policy_attachments = merge([
    for function_key, config in local.lambda_functions : {
      for policy_key, policy_arn in config.managed_policies :
      "${function_key}-${policy_key}" => {
        function_key = function_key
        policy_arn   = policy_arn
      }
    }
  ]...)
}

# 各LambdaのコードをZIP化
data "archive_file" "lambda" {
  for_each = local.lambda_functions

  type        = "zip"
  source_file = each.value.source_file
  output_path = "${path.module}/.terraform/${each.key}-lambda.zip"
}

# 各Lambda用IAM Role
resource "aws_iam_role" "lambda" {
  for_each = local.lambda_functions

  name = "${local.project_name}-${replace(each.key, "_", "-")}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

# CloudWatch LogsやVPC接続などのAWS管理ポリシー
resource "aws_iam_role_policy_attachment" "lambda" {
  for_each = local.lambda_policy_attachments

  role       = aws_iam_role.lambda[each.value.function_key].name
  policy_arn = each.value.policy_arn
}

# Lambda固有の追加権限
resource "aws_iam_role_policy" "lambda" {
  for_each = {
    for key, config in local.lambda_functions :
    key => config
    if length(config.inline_statements) > 0
  }

  name = "${local.project_name}-${replace(each.key, "_", "-")}-policy"
  role = aws_iam_role.lambda[each.key].id

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = each.value.inline_statements
  })
}

# Lambda本体
resource "aws_lambda_function" "lambda" {
  for_each = local.lambda_functions

  function_name = "${local.project_name}-${replace(each.key, "_", "-")}"

  role    = aws_iam_role.lambda[each.key].arn
  handler = each.value.handler
  runtime = "nodejs24.x"

  architectures = ["arm64"]
  memory_size   = each.value.memory_size
  timeout       = each.value.timeout

  filename         = data.archive_file.lambda[each.key].output_path
  source_code_hash = data.archive_file.lambda[each.key].output_base64sha256

  dynamic "vpc_config" {
    for_each = length(each.value.subnet_ids) > 0 ? [1] : []

    content {
      subnet_ids         = each.value.subnet_ids
      security_group_ids = each.value.security_group_ids
    }
  }

  dynamic "environment" {
    for_each = length(each.value.environment_variables) > 0 ? [1] : []

    content {
      variables = each.value.environment_variables
    }
  }

  tags = {
    Name = "${local.project_name}-${replace(each.key, "_", "-")}"
  }
}
