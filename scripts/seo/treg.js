// Uses the existing Treg login without reading or copying API credentials.
// Raw responses are saved before interpretation; calls are never automatically retried.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
export function callTreg(args, rawPath) {
    let output;
    try { output = execFileSync('treg', ['--org', 'splendidmoving', '--json', 'call', ...args], { encoding: 'utf8', timeout: 120000, maxBuffer: 12 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (error) {
        writeFileSync(rawPath, error.stdout || '{}');
        throw new Error(`Treg call failed. Inspect ${rawPath}; no automatic retry was made.`);
    }
    writeFileSync(rawPath, output);
    const response = JSON.parse(output);
    if (response._treg?.http_status >= 400) throw new Error(`Upstream error; inspect ${rawPath}.`);
    return response;
}
