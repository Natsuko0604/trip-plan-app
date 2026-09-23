locals {
  lambda_functions = {

    signup_post = {
      handler     = "signup-post.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/signup-post.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN       = var.allowed_origin
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
      handler     = "self-plans-post.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-plans-post.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN       = var.allowed_origin
        COGNITO_USER_POOL_ID = aws_cognito_user_pool.users.id
        DB_SECRET_ARN        = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST              = aws_db_instance.main.address
        DB_PORT              = tostring(aws_db_instance.main.port)
        DB_NAME              = aws_db_instance.main.db_name
        IMAGE_BUCKET         = aws_s3_bucket.images.id
        IMAGE_BUCKET_REGION  = var.aws_region
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
        {
          Effect   = "Allow"
          Action   = ["s3:GetObject"]
          Resource = "${aws_s3_bucket.images.arn}/images/*"
        },
        {
          Effect   = "Allow"
          Action   = ["s3:ListBucket"]
          Resource = aws_s3_bucket.images.arn
          Condition = {
            StringLike = {
              "s3:prefix" = ["images/*"]
            }
          }
        },
      ]
    },
    image_upload_url_post = {
      handler     = "image-upload-url-post.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/image-upload-url-post.js"
      memory_size = 128
      timeout     = 10

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN      = var.allowed_origin
        IMAGE_BUCKET        = aws_s3_bucket.images.id
        IMAGE_BUCKET_REGION = var.aws_region
      }

      subnet_ids         = []
      security_group_ids = []

      inline_statements = [
        {
          Effect   = "Allow"
          Action   = ["s3:PutObject"]
          Resource = "${aws_s3_bucket.images.arn}/images/*"
        },
      ]
    },
    self_memories_plan_id_post = {
      handler     = "self-memories-plan-id-post.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-memories-plan-id-post.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_plans_id_favorites_post = {
      handler     = "self-plans-id-favorites-post.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-plans-id-favorites-post.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    plans_get = {
      handler     = "plans-get.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/plans-get.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    plans_id_get = {
      handler     = "plans-id-get.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/plans-id-get.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_get = {
      handler     = "self-get.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-get.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_plans_get = {
      handler     = "self-plans-get.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-plans-get.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_plans_id_get = {
      handler     = "self-plans-id-get.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-plans-id-get.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_memories_get = {
      handler     = "self-memories-get.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-memories-get.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_plans_favorites_get = {
      handler     = "self-plans-favorites-get.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-plans-favorites-get.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_put = {
      handler     = "self-put.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-put.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_plans_id_put = {
      handler     = "self-plans-id-put.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-plans-id-put.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_plans_id_timelines_put = {
      handler     = "self-plans-id-timelines-put.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-plans-id-timelines-put.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN = var.allowed_origin
        DB_SECRET_ARN  = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST        = aws_db_instance.main.address
        DB_PORT        = tostring(aws_db_instance.main.port)
        DB_NAME        = aws_db_instance.main.db_name
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
      ]
    },
    self_plans_id_hotels_put = {
      handler     = "self-plans-id-hotels-put.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-plans-id-hotels-put.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN      = var.allowed_origin
        DB_SECRET_ARN       = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST             = aws_db_instance.main.address
        DB_PORT             = tostring(aws_db_instance.main.port)
        DB_NAME             = aws_db_instance.main.db_name
        IMAGE_BUCKET        = aws_s3_bucket.images.id
        IMAGE_BUCKET_REGION = var.aws_region
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
        {
          Effect   = "Allow"
          Action   = ["s3:GetObject"]
          Resource = "${aws_s3_bucket.images.arn}/images/*"
        },
        {
          Effect   = "Allow"
          Action   = ["s3:ListBucket"]
          Resource = aws_s3_bucket.images.arn
          Condition = {
            StringLike = {
              "s3:prefix" = ["images/*"]
            }
          }
        },
      ]
    },
    self_plans_id_restaurants_put = {
      handler     = "self-plans-id-restaurants-put.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-plans-id-restaurants-put.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN      = var.allowed_origin
        DB_SECRET_ARN       = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST             = aws_db_instance.main.address
        DB_PORT             = tostring(aws_db_instance.main.port)
        DB_NAME             = aws_db_instance.main.db_name
        IMAGE_BUCKET        = aws_s3_bucket.images.id
        IMAGE_BUCKET_REGION = var.aws_region
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
        {
          Effect   = "Allow"
          Action   = ["s3:GetObject"]
          Resource = "${aws_s3_bucket.images.arn}/images/*"
        },
        {
          Effect   = "Allow"
          Action   = ["s3:ListBucket"]
          Resource = aws_s3_bucket.images.arn
          Condition = {
            StringLike = {
              "s3:prefix" = ["images/*"]
            }
          }
        },
      ]
    },
    self_plans_id_touring_spots_put = {
      handler     = "self-plans-id-touring-spots-put.handler"
      source_file = "${path.module}/../apps/backend/dist/lambda/self-plans-id-touring-spots-put.js"
      memory_size = 256
      timeout     = 15

      managed_policies = {
        logs = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        vpc  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      }

      environment_variables = {
        ALLOWED_ORIGIN      = var.allowed_origin
        DB_SECRET_ARN       = aws_db_instance.main.master_user_secret[0].secret_arn
        DB_HOST             = aws_db_instance.main.address
        DB_PORT             = tostring(aws_db_instance.main.port)
        DB_NAME             = aws_db_instance.main.db_name
        IMAGE_BUCKET        = aws_s3_bucket.images.id
        IMAGE_BUCKET_REGION = var.aws_region
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
          Effect   = "Allow"
          Action   = ["secretsmanager:GetSecretValue"]
          Resource = aws_db_instance.main.master_user_secret[0].secret_arn
        },
        {
          Effect   = "Allow"
          Action   = ["s3:GetObject"]
          Resource = "${aws_s3_bucket.images.arn}/images/*"
        },
        {
          Effect   = "Allow"
          Action   = ["s3:ListBucket"]
          Resource = aws_s3_bucket.images.arn
          Condition = {
            StringLike = {
              "s3:prefix" = ["images/*"]
            }
          }
        },
      ]
    },
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

  depends_on = [
    aws_iam_role_policy_attachment.lambda,
    aws_iam_role_policy.lambda,
  ]

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
