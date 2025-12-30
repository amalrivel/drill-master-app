"use client";

import * as React from "react";

export type JPToken =
  | { t: "text"; v: string }
  | { t: "ruby"; base: string; rt: string; key?: string };

type Props = {
  tokens: JPToken[];
  className?: string;
  showFurigana?: boolean;
  as?: "p" | "span" | "div";
};

export function JPTokenText({
  tokens,
  className,
  showFurigana = true,
  as = "p",
}: Props) {
  const Wrapper = as as any;

  return (
    <Wrapper className={className}>
      {tokens.map((tok, i) => {
        if (tok.t === "text") {
          return (
            <span key={i} className="whitespace-pre-wrap">
              {tok.v}
            </span>
          );
        }

        return (
          <ruby key={i} className="align-baseline">
            {tok.base}
            <rp>(</rp>
            <rt
              className={
                showFurigana
                  ? "text-[0.65em] leading-none opacity-80 select-none"
                  : "text-[0.65em] leading-none opacity-0 select-none"
              }
            >
              {tok.rt}
            </rt>
            <rp>)</rp>
          </ruby>
        );
      })}
    </Wrapper>
  );
}
