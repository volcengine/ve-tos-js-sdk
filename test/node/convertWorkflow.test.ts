import { AudioContainerFormatType, TosClient, TosServerError } from '../../src';
import { tosOptions } from '../utils/options';
import { NEVER_TIMEOUT } from '../utils';
import { PutConvertWorkflowInput } from '../../src/methods/bucket/workflowV2';
import { AudioConvertConfig } from '../../src/methods/bucket/templatesV2';
import { ContainerFormatType } from '../../src/TosExportEnum';

const client = new TosClient(tosOptions);
const TEST_BUCKET = `test-convert-workflow-${Date.now()}`;

describe('ConvertWorkflow CRUD operations', () => {
  beforeAll(async () => {
    await client.createBucket({ bucket: TEST_BUCKET });
  }, NEVER_TIMEOUT);

  afterAll(async () => {
    await client.deleteBucket(TEST_BUCKET);
  }, NEVER_TIMEOUT);

  it(
    'should complete ConvertWorkflow CRUD lifecycle',
    async () => {
      const putAudioConvertTemplateRes = await client.putAudioConvertTemplate({
        bucket: TEST_BUCKET,
        name: 'test',
        audioConvertConfig: {
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
        },
      });

      const putVideoConvertTemplateRes = await client.putVideoConvertTemplate({
        bucket: TEST_BUCKET,
        name: 'test-video-template',
        transcodeConfig: {
          TimeInterval: {
            Start: 0,
            Duration: 60,
          },
          Container: {
            Format: ContainerFormatType.Mp4,
            ClipConfig: {
              Duration: 10,
            },
          },
          Video: {
            Codec: 'h264',
            Width: 1920,
            Height: 1080,
            Crf: 23,
            PixFmt: 'yuv420p',
            BitRate: 5000000,
            Fps: 30,
            Remove: false,
          },
          Audio: {
            Codec: 'aac',
            BitRate: 128000,
            SampleFormat: 'fltp',
            SampleRate: 44100,
            Channels: 2,
            Remove: false,
          },
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
        },
      });

      const ruleId = `test-rule-${Date.now()}`;

      // 1. Create - 创建工作流规则
      const createInput: PutConvertWorkflowInput = {
        bucket: TEST_BUCKET,
        rules: [
          {
            ID: ruleId,
            Enabled: true,
            Prefix: 'videos/',
            ExtFilter: {
              VideoExts: ['mp4'],
              AudioExts: ['mp3'],
            },
            Topology: [['transcode'], ['audio-transcode']],
            Operations: {
              Transcode: [
                {
                  OperationID: 'transcode',
                  TemplateID: putVideoConvertTemplateRes.data.ID,
                  Output: {
                    Region: tosOptions.region,
                    Bucket: TEST_BUCKET,
                    Object: 'output/video.mp4',
                  },
                },
              ],
              AudioTranscode: [
                {
                  OperationID: 'audio-transcode',
                  TemplateID: putAudioConvertTemplateRes.data.ID,
                  Output: {
                    Region: tosOptions.region,
                    Bucket: TEST_BUCKET,
                    Object: 'output/audio.mp3',
                  },
                },
              ],
            },
          },
        ],
      };

      const createRes = await client.putConvertWorkflow(createInput);
      expect(createRes.statusCode).toBe(200);

      // 2. Get - 验证工作流创建成功
      const getRes = await client.getConvertWorkflow({ bucket: TEST_BUCKET });
      expect(getRes.data.Rules).toBeDefined();
      expect(getRes.data.Rules.length).toBe(1);
      expect(getRes.data.Rules[0].ID).toBe(ruleId);
      expect(getRes.data.Rules[0]).toEqual(createInput.rules[0]);

      // 3. Delete - 删除工作流规则
      const deleteRes = await client.deleteConvertWorkflow({
        bucket: TEST_BUCKET,
      });
      expect(deleteRes.statusCode).toBe(204);

      try {
        await client.getConvertWorkflow({ bucket: TEST_BUCKET });
        fail('Should throw error for deleted convert workflow');
      } catch (error) {
        console.log('get convert workflow error', error);
        const err = error as TosServerError;
        expect(err.statusCode).toBe(404);
      }
    },
    NEVER_TIMEOUT
  );
});
