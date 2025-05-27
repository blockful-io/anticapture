import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface SecretsConfig {
  name: string;
  secrets: Record<string, pulumi.Input<string>>;
}

export class SecretsStack {
  public readonly secret: aws.secretsmanager.Secret;
  public readonly secretVersion: aws.secretsmanager.SecretVersion;

  constructor(config: SecretsConfig, opts?: pulumi.ComponentResourceOptions) {
    // Create the secret
    this.secret = new aws.secretsmanager.Secret(`${config.name}-secrets`, {
      name: `${config.name}-secrets`,
      description: `Secrets for ${config.name} application`,
      tags: {
        Name: `${config.name}-secrets`,
      },
    }, opts);

    // Create secret version with the secret values
    this.secretVersion = new aws.secretsmanager.SecretVersion(`${config.name}-secret-version`, {
      secretId: this.secret.id,
      secretString: pulumi.jsonStringify(config.secrets),
    }, opts);
  }

  public getSecretArn(): pulumi.Output<string> {
    return this.secret.arn;
  }
}