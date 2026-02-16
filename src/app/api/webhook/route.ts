import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Mini App Webhook received:", body);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
}
