import TosClient from '../../src';
import {
  ConvertJobInput,
  ConvertJobOutput,
} from '../../src/methods/bucket/mediaJob';
import {
  Container,
  Transcode,
  Video,
  Audio,
  AudioConvertConfig,
} from '../../src/methods/bucket/templatesV2';
import {
  AudioContainerFormatType,
  ContainerFormatType,
} from '../../src/TosExportEnum';
import { tosOptions } from '../utils/options';
import { clearBucket2, NEVER_TIMEOUT } from '../utils/index';

const TEST_BUCKET = 'mediajob' + Date.now();
const TEST_OBJECT = 'test.mp4';
const TARGET_BUCKET = 'target' + Date.now();
const TARGET_OBJECT = 'target.mp4';

const client = new TosClient(tosOptions);
describe('mediaJob', () => {
  beforeAll(async () => {
    await client.createBucket({ bucket: TEST_BUCKET });
    await client.putObject({
      bucket: TEST_BUCKET,
      key: TEST_OBJECT,
      body: Buffer.from('test'),
    });

    await client.createBucket({ bucket: TARGET_BUCKET });
  });

  afterAll(async () => {
    await clearBucket2(TEST_BUCKET, client);
    await clearBucket2(TARGET_BUCKET, client);
    await client.deleteBucket(TEST_BUCKET);
    await client.deleteBucket(TARGET_BUCKET);
  }, NEVER_TIMEOUT);

  it(
    'video convert job crud',
    async () => {
      const container: Container = {
        Format: ContainerFormatType.Mp4,
        ClipConfig: {
          Duration: 10,
        },
      };

      const video: Video = {
        Codec: 'h264',
        Width: 1920,
        Height: 1080,
        Crf: 23,
        PixFmt: 'yuv420p',
        BitRate: 5000000,
        Fps: 30,
        Remove: false,
      };

      const audio: Audio = {
        Codec: 'aac',
        BitRate: 128000,
        SampleFormat: 'fltp',
        SampleRate: 44100,
        Channels: 2,
        Remove: false,
      };

      const transcodeConfig: Transcode = {
        TimeInterval: {
          Start: 0,
          Duration: 60,
        },
        Container: container,
        Video: video,
        Audio: audio,
        Options: {
          AIGCMetadata: {
            Label: '1',
            ContentProducer: 'tes_producer',
            ProduceID: '123456',
            PropagateID: '654321',
            ReservedCode1: Buffer.from('123').toString('base64'),
            ReservedCode2: Buffer.from('456').toString('base64'),
          },
        },
      };

      const input: ConvertJobInput = {
        Object: TEST_OBJECT,
      };

      const output: ConvertJobOutput = {
        Region: tosOptions.region,
        Bucket: TARGET_BUCKET,
        Object: TARGET_OBJECT,
      };

      // create job by config
      const createJobByConfgRes = await client.createVideoConvertJob({
        bucket: TEST_BUCKET,
        input,
        transcodeConfig: {
          Transcode: transcodeConfig,
        },
        output,
      });

      expect(createJobByConfgRes.statusCode).toBe(200);
      expect(createJobByConfgRes.data.JobId).toBeDefined();

      const getJobRes = await client.getVideoConvertJob({
        bucket: TEST_BUCKET,
        jobId: createJobByConfgRes.data.JobId,
      });

      expect(getJobRes.statusCode).toBe(200);
      expect(getJobRes.data.JobID).toBe(createJobByConfgRes.data.JobId);
      expect(getJobRes.data.Input).toEqual(input);
      expect(getJobRes.data.Output).toEqual(output);
      expect(getJobRes.data.TranscodeConfig).toEqual({
        Transcode: transcodeConfig,
      });
      expect(getJobRes.data.CreateTime).toBeDefined();
      expect(getJobRes.data.State).toBeDefined();

      // create job by template
      const templateRes = await client.putVideoConvertTemplate({
        bucket: TEST_BUCKET,
        name: 'test',
        transcodeConfig,
      });

      const createJobByTemplateRes = await client.createVideoConvertJob({
        bucket: TEST_BUCKET,
        input,
        transcodeConfig: {
          TemplateID: templateRes.data.ID,
          Transcode: {},
        },
        output,
      });

      expect(createJobByTemplateRes.statusCode).toBe(200);
      expect(createJobByTemplateRes.data.JobId).toBeDefined();

      const getJobByTemplateRes = await client.getVideoConvertJob({
        bucket: TEST_BUCKET,
        jobId: createJobByTemplateRes.data.JobId,
      });

      expect(getJobByTemplateRes.statusCode).toBe(200);
      expect(getJobByTemplateRes.data.JobID).toBe(
        createJobByTemplateRes.data.JobId
      );
      expect(getJobByTemplateRes.data.Input).toEqual(input);
      expect(getJobByTemplateRes.data.Output).toEqual(output);
      expect(getJobByTemplateRes.data.TranscodeConfig.TemplateID).toBe(
        templateRes.data.ID
      );
      expect(getJobByTemplateRes.data.CreateTime).toBeDefined();
      expect(getJobByTemplateRes.data.State).toBeDefined();

      // create job by different container
      const containerFormats = [
        ContainerFormatType.Mp4,
        ContainerFormatType.Ts,
      ];
      for (const containerFormat of containerFormats) {
        console.log('containerFormat: ', containerFormat);
        const objectKey = 'test.' + containerFormat;
        const targetObjectKey = 'target' + '.' + containerFormat;
        await client.putObject({
          bucket: TEST_BUCKET,
          key: objectKey,
          body: Buffer.from('test'),
        });
        const createJobByContainerRes = await client.createVideoConvertJob({
          bucket: TEST_BUCKET,
          input: {
            Object: objectKey,
          },
          transcodeConfig: {
            Transcode: {
              Container: {
                Format: containerFormat,
              },
            },
          },
          output: {
            Bucket: TEST_BUCKET,
            Object: targetObjectKey,
            Region: tosOptions.region,
          },
        });

        const getJobByContainerRes = await client.getVideoConvertJob({
          bucket: TEST_BUCKET,
          jobId: createJobByContainerRes.data.JobId,
        });

        expect(getJobByContainerRes.data.Input).toEqual({
          Object: objectKey,
        });
        expect(getJobByContainerRes.data.Output).toEqual({
          Bucket: TEST_BUCKET,
          Object: targetObjectKey,
          Region: tosOptions.region,
        });
        expect(
          getJobByContainerRes.data.TranscodeConfig.Transcode?.Container?.Format
        ).toBe(containerFormat);
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'audio convert job crud',
    async () => {
      const input: ConvertJobInput = {
        Object: 'test.mp3',
      };
      const output: ConvertJobOutput = {
        Region: tosOptions.region,
        Bucket: TARGET_BUCKET,
        Object: 'target.mp3',
      };

      const config: AudioConvertConfig = {
        TimeInterval: {
          Start: 0,
          Duration: 10,
        },
        ContainerFormat: AudioContainerFormatType.Mp3,
        BitRate: 8000,
        BitRateOpt: 1,
        SampleFormat: 'fltp',
        SampleRate: 11025,
        Channels: 2,
      };

      const createJobByConfgRes = await client.createAudioConvertJob({
        bucket: TEST_BUCKET,
        input,
        audioConvertConfig: config,
        output,
      });

      expect(createJobByConfgRes.statusCode).toBe(200);
      expect(createJobByConfgRes.data.JobId).toBeDefined();

      const getJobRes = await client.getAudioConvertJob({
        bucket: TEST_BUCKET,
        jobId: createJobByConfgRes.data.JobId,
      });

      expect(getJobRes.statusCode).toBe(200);
      expect(getJobRes.data.JobID).toBe(createJobByConfgRes.data.JobId);
      expect(getJobRes.data.Input).toEqual(input);
      expect(getJobRes.data.Output).toEqual(output);
      expect(getJobRes.data.AudioConvertConfig).toEqual(config);
      expect(getJobRes.data.CreateTime).toBeDefined();
      expect(getJobRes.data.State).toBeDefined();
      expect(getJobRes.data.Code).toBeDefined();

      const containerFormatTypes = [
        AudioContainerFormatType.Wav,
        AudioContainerFormatType.Mp3,
        AudioContainerFormatType.Aac,
        AudioContainerFormatType.Flac,
        AudioContainerFormatType.Oga,
        AudioContainerFormatType.Ac3,
        AudioContainerFormatType.Opus,
      ];
      for (const containerFormatType of containerFormatTypes) {
        console.log('test containerFormatType', containerFormatType);
        const config: AudioConvertConfig = {
          TimeInterval: {
            Start: 0,
            Duration: 10,
          },
          ContainerFormat: containerFormatType,
        };
        const input2: ConvertJobInput = {
          Object: 'test.' + containerFormatType,
        };

        const output2: ConvertJobOutput = {
          Region: tosOptions.region,
          Bucket: TEST_BUCKET,
          Object: 'target.' + containerFormatType,
        };

        const createJobByContainerRes = await client.createAudioConvertJob({
          bucket: TEST_BUCKET,
          input: input2,
          audioConvertConfig: config,
          output: output2,
        });

        expect(createJobByContainerRes.statusCode).toBe(200);
        expect(createJobByContainerRes.data.JobId).toBeDefined();

        const getJobByContainerRes = await client.getAudioConvertJob({
          bucket: TEST_BUCKET,
          jobId: createJobByContainerRes.data.JobId,
        });

        expect(
          getJobByContainerRes.data.AudioConvertConfig.ContainerFormat
        ).toBe(containerFormatType);
      }
    },
    NEVER_TIMEOUT
  );
});
