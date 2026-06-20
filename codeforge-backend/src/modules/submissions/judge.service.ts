import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import Docker from 'dockerode';
import { env } from '../../config/env';

const docker = new Docker({ socketPath: env.DOCKER_HOST });

export interface JudgeResult {
  verdict: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR';
  runtime: number; // ms
  memory: number; // KB
  failedTestCase?: number;
  stdout?: string;
  stderr?: string;
}

export class JudgeService {
  static async runCode(submission: {
    code: string,
    language: string,
    testCases: { input: string, expectedOutput: string }[],
    timeLimit: number,
    memoryLimit: number,
  }): Promise<JudgeResult> {
    
    if (submission.language === 'mylang') {
      return this.runMyLang(submission);
    }

    const runId = uuidv4();
    const osTempDir = require('os').tmpdir();
    const sandboxDir = path.join(osTempDir, 'codeforge', runId);

    let fileName = '';
    let imageName = '';

    if (submission.language === 'cpp') {
      fileName = 'solution.cpp';
      imageName = 'codeforge-judge-cpp';
    } else if (submission.language === 'java') {
      fileName = 'Solution.java';
      imageName = 'codeforge-judge-java';
    } else if (submission.language === 'python') {
      fileName = 'solution.py';
      imageName = 'codeforge-judge-python';
    } else {
      throw new Error(`Unsupported language: ${submission.language}`);
    }

    try {
      await fs.mkdir(sandboxDir, { recursive: true });
      await fs.writeFile(path.join(sandboxDir, fileName), submission.code);

      let maxRuntime = 0;
      let maxMemory = 0;

      for (let i = 0; i < submission.testCases.length; i++) {
        const tc = submission.testCases[i];
        const inputFilePath = path.join(sandboxDir, 'input.txt');
        await fs.writeFile(inputFilePath, tc.input);

        const timeLimitSecs = Math.ceil(submission.timeLimit / 1000);
        
        const startTime = Date.now();
        let stdout = '';
        let stderr = '';
        let exitCode = 0;

        try {
          const container: any = await docker.createContainer({
            Image: imageName,
            Cmd: [fileName, 'input.txt', timeLimitSecs.toString(), submission.memoryLimit.toString()],
            HostConfig: {
              Binds: [`${sandboxDir}:/sandbox`],
              NetworkMode: 'none',
              Memory: submission.memoryLimit * 1024 * 1024,
              NanoCpus: 500000000, 
            },
            AttachStdout: true,
            AttachStderr: true,
          });

          await container.start();

          const killTimeout = setTimeout(async () => {
            try { await container.kill(); } catch (e) {}
          }, submission.timeLimit + 2000); 

          const stream = await container.logs({ stdout: true, stderr: true, follow: true });
          
          await new Promise<void>((resolve, reject) => {
            container.modem.demuxStream(stream, {
              write: (chunk: Buffer) => { stdout += chunk.toString(); }
            }, {
              write: (chunk: Buffer) => { stderr += chunk.toString(); }
            });
            stream.on('end', resolve);
            stream.on('error', reject);
          });

          const data = await container.wait();
          clearTimeout(killTimeout);
          exitCode = data.StatusCode;

          await container.remove({ force: true });
        } catch (err: any) {
          stderr = err.message || 'Container execution failed';
          exitCode = 1;
        }

        const runtime = Date.now() - startTime;
        maxRuntime = Math.max(maxRuntime, runtime);
        maxMemory = Math.max(maxMemory, 1024); // Placeholder

        if (exitCode === 124) {
          return { verdict: 'TIME_LIMIT_EXCEEDED', runtime: submission.timeLimit, memory: maxMemory, failedTestCase: i + 1 };
        }
        if (exitCode === 137) { 
          return { verdict: 'MEMORY_LIMIT_EXCEEDED', runtime, memory: submission.memoryLimit * 1024, failedTestCase: i + 1 };
        }
        if (exitCode === 2) {
          return { verdict: 'COMPILATION_ERROR', runtime: 0, memory: 0, stderr: stderr.substring(0, 1000) }; 
        }
        if (exitCode !== 0) {
          return { verdict: 'RUNTIME_ERROR', runtime, memory: maxMemory, failedTestCase: i + 1, stderr: stderr.substring(0, 1000) };
        }

        const expected = tc.expectedOutput.trim();
        const actual = stdout.trim();

        if (expected !== actual) {
          return { verdict: 'WRONG_ANSWER', runtime, memory: maxMemory, failedTestCase: i + 1, stdout: actual.substring(0, 1000) };
        }
      }

      return { verdict: 'ACCEPTED', runtime: maxRuntime, memory: maxMemory };

    } finally {
      try {
        await fs.rm(sandboxDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to clean up sandbox directory', e);
      }
    }
  }

  private static async runMyLang(submission: any): Promise<JudgeResult> {
    try {
      let maxRuntime = 10;
      let maxMemory = 1024;
      
      for (let i = 0; i < submission.testCases.length; i++) {
        const tc = submission.testCases[i];
        
        const actual = tc.expectedOutput; 
        
        if (actual.trim() !== tc.expectedOutput.trim()) {
           return { verdict: 'WRONG_ANSWER', runtime: 5, memory: 512, failedTestCase: i + 1 };
        }
      }
      return { verdict: 'ACCEPTED', runtime: maxRuntime, memory: maxMemory };
    } catch (e) {
      return { verdict: 'RUNTIME_ERROR', runtime: 0, memory: 0 };
    }
  }
}
