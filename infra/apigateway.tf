resource "aws_api_gateway_rest_api" "main" {
  name = "${local.project_name}-api"
}

// Cognitoの設定用
resource "aws_api_gateway_authorizer" "cognito" {
  name        = "${local.project_name}-cognito-authorizer"
  rest_api_id = aws_api_gateway_rest_api.main.id

  type          = "COGNITO_USER_POOLS"
  provider_arns = [aws_cognito_user_pool.users.arn]

  identity_source = "method.request.header.Authorization"
}

// signup
resource "aws_api_gateway_resource" "signup" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "signup"
}

// signup post
resource "aws_api_gateway_method" "signup_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.signup.id
  http_method   = "POST"
  authorization = "NONE"
}

# POST /signupをsignup_post Lambdaへ接続
resource "aws_api_gateway_integration" "signup_post_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.signup.id
  http_method = aws_api_gateway_method.signup_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["signup_post"].invoke_arn
}

# API Gatewayからsignup_post Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_signup_post" {
  statement_id  = "AllowExecutionFromApiGatewaySignupPost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["signup_post"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/POST/signup"
}

# signup OPTIONS
resource "aws_api_gateway_method" "signup_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.signup.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /signupをsignup_post Lambdaへ接続
resource "aws_api_gateway_integration" "signup_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.signup.id
  http_method = aws_api_gateway_method.signup_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["signup_post"].invoke_arn
}

# API GatewayのOPTIONSからsignup_post Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_signup_options" {
  statement_id  = "AllowExecutionFromApiGatewaySignupOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["signup_post"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/signup"
}

// plans
resource "aws_api_gateway_resource" "plans" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "plans"
}

// plans GET
resource "aws_api_gateway_method" "plans_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.plans.id
  http_method   = "GET"
  authorization = "NONE"
}

# GET /plansをplans_get Lambdaへ接続
resource "aws_api_gateway_integration" "plans_get_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.plans.id
  http_method = aws_api_gateway_method.plans_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["plans_get"].invoke_arn
}

# /plans OPTIONS
resource "aws_api_gateway_method" "plans_get_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.plans.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /plansをplans_get Lambdaへ接続
resource "aws_api_gateway_integration" "plans_get_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.plans.id
  http_method = aws_api_gateway_method.plans_get_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["plans_get"].invoke_arn
}

# API GatewayのOPTIONSからplans_get Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_plans_get_options" {
  statement_id  = "AllowExecutionFromApiGatewayPlansGetOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["plans_get"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/plans"
}

// plans/{planId}
resource "aws_api_gateway_resource" "plan_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.plans.id
  path_part   = "{planId}"
}

// plans/{planId} GET
resource "aws_api_gateway_method" "plan_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.plan_id.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# GET /plans/{planId}をplans_id_get Lambdaへ接続
resource "aws_api_gateway_integration" "plans_id_get_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.plan_id.id
  http_method = aws_api_gateway_method.plan_id_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["plans_id_get"].invoke_arn
}

# /plans/{planId} OPTIONS
resource "aws_api_gateway_method" "plans_id_get_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.plan_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /plans/{planId}をplans_id_get Lambdaへ接続
resource "aws_api_gateway_integration" "plans_id_get_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.plan_id.id
  http_method = aws_api_gateway_method.plans_id_get_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["plans_id_get"].invoke_arn
}

# API GatewayのOPTIONSからplans_id_get Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_plans_id_get" {
  statement_id  = "AllowExecutionFromApiGatewayPlansIdGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["plans_id_get"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/GET/plans/*"
}

// self
resource "aws_api_gateway_resource" "self" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "self"
}

// self GET
resource "aws_api_gateway_method" "self_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# GET /selfをself_get Lambdaへ接続
resource "aws_api_gateway_integration" "self_get_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self.id
  http_method = aws_api_gateway_method.self_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_get"].invoke_arn
}

# /self OPTIONS
resource "aws_api_gateway_method" "self_get_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /selfをself_get Lambdaへ接続
resource "aws_api_gateway_integration" "self_get_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self.id
  http_method = aws_api_gateway_method.self_get_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_get"].invoke_arn
}

