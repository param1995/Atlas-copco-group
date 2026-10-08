const { spawn } = require('node:child_process');

const angularCli = require.resolve('@angular/cli/bin/ng.js');
const angularProcess = spawn(
  process.execPath,
  [angularCli, 'serve', '--host', '127.0.0.1'],
  { stdio: 'inherit' }
);

let electronProcess;
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) {
    return;
  }

  stopping = true;
  if (angularProcess.exitCode === null) {
    angularProcess.kill();
  }
  if (electronProcess?.exitCode === null) {
    electronProcess.kill();
  }
  process.exitCode = exitCode;
}

angularProcess.once('error', () => stop(1));
angularProcess.once('exit', (code) => {
  if (!stopping) {
    stop(code ?? 1);
  }
});

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

async function launchWhenReady() {
  const deadline = Date.now() + 60000;

  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:4200');
      if (response.ok) {
        electronProcess = spawn(require('electron'), ['.', '--serve'], { stdio: 'inherit' });
        electronProcess.once('error', () => stop(1));
        electronProcess.once('exit', (code) => stop(code ?? 0));
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  if (!stopping) {
    stop(1);
  }
}

void launchWhenReady();