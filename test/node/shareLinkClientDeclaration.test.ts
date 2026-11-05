import path from 'path';
import ts from 'typescript';

const sourceFile = path.resolve(__dirname, '../../src/ShareLinkClient.ts');

describe('ShareLinkClient declaration compatibility', () => {
  it('emits an import that consumers on TypeScript < 4.5 can parse', () => {
    const program = ts.createProgram([sourceFile], {
      declaration: true,
      emitDeclarationOnly: true,
      skipLibCheck: true,
      noEmitOnError: false,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    });

    let declaration = '';
    program.emit(undefined, (fileName, text) => {
      if (fileName.endsWith('ShareLinkClient.d.ts')) {
        declaration = text;
      }
    });

    // Inline `type` modifiers (TS >= 4.5) are copied verbatim into the emitted
    // declaration and make it fail with TS1005 for consumers on older TS.
    const baseImport = declaration
      .split(/\r?\n/)
      .find((line) => line.includes("from './methods/base'"));

    expect(declaration).not.toBe('');
    expect(baseImport).toBeDefined();
    expect(baseImport).not.toMatch(/\btype\s+TOSConstructorOptions\b/);
  });
});
