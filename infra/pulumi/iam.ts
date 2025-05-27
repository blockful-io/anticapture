import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface IamConfig {
  name: string;
  secretsArn?: pulumi.Input<string>;
}

export class IamStack {
  public readonly taskRole: aws.iam.Role;
  public readonly executionRole: aws.iam.Role;
  public readonly taskRolePolicy: aws.iam.RolePolicy;
  public readonly executionRolePolicy: aws.iam.RolePolicyAttachment;

  constructor(config: IamConfig, opts?: pulumi.ComponentResourceOptions) {
    // Create task role
    this.taskRole = new aws.iam.Role(`${config.name}-task-role`, {
      name: `${config.name}-task-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com",
          },
        }],
      }),
      tags: {
        Name: `${config.name}-task-role`,
      },
    }, opts);

    // Create execution role
    this.executionRole = new aws.iam.Role(`${config.name}-execution-role`, {
      name: `${config.name}-execution-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com",
          },
        }],
      }),
      tags: {
        Name: `${config.name}-execution-role`,
      },
    }, opts);

    // Attach execution role policy
    this.executionRolePolicy = new aws.iam.RolePolicyAttachment(`${config.name}-execution-policy`, {
      role: this.executionRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    }, opts);

    // Create task role policy for accessing secrets
    if (config.secretsArn) {
      this.taskRolePolicy = new aws.iam.RolePolicy(`${config.name}-task-policy`, {
        role: this.taskRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "secretsmanager:GetSecretValue"
              ],
              "Resource": "${config.secretsArn}"
            }
          ]
        }`,
      }, opts);
    }
  }

  public getTaskRoleArn(): pulumi.Output<string> {
    return this.taskRole.arn;
  }

  public getExecutionRoleArn(): pulumi.Output<string> {
    return this.executionRole.arn;
  }
}