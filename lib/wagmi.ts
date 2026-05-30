"use client";

import { QueryClient } from "@tanstack/react-query";
import { Attribution } from "ox/erc8021";
import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const BASE_APP_ID = "";
export const BUILDER_CODE = "";

export const DATA_SUFFIX = (
  BUILDER_CODE
    ? Attribution.toDataSuffix({ codes: [BUILDER_CODE] })
    : "0x"
) as `0x${string}`;

export const dataSuffixWriteOptions =
  DATA_SUFFIX === "0x" ? {} : { dataSuffix: DATA_SUFFIX };

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "TinyQuest",
      appLogoUrl: "/icon.svg",
      preference: "all",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});

export const queryClient = new QueryClient();
