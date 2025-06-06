import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";

export interface MetricData {
  value: string | undefined | null;
  changeRate: string | undefined | null;
}

export interface TokenDistributionContextProps {
  days: TimeInterval;
  setDays: (days: TimeInterval) => void;
  totalSupply: MetricData;
  totalSupplyChart: DaoMetricsDayBucket[];
  circulatingSupply: MetricData;
  circulatingSupplyChart: DaoMetricsDayBucket[];
  delegatedSupply: MetricData;
  delegatedSupplyChart: DaoMetricsDayBucket[];
  cexSupply: MetricData;
  cexSupplyChart: DaoMetricsDayBucket[];
  dexSupply: MetricData;
  dexSupplyChart: DaoMetricsDayBucket[];
  lendingSupply: MetricData;
  lendingSupplyChart: DaoMetricsDayBucket[];
}

export interface GovernanceActivityContextProps {
  days: TimeInterval;
  setDays: (days: TimeInterval) => void;
  treasury: MetricData;
  setTreasury: (treasury: MetricData) => void;
  treasurySupplyChart: DaoMetricsDayBucket[];
  setTreasurySupplyChart: (treasurySupplyChart: DaoMetricsDayBucket[]) => void;
  proposals: MetricData;
  activeSupply: MetricData;
  votes: MetricData;
  averageTurnout: MetricData;
}
