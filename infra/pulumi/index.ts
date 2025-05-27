import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { VpcStack } from "./vpc";
import { SecurityGroupsStack } from "./security-groups";
import { DatabaseStack } from "./database";
import { CacheStack } from "./cache";
import { SecretsStack } from "./secrets";
import { EcrStack } from "./ecr";
import { IamStack } from "./iam";
import { LoadBalancerStack } from "./load-balancer";
import { EcsStack } from "./ecs";

// Get configuration
const config = new pulumi.Config();
const awsConfig = new pulumi.Config("aws");

const environment = config.get("environment") || "dev";
const daoId = config.get("daoId") || "ENS";
const network = config.get("network") || "ethereum";
const region = awsConfig.require("region");

const projectName = `anticapture-${environment}`;

// Get availability zones
const azs = aws.getAvailabilityZones({
  state: "available",
}).then(azs => azs.names.slice(0, 2));

// Create VPC
const vpc = new VpcStack({
  name: projectName,
  cidrBlock: "10.0.0.0/16",
  availabilityZones: azs.then(zones => zones),
});

// Create security groups
const securityGroups = new SecurityGroupsStack({
  name: projectName,
  vpcId: vpc.vpc.id,
});

// Generate a random password for the database
const dbPassword = new aws.secretsmanager.SecretVersion(`${projectName}-db-password`, {
  secretId: new aws.secretsmanager.Secret(`${projectName}-db-password-secret`, {
    generateSecretString: {
      length: 32,
      excludeCharacters: '"@/\\',
    },
  }).id,
  secretString: "",
});

// Create database
const database = new DatabaseStack({
  name: projectName,
  engine: "postgres",
  engineVersion: "16.2",
  instanceClass: "db.t3.micro",
  allocatedStorage: 20,
  dbName: "ens",
  username: "anticapture",
  password: dbPassword.secretString,
  vpcSecurityGroupIds: [securityGroups.rdsSecurityGroup.id],
  subnetGroupName: `${projectName}-db-subnet-group`,
  backupRetentionPeriod: 7,
  multiAz: false,
  storageEncrypted: true,
}, vpc.privateSubnets.map(subnet => subnet.id));

// Create cache
const cache = new CacheStack({
  name: projectName,
  nodeType: "cache.t3.micro",
  numCacheNodes: 1,
  subnetGroupName: `${projectName}-cache-subnet-group`,
  securityGroupIds: [securityGroups.cacheSecurityGroup.id],
}, vpc.privateSubnets.map(subnet => subnet.id));

// Create ECR repository
const ecr = new EcrStack({
  name: projectName,
  imageMutability: "MUTABLE",
  scanOnPush: true,
});

// Create secrets
const secrets = new SecretsStack({
  name: projectName,
  secrets: {
    DATABASE_URL: database.getConnectionString(),
    REDIS_URL: cache.getRedisUrl(),
    indexer: {
      ENS: {
        DAO_ID: daoId,
        NETWORK: network,
        RPC_URL: config.require("rpcUrl"),
      }
    }
  },
});

// Create IAM roles
const iam = new IamStack({
  name: projectName,
  secretsArn: secrets.getSecretArn(),
});

// Create load balancer
const loadBalancer = new LoadBalancerStack({
  name: projectName,
  vpcId: vpc.vpc.id,
  publicSubnetIds: vpc.publicSubnets.map(subnet => subnet.id),
  securityGroupId: securityGroups.albSecurityGroup.id,
  targetPort: 42069,
  healthCheckPath: "/graphql",
});

// Create ECS service
const ecs = new EcsStack({
  name: projectName,
  image: pulumi.interpolate`${ecr.getRepositoryUrl()}:latest`,
  cpu: 512,
  memory: 1024,
  containerPort: 42069,
  subnets: vpc.publicSubnets.map(subnet => subnet.id), // Using public subnets for simplicity
  securityGroups: [securityGroups.ecsSecurityGroup.id],
  targetGroupArn: loadBalancer.getTargetGroupArn(),
  taskRoleArn: iam.getTaskRoleArn(),
  executionRoleArn: iam.getExecutionRoleArn(),
  secrets: [
    {
      name: "DATABASE_URL",
      valueFrom: pulumi.interpolate`${secrets.getSecretArn()}:DATABASE_URL::`,
    },
    {
      name: "REDIS_URL",
      valueFrom: pulumi.interpolate`${secrets.getSecretArn()}:REDIS_URL::`,
    },
    {
      name: "DAO_ID",
      valueFrom: pulumi.interpolate`${secrets.getSecretArn()}:DAO_ID::`,
    },
    {
      name: "NETWORK",
      valueFrom: pulumi.interpolate`${secrets.getSecretArn()}:NETWORK::`,
    },
    {
      name: "RPC_URL",
      valueFrom: pulumi.interpolate`${secrets.getSecretArn()}:RPC_URL::`,
    },
    {
      name: "PONDER_RPC_URL_1",
      valueFrom: pulumi.interpolate`${secrets.getSecretArn()}:PONDER_RPC_URL_1::`,
    },
    {
      name: "PONDER_RPC_URL_2",
      valueFrom: pulumi.interpolate`${secrets.getSecretArn()}:PONDER_RPC_URL_2::`,
    },
  ],
  desiredCount: 1,
});

// Export outputs
export const vpcId = vpc.vpc.id;
export const vpcCidr = vpc.vpc.cidrBlock;
export const publicSubnetIds = vpc.publicSubnets.map(subnet => subnet.id);
export const privateSubnetIds = vpc.privateSubnets.map(subnet => subnet.id);
export const databaseEndpoint = database.instance.endpoint;
export const cacheEndpoint = cache.cluster.cacheNodes[0].address;
export const ecrRepositoryUrl = ecr.getRepositoryUrl();
export const loadBalancerDns = loadBalancer.getLoadBalancerDns();
export const loadBalancerUrl = pulumi.interpolate`http://${loadBalancer.getLoadBalancerDns()}`;
export const ecsClusterArn = ecs.getClusterArn();
export const ecsServiceName = ecs.getServiceName();