import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface CacheConfig {
  name: string;
  nodeType: string;
  numCacheNodes: number;
  parameterGroupName?: string;
  port?: number;
  subnetGroupName: string;
  securityGroupIds: pulumi.Input<string>[];
}

export class CacheStack {
  public readonly cluster: aws.elasticache.Cluster;
  public readonly subnetGroup: aws.elasticache.SubnetGroup;

  constructor(
    config: CacheConfig,
    subnetIds: pulumi.Input<string>[],
    opts?: pulumi.ComponentResourceOptions
  ) {
    // Create ElastiCache subnet group
    this.subnetGroup = new aws.elasticache.SubnetGroup(`${config.name}-cache-subnet-group`, {
      name: config.subnetGroupName,
      subnetIds: subnetIds,
      description: `Subnet group for ${config.name} ElastiCache cluster`,
    }, opts);

    // Create ElastiCache cluster
    this.cluster = new aws.elasticache.Cluster(`${config.name}-cache`, {
      clusterId: `${config.name}-cache`,
      engine: "redis",
      nodeType: config.nodeType,
      numCacheNodes: config.numCacheNodes,
      parameterGroupName: config.parameterGroupName || "default.redis7",
      port: config.port || 6379,
      subnetGroupName: this.subnetGroup.name,
      securityGroupIds: config.securityGroupIds,
      tags: {
        Name: `${config.name}-cache`,
      },
    }, opts);
  }

  public getRedisUrl(): pulumi.Output<string> {
    return pulumi.interpolate`redis://${this.cluster.cacheNodes[0].address}:${this.cluster.port}`;
  }
}