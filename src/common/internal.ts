import { timingSafeEqual } from 'crypto';
import { UnAuthorizedError } from './exceptions';

/**
 * Guards the operations only sibling services may call (ekoru-transactions
 * adjusting stock after a payment or a refund). The secret is accepted only
 * from the `x-internal-secret` header of a direct service-to-service call; the
 * gateway never forwards that header on federated requests, so a browser
 * cannot reach these operations even though they are in the schema.
 */
export function assertInternal(provided: string | undefined): void {
  const expected = process.env.INTERNAL_SERVICE_SECRET;
  if (!expected) {
    throw new Error('INTERNAL_SERVICE_SECRET is not configured in stores');
  }
  const a = Buffer.from(provided ?? '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new UnAuthorizedError('Internal operation');
  }
}
