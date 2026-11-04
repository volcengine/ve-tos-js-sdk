import { inspect } from 'util';
import TOS from '../../src/browser-index';

describe('rejected requests do not expose client credentials', () => {
  it('drops the signer and the signed headers from the rejected error', async () => {
    // Synthetic markers so the assertions cannot pass by accident, and a closed
    // loopback port so the failure happens before any TOS response exists.
    const client = new TOS({
      accessKeyId: 'AK_SYNTHETIC_MARKER',
      accessKeySecret: 'SK_SYNTHETIC_MARKER',
      stsToken: 'STS_SYNTHETIC_MARKER',
      region: 'cn-beijing',
      endpoint: '127.0.0.1:1',
      secure: false,
      maxRetryCount: 0,
    });

    let error: any;
    try {
      await client.putObject({
        bucket: 'bucket',
        key: 'key',
        body: Buffer.from('x'),
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();

    // The signer holds accessKeyId / secretAccessKey / securityToken.
    expect(error.config?.__retrySignature__).toBeUndefined();

    const headers = error.config?.headers ?? {};
    expect(headers.authorization).toBeUndefined();
    expect(headers['x-tos-security-token']).toBeUndefined();

    // What an application typically does with a rejected error: deep-log it,
    // attach it as a `cause`, or hand it to an error tracker.
    const serialized = inspect(error, { depth: 6 });
    expect(serialized).not.toContain('SK_SYNTHETIC_MARKER');
    expect(serialized).not.toContain('STS_SYNTHETIC_MARKER');
    expect(serialized).not.toContain('AK_SYNTHETIC_MARKER');
  });
});
