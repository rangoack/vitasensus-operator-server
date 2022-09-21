import { exec, execFile } from "child_process";
import { promisify } from "util";

/**
 * Execute simple shell file (async wrapper).
 */
export async function executeFile(
  file: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise(function (resolve, reject) {
    execFile(
      file,
      { shell: true, windowsHide: false, timeout: 5000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}

/**
 * Execute simple shell command (async wrapper).
 */
export const executeCommand = promisify(exec);
