"use client";

import { MouseEvent } from "react";
import { cn } from "@/shared/utils/";
import { Card } from "@/shared/components/ui/card";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { useScreenSize } from "@/shared/hooks";
import { RiskLevelCardSmall } from "@/shared/components";

export const GovernanceImplementationCard = ({
  field,
  isOpen,
  onToggle,
}: {
  field: GovernanceImplementationField & { name: string };
  isOpen: boolean;
  onToggle: (e: MouseEvent<HTMLDivElement>) => void;
}) => {
  const { isDesktop, isTablet } = useScreenSize();

  return (
    <Card
      className={cn(
        "!border-b-light-dark sm:border-light-dark sm:bg-surface-default xl4k:max-w-full flex w-full flex-col flex-wrap gap-3.5 rounded-t-lg rounded-b-none border-b! border-x-transparent border-t-transparent p-3 shadow-sm transition-all duration-200 hover:cursor-pointer sm:relative sm:gap-0 sm:border md:w-[calc(50%-10px)]",
        isOpen
          ? "sm:border-middle-dark sm:bg-surface-contrast z-20 rounded-b-none"
          : "sm:hover:bg-middle-dark sm:rounded-b-lg",
      )}
      onClick={onToggle}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative flex size-4 shrink-0 items-center justify-center sm:size-6">
            <span
              className={cn(
                "text-secondary absolute mb-1 text-3xl font-thin transition-all duration-300",
                isOpen ? "rotate-90 opacity-0" : "opacity-100",
              )}
            >
              +
            </span>
            <span
              className={cn(
                "text-secondary absolute mb-1 text-3xl font-thin transition-all duration-300",
                isOpen ? "opacity-100" : "rotate-90 opacity-0",
              )}
            >
              -
            </span>
          </div>
          <div className="flex items-center gap-2 sm:flex-col md:flex-row md:text-center">
            {" "}
            <h3 className="text-primary truncate text-sm leading-tight font-medium">
              {field.name}
            </h3>
            <div className="size-1 rounded-full bg-white/30" />
            <span className="text-secondary shrink-0 truncate text-sm leading-tight font-medium">
              {field.value || ""}
            </span>
          </div>
        </div>
        <div>
          <RiskLevelCardSmall status={field.riskLevel} />
        </div>
      </div>
      <div
        className={cn(
          "sm:border-middle-dark sm:bg-surface-contrast z-20 rounded-b-lg border-transparent sm:absolute sm:border sm:border-t-0 sm:px-4",
          "top-full -left-px w-[calc(100%+2px)]",
          isOpen
            ? "visible h-auto transition-all duration-500 ease-in-out sm:pb-5"
            : "hidden transition-all duration-300 ease-in-out sm:invisible sm:h-0",
        )}
        onClick={(e) => {
          if (isDesktop || isTablet) {
            e.stopPropagation();
          }
        }}
      >
        <div className="pt-1">
          <p className="text-secondary text-sm">{field.description}</p>
        </div>
      </div>
    </Card>
  );
};
