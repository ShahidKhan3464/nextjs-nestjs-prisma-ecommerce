"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="from-background via-background to-muted/40 absolute inset-0 bg-linear-to-b" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-28">
        <motion.div
          className="max-w-xl space-y-6"
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.3em] uppercase">
            Premium minimalist commerce
          </p>
          <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
            Quiet essentials for intentional living.
          </h1>
          <p className="text-muted-foreground max-w-lg text-base leading-relaxed">
            Thoughtfully made goods, calm browsing, and checkout that stays out
            of your way—so you can focus on what belongs in your home.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.login}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Get started
            </Link>
            <Link
              href={ROUTES.register}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Create account
            </Link>
          </div>
        </motion.div>
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="border-border bg-card text-muted-foreground relative aspect-4/3 w-full max-w-md rounded-2xl border p-6 shadow-sm lg:max-w-lg"
        >
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(120,120,120,0.12),transparent_55%)]" />
          <div className="relative flex h-full flex-col justify-between gap-6">
            <div className="space-y-2">
              <p className="text-foreground text-sm font-medium">
                Featured drops weekly
              </p>
              <p className="text-sm leading-relaxed">
                Curated drops, detailed product pages, easy cart updates, and
                order tracking—everything you expect from a modern shop.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>New arrivals · Careful packing · Easy returns</span>
              <span className="tabular-nums">Designed to last</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
