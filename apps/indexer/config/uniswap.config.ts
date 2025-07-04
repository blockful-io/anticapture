import { createConfig } from "ponder";
import { http } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";

import { env } from "@/env";
import { UNIGovernorAbi, UNITokenAbi } from "@/indexer/uni/abi";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    ethereum_mainnet: {
      id: 1,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    UNIToken: {
      abi: UNITokenAbi,
      chain: "ethereum_mainnet",
      address:
        CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM][DaoIdEnum.UNI]!.token.address,
      startBlock: 10861674,
    },
    UNIGovernor: {
      abi: UNIGovernorAbi,
      chain: "ethereum_mainnet",
      address:
        CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM][DaoIdEnum.UNI]!.governor,
      startBlock: 13059157,
    },
  },
});
