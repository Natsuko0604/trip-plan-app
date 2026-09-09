variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "aws_profile" {
  description = "AWS CLI profile"
  type        = string
  default     = "trip-plan-terraform"
}

variable "allowed_origin" {
  description = "CORSで許可するフロントエンドのOrigin"
  type        = string
  default     = "http://localhost:3000"
}
