import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface SecurityGroupsConfig {
  name: string;
  vpcId: pulumi.Input<string>;
}

export class SecurityGroupsStack {
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsSecurityGroup: aws.ec2.SecurityGroup;
  public readonly cacheSecurityGroup: aws.ec2.SecurityGroup;

  constructor(config: SecurityGroupsConfig, opts?: pulumi.ComponentResourceOptions) {
    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(`${config.name}-alb-sg`, {
      name: `${config.name}-alb-sg`,
      description: "Security group for ALB",
      vpcId: config.vpcId,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow HTTP traffic",
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow HTTPS traffic",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: {
        Name: `${config.name}-alb-sg`,
      },
    }, opts);

    // ECS Security Group
    this.ecsSecurityGroup = new aws.ec2.SecurityGroup(`${config.name}-ecs-sg`, {
      name: `${config.name}-ecs-sg`,
      description: "Security group for ECS tasks",
      vpcId: config.vpcId,
      ingress: [
        {
          fromPort: 42069,
          toPort: 42069,
          protocol: "tcp",
          securityGroups: [this.albSecurityGroup.id],
          description: "Allow traffic from ALB to indexer port",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: {
        Name: `${config.name}-ecs-sg`,
      },
    }, opts);

    // RDS Security Group
    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(`${config.name}-rds-sg`, {
      name: `${config.name}-rds-sg`,
      description: "Security group for RDS database",
      vpcId: config.vpcId,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: "tcp",
          securityGroups: [this.ecsSecurityGroup.id],
          description: "Allow PostgreSQL access from ECS",
        },
      ],
      tags: {
        Name: `${config.name}-rds-sg`,
      },
    }, opts);

    // ElastiCache Security Group
    this.cacheSecurityGroup = new aws.ec2.SecurityGroup(`${config.name}-cache-sg`, {
      name: `${config.name}-cache-sg`,
      description: "Security group for ElastiCache",
      vpcId: config.vpcId,
      ingress: [
        {
          fromPort: 6379,
          toPort: 6379,
          protocol: "tcp",
          securityGroups: [this.ecsSecurityGroup.id],
          description: "Allow Redis access from ECS",
        },
      ],
      tags: {
        Name: `${config.name}-cache-sg`,
      },
    }, opts);
  }
}