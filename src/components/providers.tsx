"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";
import { coinbaseWallet, injected } from "wagmi/connectors";

import { OnchainKitProvider } from "@coinbase/onchainkit";

export const config = createConfig({
    chains: [base],
    connectors: [
        farcasterFrame(),
        injected(),
        coinbaseWallet({
            appName: "Base Tap Game",
            preference: "smartWalletOnly",
        }),
    ],
    transports: {
        [base.id]: http(),
    },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <OnchainKitProvider
                    apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY}
                    chain={base}
                    config={{
                        paymaster: "https://api.developer.coinbase.com/rpc/v1/base/oSPvkDRNQ29jCAUmVeMEUacXRBsrGSPC",
                    }}
                >
                    {children}
                </OnchainKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
