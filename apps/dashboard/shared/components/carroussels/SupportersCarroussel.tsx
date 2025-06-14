"use client";

import { useRef, useEffect } from "react";
import { TooltipInfo } from "@/shared/components/tooltips/TooltipInfo";
import { Address } from "viem";
import { SupporterBadge } from "@/shared/components/badges/SupporterBadge";

interface SupportersCarrousselProps {
  supporters: Address[];
}

// Creates a scrolling carousel that displays supporter badges
export const SupportersCarroussel = ({
  supporters,
}: SupportersCarrousselProps) => {
  // Use enough supporters for a smooth scrolling effect
  let paddedSupporters = supporters;
  while (paddedSupporters.length < 40) {
    paddedSupporters = [...paddedSupporters, ...paddedSupporters];
  }

  const scrollContentRef = useRef<HTMLDivElement>(null);

  // Set up the marquee-like animation
  useEffect(() => {
    const scrollElement = scrollContentRef.current;
    if (!scrollElement) return;

    let scrollPos = 0;
    const totalWidth = scrollElement.scrollWidth;

    // We'll reset when we're halfway through the content
    const resetPoint = totalWidth / 2;

    const scroll = () => {
      if (!scrollElement) return;

      scrollPos += 0.3;

      // If we've scrolled past the first set of supporters,
      // jump back to the beginning to create infinite loop
      if (scrollPos >= resetPoint) {
        scrollPos = 0;
      }

      scrollElement.scrollLeft = scrollPos;
      requestAnimationFrame(scroll);
    };

    const animationId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [supporters.length]);

  return (
    <div className="border-light-dark bg-surface-background sm:bg-surface-default relative w-full overflow-hidden border-b p-4 sm:rounded-b-lg sm:border-t sm:border-b-0">
      <div className="flex w-full gap-2">
        <p className="text-md z-20 text-gray-400">Latest Supporters</p>
        <TooltipInfo text={"Latest 10 Supporters"} />
      </div>

      {/* Left shadow overlay */}
      <div className="sm:from-dark absolute top-0 left-3 z-10 h-full w-24 bg-linear-to-r from-[#18181B] to-transparent" />

      <div className="relative rounded-lg pt-2">
        <div
          ref={scrollContentRef}
          className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4"
        >
          {paddedSupporters.map((supporter, index) => (
            <SupporterBadge key={`${supporter}-${index}`} address={supporter} />
          ))}
        </div>
      </div>

      {/* Right shadow overlay */}
      <div className="sm:from-dark absolute top-0 right-4 z-10 h-full w-24 bg-linear-to-l from-[#18181B] to-transparent" />
    </div>
  );
};
