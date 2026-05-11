import { execSync } from 'child_process';

/**
 * Script to find and kill processes running on a specific port.
 * Optimized for Windows environments.
 */
function killPort(port: number) {
  try {
    console.log(`🔍 Checking for processes on port ${port}...`);
    
    // Find the PID of the process using the port
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = output.split('\n').filter(line => line.includes('LISTENING'));

    if (lines.length === 0) {
      console.log(`✅ No processes found on port ${port}.`);
      return;
    }

    const pids = new Set<string>();
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    });

    if (pids.size === 0) {
      console.log(`✅ No active PIDs found for port ${port}.`);
      return;
    }

    console.log(`🚀 Found PIDs: ${Array.from(pids).join(', ')}. Terminating...`);
    
    pids.forEach(pid => {
      try {
        execSync(`taskkill /F /PID ${pid}`);
        console.log(`💀 PID ${pid} terminated.`);
      } catch (err) {
        console.error(`❌ Failed to kill PID ${pid}:`, err);
      }
    });

    console.log(`✨ Port ${port} is now clear.`);
  } catch (error) {
    // If findstr finds nothing, it returns exit code 1
    console.log(`✅ Port ${port} is already clear or no process was found.`);
  }
}

const PORT = 4000;
killPort(PORT);
