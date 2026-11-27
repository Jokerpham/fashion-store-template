import { NextResponse } from "next/server";
import {
  isPayosConfigured,
  isSepayConfigured,
  isSimulationFlag,
} from "@/lib/payments/config";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Trang checkout gọi để biết cổng nào đã có key thật (gắn nhãn
   "thử nghiệm" cho cổng chưa cấu hình). Chỉ trả cờ true/false —
   KHÔNG trả secret. */
export async function GET() {
  return NextResponse.json({
    simulation: isSimulationFlag(),
    methods: {
      payos: isPayosConfigured(),
      sepay: isSepayConfigured(),
    },
  });
}