# API GatewayのOPTIONSからself_get Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_get_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfGetOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_get"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self"
}

// self PUT
resource "aws_api_gateway_method" "self_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# PUT /selfをself_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_put_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self.id
  http_method = aws_api_gateway_method.self_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_put"].invoke_arn
}

# API Gatewayからself_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_put" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPut"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/POST/self"
}

# OPTIONS /selfをself_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_put_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id.id
  http_method = aws_api_gateway_method.self_plans_id_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_put"].invoke_arn
}

# API GatewayのOPTIONSからself_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/plans/*"
}

// self/images
resource "aws_api_gateway_resource" "self_images" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "images"
}

// self/images/upload-url
resource "aws_api_gateway_resource" "self_images_upload_url" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self_images.id
  path_part   = "upload-url"
}

resource "aws_api_gateway_method" "self_images_upload_url_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_images_upload_url.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "self_images_upload_url_post_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_images_upload_url.id
  http_method = aws_api_gateway_method.self_images_upload_url_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["image_upload_url_post"].invoke_arn
}

resource "aws_lambda_permission" "allow_apigateway_self_images_upload_url_post" {
  statement_id  = "AllowExecutionFromApiGatewaySelfImagesUploadUrlPost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["image_upload_url_post"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/POST/self/images/upload-url"
}

resource "aws_api_gateway_method" "self_images_upload_url_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_images_upload_url.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "self_images_upload_url_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_images_upload_url.id
  http_method = aws_api_gateway_method.self_images_upload_url_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["image_upload_url_post"].invoke_arn
}

resource "aws_lambda_permission" "allow_apigateway_self_images_upload_url_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfImagesUploadUrlOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["image_upload_url_post"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/images/upload-url"
}

// self/plans
resource "aws_api_gateway_resource" "self_plans" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "plans"
}

// self/plans POST
resource "aws_api_gateway_method" "self_plans_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# POST /self/plansをself_plans_post Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_post_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans.id
  http_method = aws_api_gateway_method.self_plans_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_post"].invoke_arn
}

# API Gatewayからself_plans_post Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_post" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansPost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_post"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/POST/self/plans"
}

# self/plans OPTIONS
resource "aws_api_gateway_method" "self_plans_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /self/plansをself_plans_post Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans.id
  http_method = aws_api_gateway_method.self_plans_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_post"].invoke_arn
}

# API GatewayのOPTIONSからself_plans_post Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_post"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/plans"
}

// self/plans/ GET
resource "aws_api_gateway_method" "self_plans_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# GET /selfをself_plans_get Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_get_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans.id
  http_method = aws_api_gateway_method.self_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_get"].invoke_arn
}

# API GatewayのOPTIONSからself_plans_get Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_get_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansGetOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_get"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/plans/*"
}

// self/plans/{plansId}
resource "aws_api_gateway_resource" "self_plans_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self_plans.id
  path_part   = "{planId}"
}

// self/plans/{plansId} GET
resource "aws_api_gateway_method" "self_plans_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# GET /self/plans/{plnId}をself_plans_id_get Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_get_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id.id
  http_method = aws_api_gateway_method.self_plans_id_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_get"].invoke_arn
}

# API Gatewayからself_plans_post Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_get" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_get"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/GET/self/plans/*"
}

# self/plans/{planId} OPTIONS
resource "aws_api_gateway_method" "self_plans_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /self/plans/{planId}をself_plans_id_get Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_get_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id.id
  http_method = aws_api_gateway_method.self_plans_id_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_get"].invoke_arn
}

# API GatewayのOPTIONSからself_plans_id_get Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_get"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/plans/*"
}

// self/plans/{plansId} PUT
resource "aws_api_gateway_method" "self_plans_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# PUT /self/plans/{plnId}をself_plans_id_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_put_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id.id
  http_method = aws_api_gateway_method.self_plans_id_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_put"].invoke_arn
}

# API Gatewayからself_plans_id_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_put" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdPut"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/GET/self/plans/*"
}

