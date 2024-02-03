import { SSTConfig } from "sst";
import { FckNatVpcStack, NodeServiceStack } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "sst-fk-nat",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(FckNatVpcStack).stack(NodeServiceStack);
  },
} satisfies SSTConfig;
