// UserPool
resource "aws_cognito_user_pool" "users" {
  name                     = "${local.project_name}-users" //AWS上に表示されるUserPool名
  username_attributes      = ["email"]                     // ログインIDをemailに設定
  auto_verified_attributes = ["email"]                     // 入力に成功したら email_verified = true にする
  username_configuration {                                 // ログインIDの大文字小文字を区別しない設定
    case_sensitive = false
  }
  // パスワード設定
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }
}

// WebアプリがCognitoへどんな方法でログインできるかの設定
resource "aws_cognito_user_pool_client" "web" {
  name         = "${local.project_name}-web-client"
  user_pool_id = aws_cognito_user_pool.users.id

  // ブラウザに埋め込んだ値は利用者から確認出来、秘密として安全に保存できないためApp Clientではfalse
  generate_secret = false

  // アプリで許可するログイン方法
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  // 存在しないメールアドレスでログインされた場合に、「そのユーザーは存在しません」と明確に返さない設定
  prevent_user_existence_errors = "ENABLED"
}
