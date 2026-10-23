import { TosClient } from '../../src';

// These tests only generate signatures: no real credentials or TOS requests.
const options = {
  accessKeyId: 'test-ak',
  accessKeySecret: 'test-sk',
  region: 'cn-beijing',
  endpoint: 'tos-cn-beijing.volces.com',
  bucket: 'example-bucket',
  secure: true,
};
const date = new Date('2026-01-02T03:04:05Z');
const credential = 'test-ak/20260102/cn-beijing/tos/request';

function expectRegion(url: URL) {
  expect(url.searchParams.get('X-Tos-Credential')).toBe(credential);
  expect(url.searchParams.get('X-Tos-Date')).toBe('20260102T030405Z');
  expect(url.searchParams.get('X-Tos-Signature')).toMatch(/^[a-f0-9]{64}$/);
}

describe('pre-signed URL region', () => {
  beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(date);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(['tos-cn-beijing.volces.com', 'tos-cn-beijing.ivolces.com'])(
    'uses the configured region with endpoint %s',
    (endpoint) => {
      const client = new TosClient({ ...options, endpoint });
      const url = new URL(
        client.getPreSignedUrl({
          key: 'uploads/file.jpg',
          method: 'PUT',
          expires: 600,
        })
      );
      expectRegion(url);
      expect(url.host).toBe(`example-bucket.${endpoint}`);
      expect(url.pathname).toBe('/uploads/file.jpg');
      expect(url.searchParams.get('X-Tos-Expires')).toBe('600');
      expect(url.searchParams.get('X-Tos-SignedHeaders')).toBe('host');
    }
  );

  it('preserves the legacy string input and default GET/expiry', () => {
    const client = new TosClient(options);
    const legacy = client.getPreSignedUrl('uploads/file.txt');
    const explicit = client.getPreSignedUrl({
      key: 'uploads/file.txt',
      method: 'GET',
    });
    expect(legacy).toBe(explicit);
    const url = new URL(legacy);
    expectRegion(url);
    expect(url.searchParams.get('X-Tos-Expires')).toBe('1800');
    expect(url.searchParams.get('X-Tos-Signature')).not.toBe(
      new URL(
        client.getPreSignedUrl({ key: 'uploads/file.txt', method: 'PUT' })
      ).searchParams.get('X-Tos-Signature')
    );
  });

  it('preserves per-request bucket, query and response overrides', () => {
    const client = new TosClient(options);
    const url = new URL(
      client.getPreSignedUrl({
        bucket: 'another-bucket',
        key: 'uploads/file.txt',
        method: 'HEAD',
        versionId: 'version-1',
        query: { 'custom-query': 'value' },
        response: { contentDisposition: 'attachment' },
      })
    );
    expectRegion(url);
    expect(url.host).toBe('another-bucket.tos-cn-beijing.volces.com');
    expect(url.searchParams.get('versionId')).toBe('version-1');
    expect(url.searchParams.get('custom-query')).toBe('value');
    expect(url.searchParams.get('response-content-disposition')).toBe(
      'attachment'
    );
  });

  it('preserves the region when using an alternative endpoint', () => {
    const client = new TosClient(options);
    const url = new URL(
      client.getPreSignedUrl({
        key: 'uploads/file.txt',
        alternativeEndpoint: 'download.example.com',
      })
    );
    expectRegion(url);
    expect(url.host).toBe('download.example.com');
    expect(url.pathname).toBe('/uploads/file.txt');
  });

  it('preserves custom domain URL construction', () => {
    const client = new TosClient({
      ...options,
      endpoint: 'storage.example.com',
    });
    const url = new URL(
      client.getPreSignedUrl({
        key: 'uploads/file.txt',
        isCustomDomain: true,
      })
    );
    expectRegion(url);
    expect(url.host).toBe('storage.example.com');
  });

  it('preserves temporary credentials', () => {
    const client = new TosClient({
      ...options,
      stsToken: 'test-session-token',
    });
    const url = new URL(client.getPreSignedUrl('uploads/file.txt'));
    expectRegion(url);
    expect(url.searchParams.get('X-Tos-Security-Token')).toBe(
      'test-session-token'
    );
  });

  it('uses the configured region for policy URLs and keeps their helpers', () => {
    const client = new TosClient(options);
    const result = client.preSignedPolicyURL({
      expires: 600,
      conditions: [{ key: 'key', value: 'uploads/', operator: 'starts-with' }],
    });
    const list = new URL(result.getSignedURLForList({ prefix: 'uploads/' }));
    const object = new URL(result.getSignedURLForGetOrHead('uploads/file.txt'));
    expectRegion(list);
    expectRegion(object);
    expect(list.host).toBe('example-bucket.tos-cn-beijing.volces.com');
    expect(list.searchParams.get('prefix')).toBe('uploads/');
    expect(list.searchParams.get('X-Tos-Expires')).toBe('600');
    expect(object.pathname).toBe('/uploads/file.txt');
    expect(object.searchParams.get('X-Tos-Signature')).toBe(
      list.searchParams.get('X-Tos-Signature')
    );
  });
});
