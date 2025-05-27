import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface EcsConfig {
  name: string;
  image: pulumi.Input<string>;
  cpu: number;
  memory: number;
  containerPort: number;
  subnets: pulumi.Input<string>[];
  securityGroups: pulumi.Input<string>[];
  targetGroupArn: pulumi.Input<string>;
  taskRoleArn: pulumi.Input<string>;
  executionRoleArn: pulumi.Input<string>;
  environment?: aws.types.input.ecs.TaskDefinitionContainerDefinitionEnvironment[];
  secrets?: aws.types.input.ecs.TaskDefinitionContainerDefinitionSecret[];
  desiredCount?: number;
}

export class EcsStack {
  public readonly cluster: aws.ecs.Cluster;
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly service: aws.ecs.Service;

  constructor(config: EcsConfig, opts?: pulumi.ComponentResourceOptions) {
    // Create ECS cluster
    this.cluster = new aws.ecs.Cluster(`${config.name}-cluster`, {
      name: `${config.name}-cluster`,
      settings: [{
        name: "containerInsights",
        value: "enabled",
      }],
      tags: {
        Name: `${config.name}-cluster`,
      },
    }, opts);

    // Create task definition
    this.taskDefinition = new aws.ecs.TaskDefinition(`${config.name}-task`, {
      family: `${config.name}-task`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: config.cpu.toString(),
      memory: config.memory.toString(),
      executionRoleArn: config.executionRoleArn,
      taskRoleArn: config.taskRoleArn,
      containerDefinitions: pulumi.jsonStringify([{
        name: `${config.name}-container`,
        image: config.image,
        cpu: config.cpu,
        memory: config.memory,
        essential: true,
        portMappings: [{
          containerPort: config.containerPort,
          protocol: "tcp",
        }],
        environment: config.environment || [],
        secrets: config.secrets || [],
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": `/ecs/${config.name}`,
            "awslogs-region": aws.getRegion().then(r => r.name),
            "awslogs-stream-prefix": "ecs",
          },
        },
      }]),
      tags: {
        Name: `${config.name}-task`,
      },
    }, opts);

    // Create CloudWatch log group
    new aws.cloudwatch.LogGroup(`${config.name}-logs`, {
      name: `/ecs/${config.name}`,
      retentionInDays: 7,
      tags: {
        Name: `${config.name}-logs`,
      },
    }, opts);

    // Create ECS service
    this.service = new aws.ecs.Service(`${config.name}-service`, {
      name: `${config.name}-service`,
      cluster: this.cluster.id,
      taskDefinition: this.taskDefinition.arn,
      launchType: "FARGATE",
      desiredCount: config.desiredCount || 1,
      networkConfiguration: {
        subnets: config.subnets,
        securityGroups: config.securityGroups,
        assignPublicIp: true,
      },
      loadBalancers: [{
        targetGroupArn: config.targetGroupArn,
        containerName: `${config.name}-container`,
        containerPort: config.containerPort,
      }],
      dependsOn: [
        // Ensure target group is created before service
      ],
      tags: {
        Name: `${config.name}-service`,
      },
    }, opts);
  }

  public getClusterArn(): pulumi.Output<string> {
    return this.cluster.arn;
  }

  public getServiceName(): pulumi.Output<string> {
    return this.service.name;
  }
}