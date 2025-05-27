import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface EcrConfig {
  name: string;
  imageMutability?: "MUTABLE" | "IMMUTABLE";
  scanOnPush?: boolean;
}

export class EcrStack {
  public readonly repository: aws.ecr.Repository;
  public readonly lifecyclePolicy: aws.ecr.LifecyclePolicy;

  constructor(config: EcrConfig, opts?: pulumi.ComponentResourceOptions) {
    // Create ECR repository
    this.repository = new aws.ecr.Repository(`${config.name}-ecr`, {
      name: `${config.name}`,
      imageTagMutability: config.imageMutability || "MUTABLE",
      imageScanningConfiguration: {
        scanOnPush: config.scanOnPush || true,
      },
      tags: {
        Name: `${config.name}-ecr`,
      },
    }, opts);

    // Create lifecycle policy to manage image retention
    this.lifecyclePolicy = new aws.ecr.LifecyclePolicy(`${config.name}-lifecycle`, {
      repository: this.repository.name,
      policy: JSON.stringify({
        rules: [
          {
            rulePriority: 1,
            description: "Keep last 10 images",
            selection: {
              tagStatus: "tagged",
              tagPrefixList: ["v"],
              countType: "imageCountMoreThan",
              countNumber: 10,
            },
            action: {
              type: "expire",
            },
          },
          {
            rulePriority: 2,
            description: "Delete untagged images older than 1 day",
            selection: {
              tagStatus: "untagged",
              countType: "sinceImagePushed",
              countUnit: "days",
              countNumber: 1,
            },
            action: {
              type: "expire",
            },
          },
        ],
      }),
    }, opts);
  }

  public getRepositoryUrl(): pulumi.Output<string> {
    return this.repository.repositoryUrl;
  }
}