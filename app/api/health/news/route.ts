import { NextResponse } from "next/server";

import { getNewsHealthStatus } from "@/lib/content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const health = await getNewsHealthStatus();

  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
  });
}
