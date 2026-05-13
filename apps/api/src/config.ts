import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  WEB_ORIGIN: z.string().default("http://localhost:3002"),
  SESSION_DAYS: z.coerce.number().default(14),
  DEV_OTP: z.string().default("123456"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

export type BaseEnv = z.infer<typeof envSchema>;

export type Env = BaseEnv & {
  /** True in development, or when ALLOW_DUMMY_PAYMENTS=true (for staging demos). */
  ALLOW_DUMMY_PAYMENTS_ENABLED: boolean;
};

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  const data = parsed.data;
  const allowDummyFlag = process.env.ALLOW_DUMMY_PAYMENTS === "true" || process.env.ALLOW_DUMMY_PAYMENTS === "1";
  return {
    ...data,
    ALLOW_DUMMY_PAYMENTS_ENABLED: data.NODE_ENV === "development" || allowDummyFlag,
  };
}
