import type { FastifyPluginAsync } from "fastify";
import { Prisma } from "@prisma/client";
import { otpRequestSchema, otpVerifySchema } from "@merrakii/shared";
import type { Env } from "../config.js";
import { normalizePhone } from "../lib/phone.js";
import { setOtp, consumeOtp } from "../lib/otp-store.js";
import { prisma } from "../lib/prisma.js";
import {
  cookieOptions,
  createDbSession,
  deleteSessionToken,
  getUserFromSessionToken,
  sessionCookieName,
} from "../lib/session.js";

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isDatabaseUnavailable(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === "P1001" || err.code === "P1017")
  ) {
    return true;
  }
  return err instanceof Error && err.message.includes("Can't reach database server");
}

export const authRoutes: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  const { env } = opts;

  app.post("/auth/otp/request", async (request, reply) => {
    const parsed = otpRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const phone = normalizePhone(parsed.data.phone);
    const code = env.NODE_ENV === "production" ? randomOtp() : env.DEV_OTP;
    setOtp(phone, code, 5 * 60 * 1000);
    if (env.NODE_ENV !== "production") {
      return reply.send({ ok: true, devHint: `Use OTP: ${code}` });
    }
    // Production: integrate SNS / MSG91 here — do not return code
    return reply.send({ ok: true });
  });

  app.post("/auth/otp/verify", async (request, reply) => {
    const parsed = otpVerifySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const phone = normalizePhone(parsed.data.phone);
    const ok =
      env.NODE_ENV !== "production" && parsed.data.code === env.DEV_OTP
        ? true
        : consumeOtp(phone, parsed.data.code);
    if (!ok) {
      return reply.status(400).send({ error: "Invalid or expired OTP" });
    }

    try {
      const user = await prisma.user.upsert({
        where: { phone },
        create: { phone },
        update: {},
      });

      await prisma.activeSession.deleteMany({ where: { userId: user.id } });

      const { token, expiresAt } = await createDbSession(env, user.id, {
        userAgent: request.headers["user-agent"],
        ip: request.ip,
      });

      reply.setCookie(sessionCookieName(), token, {
        ...cookieOptions(env),
        expires: expiresAt,
        signed: false,
      });

      return reply.send({ ok: true, user: { id: user.id, phone: user.phone, name: user.name } });
    } catch (err) {
      if (isDatabaseUnavailable(err)) {
        request.log.error(err);
        return reply.status(503).send({
          error:
            "Database is not running. Start PostgreSQL (docker compose up -d from the project root), then run npm run db:push and npm run db:seed.",
        });
      }
      throw err;
    }
  });

  app.post("/auth/logout", async (request, reply) => {
    const token = request.cookies[sessionCookieName()];
    await deleteSessionToken(token);
    reply.clearCookie(sessionCookieName(), { path: "/" });
    return reply.send({ ok: true });
  });

  app.get("/auth/me", async (request, reply) => {
    const token = request.cookies[sessionCookieName()];
    const user = await getUserFromSessionToken(token);
    if (!user) return reply.status(401).send({ error: "Unauthorized" });
    return reply.send({
      user: { id: user.id, phone: user.phone, name: user.name, email: user.email },
    });
  });
};
