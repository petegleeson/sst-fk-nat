import { StackContext, Service, use } from "sst/constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export function FckNatVpcStack({ stack, app }: StackContext) {
  let vpc: ec2.Vpc | undefined = undefined;
  let vpcPrivateSubnets: ec2.SubnetSelection | undefined = undefined;
  let vpcPublicSubnets: ec2.SubnetSelection | undefined = undefined;

  // skip vpc locally and use localhost directly
  if (app.stage !== "dev" && app.stage !== "prod") {
    return { vpc, vpcPrivateSubnets, vpcPublicSubnets };
  }

  const elasticIp = new ec2.CfnEIP(stack, "elasticIp", {
    domain: "vpc",
  });

  const natGatewayProvider = new ec2.NatInstanceProvider({
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T4G,
      ec2.InstanceSize.NANO
    ),
    machineImage: new ec2.LookupMachineImage({
      name: "fck-nat-amzn2-*-arm64-ebs",
      owners: ["568608671756"],
    }),
  });

  vpc = new ec2.Vpc(stack, "vpc", {
    maxAzs: 2,
    subnetConfiguration: [
      {
        name: "private",
        cidrMask: 24,
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      {
        name: "public",
        cidrMask: 24,
        subnetType: ec2.SubnetType.PUBLIC,
      },
    ],
    natGateways: 1,
    natGatewayProvider,
  });

  const eipAllocationIds = [elasticIp.attrAllocationId];
  natGatewayProvider.configuredGateways.forEach((gateway, idx) => {
    new ec2.CfnEIPAssociation(stack, `EIPAssociation${idx}`, {
      allocationId: eipAllocationIds[idx],
      instanceId: gateway.gatewayId,
    });
  });

  vpcPrivateSubnets = vpc.selectSubnets({
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
  });
  vpcPublicSubnets = vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC });

  return { vpc, vpcPrivateSubnets, vpcPublicSubnets };
}

export function NodeServiceStack({ stack }: StackContext) {
  const fckNatStack = use(FckNatVpcStack);
  const port = 1234;
  const service = new Service(stack, "NodeService", {
    path: "packages/node-service",
    port,
    dev: {
      url: `http://localhost:${port}`,
    },
    cdk: {
      container: {
        healthCheck: {
          command: ["CMD-SHELL", `curl -f http://localhost:${port} || exit 1`],
        },
      },
      fargateService: {
        circuitBreaker: { rollback: true },
      },
      vpc: fckNatStack.vpc,
    },
  });

  stack.addOutputs({
    ServiceUrl: service.url,
  });

  return service;
}
