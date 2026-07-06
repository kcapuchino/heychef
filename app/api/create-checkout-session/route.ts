import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP = {
  founding: process.env.STRIPE_FOUNDING_CHEF_PRICE,
  features: process.env.STRIPE_FEATURES_PRICE,
  coffee: process.env.STRIPE_COFFEE_PRICE,
  support: process.env.STRIPE_SUPPORT_PRICE,
};

export async function POST(request: Request) {
  try {
    const { type } = await request.json();

    const price = PRICE_MAP[type as keyof typeof PRICE_MAP];

    if (!price) {
      return NextResponse.json(
        { error: "Invalid checkout type." },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") || "https://www.myheychef.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/founding-chef`,
      allow_promotion_codes: false,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 }
    );
  }
}