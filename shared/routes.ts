import { z } from 'zod';
import { insertWorkItemSchema, insertResourceColumnSchema, insertResourceConstantSchema, workItems, resourceColumns, resourceConstants } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  workItems: {
    list: {
      method: 'GET' as const,
      path: '/api/work-items',
      responses: {
        200: z.array(z.custom<typeof workItems.$inferSelect & { constants: typeof resourceConstants.$inferSelect[] }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/work-items',
      input: insertWorkItemSchema,
      responses: {
        201: z.custom<typeof workItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/work-items/:id',
      input: insertWorkItemSchema.partial(),
      responses: {
        200: z.custom<typeof workItems.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/work-items/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  resourceColumns: {
    list: {
      method: 'GET' as const,
      path: '/api/resource-columns',
      responses: {
        200: z.array(z.custom<typeof resourceColumns.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/resource-columns',
      input: insertResourceColumnSchema,
      responses: {
        201: z.custom<typeof resourceColumns.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/resource-columns/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    reorder: {
      method: 'POST' as const,
      path: '/api/resource-columns/reorder',
      input: z.object({
        columnIds: z.array(z.number()),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  resourceConstants: {
    upsert: {
      method: 'POST' as const,
      path: '/api/resource-constants',
      input: insertResourceConstantSchema,
      responses: {
        200: z.custom<typeof resourceConstants.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
