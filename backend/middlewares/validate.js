/**
 * Request validation middleware using Zod schemas
 *
 * @param {import("zod").ZodTypeAny | { body?: import("zod").ZodTypeAny, query?: import("zod").ZodTypeAny, params?: import("zod").ZodTypeAny }} schema
 */
const validate = (schema) => async (req, res, next) => {
  try {
    // If schema has explicit body/query/params sections
    if (schema.body || schema.query || schema.params) {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
    } else {
      // Default: treat entire schema as validating req.body
      req.body = await schema.parseAsync(req.body);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;
