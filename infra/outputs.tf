# AWSアカウントIDを出力
output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

# Terraformが使用しているIAM ARNを出力
output "caller_arn" {
  value = data.aws_caller_identity.current.arn
}
