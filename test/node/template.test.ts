import { AudioContainerFormatType, TosClient, TosServerError } from '../../src';
import {
  AudioConvertConfig,
  Transcode,
  Container,
  Video,
  Audio,
} from '../../src/methods/bucket/templatesV2';
import { ContainerFormatType } from '../../src/TosExportEnum';
import { tosOptions } from '../utils/options';

describe('template', () => {
  const client = new TosClient(tosOptions);
  const TEST_BUCKET = 'js-sdk' + Date.now();
  beforeAll(async () => {
    await client.createBucket({ bucket: TEST_BUCKET });
  });

  afterAll(async () => {
    await client.deleteBucket(TEST_BUCKET);
  });

  it('audio convert template crud', async () => {
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
    const res = await client.putAudioConvertTemplate({
      bucket: TEST_BUCKET,
      name: 'test',
      audioConvertConfig: config,
    });
    expect(res.data.ID).toBeDefined();

    await client.putAudioConvertTemplate({
      bucket: TEST_BUCKET,
      name: 'test2',
      audioConvertConfig: config,
    });

    const getRes = await client.getAudioConvertTemplate({
      bucket: TEST_BUCKET,
      id: res.data.ID,
    });
    expect(getRes.data.ID).toBe(res.data.ID);
    expect(getRes.data.Name).toBe('test');
    expect(getRes.data.AudioConvertConfig).toEqual(config);
    expect(getRes.data.Tag).toBe('AudioConvert');

    const listRes = await client.listAudioConvertTemplates({
      bucket: TEST_BUCKET,
    });
    expect(listRes.data.AudioConvertTemplates.length).toBe(2);
    const found = listRes.data.AudioConvertTemplates.find(
      (item) => item.ID === res.data.ID
    );
    expect(found).toBeDefined();
    expect(found?.Name).toBe('test');
    expect(found?.AudioConvertConfig).toEqual(config);
    expect(found?.Tag).toBe('AudioConvert');

    const deleteRes = await client.deleteAudioConvertTemplate({
      bucket: TEST_BUCKET,
      id: res.data.ID,
    });
    expect(deleteRes.statusCode).toBe(204);

    try {
      await client.getAudioConvertTemplate({
        bucket: TEST_BUCKET,
        id: res.data.ID,
      });
      fail('should not get template');
    } catch (e) {
      const err = e as TosServerError;
      console.log('status code', err.statusCode);
      expect(err.statusCode).toBe(404);
    }
  });

  it('different AudioContainerFormatType test', async () => {
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
      const name = `test-audio-template-${containerFormatType}`;
      const res = await client.putAudioConvertTemplate({
        bucket: TEST_BUCKET,
        name: name,
        audioConvertConfig: config,
      });

      const getRes = await client.getAudioConvertTemplate({
        bucket: TEST_BUCKET,
        id: res.data.ID,
      });
      expect(getRes.data.ID).toBe(res.data.ID);
      expect(getRes.data.Name).toBe(name);
      expect(getRes.data.AudioConvertConfig.ContainerFormat).toEqual(containerFormatType);
    }
  });

  it('video convert template crud', async () => {
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
        }
      },
    };

    // 1. Create video convert template
    const createRes = await client.putVideoConvertTemplate({
      bucket: TEST_BUCKET,
      name: 'test-video-template',
      transcodeConfig: transcodeConfig,
    });
    expect(createRes.data.ID).toBeDefined();

    // 2. Get video convert template to verify creation
    const getRes = await client.getVideoConvertTemplate({
      bucket: TEST_BUCKET,
      id: createRes.data.ID,
    });
    expect(getRes.data.ID).toBe(createRes.data.ID);
    expect(getRes.data.Name).toBe('test-video-template');
    expect(getRes.data.TranscodeConfig).toEqual(transcodeConfig);
    expect(getRes.data.Tag).toBe('Transcode');

    const listRes = await client.listVideoConvertTemplates({
      bucket: TEST_BUCKET,
    });
    const found = listRes.data.VideoConvertTemplates.find(
      (item) => item.ID === createRes.data.ID
    );
    expect(found).toBeDefined();
    expect(found?.Name).toBe('test-video-template');
    expect(found?.TranscodeConfig).toEqual(transcodeConfig);
    expect(found?.Tag).toBe('Transcode');

    // 3. Delete video convert template
    const deleteRes = await client.deleteVideoConvertTemplate({
      bucket: TEST_BUCKET,
      id: createRes.data.ID,
    });
    expect(deleteRes.statusCode).toBe(204);

    // 4. Verify deletion by trying to get the template (should fail)
    try {
      await client.getVideoConvertTemplate({
        bucket: TEST_BUCKET,
        id: createRes.data.ID,
      });
      fail('Should throw error for deleted video convert template');
    } catch (e) {
      const err = e as TosServerError;
      expect(err.statusCode).toBe(404);
    }
  });

  it('different container format type test', async () => {
    const containerFormatTypes = [
      ContainerFormatType.Mp4,
      ContainerFormatType.Ts,
    ];
    for (const containerType of containerFormatTypes) {
      console.log('test containerFormatType', containerType);
      const config: Transcode = {
        Container: {
          Format: containerType,
          ClipConfig: {
            Duration: 10,
          },
        },
        Video: {},
        Audio: {},
      };
      const name = `test-video-template-${containerType}`;
      const res = await client.putVideoConvertTemplate({
        bucket: TEST_BUCKET,
        name: name,
        transcodeConfig: config,
      });

      const getRes = await client.getVideoConvertTemplate({
        bucket: TEST_BUCKET,
        id: res.data.ID,
      });
      expect(getRes.data.ID).toBe(res.data.ID);
      expect(getRes.data.Name).toBe(name);
      expect(getRes.data.TranscodeConfig.Container?.Format).toEqual(containerType);
    }
  })
});
