# Anticapture Indexer AWS Deployment Makefile

# Configuration
PROJECT_NAME := anticapture-indexer
AWS_REGION ?= us-east-1
ENVIRONMENT ?= dev
DAO_ID ?= ENS
NETWORK ?= ethereum

# Colors
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

# Helper functions
define log_info
	@echo -e "$(GREEN)[INFO]$(NC) $(1)"
endef

define log_warn
	@echo -e "$(YELLOW)[WARN]$(NC) $(1)"
endef

define log_error
	@echo -e "$(RED)[ERROR]$(NC) $(1)"
endef

.PHONY: help install check-prereqs configure deploy build-image push-image update-service destroy preview clean

help: ## Show this help message
	@echo "Anticapture Indexer AWS Deployment"
	@echo ""
	@echo "Usage: make [target] [ENVIRONMENT=env] [AWS_REGION=region] [DAO_ID=dao] [NETWORK=network]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make deploy ENVIRONMENT=prod AWS_REGION=us-west-2 DAO_ID=UNI"
	@echo "  make destroy ENVIRONMENT=staging"

check-prereqs: ## Check if all prerequisites are installed
	$(call log_info,Checking prerequisites...)
	@command -v pulumi >/dev/null 2>&1 || { $(call log_error,Pulumi is not installed); exit 1; }
	@command -v aws >/dev/null 2>&1 || { $(call log_error,AWS CLI is not installed); exit 1; }
	@command -v docker >/dev/null 2>&1 || { $(call log_error,Docker is not installed); exit 1; }
	@aws sts get-caller-identity >/dev/null 2>&1 || { $(call log_error,AWS credentials not configured); exit 1; }
	$(call log_info,Prerequisites check passed!)

install: ## Install dependencies
	$(call log_info,Installing dependencies...)
	npm install

configure: check-prereqs ## Configure Pulumi stack
	$(call log_info,Configuring Pulumi for environment: $(ENVIRONMENT))
	@if ! pulumi stack select $(ENVIRONMENT) 2>/dev/null; then \
		$(call log_info,Creating new Pulumi stack: $(ENVIRONMENT)); \
		pulumi stack init $(ENVIRONMENT); \
	fi
	pulumi config set aws:region $(AWS_REGION)
	pulumi config set indexer:environment $(ENVIRONMENT)
	pulumi config set indexer:daoId $(DAO_ID)
	pulumi config set indexer:network $(NETWORK)
	@if [ -z "$(RPC_URL)" ]; then \
		$(call log_warn,RPC_URL not set. Please set it manually:); \
		echo "Run: pulumi config set rpcUrl <your-rpc-url> --secret"; \
	else \
		pulumi config set rpcUrl $(RPC_URL) --secret; \
	fi

preview: configure ## Preview infrastructure changes
	$(call log_info,Previewing changes for $(ENVIRONMENT)...)
	pulumi preview

deploy-infra: configure install ## Deploy infrastructure only
	$(call log_info,Deploying infrastructure for $(ENVIRONMENT)...)
	pulumi up --yes

get-ecr-url: ## Get ECR repository URL
	@pulumi stack output ecrRepositoryUrl 2>/dev/null || echo ""

build-image: ## Build Docker image
	$(call log_info,Building Docker image...)
	docker build -f Dockerfile.indexer -t $(PROJECT_NAME):latest ../../

push-image: build-image ## Build and push Docker image to ECR
	$(call log_info,Pushing Docker image to ECR...)
	@REPOSITORY_URL=$$(make get-ecr-url); \
	if [ -z "$$REPOSITORY_URL" ]; then \
		$(call log_error,ECR repository not found. Deploy infrastructure first.); \
		exit 1; \
	fi; \
	AWS_ACCOUNT_ID=$$(aws sts get-caller-identity --query Account --output text); \
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $$AWS_ACCOUNT_ID.dkr.ecr.$(AWS_REGION).amazonaws.com; \
	docker tag $(PROJECT_NAME):latest $$REPOSITORY_URL:latest; \
	docker push $$REPOSITORY_URL:latest

update-service: ## Update ECS service with new image
	$(call log_info,Updating ECS service...)
	@CLUSTER_ARN=$$(pulumi stack output ecsClusterArn 2>/dev/null); \
	SERVICE_NAME=$$(pulumi stack output ecsServiceName 2>/dev/null); \
	if [ -n "$$CLUSTER_ARN" ] && [ -n "$$SERVICE_NAME" ]; then \
		aws ecs update-service \
			--cluster $$CLUSTER_ARN \
			--service $$SERVICE_NAME \
			--force-new-deployment \
			--region $(AWS_REGION) >/dev/null; \
		$(call log_info,ECS service update initiated.); \
	else \
		$(call log_warn,ECS cluster or service not found.); \
	fi

deploy: deploy-infra push-image update-service ## Full deployment (infrastructure + image)
	$(call log_info,Deployment completed successfully!)
	@echo ""
	@echo "=== Deployment Information ==="
	@echo "Environment: $(ENVIRONMENT)"
	@echo "Region: $(AWS_REGION)"
	@echo "DAO ID: $(DAO_ID)"
	@echo "Network: $(NETWORK)"
	@echo ""
	@echo "=== Infrastructure Outputs ==="
	@pulumi stack output 2>/dev/null || echo "No outputs available"
	@echo ""
	@LOAD_BALANCER_URL=$$(pulumi stack output loadBalancerUrl 2>/dev/null); \
	if [ -n "$$LOAD_BALANCER_URL" ]; then \
		echo "Application URL: $$LOAD_BALANCER_URL"; \
		echo "GraphQL Endpoint: $$LOAD_BALANCER_URL/graphql"; \
	fi

destroy: check-prereqs ## Destroy infrastructure
	$(call log_warn,Destroying infrastructure for $(ENVIRONMENT)...)
	@read -p "Are you sure you want to destroy the infrastructure? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		pulumi destroy --yes; \
		$(call log_info,Infrastructure destroyed.); \
	else \
		$(call log_info,Destruction cancelled.); \
	fi

clean: ## Clean up local Docker images
	$(call log_info,Cleaning up local Docker images...)
	docker rmi $(PROJECT_NAME):latest 2>/dev/null || true
	docker system prune -f

logs: ## Show ECS service logs
	@CLUSTER_ARN=$$(pulumi stack output ecsClusterArn 2>/dev/null); \
	SERVICE_NAME=$$(pulumi stack output ecsServiceName 2>/dev/null); \
	if [ -n "$$CLUSTER_ARN" ] && [ -n "$$SERVICE_NAME" ]; then \
		aws logs tail /ecs/$(PROJECT_NAME)-$(ENVIRONMENT) --follow --region $(AWS_REGION); \
	else \
		$(call log_error,ECS cluster or service not found.); \
	fi

status: ## Show deployment status
	@echo "=== Deployment Status ==="
	@echo "Stack: $$(pulumi stack --show-name 2>/dev/null || echo 'No stack selected')"
	@echo "Environment: $(ENVIRONMENT)"
	@echo "Region: $(AWS_REGION)"
	@echo ""
	@pulumi stack output 2>/dev/null || echo "No stack outputs available"

# Development targets
dev-setup: ## Setup development environment
	$(eval ENVIRONMENT := dev)
	$(eval AWS_REGION := us-east-1)
	make configure

staging-setup: ## Setup staging environment
	$(eval ENVIRONMENT := staging)
	$(eval AWS_REGION := us-east-1)
	make configure

prod-setup: ## Setup production environment
	$(eval ENVIRONMENT := prod)
	$(eval AWS_REGION := us-west-2)
	make configure