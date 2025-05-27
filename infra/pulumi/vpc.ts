import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface VpcConfig {
  name: string;
  cidrBlock: string;
  availabilityZones: string[];
}

export class VpcStack {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];

  constructor(config: VpcConfig, opts?: pulumi.ComponentResourceOptions) {
    // Create VPC
    this.vpc = new aws.ec2.Vpc(`${config.name}-vpc`, {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.name}-vpc`,
      },
    }, opts);

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(`${config.name}-igw`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-igw`,
      },
    }, opts);

    // Create public subnets
    this.publicSubnets = config.availabilityZones.map((az, index) => {
      const cidr = `10.0.${index * 2 + 1}.0/24`;
      return new aws.ec2.Subnet(`${config.name}-public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.name}-public-subnet-${index + 1}`,
          Type: "public",
        },
      }, opts);
    });

    // Create private subnets
    this.privateSubnets = config.availabilityZones.map((az, index) => {
      const cidr = `10.0.${index * 2 + 2}.0/24`;
      return new aws.ec2.Subnet(`${config.name}-private-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: az,
        tags: {
          Name: `${config.name}-private-subnet-${index + 1}`,
          Type: "private",
        },
      }, opts);
    });

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(`${config.name}-public-rt`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-public-rt`,
      },
    }, opts);

    // Create route to internet gateway
    new aws.ec2.Route(`${config.name}-public-route`, {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    }, opts);

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(`${config.name}-public-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      }, opts);
    });

    // Create Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map((_, index) => 
      new aws.ec2.Eip(`${config.name}-nat-eip-${index + 1}`, {
        domain: "vpc",
        tags: {
          Name: `${config.name}-nat-eip-${index + 1}`,
        },
      }, opts)
    );

    // Create NAT Gateways
    this.natGateways = this.publicSubnets.map((subnet, index) =>
      new aws.ec2.NatGateway(`${config.name}-nat-${index + 1}`, {
        subnetId: subnet.id,
        allocationId: eips[index].id,
        tags: {
          Name: `${config.name}-nat-${index + 1}`,
        },
      }, opts)
    );

    // Create private route tables
    this.privateRouteTables = this.privateSubnets.map((subnet, index) => {
      const routeTable = new aws.ec2.RouteTable(`${config.name}-private-rt-${index + 1}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${config.name}-private-rt-${index + 1}`,
        },
      }, opts);

      // Create route to NAT Gateway
      new aws.ec2.Route(`${config.name}-private-route-${index + 1}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[index].id,
      }, opts);

      // Associate private subnet with route table
      new aws.ec2.RouteTableAssociation(`${config.name}-private-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      }, opts);

      return routeTable;
    });
  }
}