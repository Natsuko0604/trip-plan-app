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

// plans Integration設定
# resource "aws_api_gateway_integration" "plans_get_lambda" {
#   rest_api_id = aws_api_gateway_rest_api.main.id
#   resource_id = aws_api_gateway_resource.plans.id
#   http_method = aws_api_gateway_method.plans_get.http_method
#   integration_http_method = "POST"
#   type                    = "AWS_PROXY"
#   uri                     = aws_lambda_function.hello.invoke_arn
# }

// plans lambdaにapi gatewayの実行権限を追加
# resource "aws_lambda_permission" "allow_apigateway_plans_get" {
#   statement_id  = "AllowExecutionFromApiGatewayPlansGet"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.hello.function_name
#   principal     = "apigateway.amazonaws.com"
#   source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/GET/plans"
# }

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

// self PUT
resource "aws_api_gateway_method" "self_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

// self/plans
resource "aws_api_gateway_resource" "self_plans" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.self.id
  path_part   = "plans"
}

// self/plans POST
resource "aws_api_gateway_method" "self_plans_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

// self/plans/ GET
resource "aws_api_gateway_method" "self_plans_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

// self/plans/{plansId}
resource "aws_api_gateway_resource" "self_plans_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.plans.id
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

// self/plans/{plansId} PUT
resource "aws_api_gateway_method" "self_plans_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
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

// self/plans/{plansId}/favorites POST
resource "aws_api_gateway_method" "self_plans_id_favorites_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_plans_id_favorites.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
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

// self/memories POST
resource "aws_api_gateway_method" "self_memories_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_memories.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

// self/memories DELETE
resource "aws_api_gateway_method" "self_memories_delete" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.self_memories.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

// Terraformで 作成したAPI Gateway（REST API）の設定を「デプロイする」ためのリソース
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  // 本番用Lambda Integration完成後にtriggersとdepends_onを追加


  lifecycle {
    create_before_destroy = true // 新しいDeploymentを作成してから古いものを削除
  }
}

// dev環境として公開するリソース
resource "aws_api_gateway_stage" "dev" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  deployment_id = aws_api_gateway_deployment.main.id
  stage_name    = "dev"
}
