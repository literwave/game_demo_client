// Compare script diagnostics against HEAD without changing project files.
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(__dirname, '../..');
const configPath = path.join(__dirname, 'tsconfig.cocos-scripts.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath), {}, configPath);
if (parsed.errors.length) throw new Error('Cannot parse script diagnostic configuration');
const normalize = file => path.resolve(file).replaceAll('\\', '/').toLowerCase();
const changedFiles = execFileSync('git', ['diff', '--name-only', '--', 'assets/scripts'], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}).trim().split(/\r?\n/).filter(file => file.endsWith('.ts'));
const originalSources = new Map(changedFiles.map(file => [normalize(path.join(root, file)),
    execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' })]));
function diagnostics(original) {
    const host = ts.createCompilerHost(parsed.options);
    const readFile = host.readFile.bind(host);
    host.readFile = file => original && originalSources.has(normalize(file))
        ? originalSources.get(normalize(file)) : readFile(file);
    const program = ts.createProgram(parsed.fileNames, parsed.options, host);
    return ts.getPreEmitDiagnostics(program).map(diagnostic => ({
        file: diagnostic.file ? path.relative(root, diagnostic.file.fileName).replaceAll('\\', '/') : '',
        line: diagnostic.file && diagnostic.start != null
            ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1 : 0,
        code: diagnostic.code,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    }));
}
const before = diagnostics(true);
const after = diagnostics(false);
const key = diagnostic => JSON.stringify([diagnostic.file, diagnostic.code, diagnostic.message]);
const counts = new Map();
before.forEach(diagnostic => counts.set(key(diagnostic), (counts.get(key(diagnostic)) || 0) + 1));
const introduced = after.filter(diagnostic => {
    const remaining = counts.get(key(diagnostic)) || 0;
    if (remaining) counts.set(key(diagnostic), remaining - 1);
    return remaining === 0;
});
const changedDiagnostics = after.filter(diagnostic => changedFiles.includes(diagnostic.file));
console.log(JSON.stringify({ before: before.length, after: after.length,
    changedScriptCount: changedFiles.length, changedScriptDiagnostics: changedDiagnostics,
    introducedDiagnostics: introduced }, null, 2));
if (introduced.length || changedDiagnostics.length) process.exitCode = 1;
