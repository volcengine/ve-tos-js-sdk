import TOS from '../../src/browser-index';
import {
  deleteBucket,
  NEVER_TIMEOUT,
  sleepCache,
  testCheckErr,
} from '../utils';
import {
  testBucketName,
  isNeedDeleteBucket,
  tosOptions,
} from '../utils/options';
import https from 'https';
import fs from 'fs';
import { Agent, OutgoingMessage, Server } from 'http';
import { AddressInfo } from 'net';
import path from 'path';

describe('nodejs connection params', () => {
  beforeAll(async done => {
    const client = new TOS(tosOptions);
    // clear all bucket
    const { data: buckets } = await client.listBuckets();
    for (const bucket of buckets.Buckets) {
      if (isNeedDeleteBucket(bucket.Name)) {
        try {
          await deleteBucket(client, bucket.Name);
        } catch (err) {
          console.log('a: ', err);
        }
      }
    }
    // create bucket
    await client.createBucket({
      bucket: testBucketName,
    });
    await sleepCache();
    done();
  }, NEVER_TIMEOUT);
  afterAll(async done => {
    const client = new TOS(tosOptions);
    console.log('delete bucket.....');
    // delete bucket
    deleteBucket(client, testBucketName);
    done();
  }, NEVER_TIMEOUT);

  it(
    'connection Timeout',
    async () => {
      const client = new TOS({ ...tosOptions, connectionTimeout: 1 });
      try {
        await client.listBuckets();
      } catch (_err) {
        const err = _err as any;
        expect(err.toString().includes('Connect timeout'));
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'maxConnections',
    async () => {
      const taskNum = 10;
      const time1 = await runTest(1);
      const timeDefault = await runTest();
      console.log({ time1, timeDefault });
      expect(time1 > (timeDefault / taskNum) * 2).toBe(true);
      async function runTest(maxConnections?: number) {
        const client = new TOS({ ...tosOptions, maxConnections });
        const startTime = +new Date();
        const promises: Promise<unknown>[] = [];
        for (let i = 0; i < taskNum; ++i) {
          promises.push(client.listBuckets());
        }
        await Promise.all(promises);
        return +new Date() - startTime;
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'enableVerifySSL',
    async () => {
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const endpoint = `${address.address}:${address.port}`;
      const clientVerify = new TOS({ ...tosOptions, endpoint });
      const clientNoVerify = new TOS({
        ...tosOptions,
        endpoint,
        enableVerifySSL: false,
      });

      testCheckErr(() => clientVerify.listBuckets());

      const { data } = await clientNoVerify.listBuckets();
      expect(data.Buckets.length).toEqual(0);

      function startServer(): Promise<Server> {
        const options = {
          key: fs.readFileSync(
            path.resolve(__dirname, './self-signed-cert/server.key')
          ),
          cert: fs.readFileSync(
            path.resolve(__dirname, './self-signed-cert/server.crt')
          ),
        };

        return new Promise(res => {
          https
            .createServer(options, (_req: unknown, res: OutgoingMessage) => {
              res.end('{}');
            })
            .listen(function(this: Server) {
              res(this);
            });
        });
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'requestTimeout',
    async () => {
      testCheckErr(
        async () => {
          const client = new TOS({ ...tosOptions, requestTimeout: 50 });
          await client.listBuckets();
        },
        msg => msg.toLowerCase().includes('timeout')
      );

      const client = new TOS({ ...tosOptions, requestTimeout: 2000 });
      const { data } = await client.listBuckets();
      expect(data.Buckets).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'idleConnectionTime',
    async () => {
      const taskNum = 10;
      const idleConnectionTime = 3000;
      const client = new TOS({ ...tosOptions, idleConnectionTime });
      const promises: Promise<unknown>[] = [];
      for (let i = 0; i < taskNum; ++i) {
        promises.push(client.listBuckets());
      }
      const agent: Agent = (client as any).httpsAgent;
      expect(Object.values(agent.sockets).flat().length).toEqual(taskNum);
      await Promise.all(promises);
      expect(Object.values(agent.freeSockets).flat().length).toEqual(taskNum);

      await new Promise(r => setTimeout(r, idleConnectionTime + 500));
      expect(Object.values(agent.freeSockets).flat().length).toEqual(0);
    },
    NEVER_TIMEOUT
  );
});
