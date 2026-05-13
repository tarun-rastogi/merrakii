import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { applicationCreateSchema } from "@merrakii/shared";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/auth-guard.js";
import { normalizePhone } from "../lib/phone.js";

const uuidParam = z.string().uuid();

export const applicationRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/applications",
    { preHandler: requireUser },
    async (request, reply) => {
      const parsed = applicationCreateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid payload", details: parsed.error.flatten() });
      }
      const user = request.authUser!;

      const program = await prisma.program.findUnique({
        where: { id: parsed.data.programId },
        include: { institute: true },
      });
      if (!program) return reply.status(404).send({ error: "Program not found" });

      const application = await prisma.application.create({
        data: {
          userId: user.id,
          programId: program.id,
          status: "SUBMITTED",
          name: parsed.data.name,
          phoneSnapshot: normalizePhone(user.phone),
          email: parsed.data.email,
          address: parsed.data.address,
          dateOfBirth: new Date(parsed.data.dateOfBirth),
          gender: parsed.data.gender,
          parentNamePrimary: parsed.data.parentNamePrimary,
          parentNameSecondary: parsed.data.parentNameSecondary,
          lastPassedClass: parsed.data.lastPassedClass,
          board: parsed.data.board,
          percentage: parsed.data.percentage,
          studyMode: parsed.data.studyMode,
          documentUploadNote: "Upload later (MVP)",
        },
      });

      return reply.status(201).send({ application });
    },
  );

  app.get("/applications/mine", { preHandler: requireUser }, async (request, reply) => {
    const user = request.authUser!;
    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        program: {
          include: {
            institute: { select: { id: true, name: true, city: true, isPartner: true } },
            exam: { select: { name: true } },
            paymentPlans: { where: { active: true }, take: 1 },
          },
        },
        paymentDetails: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return reply.send({ applications });
  });

  app.get("/applications/:applicationId", { preHandler: requireUser }, async (request, reply) => {
    const raw = (request.params as { applicationId: string }).applicationId;
    const idParsed = uuidParam.safeParse(raw);
    if (!idParsed.success) {
      return reply.status(400).send({ error: "Invalid application id" });
    }
    const user = request.authUser!;
    const application = await prisma.application.findFirst({
      where: { id: idParsed.data, userId: user.id },
      include: {
        program: {
          include: {
            institute: { select: { id: true, name: true, city: true, isPartner: true } },
            exam: { select: { name: true } },
            paymentPlans: { where: { active: true }, take: 1 },
          },
        },
        paymentDetails: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!application) return reply.status(404).send({ error: "Application not found" });
    return reply.send({ application });
  });
};
