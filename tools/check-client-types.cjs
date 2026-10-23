// 对比工作区与 HEAD 的 TypeScript 诊断，区分本次引入问题和历史问题。
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ts = require(process.argv[2]);
const root = path.resolve(__dirname, '..');
const normalize = file => path.relative(root, file).replace(/\\/g, '/');
const tracked = cp.execFileSync('git', ['ls-files', 'assets/scripts'], { cwd: root, encoding: 'utf8' })
    .trim().split(/\r?\n/).filter(name => name.endsWith('.ts'));
const configFile = path.join(root, 'tsconfig.json');
const config = ts.readConfigFile(configFile, ts.sys.readFile);
config.config.compilerOptions = { ...config.config.compilerOptions, skipLibCheck: true,
    types: ['cc', 'cc.custom-macro', 'cc.env', 'jsb'].map(name => path.join(root, 'temp/declarations', name)),
};
config.config.include = ['assets/scripts/**/*.ts'];
config.config.exclude = ['assets/scripts/3rd'];
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configFile));
function diagnostics(baseline) {
    const host = ts.createCompilerHost(parsed.options);
    if (baseline) {
        const readFile = host.readFile.bind(host);
        const fileExists = host.fileExists.bind(host);
        const contents = new Map();
        host.fileExists = file => normalize(file).startsWith('assets/scripts/')
            ? tracked.includes(normalize(file)) : fileExists(file);
        host.readFile = file => {
            const name = normalize(file);
            if (!name.startsWith('assets/scripts/')) return readFile(file);
            if (!tracked.includes(name)) return undefined;
            if (!contents.has(name)) contents.set(name, cp.execFileSync('git', ['show', `HEAD:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
            return contents.get(name);
        };
    }
    const files = baseline ? tracked.map(name => path.join(root, name)) : parsed.fileNames;
    const program = ts.createProgram(files, { ...parsed.options, noEmit: true }, host);
    return ts.getPreEmitDiagnostics(program).map(item => ({
        file: item.file ? normalize(item.file.fileName) : '', code: item.code,
        message: ts.flattenDiagnosticMessageText(item.messageText, ' '),
        line: item.file && item.start != null ? item.file.getLineAndCharacterOfPosition(item.start).line + 1 : 0,
    }));
}
const baseline = diagnostics(true), current = diagnostics(false);
const key = item => `${item.file}:${item.code}:${item.message}`;
const counts = new Map();
baseline.forEach(item => counts.set(key(item), (counts.get(key(item)) || 0) + 1));
const introduced = current.filter(item => {
    const remaining = counts.get(key(item)) || 0;
    if (remaining) { counts.set(key(item), remaining - 1); return false; }
    return true;
});
const report = { baselineCount: baseline.length, currentCount: current.length, introduced };
fs.writeFileSync(path.join(root, 'temp/client-types-comparison.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(introduced.length ? 1 : 0);
