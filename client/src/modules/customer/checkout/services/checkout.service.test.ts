import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  abandonCheckout,
  cancelCheckout,
  recoverCheckout,
} from "./checkout.service";

vi.mock("@/services/api/client", () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from "@/services/api/client";

describe("checkout.service", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("posts cancel payload to the checkout cancel route", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { data: { cancelled: true } },
    });

    await cancelCheckout("pi_test_123");

    expect(api.post).toHaveBeenCalledWith(
      "/api/v1/customer/orders/checkout/cancel",
      { paymentIntentId: "pi_test_123" }
    );
  });

  it("abandons checkout without throwing when cancel fails", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("network"));

    expect(() => abandonCheckout("pi_test_123")).not.toThrow();
    await Promise.resolve();
  });

  it("skips abandon when payment intent id is missing", () => {
    abandonCheckout(null);
    expect(api.post).not.toHaveBeenCalled();
  });

  it("recovers checkout via idempotent complete", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        data: {
          orders: [{ id: "1", orderNumber: "ORD-1" }],
          order: { id: "1", orderNumber: "ORD-1" },
        },
      },
    });

    const orders = await recoverCheckout("pi_test_456");

    expect(api.post).toHaveBeenCalledWith(
      "/api/v1/customer/orders/checkout/complete",
      { paymentIntentId: "pi_test_456" }
    );
    expect(orders).toHaveLength(1);
  });
});
