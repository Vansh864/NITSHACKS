import { z } from 'zod';

export const jsonError = (code, message, status = 400) => {
  const err = new Error(message);
  err.code = code;
  err.statusCode = status;
  return err;
};

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const issue = result.error.issues[0];
        return next(jsonError('VALIDATION_ERROR', issue.message, 400));
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(jsonError('VALIDATION_ERROR', 'Invalid request body', 400));
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const issue = result.error.issues[0];
        return next(jsonError('VALIDATION_ERROR', issue.message, 400));
      }
      req.params = result.data;
      next();
    } catch (error) {
      next(jsonError('VALIDATION_ERROR', 'Invalid request params', 400));
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const issue = result.error.issues[0];
        return next(jsonError('VALIDATION_ERROR', issue.message, 400));
      }
      req.query = result.data;
      next();
    } catch (error) {
      next(jsonError('VALIDATION_ERROR', 'Invalid query params', 400));
    }
  };
}

export const appPermissionSchema = z.object({
  permissionName: z.string().min(1),
  status: z.enum(['allowed', 'restricted']),
});

export const accessEventSchema = z.object({
  resource: z.string().min(1),
  purpose: z.string().min(1).default('App access'),
  background: z.boolean().default(false),
  itemCount: z.number().int().nonnegative().default(0),
  count: z.number().int().nonnegative().default(1),
});

export const actionSchema = z.object({
  action: z.enum(['approve', 'restrict', 'suspend', 'revoke']),
  permissionName: z.string().optional(),
});

export const alertPatchSchema = z.object({
  status: z.enum(['open', 'acknowledged', 'resolved']),
});
