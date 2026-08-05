"use client";

import Link from "next/link";
import { toast } from "sonner";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { ShoppingBag } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import type { Address, Order } from "../types";
import { PaymentPanel } from "./payment-panel";
import { cartClear } from "@/lib/cart-actions";
import { PaymentStatus } from "./payment-status";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart-store";
import { queryKeys } from "@/constants/query-keys";
import { CheckoutSummary } from "./checkout-summary";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlaceOrderButton } from "./place-order-button";
import { useCheckoutStore } from "@/store/checkout-store";
import { CheckoutPageSkeleton } from "./checkout-skeletons";
import { CheckoutStoreGroup } from "./checkout-store-group";
import { CheckoutAddressCard } from "./checkout-address-card";
import { abandonCheckout } from "../services/checkout.service";
import { Button, buttonVariants } from "@/components/ui/button";
import { shippingSchema, type ShippingValues } from "../schemas";
import { useCartHydrate } from "@/shared/hooks/use-cart-hydrate";
import { PaymentContinueButton } from "./payment-continue-button";
import { groupCartItemsByStore } from "@/modules/customer/shared";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { persistCheckoutSuccess } from "../utils/checkout-session-storage";
import { useCreateCheckoutSession } from "../hooks/use-checkout-mutations";
import { LazyStripeCheckoutProvider } from "./lazy-stripe-checkout-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvalidateAfterCheckout } from "../hooks/use-invalidate-after-checkout";
import { fetchAddresses } from "@/modules/customer/addresses/services/addresses.service";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";

