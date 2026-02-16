export const minikitConfig = {
    accountAssociation: {
        header: "",
        payload: "",
        signature: "",
    },
    miniapp: {
        version: "1",
        name: "Base Tap Game",
        subtitle: "Tap the Base logo to earn points!",
        description: "A simple and addictive tapper game on Base Mainnet. Every tap is a transaction!",
        iconUrl: "https://base-tap-game-tawny.vercel.app/icon.png",
        splashImageUrl: "https://base-tap-game-tawny.vercel.app/splash.png",
        splashBackgroundColor: "#0052FF",
        homeUrl: "https://base-tap-game-tawny.vercel.app/",
        primaryCategory: "gaming",
        tags: ["tap", "base", "onchain", "game"],
    },
} as const;
