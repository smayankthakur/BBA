import { z } from "zod";

export const INDIAN_STATES = [
  "Andaman & Nicobar", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra & Nagar Haveli and Daman & Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

const text = (max: number) => z.string().trim().min(1).max(max);
const optText = (max: number) => z.string().trim().max(max).optional().or(z.literal("")).transform((v) => v || undefined);

/** Body accepted by POST /api/checkout/create. The price is NOT part of it. */
export const CheckoutSchema = z.object({
  bracelet: z.string().max(60),
  wearer: z.object({
    firstName: text(60),
    lastName: optText(60),
    day: z.number().int().min(1).max(31),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(1920).max(2100),
    gender: z.enum(["female", "male", "other"]),
    wrist: z.string().max(20),
  }),
  intentions: z.array(z.string().max(60)).max(3),
  focus: optText(160),
  isGift: z.boolean(),
  giftNote: optText(240),
  contact: z.object({
    deliveryName: text(80),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
    email: z.string().trim().email().max(120).optional().or(z.literal("")).transform((v) => v || undefined),
  }),
  address: z.object({
    line1: text(120),
    line2: optText(120),
    landmark: optText(80),
    city: text(60),
    state: z.enum(INDIAN_STATES),
    pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
  }),
  consent: z.literal(true),
  marketing: z.boolean(),
  utm: z.record(z.string().max(100)).optional(),
  coupon: z.string().trim().max(40).optional(),
});

export type CheckoutInput = z.input<typeof CheckoutSchema>;

export const VerifySchema = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]{6,40}$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]{6,40}$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});
