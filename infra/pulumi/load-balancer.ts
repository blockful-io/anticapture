import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface LoadBalancerConfig {
  name: string;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  targetPort: number;
  healthCheckPath?: string;
}

export class LoadBalancerStack {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly listener: aws.lb.Listener;

  constructor(config: LoadBalancerConfig, opts?: pulumi.ComponentResourceOptions) {
    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(`${config.name}-alb`, {
      name: `${config.name}-alb`,
      loadBalancerType: "application",
      subnets: config.publicSubnetIds,
      securityGroups: [config.securityGroupId],
      enableDeletionProtection: false,
      tags: {
        Name: `${config.name}-alb`,
      },
    }, opts);

    // Create target group
    this.targetGroup = new aws.lb.TargetGroup(`${config.name}-tg`, {
      name: `${config.name}-tg`,
      port: config.targetPort,
      protocol: "HTTP",
      vpcId: config.vpcId,
      targetType: "ip",
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: config.healthCheckPath || "/",
        matcher: "200",
      },
      tags: {
        Name: `${config.name}-tg`,
      },
    }, opts);

    // Create listener
    this.listener = new aws.lb.Listener(`${config.name}-listener`, {
      loadBalancerArn: this.alb.arn,
      port: "80",
      protocol: "HTTP",
      defaultActions: [{
        type: "forward",
        targetGroupArn: this.targetGroup.arn,
      }],
    }, opts);
  }

  public getLoadBalancerDns(): pulumi.Output<string> {
    return this.alb.dnsName;
  }

  public getTargetGroupArn(): pulumi.Output<string> {
    return this.targetGroup.arn;
  }
}