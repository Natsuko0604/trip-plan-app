# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${local.project_name}-vpc"
  }
}

# Public Subnet 1
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-northeast-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.project_name}-public-subnet-1"
  }
}

# Public Subnet 2
resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "ap-northeast-1c"
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.project_name}-public-subnet-2"
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "ap-northeast-1a"

  tags = {
    Name = "${local.project_name}-private-subnet-1"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "ap-northeast-1c"

  tags = {
    Name = "${local.project_name}-private-subnet-2"
  }
}

# CognitoとSecrets ManagerのInterface Endpoint用Security Group
resource "aws_security_group" "vpc_endpoints" {
  name        = "${local.project_name}-vpc-endpoints-sg"
  description = "Security group for Cognito and Secrets Manager VPC endpoints"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${local.project_name}-vpc-endpoints-sg"
  }
}

# LambdaからInterface EndpointへのHTTPS通信を許可
resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints_https_from_lambda" {
  security_group_id            = aws_security_group.vpc_endpoints.id
  referenced_security_group_id = aws_security_group.lambda.id

  ip_protocol = "tcp"
  from_port   = 443
  to_port     = 443
}

# LambdaからInterface EndpointへのHTTPS送信を許可
resource "aws_vpc_security_group_egress_rule" "lambda_to_vpc_endpoints_https" {
  security_group_id            = aws_security_group.lambda.id
  referenced_security_group_id = aws_security_group.vpc_endpoints.id

  ip_protocol = "tcp"
  from_port   = 443
  to_port     = 443
}

# LambdaからCognito User Pools APIへプライベート接続
resource "aws_vpc_endpoint" "cognito_idp" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.cognito-idp"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id,
  ]

  security_group_ids = [
    aws_security_group.vpc_endpoints.id,
  ]

  tags = {
    Name = "${local.project_name}-cognito-idp-endpoint"
  }
}

# LambdaからSecrets Manager APIへプライベート接続
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id,
  ]

  security_group_ids = [
    aws_security_group.vpc_endpoints.id,
  ]

  tags = {
    Name = "${local.project_name}-secretsmanager-endpoint"
  }
}
