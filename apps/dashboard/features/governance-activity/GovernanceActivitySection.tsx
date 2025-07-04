"use client";

import { TheSectionLayout, SwitcherDate } from "@/shared/components";
import { GovernanceActivityTable } from "@/features/governance-activity/components";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { useGovernanceActivityContext } from "@/features/governance-activity/contexts/GovernanceActivityContext";
import { Activity } from "lucide-react";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";

export const GovernanceActivitySection = () => {
  const { setDays, days } = useGovernanceActivityContext();

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.governanceActivity.title}
      icon={<Activity className="section-layout-icon" />}
      switchDate={
        <SwitcherDate
          defaultValue={TimeInterval.ONE_YEAR}
          setTimeInterval={setDays}
          isSmall
        />
      }
      days={days}
      description={SECTIONS_CONSTANTS.governanceActivity.description}
      anchorId={SECTIONS_CONSTANTS.governanceActivity.anchorId}
    >
      <GovernanceActivityTable />
    </TheSectionLayout>
  );
};
