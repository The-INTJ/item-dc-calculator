import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

/**
 * Registers a schema with the OpenAPI registry under the given name so the
 * build step can emit it into `components.schemas`. Returns the same schema
 * so the registration inline with the definition.
 */
export function register<S extends z.ZodType>(name: string, schema: S): S {
  registry.register(name, schema);
  return schema;
}

// Re-exported so sibling schema modules import the already-extended `z`
// (guaranteeing `extendZodWithOpenApi` has run before any `.openapi()` call).
export { z };
