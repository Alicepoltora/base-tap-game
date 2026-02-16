# Base Tapper Mini App

A simple and addictive tapper game built for the Base ecosystem. Every tap on the Base logo triggers a real transaction on the Base Mainnet and earns you a confirmed point.

## Features

- **Onchain Gameplay**: Every interaction is a transaction.
- **Base Aesthetics**: Modern, sleek UI inspired by the Base brand.
- **Farcaster Integration**: Built ready for Farcaster Mini App frames.

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS 4 & Framer Motion
- **Onchain SDK**: Wagmi 2 + Viem
- **Mini App SDK**: @farcaster/miniapp-sdk

## Setup Instructions

1. **Local Development**:
   ```bash
   npm install
   npm run dev
   ```

2. **Deployment**:
   - Deploy the project to Vercel.
   - Go to your Vercel Project Settings -> Deployment Protection and turn off "**Vercel Authentication**" (to allow the Base manifest to be read).
   - Sign your manifest using the [Base Account Association Tool](https://www.base.dev/preview?tab=account).
   - Update `minikit.config.ts` with the signature/header/payload from the tool.

3. **How to Play**:
   - Open the app in a Farcaster client or the Base App.
   - Connect your wallet.
   - Tap the logo! Each tap will prompt a signature for a 1-wei transaction.
   - Once confirmed, your score increments.

## Manifest Configuration

The app manifest is located at `src/app/.well-known/farcaster.json`. Ensure the `homeUrl` and other URLs match your deployment domain.