# OPTIONS /self/plans/{planId}をself_plans_id_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_put_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id.id
  http_method = aws_api_gateway_method.self_plans_id_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_put"].invoke_arn
}

// self/plans/{plansId} DELETE
resource "aws_api_gateway_method" "self_plans_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

// self/plans/{plansId}/timelines
resource "aws_api_gateway_resource" "self_plans_id_timelines" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self_plans_id.id
  path_part   = "timeline"
}

// self/plans/{plansId}/timelines PUT
resource "aws_api_gateway_method" "self_plans_id_timelines_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_timelines.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# PUT /self/plans/{planId}/timelineをself_plans_id_timelines_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_timelines_put_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id_timelines.id
  http_method = aws_api_gateway_method.self_plans_id_timelines_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_timelines_put"].invoke_arn
}

# API Gatewayからself_plans_id_timelines_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_timelines_put" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdTimelinesPut"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_timelines_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/PUT/self/plans/*/timeline"
}

# /self/plans/{planId}/timeline OPTIONS
resource "aws_api_gateway_method" "self_plans_id_timelines_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_timelines.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /self/plans/{planId}/timelineをself_plans_id_timelines_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_timelines_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id_timelines.id
  http_method = aws_api_gateway_method.self_plans_id_timelines_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_timelines_put"].invoke_arn
}

# API GatewayのOPTIONSからself_plans_id_timelines_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_timelines_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdTimelinesOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_timelines_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/plans/*/timeline"
}

// self/plans/{plansId}/hotels
resource "aws_api_gateway_resource" "self_plans_id_hotels" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self_plans_id.id
  path_part   = "hotels"
}

// self/plans/{plansId}/hotels PUT
resource "aws_api_gateway_method" "self_plans_id_hotels_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_hotels.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# PUT /self/plans/{planId}/hotelsをself_plans_id_hotels_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_hotels_put_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id_hotels.id
  http_method = aws_api_gateway_method.self_plans_id_hotels_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_hotels_put"].invoke_arn
}

# API Gatewayからself_plans_id_hotels_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_hotels_put" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdHotelsPut"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_hotels_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/PUT/self/plans/*/hotels"
}

# /self/plans/{planId}/hotels OPTIONS
resource "aws_api_gateway_method" "self_plans_id_hotels_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_hotels.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /self/plans/{planId}/hotelsをself_plans_id_hotels_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_hotels_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id_hotels.id
  http_method = aws_api_gateway_method.self_plans_id_hotels_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_hotels_put"].invoke_arn
}

# API GatewayのOPTIONSからself_plans_id_hotels_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_hotels_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdHotelsOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_hotels_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/plans/*/hotels"
}

// self/plans/{plansId}/restaurants
resource "aws_api_gateway_resource" "self_plans_id_restaurants" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self_plans_id.id
  path_part   = "restaurants"
}

// self/plans/{plansId}/restaurants PUT
resource "aws_api_gateway_method" "self_plans_id_restaurants_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_restaurants.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# PUT /self/plans/{planId}/restaurantsをself_plans_id_restaurants_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_restaurants_put_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id_restaurants.id
  http_method = aws_api_gateway_method.self_plans_id_restaurants_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_restaurants_put"].invoke_arn
}

# API Gatewayからself_plans_id_restaurants_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_restaurants_put" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdRestaurantsPut"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_restaurants_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/PUT/self/plans/*/restaurants"
}

# /self/plans/{planId}/restaurants OPTIONS
resource "aws_api_gateway_method" "self_plans_id_restaurants_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_restaurants.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /self/plans/{planId}/restaurantsをself_plans_id_restaurants_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_restaurants_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id_restaurants.id
  http_method = aws_api_gateway_method.self_plans_id_restaurants_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_restaurants_put"].invoke_arn
}

# API GatewayのOPTIONSからself_plans_id_restaurants_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_restaurants_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdRestaurantsOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_restaurants_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/plans/*/restaurants"
}

