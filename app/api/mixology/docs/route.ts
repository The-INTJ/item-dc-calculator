import { ApiReference } from '@scalar/nextjs-api-reference';
import spec from '../openapi.json';

export const GET = ApiReference({
  content: JSON.stringify(spec),
});
