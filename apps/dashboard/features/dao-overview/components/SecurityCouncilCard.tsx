"use client";

import { CheckCheck, Key, ShieldCheck } from "lucide-react";
import { cn } from "@/shared/utils/";
import { TooltipInfo } from "@/shared/components";
import { DaoOverviewConfig } from "@/shared/dao-config/types";
import {
  CountdownDaoInfo,
  ProgressBar,
} from "@/features/dao-overview/components";
import { UnderlinedLink } from "@/shared/components/design-system/links/underlined-link/UnderlinedLink";
import { useMemo } from "react";

export const SecurityCouncilCard = ({
  daoOverview,
}: {
  daoOverview: DaoOverviewConfig;
}) => {
  const { securityCouncil } = daoOverview;

  const progress = useMemo(() => {
    if (!securityCouncil) return 0;
    const start = new Date(securityCouncil.expiration.startDate).getTime();
    const end = new Date(securityCouncil.expiration.date).getTime();
    const now = Date.now();

    const total = end - start;
    const current = now - start;

    return Math.min(Math.max((current / total) * 100, 0), 100);
  }, [securityCouncil]);

  const warning = useMemo(() => {
    if (!securityCouncil) return 0;

    const start = new Date(securityCouncil.expiration.startDate).getTime();
    const end = new Date(securityCouncil.expiration.date).getTime();
    const alertTimestamp = securityCouncil.expiration.alertExpiration;

    // Convert alertTimestamp from seconds to milliseconds
    const alertMs = alertTimestamp * 1000;

    // Calculate the total duration of the progress bar
    const totalDuration = end - start;

    // Calculate the position of the warning as a percentage
    const warningPosition = ((alertMs - start) / totalDuration) * 100;

    // Return the warning percentage if it's a valid number
    return isNaN(warningPosition)
      ? 0
      : Math.min(Math.max(warningPosition, 0), 100);
  }, [securityCouncil]);

  if (!securityCouncil) return null;

  return (
    <div className="flex h-full w-full flex-col gap-6 py-2 sm:gap-5">
      <div className="flex w-full justify-between gap-5">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:bg-light-dark flex h-fit gap-1.5 rounded-md py-2 sm:gap-0 sm:p-2">
            <ShieldCheck className="text-foreground size-4 sm:size-6" />
            <h3 className="text-xs font-semibold text-white uppercase sm:hidden">
              Security Council
            </h3>
          </div>
          <div className="flex flex-col gap-3 sm:gap-1.5">
            <h3 className="hidden text-xs font-semibold text-white uppercase sm:block">
              Security Council
            </h3>
            <div className="flex w-full items-center justify-between gap-1.5 sm:justify-start">
              <p className="text-foreground text-sm font-medium">Multisig:</p>
              <div className="bg-dark flex items-center gap-1.5 rounded-lg px-2 py-1 sm:rounded-none sm:bg-none sm:p-0">
                <div
                  className={cn(
                    "flex items-center gap-1.5",
                    securityCouncil.isActive ? "text-success" : "text-error",
                  )}
                >
                  <CheckCheck className="size-3.5" />
                  <p className="text-sm font-medium">
                    {securityCouncil.isActive ? "Yes" : "No"}
                  </p>
                </div>
                <div className="size-1 items-center rounded-full bg-[#3F3F46] sm:flex" />
                <UnderlinedLink
                  href={securityCouncil.multisig.externalLink}
                  openInNewTab
                >
                  <Key className="text-tangerine size-3.5" />
                  <span className="text-white">
                    {securityCouncil.multisig.threshold}/
                    {securityCouncil.multisig.signers}
                  </span>
                  <span className="hidden sm:inline">
                    required for transactions
                  </span>
                  <span className="inline sm:hidden"> required</span>
                </UnderlinedLink>
                <div className="hidden sm:flex">
                  <TooltipInfo text="The security council is set up as a multisig with eight signers, needing the signature of 4 out of 8 to execute a cancel transaction for an approved proposal in the Timelock contract." />
                </div>
              </div>
            </div>
            <div className="flex w-full items-center justify-between sm:hidden">
              <p className="text-foreground text-sm font-medium">Countdown:</p>
              <CountdownDaoInfo
                daoOverview={daoOverview}
                className="bg-dark border-none"
              />
            </div>
          </div>
        </div>
        <div className="hidden sm:flex">
          <CountdownDaoInfo daoOverview={daoOverview} />
        </div>
      </div>
      <div className="flex">
        <ProgressBar
          startDate={securityCouncil.expiration.startDate}
          endDate={securityCouncil.expiration.date}
          progress={progress}
          warning={warning}
        />
      </div>
    </div>
  );
};
