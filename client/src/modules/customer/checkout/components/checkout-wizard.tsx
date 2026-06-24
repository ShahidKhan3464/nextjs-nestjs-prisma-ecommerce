"use client";

import Link from "next/link";
import { toast } from "sonner";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { Address } from "../types";
import { useForm } from "react-hook-form";
import { ShoppingBag } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cartClear } from "@/lib/cart-actions";
import { useCartStore } from "@/store/cart-store";
import { getApiErrorMessage } from "@/lib/api-error";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlaceOrderButton } from "./place-order-button";
import { StripePaymentForm } from "./stripe-payment-form";
import { useCheckoutStore } from "@/store/checkout-store";
import { Button, buttonVariants } from "@/components/ui/button";
import { shippingSchema, type ShippingValues } from "../schemas";
import { useCartHydrate } from "@/shared/hooks/use-cart-hydrate";
import { PaymentContinueButton } from "./payment-continue-button";
import { StripeCheckoutProvider } from "./stripe-checkout-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  cancelCheckout,
  createCheckout,
  abandonCheckout,
} from "../services/checkout.service";

export function CheckoutWizard() {
  useCartHydrate();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const step = useCheckoutStore((s) => s.step);
  const setStep = useCheckoutStore((s) => s.setStep);
  const resetCheckout = useCheckoutStore((s) => s.reset);
  const setShipping = useCheckoutStore((s) => s.setShipping);
  const clientSecret = useCheckoutStore((s) => s.clientSecret);
  const paymentIntentId = useCheckoutStore((s) => s.paymentIntentId);
  const shippingAddress = useCheckoutStore((s) => s.shippingAddress);
  const setCheckoutSession = useCheckoutStore((s) => s.setCheckoutSession);
  const clearCheckoutSession = useCheckoutStore((s) => s.clearCheckoutSession);

  const [checkoutLoading, setCheckoutLoading] = React.useState(false);

  React.useEffect(() => {
    return () => {
      abandonCheckout(useCheckoutStore.getState().paymentIntentId);
    };
  }, []);

  async function releaseCheckoutSession(paymentIntentId: string) {
    try {
      await cancelCheckout(paymentIntentId);
    } catch {
      // Session may already be completed or removed.
    }
    clearCheckoutSession();
  }

  function handleStepChange(next: string) {
    const stepValue = next as typeof step;
    if (stepValue === "shipping" && paymentIntentId) {
      void releaseCheckoutSession(paymentIntentId);
      return;
    }
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

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;
  const estimatedTotal = Math.round((subtotal + estimatedTax) * 100) / 100;

  async function onShipping(values: ShippingValues) {
    setShipping(values as Address);
    setCheckoutLoading(true);
    try {
      const existingPaymentIntentId =
        useCheckoutStore.getState().paymentIntentId;
      if (existingPaymentIntentId) {
        await releaseCheckoutSession(existingPaymentIntentId);
      }
      const session = await createCheckout({
        shippingAddress: values as Address,
      });
      setCheckoutSession(session.paymentIntentId, session.clientSecret);
      toast.success("Ready for payment");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not start checkout"));
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleOrderSuccess() {
    await cartClear();
    resetCheckout();
    toast.success("Order placed");
    router.push(ROUTES.orders);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <div className="bg-muted/60 mb-6 flex size-20 items-center justify-center rounded-full">
          <ShoppingBag className="text-muted-foreground size-9" />
        </div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Your bag is empty
        </h2>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
          Add items to your cart before checking out. When you are ready, return
          here to complete your purchase.
        </p>
        <Link
          href={ROUTES.products}
          className={cn(buttonVariants({ size: "lg" }), "mt-8")}
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const paymentAndReview = clientSecret ? (
    <StripeCheckoutProvider clientSecret={clientSecret}>
      <div
        aria-hidden={step !== "payment"}
        className={cn(
          "space-y-4",
          step !== "payment" &&
            "pointer-events-none absolute left-[-9999px] h-px w-px overflow-hidden opacity-0"
        )}
      >
        <StripePaymentForm />
        {step === "payment" ? (
          <PaymentContinueButton onContinue={() => setStep("review")} />
        ) : null}
      </div>

      <TabsContent value="review" className="space-y-6">
        <div className="space-y-2 text-sm">
          <p className="font-medium">Shipping</p>
          <p className="text-muted-foreground">
            {shippingAddress?.fullName}
            <br />
            {shippingAddress?.line1}
            {shippingAddress?.line2 && (
              <>
                <br />
                {shippingAddress.line2}
              </>
            )}
            <br />
            {shippingAddress?.city}, {shippingAddress?.region}{" "}
            {shippingAddress?.postalCode}
            <br />
            {shippingAddress?.country}
          </p>
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <p className="font-medium">Payment</p>
          <p className="text-muted-foreground">
            Your card will be charged when you place the order.
          </p>
        </div>
        <Separator />
        {paymentIntentId ? (
          <PlaceOrderButton onSuccess={() => void handleOrderSuccess()} />
        ) : null}
      </TabsContent>
    </StripeCheckoutProvider>
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
            className="cursor-pointer"
            disabled={!clientSecret}
          >
            Payment
          </TabsTrigger>
          <TabsTrigger
            value="review"
            className="cursor-pointer"
            disabled={!clientSecret}
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
              <Button type="submit" disabled={checkoutLoading}>
                {checkoutLoading
                  ? "Preparing checkout…"
                  : "Continue to payment"}
              </Button>
            </form>
          </Form>
        </TabsContent>

        {paymentAndReview}
      </Tabs>

      <aside className="bg-muted/40 border-border h-fit space-y-4 rounded-xl border p-6 lg:sticky lg:top-28">
        <p className="font-medium">Order summary</p>
        <ul className="space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-4">
              <span className="min-w-0 truncate">
                {i.name} × {i.quantity}
              </span>
              <span className="tabular-nums">
                ${(i.price * i.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <Separator />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax (est.)</span>
            <span className="tabular-nums">${estimatedTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 font-semibold">
            <span>Total (est.)</span>
            <span className="tabular-nums">${estimatedTotal.toFixed(2)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
