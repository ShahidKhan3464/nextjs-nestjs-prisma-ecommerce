import { beforeEach, describe, expect, it, vi } from "vitest";
import { abandonCheckout, cancelCheckout } from "./checkout.service";

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
});
