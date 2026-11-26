import { NextResponse } from "next/server";
import {
  getPaypalRate,
  isPayosConfigured,
  isSepayConfigured,
  isPaypalConfigured,
  isStripeConfigured,
  isSimulationFlag,
} from "@/lib/payments/config";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Trang checkout gọi để biết cổng nào đã có key thật (hiện số USD cho
   PayPal, gắn nhãn "thử nghiệm" cho cổng chưa cấu hình). Chỉ trả cờ
   true/false — KHÔNG trả secret. */
export async function GET() {
  return NextResponse.json({
    simulation: isSimulationFlag(),
    methods: {
      payos: isPayosConfigured(),
      sepay: isSepayConfigured(),
      paypal: isPaypalConfigured(),
      stripe: isStripeConfigured(),
    },
    paypalRate: getPaypalRate(),
  });
}
