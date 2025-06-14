import { createConfig } from "ponder";
import { http } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";

import { env } from "@/env";
import { ARBTokenAbi } from "@/indexer/arb";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    arbitrum_mainnet: {
      id: 42161,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    ARBToken: {
      abi: ARBTokenAbi,
      chain: "arbitrum_mainnet",
      address:
        CONTRACT_ADDRESSES[NetworkEnum.ARBITRUM][DaoIdEnum.ARB]!.token.address,
      startBlock: 70398200,
    },
  },
});
