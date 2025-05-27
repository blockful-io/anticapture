import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface DatabaseConfig {
  name: string;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: pulumi.Output<string>;
  vpcSecurityGroupIds: pulumi.Input<string>[];
  subnetGroupName: string;
  backupRetentionPeriod?: number;
  multiAz?: boolean;
  storageEncrypted?: boolean;
}

export class DatabaseStack {
  public readonly instance: aws.rds.Instance;
  public readonly subnetGroup: aws.rds.SubnetGroup;

  constructor(
    config: DatabaseConfig,
    subnetIds: pulumi.Input<string>[],
    opts?: pulumi.ComponentResourceOptions
  ) {
    // Create DB subnet group
    this.subnetGroup = new aws.rds.SubnetGroup(`${config.name}-subnet-group`, {
      name: config.subnetGroupName,
      subnetIds: subnetIds,
      tags: {
        Name: `${config.name}-subnet-group`,
      },
    }, opts);

    // Create RDS instance
    this.instance = new aws.rds.Instance(`${config.name}-db`, {
      identifier: `${config.name}-db`,
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      dbName: config.dbName,
      username: config.username,
      password: config.password,
      vpcSecurityGroupIds: config.vpcSecurityGroupIds,
      dbSubnetGroupName: this.subnetGroup.name,
      backupRetentionPeriod: config.backupRetentionPeriod || 7,
      multiAz: config.multiAz || false,
      storageEncrypted: config.storageEncrypted || true,
      skipFinalSnapshot: true,
      deletionProtection: false,
      tags: {
        Name: `${config.name}-db`,
      },
    }, opts);
  }

  public getConnectionString(): pulumi.Output<string> {
    return pulumi.interpolate`postgres://${this.instance.username}:${this.instance.password}@${this.instance.endpoint}/${this.instance.dbName}`;
  }
}