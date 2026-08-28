# AWSアカウントIDを出力
output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

# Terraformが使用しているIAM ARNを出力
output "caller_arn" {
  value = data.aws_caller_identity.current.arn
}

output "api_base_url" {
  value = aws_api_gateway_stage.dev.invoke_url
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.users.id
}

output "cognito_user_pool_client_id" {
  value = aws_cognito_user_pool_client.web.id
}
