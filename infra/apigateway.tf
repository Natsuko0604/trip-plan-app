resource "aws_api_gateway_rest_api" "main" {
  name = "${local.project_name}-api"
}

// signup 
resource "aws_api_gateway_resource" "signup" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "signup"
}

// signup POST 
resource "aws_api_gateway_method" "signup_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.signup.id
  http_method   = "POST"
  authorization = "NONE"
}

// login
resource "aws_api_gateway_resource" "login" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "login"
}

// login POST
resource "aws_api_gateway_method" "login_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.login.id
  http_method   = "POST"
  authorization = "NONE"
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

// Integration設定
resource "aws_api_gateway_integration" "plans_get_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.plans.id
  http_method = aws_api_gateway_method.plans_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.hello.invoke_arn
}

// lambdaにapi gatewayの実行権限を追加
resource "aws_lambda_permission" "allow_apigateway_plans_get" {
  statement_id  = "AllowExecutionFromApiGatewayPlansGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.hello.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/GET/plans"
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
  authorization = "NONE"
}

// self PUT
resource "aws_api_gateway_method" "self_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self.id
  http_method   = "PUT"
  authorization = "NONE"
}

// self/favorites
resource "aws_api_gateway_resource" "self_favorites" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "favorites"
}

// self/favorites GET
resource "aws_api_gateway_method" "self_favorites_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_favorites.id
  http_method   = "GET"
  authorization = "NONE"
}

// self/favorites POST
resource "aws_api_gateway_method" "self_favorites_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_favorites.id
  http_method   = "POST"
  authorization = "NONE"
}

// self/favorites DELETE
resource "aws_api_gateway_method" "self_favorites_delete" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_favorites.id
  http_method   = "DELETE"
  authorization = "NONE"
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
  authorization = "NONE"
}

// self/memories PUT
resource "aws_api_gateway_method" "self_memories_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_memories.id
  http_method   = "PUT"
  authorization = "NONE"
}

// self/plans
resource "aws_api_gateway_resource" "self_plans" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "plans"
}

// self/plans GET
resource "aws_api_gateway_method" "self_plans_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans.id
  http_method   = "GET"
  authorization = "NONE"
}

// self/plans PUT
resource "aws_api_gateway_method" "self_plans_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans.id
  http_method   = "PUT"
  authorization = "NONE"
}

// self/timeline
resource "aws_api_gateway_resource" "self_timeline" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "timeline"
}

// self/timeline PUT
resource "aws_api_gateway_method" "self_timeline_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_timeline.id
  http_method   = "PUT"
  authorization = "NONE"
}

// self/hotels
resource "aws_api_gateway_resource" "self_hotels" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "hotels"
}

// self/hotels PUT
resource "aws_api_gateway_method" "self_hotels_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_hotels.id
  http_method   = "PUT"
  authorization = "NONE"
}

// self/restaurants
resource "aws_api_gateway_resource" "self_restaurants" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "restaurants"
}

// self/restaurants PUT
resource "aws_api_gateway_method" "self_restaurants_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_restaurants.id
  http_method   = "PUT"
  authorization = "NONE"
}

// self/touring-spots
resource "aws_api_gateway_resource" "self_touring_spots" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "touring-spots"
}

// self/touring-spots PUT
resource "aws_api_gateway_method" "self_touring_spots_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_touring_spots.id
  http_method   = "PUT"
  authorization = "NONE"
}

// self/items
resource "aws_api_gateway_resource" "self_items" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "items"
}

// self/items PUT
resource "aws_api_gateway_method" "self_items_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_items.id
  http_method   = "PUT"
  authorization = "NONE"
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
  authorization = "NONE"
}

// API Gatewayの設定をデプロイして公開する
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_method.plans_get.id,
      aws_api_gateway_integration.plans_get_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.plans_get_lambda,
  ]
}

resource "aws_api_gateway_stage" "dev" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  deployment_id = aws_api_gateway_deployment.main.id
  stage_name    = "dev"
}
