import { fillRequestHeaders } from '../../src/utils';

describe('test utils', () => {
  it('fillRequestHeaders', async () => {
    const input = {
      contentType: 'contentType1',
      contentDisposition: 'aa',
      expires: new Date(1677080479415),
      meta: {
        aa: 'bb',
        cc: 'dd',
      },
      headers: {
        'content-type': 'contentType2',
        'x-tos-meta-aa': 'aa',
        'x-tos-meta-bb': 'bb',
      } as any,
    };
    fillRequestHeaders(input, ['contentDisposition', 'expires', 'meta']);
    const headers = input.headers;
    expect(Object.keys(headers).length).toBe(6);
    expect(headers['content-type']).toBe('contentType2');
    expect(headers['content-disposition']).toBe('aa');
    expect(headers['expires']).toBe('Wed, 22 Feb 2023 15:41:19 GMT');
    expect(headers['x-tos-meta-aa']).toBe('aa');
    expect(headers['x-tos-meta-bb']).toBe('bb');
    expect(headers['x-tos-meta-cc']).toBe('dd');
  });
});