export function CheckoutWizard() {
  useCartHydrate();
  const router = useRouter();
  const invalidateAfterCheckout = useInvalidateAfterCheckout();
  const createSession = useCreateCheckoutSession();

  const items = useCartStore((s) => s.items);
  const step = useCheckoutStore((s) => s.step);
  const hydrated = useCheckoutStore((s) => s.hydrated);
  const setStep = useCheckoutStore((s) => s.setStep);
  const resetCheckout = useCheckoutStore((s) => s.reset);
  const clientSecret = useCheckoutStore((s) => s.clientSecret);
  const paymentIntentId = useCheckoutStore((s) => s.paymentIntentId);
  const shippingAddress = useCheckoutStore((s) => s.shippingAddress);
  const preview = useCheckoutStore((s) => s.preview);
  const paymentProvider = useCheckoutStore((s) => s.paymentProvider);
  const paymentStatus = useCheckoutStore((s) => s.paymentStatus);
  const paymentFailure = useCheckoutStore((s) => s.paymentFailure);
  const checkoutSessionId = useCheckoutStore((s) => s.checkoutSessionId);
  const setPaymentProvider = useCheckoutStore((s) => s.setPaymentProvider);
  const setPaymentStatus = useCheckoutStore((s) => s.setPaymentStatus);
  const clearCheckoutSession = useCheckoutStore((s) => s.clearCheckoutSession);
  const hydrateFromStorage = useCheckoutStore((s) => s.hydrateFromStorage);

  const [selectedAddressId, setSelectedAddressId] = React.useState("");
  const [placeOrderKey, setPlaceOrderKey] = React.useState(0);
  const [redirecting, setRedirecting] = React.useState(false);

  React.useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const { data: savedAddresses = [], isPending: addressesPending } = useQuery({
    queryKey: queryKeys.addresses.all,
    queryFn: fetchAddresses,
  });

  const { groups, grandTotal } = React.useMemo(
    () => groupCartItemsByStore(items),
    [items]
  );

  React.useEffect(() => {
    return () => {
      const state = useCheckoutStore.getState();
      // Do not cancel once Stripe is processing/succeeded — complete/webhook own it.
      if (
        state.paymentStatus === "succeeded" ||
        state.paymentStatus === "processing"
      ) {
        return;
      }
      abandonCheckout(state.paymentIntentId);
    };
  }, []);

  async function releaseCheckoutSession() {
    const pi = useCheckoutStore.getState().paymentIntentId;
    if (pi) {
      abandonCheckout(pi);
    }
    clearCheckoutSession();
  }

  function handleStepChange(next: string) {
    const stepValue = next as typeof step;
    if (stepValue === "shipping" && paymentIntentId) {
      void releaseCheckoutSession();
      return;
    }
    if (stepValue === "payment" && !clientSecret) return;
    if (stepValue === "review" && !clientSecret) return;
    setStep(stepValue);
  }

  const form = useForm<ShippingValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: shippingAddress?.fullName ?? "",
      line1: shippingAddress?.line1 ?? "",
      line2: shippingAddress?.line2 ?? "",
      city: shippingAddress?.city ?? "",
      region: shippingAddress?.region ?? "",
      postalCode: shippingAddress?.postalCode ?? "",
      country: shippingAddress?.country ?? "PK",
      phone: shippingAddress?.phone ?? "",
    },
  });

  React.useEffect(() => {
    if (!savedAddresses.length || shippingAddress?.fullName) return;
    const defaultShipping =
      savedAddresses.find((a) => a.isDefaultShipping) ?? savedAddresses[0];
    if (!defaultShipping) return;
    setSelectedAddressId(defaultShipping.id);
    form.reset({
      fullName: defaultShipping.fullName,
      line1: defaultShipping.line1,
      line2: defaultShipping.line2 ?? "",
      city: defaultShipping.city,
      region: defaultShipping.region,
      postalCode: defaultShipping.postalCode,
      country: defaultShipping.country,
      phone: defaultShipping.phone ?? "",
    });
  }, [savedAddresses, shippingAddress, form]);

  function applySavedAddress(id: string) {
    setSelectedAddressId(id);
    const address = savedAddresses.find((a) => a.id === id);
    if (!address) return;
    form.reset({
      fullName: address.fullName,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone ?? "",
    });
  }

  async function onShipping(values: ShippingValues) {
    createSession.mutate(values as Address);
  }

  async function handleOrderSuccess(orders: Order[]) {
    setRedirecting(true);
    persistCheckoutSuccess({
      orders,
      completedAt: new Date().toISOString(),
      checkoutSessionId: checkoutSessionId ?? "unknown",
    });
    await cartClear();
    await invalidateAfterCheckout();
    // Keep paymentStatus succeeded and clear PI so unmount abandon cannot cancel.
    useCheckoutStore.setState({
      paymentIntentId: null,
      clientSecret: null,
      paymentStatus: "succeeded",
      submitting: false,
    });
    toast.success(
      orders.length > 1
        ? `${orders.length} orders placed`
        : "Order placed successfully"
    );
    router.push(ROUTES.checkoutSuccess);
    resetCheckout();
  }

  function handleRetryPayment() {
    const failure = useCheckoutStore.getState().paymentFailure;
    setPlaceOrderKey((k) => k + 1);

    // Network / generic failures: stay on review and recover via complete or re-confirm.
    if (failure?.kind === "network" || failure?.kind === "failed") {
      setPaymentStatus("idle", failure);
      setStep("review");
      return;
    }

    setPaymentStatus("idle");
    setStep("payment");
  }

  function handleRestartCheckout() {
    void releaseCheckoutSession();
    setPaymentStatus("idle");
    setStep("shipping");
  }

  if (!hydrated || redirecting) {
    return <CheckoutPageSkeleton />;
  }

  if (items.length === 0 && !clientSecret) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Your bag is empty"
          description="Add items to your cart before checking out. When you are ready, return here to complete your purchase."
          action={
            <Link
              href={ROUTES.products}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              <ShoppingBag className="size-4" />
              Continue shopping
            </Link>
          }
        />
      </div>
    );
  }

  const paymentAndReview = clientSecret ? (
    <LazyStripeCheckoutProvider clientSecret={clientSecret}>
      <div
        aria-hidden={step !== "payment"}
        className={cn(
          "space-y-4",
          step !== "payment" &&
            "pointer-events-none absolute left-[-9999px] h-px w-px overflow-hidden opacity-0"
        )}
      >
        <PaymentPanel
          selectedProvider={paymentProvider}
          onSelectProvider={setPaymentProvider}
        />
        <PaymentStatus
          status={paymentStatus}
          failure={paymentFailure}
          onRetry={handleRetryPayment}
          onRestart={handleRestartCheckout}
        />
        {step === "payment" && paymentProvider === "stripe" ? (
          <PaymentContinueButton
            onContinue={() => {
              setPaymentStatus("idle");
              setStep("review");
            }}
          />
        ) : null}
      </div>

      <TabsContent value="review" className="space-y-6">
        <CheckoutAddressCard
          showManageLink
          address={shippingAddress}
        />
        <Separator />
        <div className="space-y-3">
          <p className="text-sm font-medium">Stores in this order</p>
          {groups.map((group) => (
            <CheckoutStoreGroup key={group.storeKey} group={group} compact />
          ))}
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <p className="font-medium">Payment</p>
          <p className="text-muted-foreground">
            {paymentProvider === "stripe"
              ? "Your card will be charged when you place the order. Totals come from the server."
              : "Selected payment method is not available yet."}
          </p>
        </div>
        <PaymentStatus
          status={paymentStatus}
          failure={paymentFailure}
          onRetry={handleRetryPayment}
          onRestart={handleRestartCheckout}
        />
        <Separator />
        {paymentIntentId && paymentProvider === "stripe" ? (
          <PlaceOrderButton
            key={placeOrderKey}
            onRetryReady={() => setPlaceOrderKey((k) => k + 1)}
            onSuccess={(orders) => void handleOrderSuccess(orders)}
          />
        ) : null}
      </TabsContent>
    </LazyStripeCheckoutProvider>
  ) : (
    <>
      <TabsContent value="payment" className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Complete the shipping step to initialize secure payment.
        </p>
      </TabsContent>
      <TabsContent value="review" className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Complete shipping and payment before reviewing your order.
        </p>
      </TabsContent>
    </>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_340px] lg:px-6">
      <Tabs value={step} className="space-y-6" onValueChange={handleStepChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shipping" className="cursor-pointer">
            Shipping
          </TabsTrigger>
          <TabsTrigger
            value="payment"
            disabled={!clientSecret}
            className="cursor-pointer"
          >
            Payment
          </TabsTrigger>
          <TabsTrigger
            value="review"
            disabled={!clientSecret}
            className="cursor-pointer"
          >
            Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipping">
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(onShipping)}
            >
              {addressesPending ? (
                <p className="text-muted-foreground text-sm">
                  Loading saved addresses…
                </p>
              ) : null}

              {savedAddresses.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Saved addresses</p>
                  <Select
                    value={selectedAddressId}
                    onValueChange={(value) => {
                      if (value) applySavedAddress(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a saved address" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedAddresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          {address.label || address.fullName}
                          {address.isDefaultShipping ? " (default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Link
                    href={ROUTES.addresses}
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    Manage addresses
                  </Link>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-3 text-sm">
                  <p className="text-muted-foreground">
                    No saved addresses yet. Enter shipping below, or{" "}
                    <Link
                      href={ROUTES.addresses}
                      className="text-foreground underline-offset-2 hover:underline"
                    >
                      add one to your address book
                    </Link>
                    .
                  </p>
                </div>
              )}

              <FormField
                name="fullName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="line1"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address line 1</FormLabel>
                    <FormControl>
                      <Input autoComplete="address-line1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="line2"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address line 2</FormLabel>
                    <FormControl>
                      <Input autoComplete="address-line2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  name="city"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input autoComplete="address-level2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="region"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Region</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  name="postalCode"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl>
                        <Input autoComplete="postal-code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="country"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input autoComplete="country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input autoComplete="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createSession.isPending}>
                {createSession.isPending
                  ? "Preparing checkout…"
                  : "Continue to payment"}
              </Button>
            </form>
          </Form>
        </TabsContent>

        {paymentAndReview}
      </Tabs>

      <CheckoutSummary
        groups={groups}
        preview={preview}
        merchandiseSubtotal={grandTotal}
      />
    </div>
  );
}
