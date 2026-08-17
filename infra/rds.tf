# RDSに関係するTerraformリソースを書く
resource "aws_db_subnet_group" "main" {
  name = "${local.project_name}-db-subnet-group"

  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]

  tags = {
    Name = "${local.project_name}-db-subnet-group"
  }
}

# Lambda用Security Group
resource "aws_security_group" "lambda" {
  name        = "${local.project_name}-lambda-sg"
  description = "Security group for Lambda"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${local.project_name}-lambda-sg"
  }
}

# RDS用Security Group
resource "aws_security_group" "rds" {
  name        = "${local.project_name}-rds-sg"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${local.project_name}-rds-sg"
  }
}

# Lambda SG → RDS SG の5432番だけ許可
resource "aws_vpc_security_group_ingress_rule" "rds_from_lambda" {
  security_group_id            = aws_security_group.rds.id
  referenced_security_group_id = aws_security_group.lambda.id

  ip_protocol = "tcp"
  from_port   = 5432
  to_port     = 5432
}

resource "aws_db_instance" "main" {
  identifier = "${local.project_name}-db"

  engine         = "postgres"
  engine_version = "17"

  instance_class        = "db.t4g.micro"
  allocated_storage     = 20
  max_allocated_storage = 20
  storage_type          = "gp3"

  db_name  = "trip_plan"
  username = "postgres"

  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  publicly_accessible = false
  multi_az            = false

  skip_final_snapshot = true

  tags = {
    Name = "${local.project_name}-db"
  }
}