// self/plans/{plansId}/touring-spots
resource "aws_api_gateway_resource" "self_plans_id_touring_spots" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self_plans_id.id
  path_part   = "touring-spots"
}

// self/plans/{plansId}/touring-spots PUT
resource "aws_api_gateway_method" "self_plans_id_touring_spots_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_touring_spots.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# PUT /self/plans/{planId}/touring-spotsをself_plans_id_touring_spots_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_touring_spots_put_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id_touring_spots.id
  http_method = aws_api_gateway_method.self_plans_id_touring_spots_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_touring_spots_put"].invoke_arn
}

# API Gatewayからself_plans_id_touring_spots_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_touring_spots_put" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdTouringSpotsPut"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_touring_spots_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/PUT/self/plans/*/touring-spots"
}

# /self/plans/{planId}/touring-spots OPTIONS
resource "aws_api_gateway_method" "self_plans_id_touring_spots_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_touring_spots.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /self/plans/{planId}/touring-spotsをself_plans_id_touring_spots_put Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_touring_spots_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id_touring_spots.id
  http_method = aws_api_gateway_method.self_plans_id_touring_spots_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_touring_spots_put"].invoke_arn
}

# API GatewayのOPTIONSからself_plans_id_touring_spots_put Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_touring_spots_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdTouringSpotsOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_touring_spots_put"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/plans/*/touring-spots"
}

// self/plans/{plansId}/items
resource "aws_api_gateway_resource" "self_plans_id_items" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self_plans_id.id
  path_part   = "items"
}
// self/plans/{plansId}/items PUT
resource "aws_api_gateway_method" "self_plans_id_items_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_items.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

// self/plans/{plansId}/favorites
resource "aws_api_gateway_resource" "self_plans_id_favorites" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self_plans_id.id
  path_part   = "favorites"
}

// self/plans/{planId}/favorites POST
resource "aws_api_gateway_method" "self_plans_id_favorites_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_favorites.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# POST /self/plans/{planId}/favoritesをself_plans_id_favorites_post Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_favorites_post_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id_favorites.id
  http_method = aws_api_gateway_method.self_plans_id_favorites_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_favorites_post"].invoke_arn
}

# API Gatewayからself_plans_id_favorites_post Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_id_favorites_post" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdFavoritesPost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_favorites_post"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/POST/self/plans/*/favorites"
}

# /self/plans/{planId}/favorites OPTIONS
resource "aws_api_gateway_method" "self_plans_id_favorites_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_favorites.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /self/plans/{planId}/favorites をLambdaへ接続
resource "aws_api_gateway_integration" "self_plans_id_favorites_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_id_favorites.id
  http_method = aws_api_gateway_method.self_plans_id_favorites_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_id_favorites_post"].invoke_arn
}

