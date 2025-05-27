# Anticapture Indexer AWS Infrastructure

This directory contains the AWS infrastructure code for deploying the Anticapture Indexer using Pulumi with TypeScript and ECS Fargate.

## Architecture

- **VPC**: Custom VPC with public and private subnets across 2 AZs
- **ECS Fargate**: Containerized indexer service with auto-scaling
- **RDS PostgreSQL**: Managed database for indexer data
- **ElastiCache Redis**: Managed Redis for caching
- **Application Load Balancer**: Traffic distribution and health checks
- **ECR**: Container registry for Docker images
- **Secrets Manager**: Secure storage for environment variables

## Prerequisites

1. **AWS CLI** - [Installation guide](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
2. **Pulumi CLI** - [Installation guide](https://www.pulumi.com/docs/get-started/install/)
3. **Docker** - [Installation guide](https://docs.docker.com/get-docker/)
4. **Node.js 18+** - [Installation guide](https://nodejs.org/)

## Quick Start

1. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

2. **Install dependencies:**
   ```bash
   make install
   ```

3. **Set up environment:**
   ```bash
   # For development
   make dev-setup
   
   # For staging
   make staging-setup
   
   # For production  
   make prod-setup
   ```

4. **Set RPC URL (required):**
   ```bash
   pulumi config set rpcUrl "https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY" --secret
   ```

5. **Deploy:**
   ```bash
   make deploy
   ```

## Available Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make deploy` | Full deployment (infrastructure + image) |
| `make deploy-infra` | Deploy infrastructure only |
| `make build-image` | Build Docker image locally |
| `make push-image` | Build and push image to ECR |
| `make update-service` | Update ECS service with new image |
| `make preview` | Preview infrastructure changes |
| `make destroy` | Destroy infrastructure |
| `make status` | Show deployment status |
| `make logs` | Show ECS service logs |

## Configuration

Set environment variables or use make parameters:

```bash
make deploy ENVIRONMENT=prod AWS_REGION=us-west-2 DAO_ID=UNI NETWORK=ethereum
```

### Available Parameters

- `ENVIRONMENT`: Deployment environment (dev, staging, prod)
- `AWS_REGION`: AWS region (default: us-east-1)
- `DAO_ID`: DAO to index (ENS, UNI, ARB)
- `NETWORK`: Network to index (ethereum, arbitrum)
- `RPC_URL`: Blockchain RPC endpoint (set via pulumi config)

## Deployment Environments

### Development
```bash
make dev-setup
make deploy
```

### Staging
```bash
make staging-setup
make deploy
```

### Production
```bash
make prod-setup
pulumi config set rpcUrl "YOUR_PRODUCTION_RPC_URL" --secret
make deploy
```

## Infrastructure Costs

Estimated monthly costs for minimal setup:

- **ECS Fargate**: ~$15-30 (0.5 vCPU, 1GB RAM)
- **RDS PostgreSQL**: ~$15-25 (db.t3.micro)
- **ElastiCache Redis**: ~$15-20 (cache.t3.micro)
- **Load Balancer**: ~$20-25
- **NAT Gateway**: ~$45-50
- **Data Transfer**: ~$5-15

**Total**: ~$115-165/month

## Security

- All resources deployed in private subnets where possible
- Security groups with minimal required access
- Secrets stored in AWS Secrets Manager
- Database encryption at rest enabled
- Container images scanned for vulnerabilities

## Monitoring

- CloudWatch logs for ECS tasks
- Container insights enabled
- Health checks configured for load balancer

View logs:
```bash
make logs
```

## Troubleshooting

### Common Issues

1. **AWS credentials not configured**
   ```bash
   aws configure
   ```

2. **Pulumi stack not found**
   ```bash
   make configure
   ```

3. **ECR authentication fails**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
   ```

4. **RPC URL not set**
   ```bash
   pulumi config set rpcUrl "YOUR_RPC_URL" --secret
   ```

### View Current Configuration
```bash
pulumi config
pulumi stack output
```

### Force ECS Deployment
```bash
make update-service
```

## Cleanup

To destroy all infrastructure:
```bash
make destroy
```

## Project Structure

```
infra/indexer-pulumi/
├── Makefile              # Deployment automation
├── package.json          # Node.js dependencies
├── Pulumi.yaml          # Pulumi project configuration
├── tsconfig.json        # TypeScript configuration
├── Dockerfile.indexer   # Production Docker image
├── index.ts             # Main infrastructure code
├── vpc.ts               # VPC and networking
├── database.ts          # RDS PostgreSQL
├── cache.ts             # ElastiCache Redis
├── ecs.ts               # ECS Fargate service
├── load-balancer.ts     # Application Load Balancer
├── security-groups.ts   # Security group definitions
├── iam.ts               # IAM roles and policies
├── secrets.ts           # Secrets Manager
├── ecr.ts               # ECR repository
└── README.md            # This file
```