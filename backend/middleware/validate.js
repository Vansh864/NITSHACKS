export const jsonError = (code, message, status = 400) => {
  const err = new Error(message);
  err.code = code;
  err.statusCode = status;
  return err;
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function invalid(message) {
  return { ok: false, message };
}

function validateValue(schema, value, fieldName = 'value') {
  if (schema === undefined) {
    return { ok: true, value };
  }

  if ('default' in schema && value === undefined) {
    value = schema.default;
  }

  if (schema.optional && (value === undefined || value === null)) {
    return { ok: true, value: undefined };
  }

  if (schema.type === 'string') {
    if (typeof value !== 'string') {
      return invalid(`${fieldName} must be a string`);
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      return invalid(`${fieldName} must be at least ${schema.minLength} characters long`);
    }
    return { ok: true, value };
  }

  if (schema.type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return invalid(`${fieldName} must be a number`);
    }
    if (schema.integer && !Number.isInteger(value)) {
      return invalid(`${fieldName} must be an integer`);
    }
    if (schema.min !== undefined && value < schema.min) {
      return invalid(`${fieldName} must be at least ${schema.min}`);
    }
    if (schema.max !== undefined && value > schema.max) {
      return invalid(`${fieldName} must be at most ${schema.max}`);
    }
    return { ok: true, value };
  }

  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return invalid(`${fieldName} must be a boolean`);
    }
    return { ok: true, value };
  }

  if (schema.type === 'enum') {
    if (!schema.values.includes(value)) {
      return invalid(`${fieldName} must be one of: ${schema.values.join(', ')}`);
    }
    return { ok: true, value };
  }

  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      return invalid(`${fieldName} must be an array`);
    }
    return { ok: true, value };
  }

  if (schema.type === 'object') {
    if (!isPlainObject(value)) {
      return invalid(`${fieldName} must be an object`);
    }

    const result = {};
    const required = schema.required || [];
    for (const [key, propertySchema] of Object.entries(schema.properties || {})) {
      const hasKey = Object.prototype.hasOwnProperty.call(value, key);
      const propertyValue = hasKey ? value[key] : undefined;

      if (!hasKey && required.includes(key)) {
        if (propertySchema.default !== undefined) {
          result[key] = propertySchema.default;
          continue;
        }
        return invalid(`${fieldName}.${key} is required`);
      }

      if (!hasKey && propertySchema.optional) {
        continue;
      }

      if (!hasKey && propertySchema.default !== undefined) {
        result[key] = propertySchema.default;
        continue;
      }

      if (!hasKey) {
        return invalid(`${fieldName}.${key} is required`);
      }

      const propertyResult = validateValue(propertySchema, propertyValue, `${fieldName}.${key}`);
      if (!propertyResult.ok) {
        return propertyResult;
      }
      result[key] = propertyResult.value;
    }

    return { ok: true, value: result };
  }

  return { ok: true, value };
}

function validateRequestData(schema, input, kind) {
  const result = validateValue(schema, input, kind);
  if (!result.ok) {
    return { ok: false, error: jsonError('VALIDATION_ERROR', result.message, 400) };
  }
  return { ok: true, value: result.value };
}

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const result = validateRequestData(schema, req.body, 'body');
      if (!result.ok) {
        return next(result.error);
      }
      req.body = result.value;
      next();
    } catch (error) {
      next(jsonError('VALIDATION_ERROR', 'Invalid request body', 400));
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const result = validateRequestData(schema, req.params, 'params');
      if (!result.ok) {
        return next(result.error);
      }
      req.params = result.value;
      next();
    } catch (error) {
      next(jsonError('VALIDATION_ERROR', 'Invalid request params', 400));
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const result = validateRequestData(schema, req.query, 'query');
      if (!result.ok) {
        return next(result.error);
      }
      req.query = result.value;
      next();
    } catch (error) {
      next(jsonError('VALIDATION_ERROR', 'Invalid query params', 400));
    }
  };
}

export const appPermissionSchema = {
  type: 'object',
  properties: {
    permissionName: { type: 'string', minLength: 1 },
    status: { type: 'enum', values: ['allowed', 'restricted'] },
  },
  required: ['permissionName', 'status'],
};

export const accessEventSchema = {
  type: 'object',
  properties: {
    resource: { type: 'string', minLength: 1 },
    purpose: { type: 'string', minLength: 1, default: 'App access' },
    background: { type: 'boolean', default: false },
    itemCount: { type: 'number', integer: true, min: 0, default: 0 },
    count: { type: 'number', integer: true, min: 0, default: 1 },
  },
  required: ['resource'],
};

export const actionSchema = {
  type: 'object',
  properties: {
    action: { type: 'enum', values: ['approve', 'restrict', 'suspend', 'revoke'] },
    permissionName: { type: 'string', minLength: 1, optional: true },
  },
  required: ['action'],
};

export const alertPatchSchema = {
  type: 'object',
  properties: {
    status: { type: 'enum', values: ['open', 'acknowledged', 'resolved'] },
  },
  required: ['status'],
};
