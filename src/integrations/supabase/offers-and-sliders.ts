import { supabase } from "./client";

export interface ProductVariant {
  id?: string;
  size: string; // e.g., "500ml", "1L", "2L", "5L", "15L"
  mrp?: number;
  discount_percentage?: number;
  price: number;
  stock_quantity?: number;
}

export interface Offer {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  banner_url?: string | null;
  badge_text?: string | null;
  discount_percentage?: number | null;
  promo_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SliderItem {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image_url: string;
  badge_text?: string | null;
  button_text?: string | null;
  link_url?: string | null;
  offer_id?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  offers?: Offer | null;
}

export interface PromoCode {
  id: string;
  code: string;
  offer_id?: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  used_count: number;
  is_active: boolean;
  expires_at?: string | null;
  created_at?: string;
}

// All mock offers, sliders and promos cleared out as requested
export const FALLBACK_OFFERS: Offer[] = [];
export const FALLBACK_SLIDERS: SliderItem[] = [];
export const FALLBACK_PROMO_CODES: PromoCode[] = [];

// Helper to fetch active sliders
export async function fetchActiveSliders(): Promise<SliderItem[]> {
  try {
    const { data, error } = await supabase
      .from("sliders")
      .select("*, offers(*)")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && Array.isArray(data)) {
      return data as SliderItem[];
    }
    return [];
  } catch {
    return [];
  }
}

// Helper to fetch active offers
export async function fetchActiveOffers(): Promise<Offer[]> {
  try {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      return data as Offer[];
    }
    return [];
  } catch {
    return [];
  }
}

// Helper to validate and apply promo code
export async function validatePromoCode(
  inputCode: string,
  subtotal: number
): Promise<{
  valid: boolean;
  promo?: PromoCode;
  discountAmount: number;
  message: string;
}> {
  const normalized = inputCode.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, discountAmount: 0, message: "Please enter a promo code" };
  }

  let promo: PromoCode | undefined;

  try {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", normalized)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && data) {
      promo = data as PromoCode;
    }
  } catch {
    // ignore
  }

  if (!promo) {
    return { valid: false, discountAmount: 0, message: "Invalid or expired promo code" };
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { valid: false, discountAmount: 0, message: "This promo code has expired" };
  }

  if (subtotal < promo.min_order_amount) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order amount of ₹${promo.min_order_amount} required to use ${promo.code}`,
    };
  }

  let discount = 0;
  if (promo.discount_type === "percentage") {
    discount = (subtotal * promo.discount_value) / 100;
    if (promo.max_discount_amount && discount > promo.max_discount_amount) {
      discount = promo.max_discount_amount;
    }
  } else {
    discount = Math.min(promo.discount_value, subtotal);
  }

  discount = Math.round(discount * 100) / 100;

  return {
    valid: true,
    promo,
    discountAmount: discount,
    message: `Promo code ${promo.code} applied successfully! You saved ₹${discount.toFixed(2)}`,
  };
}