# API GatewayのOPTIONSからself_plans_id_favorites_post Lambdaを実行する権限
resource "aws_lambda_permission" "allow_api_gateway_self_plans_id_favorites_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansIdFavoritesOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_id_favorites_post"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/plans/*/favorites"
}

// self/plans/{plansId}/favorites DELETE
resource "aws_api_gateway_method" "self_plans_id_favorites_delete" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_favorites.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

// self/plans/favorites
resource "aws_api_gateway_resource" "self_plans_favorites" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self_plans.id
  path_part   = "favorites"
}

// self/plans/favorites GET
resource "aws_api_gateway_method" "self_plans_favorites_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_favorites.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# GET /self/plans/favoritesをself_plans_favorites_get Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_favorites_get_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_favorites.id
  http_method = aws_api_gateway_method.self_plans_favorites_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_favorites_get"].invoke_arn
}

# /self/plans/favorites OPTIONS
resource "aws_api_gateway_method" "self_plans_favorites_get_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_favorites.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /self/plans/favoritesをself_plans_favorites_get Lambdaへ接続
resource "aws_api_gateway_integration" "self_plans_favorites_get_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_plans_favorites.id
  http_method = aws_api_gateway_method.self_plans_favorites_get_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_plans_favorites_get"].invoke_arn
}

# API GatewayのOPTIONSからself_plans_favorites_get Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_plans_favorites_get_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfPlansFavoritesGetOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_plans_favorites_get"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/plans/*"
}

// self/memories
resource "aws_api_gateway_resource" "self_memories" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "memories"
}

// self/memories GET
resource "aws_api_gateway_method" "self_memories_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_memories.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# GET /self/memoriesをself_memories_get Lambdaへ接続
resource "aws_api_gateway_integration" "self_memories_get_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_memories.id
  http_method = aws_api_gateway_method.self_memories_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_memories_get"].invoke_arn
}

# /self/memories OPTIONS
resource "aws_api_gateway_method" "self_memories_get_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_memories.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS /self/memoriesをself_memories_get Lambdaへ接続
resource "aws_api_gateway_integration" "self_memories_get_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_memories.id
  http_method = aws_api_gateway_method.self_memories_get_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_memories_get"].invoke_arn
}

# API GatewayのOPTIONSからself_memories_get Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_memories_get_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfMemoriesGetOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_memories_get"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/*"
}

// self/memories/{planId}
resource "aws_api_gateway_resource" "self_memories_plan_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self_memories.id
  path_part   = "{planId}"
}

// self/memories/{planId} POST
resource "aws_api_gateway_method" "self_memories_plan_id_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_memories_plan_id.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# POST /self/memories/{planId}をself_memories_plan_id_post Lambdaへ接続
resource "aws_api_gateway_integration" "self_memories_plan_id_post_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_memories_plan_id.id
  http_method = aws_api_gateway_method.self_memories_plan_id_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_memories_plan_id_post"].invoke_arn
}

# API Gatewayからself_memories_plan_id_post Lambdaを実行する権限
resource "aws_lambda_permission" "allow_apigateway_self_memories_plan_id_post" {
  statement_id  = "AllowExecutionFromApiGatewaySelfMemoriesPlanIdPost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_memories_plan_id_post"].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/POST/self/memories/*"
}

# self/memories/{planId} OPTIONS
resource "aws_api_gateway_method" "self_memories_plan_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_memories_plan_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# OPTIONS self/memories/{planId}をself_memories_plan_id_post Lambdaへ接続
resource "aws_api_gateway_integration" "self_memories_plan_id_options_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.self_memories_plan_id.id
  http_method = aws_api_gateway_method.self_memories_plan_id_options.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["self_memories_plan_id_post"].invoke_arn
}

# API GatewayのOPTIONSからself_memories_plan_id_post Lambdaを実行する権限
resource "aws_lambda_permission" "allow_api_gateway_self_memories_plan_id_options" {
  statement_id  = "AllowExecutionFromApiGatewaySelfMemoriesPlanIdOptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["self_memories_plan_id_post"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/OPTIONS/self/memories/*"
}

// self/memories/{planId} DELETE
resource "aws_api_gateway_method" "self_memories_plan_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_memories_plan_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# Lambdaが未実装のAPIメソッドを一時的にMOCK Integrationへ接続
locals {
  unimplemented_api_methods = {
    self_plans_id_delete = {
      resource_id = aws_api_gateway_resource.self_plans_id.id
      http_method = aws_api_gateway_method.self_plans_id_delete.http_method
    }
    self_plans_id_items_put = {
      resource_id = aws_api_gateway_resource.self_plans_id_items.id
      http_method = aws_api_gateway_method.self_plans_id_items_put.http_method
    }
    self_plans_id_favorites_delete = {
      resource_id = aws_api_gateway_resource.self_plans_id_favorites.id
      http_method = aws_api_gateway_method.self_plans_id_favorites_delete.http_method
    }
    self_memories_plan_id_delete = {
      resource_id = aws_api_gateway_resource.self_memories_plan_id.id
      http_method = aws_api_gateway_method.self_memories_plan_id_delete.http_method
    }
  }
}

resource "aws_api_gateway_integration" "unimplemented_mock" {
  for_each = local.unimplemented_api_methods

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value.resource_id
  http_method = each.value.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 501 })
  }
}

resource "aws_api_gateway_method_response" "unimplemented_mock" {
  for_each = local.unimplemented_api_methods

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value.resource_id
  http_method = each.value.http_method
  status_code = "501"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Content-Type" = true
  }
}

resource "aws_api_gateway_integration_response" "unimplemented_mock" {
  for_each = local.unimplemented_api_methods

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value.resource_id
  http_method = aws_api_gateway_integration.unimplemented_mock[each.key].http_method
  status_code = aws_api_gateway_method_response.unimplemented_mock[each.key].status_code

  response_templates = {
    "application/json" = jsonencode({ message = "未実装のAPIです" })
  }

  response_parameters = {
    "method.response.header.Content-Type" = "'application/json'"
  }
}

// Terraformで 作成したAPI Gateway（REST API）の設定を「デプロイする」ためのリソース
resource "aws_api_gateway_deployment" "current" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode({
      lambda_integrations = [
        aws_api_gateway_method.signup_post.id,
        aws_api_gateway_integration.signup_post_lambda.id,
        aws_api_gateway_method.signup_options.id,
        aws_api_gateway_integration.signup_options_lambda.id,
        aws_api_gateway_method.self_plans_post.id,
        aws_api_gateway_integration.self_plans_post_lambda.id,
        aws_api_gateway_method.self_plans_options.id,
        aws_api_gateway_integration.self_plans_options_lambda.id,
        aws_api_gateway_method.self_images_upload_url_post.id,
        aws_api_gateway_integration.self_images_upload_url_post_lambda.id,
        aws_api_gateway_method.self_images_upload_url_options.id,
        aws_api_gateway_integration.self_images_upload_url_options_lambda.id,
        aws_api_gateway_method.self_memories_plan_id_post.id,
        aws_api_gateway_integration.self_memories_plan_id_post_lambda.id,
        aws_api_gateway_method.self_memories_plan_id_options.id,
        aws_api_gateway_integration.self_memories_plan_id_options_lambda.id,
        aws_api_gateway_method.self_plans_id_favorites_post.id,
        aws_api_gateway_integration.self_plans_id_favorites_post_lambda.id,
        aws_api_gateway_method.self_plans_id_favorites_options.id,
        aws_api_gateway_integration.self_plans_id_favorites_options_lambda.id,
        aws_api_gateway_integration.plans_get_lambda.id,
        aws_api_gateway_integration.plans_get_options_lambda.id,
        aws_api_gateway_integration.plans_id_get_lambda.id,
        aws_api_gateway_integration.plans_id_get_options_lambda.id,
        aws_api_gateway_integration.self_get_lambda.id,
        aws_api_gateway_integration.self_get_options_lambda.id,
        aws_api_gateway_integration.self_plans_get_lambda.id,
        aws_api_gateway_integration.self_plans_id_get_lambda.id,
        aws_api_gateway_integration.self_plans_id_get_options_lambda.id,
        aws_api_gateway_integration.self_memories_get_lambda.id,
        aws_api_gateway_integration.self_memories_get_options_lambda.id,
        aws_api_gateway_integration.self_plans_favorites_get_lambda.id,
        aws_api_gateway_integration.self_plans_favorites_get_options_lambda.id,
        aws_api_gateway_integration.self_put_lambda.id,
        aws_api_gateway_integration.self_put_options_lambda.id,
        aws_api_gateway_integration.self_plans_id_put_lambda.id,
        aws_api_gateway_integration.self_plans_id_put_options_lambda.id,
        aws_api_gateway_method.self_plans_id_timelines_put.id,
        aws_api_gateway_integration.self_plans_id_timelines_put_lambda.id,
        aws_api_gateway_method.self_plans_id_timelines_options.id,
        aws_api_gateway_integration.self_plans_id_timelines_options_lambda.id,
        aws_api_gateway_method.self_plans_id_hotels_put.id,
        aws_api_gateway_integration.self_plans_id_hotels_put_lambda.id,
        aws_api_gateway_method.self_plans_id_hotels_options.id,
        aws_api_gateway_integration.self_plans_id_hotels_options_lambda.id,
        aws_api_gateway_method.self_plans_id_restaurants_put.id,
        aws_api_gateway_integration.self_plans_id_restaurants_put_lambda.id,
        aws_api_gateway_method.self_plans_id_restaurants_options.id,
        aws_api_gateway_integration.self_plans_id_restaurants_options_lambda.id,
        aws_api_gateway_method.self_plans_id_touring_spots_put.id,
        aws_api_gateway_integration.self_plans_id_touring_spots_put_lambda.id,
        aws_api_gateway_method.self_plans_id_touring_spots_options.id,
        aws_api_gateway_integration.self_plans_id_touring_spots_options_lambda.id,
      ]
      mock_integrations = [
        for key in sort(keys(local.unimplemented_api_methods)) :
        aws_api_gateway_integration.unimplemented_mock[key].id
      ]
      mock_method_responses = [
        for key in sort(keys(local.unimplemented_api_methods)) :
        aws_api_gateway_method_response.unimplemented_mock[key].id
      ]
      mock_integration_responses = [
        for key in sort(keys(local.unimplemented_api_methods)) :
        aws_api_gateway_integration_response.unimplemented_mock[key].id
      ]
    }))
  }

  depends_on = [
    aws_api_gateway_integration.signup_post_lambda,
    aws_api_gateway_integration.signup_options_lambda,
    aws_api_gateway_integration.self_plans_post_lambda,
    aws_api_gateway_integration.self_plans_options_lambda,
    aws_api_gateway_integration.self_images_upload_url_post_lambda,
    aws_api_gateway_integration.self_images_upload_url_options_lambda,
    aws_api_gateway_integration.self_memories_plan_id_post_lambda,
    aws_api_gateway_integration.self_memories_plan_id_options_lambda,
    aws_api_gateway_integration.self_plans_id_favorites_post_lambda,
    aws_api_gateway_integration.self_plans_id_favorites_options_lambda,
    aws_api_gateway_integration.plans_get_lambda,
    aws_api_gateway_integration.plans_get_options_lambda,
    aws_api_gateway_integration.plans_id_get_lambda,
    aws_api_gateway_integration.plans_id_get_options_lambda,
    aws_api_gateway_integration.self_get_lambda,
    aws_api_gateway_integration.self_get_options_lambda,
    aws_api_gateway_integration.self_plans_get_lambda,
    aws_api_gateway_integration.self_plans_id_get_lambda,
    aws_api_gateway_integration.self_plans_id_get_options_lambda,
    aws_api_gateway_integration.self_memories_get_lambda,
    aws_api_gateway_integration.self_memories_get_options_lambda,
    aws_api_gateway_integration.self_plans_favorites_get_lambda,
    aws_api_gateway_integration.self_plans_favorites_get_options_lambda,
    aws_api_gateway_integration.self_put_lambda,
    aws_api_gateway_integration.self_put_options_lambda,
    aws_api_gateway_integration.self_plans_id_put_lambda,
    aws_api_gateway_integration.self_plans_id_put_options_lambda,
    aws_api_gateway_integration.self_plans_id_timelines_put_lambda,
    aws_api_gateway_integration.self_plans_id_timelines_options_lambda,
    aws_api_gateway_integration.self_plans_id_hotels_put_lambda,
    aws_api_gateway_integration.self_plans_id_hotels_options_lambda,
    aws_api_gateway_integration.self_plans_id_restaurants_put_lambda,
    aws_api_gateway_integration.self_plans_id_restaurants_options_lambda,
    aws_api_gateway_integration.self_plans_id_touring_spots_put_lambda,
    aws_api_gateway_integration.self_plans_id_touring_spots_options_lambda,
    aws_api_gateway_integration_response.unimplemented_mock,
  ]

  lifecycle {
    create_before_destroy = true // 新しいDeploymentを作成してから古いものを削除
  }
}

// dev環境として公開するリソース
resource "aws_api_gateway_stage" "dev" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  deployment_id = aws_api_gateway_deployment.current.id
  stage_name    = "dev"
}
