// 用项目真实 protobuf 编解码验证部队协议；网络和 Cocos 界面边界在内存中隔离。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require(process.argv[2]);
const root = path.resolve(__dirname, '../..');
const scripts = path.join(root, 'assets/scripts');
const protobuf = require(path.join(scripts, '3rd/protobuf.js'));
const plain = value => JSON.parse(JSON.stringify(value));
let passed = 0;

function harness() {
    const cache = new Map(), timers = new Map(), sent = [], toasts = [], notifications = [];
    let timerId = 0, failSend = false, facilityRequests = 0, additionReads = 0;
    class Component { constructor() { this.isValid = true; this.node = { active: true }; } }
    class Label { constructor() { this.string = ''; this.node = { active: true }; } }
    class Node {}
    Node.EventType = {};
    const cc = {
        Component, Label, Node, Prefab: class {}, EditBox: class {}, Slider: class {},
        Sprite: class {}, ProgressBar: class {}, ScrollView: class {}, UITransform: class {},
        _decorator: { ccclass: () => target => target, property: () => () => {} },
        view: { on() {}, off() {} },
    };
    const heroes = new Map([1001, 1002, 1003, 1004].map(id => [id, {
        hero_type: id, heroType: id, cfgId: id, level: 1,
        config: { name: '武将' + id, speed: 3, attack: 100 },
    }]));
    const generals = {
        proxy: {
            getMyGeneral: id => heroes.get(id),
            getGeneralCfg: id => heroes.get(id)?.config,
            getMyActiveGeneralCnt: () => heroes.size,
            getUseGenerals: () => Array.from(heroes.values()),
        },
        isProtocolAvailable: name => !!proto.getIdByMsgType(name),
        qryMyGenerals() {},
    };
    const stubs = {
        'general/GeneralCommand': { default: { getInstance: () => generals } },
        'network/socket/NetManager': { NetManager: { getInstance: () => ({
            send(packet) {
                if (failSend) throw new Error('模拟发送失败');
                sent.push({ name: packet.name, bytes: packet.msg, data: proto.decode(packet.name, packet.msg) });
            },
        }) } },
        'general/ArmyCommand': { default: { getInstance: () => ({ proxy: { getArmyByOrder: () => null } }) } },
        'general/ArmyProxy': { ArmyCmd: { Idle: 0, Conscript: 1 } },
        'map/MapCommand': { default: { getInstance: () => ({
            cityProxy: { getMyCityById: () => null, getMyMainCity: () => null },
        }) } },
        'map/ui/MapUICommand': { default: { getInstance: () => ({
            proxy: {
                getMyFacilitys: () => undefined,
                getMyCityAddition: () => { additionReads++; return { armyCnt: 0, vanguardCnt: 0 }; },
            },
            qryCityFacilities: () => facilityRequests++,
        }) } },
        'login/LoginCommand': { default: { getInstance: () => ({ proxy: {} }) } },
        'common/AudioManager': { AudioManager: { instance: { playClick() {} } } },
        'utils/DateUtil': { default: {} },
        'utils/ListLogic': { default: class {} },
        'map/ui/GeneralHeadLogic': { default: class {} },
        'map/ui/GeneralListSkin': { applyGeneralListSkin() {} },
        'map/ui/RightHudSkin': {},
        'map/ui/TroopPanelSkin': { styleTroopPanel() {}, styleTroopCard() {} },
    };
    function load(name) {
        const file = path.resolve(scripts, name.endsWith('.ts') ? name : name + '.ts');
        const key = path.relative(scripts, file).replace(/\\/g, '/').replace(/\.ts$/, '');
        if (stubs[key]) return stubs[key];
        if (cache.has(file)) return cache.get(file).exports;
        const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
            target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true,
        } }).outputText;
        const module = { exports: {} };
        cache.set(file, module);
        vm.runInNewContext(output, {
            module, exports: module.exports, protobuf,
            console: { log() {}, warn() {}, error() {} },
            setTimeout: callback => { const id = ++timerId; timers.set(id, callback); return id; },
            clearTimeout: id => timers.delete(id),
            require: specifier => specifier === 'cc' ? cc
                : load(path.relative(scripts, path.resolve(path.dirname(file), specifier))),
        }, { filename: file });
        return module.exports;
    }
    const proto = load('network/pto/ProtoManager').ProtoManager.getInstance();
    const protoDir = path.join(root, 'assets/resources/protbuf/pto');
    for (const file of fs.readdirSync(protoDir).filter(name => name.endsWith('.proto'))) {
        proto.mergeRoot(proto._root, protobuf.parse(fs.readFileSync(path.join(protoDir, file), 'utf8')).root);
    }
    proto.parseIdMap(JSON.parse(fs.readFileSync(path.join(root, 'assets/resources/protbuf/net_pb.json'), 'utf8')).define);
    proto._isReady = true;
    const events = load('utils/EventMgr').EventMgr;
    const server = load('config/ServerConfig').ServerConfig;
    const logic = load('common/LogicEvent').LogicEvent;
    const net = load('network/socket/NetInterface').NetEvent;
    const command = load('general/TroopCommand').default.getInstance();
    events.on(logic.showToast, text => toasts.push(text), toasts);
    for (const name of [logic.updateTroop, logic.updateTroopList, logic.troopEditState, logic.troopEditSubmitted]) {
        events.on(name, () => notifications.push(name), notifications);
    }
    function receive(name, data) { events.emit(name, proto.decode(name, proto.encode(name, data))); }
    function authenticate() { events.emit(server.s2c_user_login_ok, { userId: 1 }); }
    function ready(list = []) {
        authenticate();
        command.requestTroops();
        receive(server.s2c_req_troop, { troopList: list });
    }
    function expire() {
        const entry = timers.entries().next().value;
        assert.ok(entry, '应存在待处理超时');
        timers.delete(entry[0]);
        entry[1]();
    }
    function createSettings(order = 1) {
        const Settings = load('map/ui/CityArmySettingLogic').default;
        const settings = new Settings();
        for (const name of ['labelId', 'labelCost', 'labelSoldierCnt', 'labelAddition', 'labelSpeed', 'labelAtkCity', 'labelResCost']) {
            settings[name] = new Label();
        }
        settings.tipNodes = [0, 1, 2].map(() => ({ active: true }));
        settings.editBoxs = [0, 1, 2].map(() => ({ string: '', node: { active: false } }));
        settings.sliders = [0, 1, 2].map(() => ({ progress: 0, node: { active: false } }));
        settings._gengeralLogics = [0, 1, 2].map(() => ({ setData(...args) { this.args = args; } }));
        settings.onEnable();
        settings.setData(0, order);
        return settings;
    }
    return { load, proto, events, server, logic, net, command, sent, toasts, notifications,
        timers, receive, authenticate, ready, expire, createSettings, heroes,
        set failSend(value) { failSend = value; },
        get facilityRequests() { return facilityRequests; },
        get additionReads() { return additionReads; } };
}

function test(name, run) {
    run();
    passed++;
    console.log('PASS ' + name);
}

test('登录/创建阶段不请求部队，打开编队才请求且合并重复查询', () => {
    const h = harness();
    h.authenticate();
    assert.equal(h.sent.length, 0);
    h.command.requestTroops();
    h.command.requestTroops();
    assert.equal(h.sent.length, 1);
    assert.equal(h.proto.getIdByMsgType(h.sent[0].name), 52);
    h.receive(h.server.s2c_req_troop, { troopList: [] });
    h.command.requestTroops();
    assert.equal(h.sent.length, 1);
    assert.equal(h.timers.size, 0);
});

test('真实协议 54/55 编解码：保留 0 号主将位、三格阵容，回包前不修改数据', () => {
    const h = harness();
    h.ready();
    let updated = null;
    h.events.on(h.logic.updateTroop, troop => updated = troop, h);
    assert.equal(h.command.editTroop(2, { 1001: 0, 1002: 1, 1003: 2 }), true);
    const packet = h.sent.at(-1);
    assert.equal(h.proto.getIdByMsgType(packet.name), 54);
    assert.deepEqual(plain(packet.data), { troopInfo: { troopIdx: 2, pos2HeroMap: { 0: 1001, 1: 1002, 2: 1003 } } });
    assert.equal(h.command.proxy.getTroop(2), null);
    h.receive(h.server.s2c_edit_troop, packet.data);
    assert.equal(h.proto.getIdByMsgType(h.server.s2c_edit_troop), 55);
    assert.equal(h.command.editingTroopIdx, 0);
    assert.equal(updated.getHeroIdxAt(0), 1001);
    assert.deepEqual(plain(updated.getHeroMap()), { 1001: 0, 1002: 1, 1003: 2 });
    assert.ok(h.notifications.includes(h.logic.updateTroopList));
});

test('配置页上阵、替换和下阵共用协议，空 map 能清空最后一名武将', () => {
    const h = harness();
    h.ready([{ troopIdx: 1, pos2HeroMap: { 0: 1001, 1: 1002 } }]);
    const settings = h.createSettings();
    settings.onChooseGeneral(null, { heroType: 1003 }, 0);
    assert.deepEqual(plain(h.sent.at(-1).data.troopInfo.pos2HeroMap), { 0: 1003, 1: 1002 });
    assert.equal(settings.labelCost.string, '编队保存中…');
    h.receive(h.server.s2c_edit_troop, h.sent.at(-1).data);
    assert.equal(settings._gengeralLogics[0].args[2].hero_type, 1003);
    const Item = h.load('map/ui/CityGeneralItemLogic').default;
    const item = new Item();
    item._order = 1;
    item._data = h.heroes.get(1003);
    item.onClickDown();
    assert.deepEqual(plain(h.sent.at(-1).data.troopInfo.pos2HeroMap), { 1: 1002 });
    h.receive(h.server.s2c_edit_troop, h.sent.at(-1).data);
    item._data = h.heroes.get(1002);
    item.onClickDown();
    assert.deepEqual(plain(h.sent.at(-1).data.troopInfo.pos2HeroMap), {});
    assert.equal(h.command.proxy.getTroop(1).getHeroCount(), 1);
    h.receive(h.server.s2c_edit_troop, h.sent.at(-1).data);
    assert.equal(h.command.proxy.getTroop(1).getHeroCount(), 0);
    assert.equal(settings.labelCost.string, '上阵 0/3');
});

test('拒绝无效 ID、越界位置、位置冲突、未拥有武将及跨队重复上阵', () => {
    const h = harness();
    h.ready([{ troopIdx: 2, pos2HeroMap: { 0: 1004 } }]);
    for (const [index, map] of [
        [0, {}], [-1, {}], [1.5, {}], [2 ** 32, {}], [1, null],
        [1, { 1001: -1 }], [1, { 1001: 3 }], [1, { 1001: 0.5 }],
        [1, { 1001: 0, 1002: 0 }], [1, { 1001: 0, '01001': 1 }],
        [1, { '-1': 0 }], [1, { 9999: 0 }], [1, { 1004: 0 }],
    ]) assert.equal(h.command.editTroop(index, map), false);
    assert.equal(h.sent.length, 1);
    assert.equal(h.command.editingTroopIdx, 0);
});

test('等待完整快照和编辑回包期间不允许覆盖旧阵容，也不重复发送', () => {
    const h = harness();
    h.authenticate();
    assert.equal(h.command.editTroop(1, { 1001: 0 }), false);
    assert.equal(h.sent.length, 1);
    h.receive(h.server.s2c_req_troop, { troopList: [] });
    assert.equal(h.command.editTroop(1, { 1001: 0 }), true);
    assert.equal(h.command.editTroop(1, { 1002: 1 }), false);
    assert.equal(h.command.editTroop(2, { 1002: 0 }), false);
    assert.equal(h.command.requestTroops(true), false);
    h.receive(h.server.s2c_edit_troop, { troopInfo: { troopIdx: 2, pos2HeroMap: { 0: 1003 } } });
    assert.equal(h.command.editingTroopIdx, 1, '其他部队更新不能解除当前保存状态');
    h.receive(h.server.s2c_edit_troop, { troopInfo: { troopIdx: 1, pos2HeroMap: { 0: 1001 } } });
    assert.equal(h.command.editTroop(1, { 1001: 0, 1002: 1 }), true);
});

test('超时后重新查询，取得服务器快照后才能继续编辑，不自动重发写请求', () => {
    const h = harness();
    h.ready();
    h.command.editTroop(1, { 1001: 0 });
    h.expire();
    assert.equal(h.command.editingTroopIdx, 0);
    assert.equal(h.sent.at(-1).name, h.server.c2s_req_troop);
    assert.equal(h.command.editTroop(1, { 1002: 1 }), false);
    h.expire();
    assert.equal(h.command.editTroop(1, { 1002: 1 }), false);
    h.receive(h.server.s2c_req_troop, { troopList: [{ troopIdx: 1, pos2HeroMap: { 0: 1001 } }] });
    assert.equal(h.command.editTroop(1, { 1001: 0, 1002: 1 }), true);
    assert.equal(h.sent.filter(p => p.name === h.server.c2s_edit_troop).length, 2);
});

test('协议未就绪、编码失败或发送异常不关闭选将页、不残留保存状态', () => {
    for (const failure of ['protocol', 'encode', 'send']) {
        const h = harness();
        h.ready();
        const List = h.load('map/ui/GeneralListLogic').default;
        const list = new List();
        list._type = 1;
        list.onEnable();
        if (failure === 'protocol') h.proto._isReady = false;
        if (failure === 'encode') h.proto.encode = () => null;
        if (failure === 'send') h.failSend = true;
        assert.equal(h.command.editTroop(1, { 1001: 0 }), false);
        assert.equal(list.node.active, true);
        assert.equal(h.command.editingTroopIdx, 0);
        assert.equal(h.timers.size, 0);
        assert.equal(h.notifications.includes(h.logic.troopEditSubmitted), false);
    }
});

test('错误回包和缺少 troopInfo 不清空原阵容，重新同步后允许重试', () => {
    for (const response of [{}, { troopInfo: null }, { code: 1, msg: { troopInfo: { troopIdx: 1 } } }]) {
        const h = harness();
        h.ready([{ troopIdx: 1, pos2HeroMap: { 0: 1001 } }]);
        h.command.editTroop(1, {});
        h.events.emit(h.server.s2c_edit_troop, response);
        assert.equal(h.command.proxy.getTroop(1).getHeroIdxAt(0), 1001);
        assert.equal(h.command.editingTroopIdx, 0);
        assert.equal(h.sent.at(-1).name, h.server.c2s_req_troop);
    }
});

test('断线后禁止写入，重登只查询；退出清理定时器并忽略迟到回包', () => {
    const h = harness();
    h.ready();
    h.command.editTroop(1, { 1001: 0 });
    h.events.emit(h.net.ServerDisconnected);
    assert.equal(h.command.editTroop(1, { 1002: 0 }), false);
    assert.equal(h.timers.size, 0);
    h.receive(h.server.s2c_edit_troop, { troopInfo: { troopIdx: 1, pos2HeroMap: { 0: 1001 } } });
    assert.equal(h.command.proxy.getTroop(1), null);
    h.authenticate();
    assert.equal(h.sent.at(-1).name, h.server.c2s_req_troop);
    assert.equal(h.sent.filter(p => p.name === h.server.c2s_edit_troop).length, 1);
    h.command.clearData();
    h.receive(h.server.s2c_req_troop, { troopList: [{ troopIdx: 1, pos2HeroMap: { 0: 1001 } }] });
    assert.equal(h.command.proxy.getTroops().length, 0);
    assert.equal(h.timers.size, 0);
});

test('没有旧主城和设施也能打开编队、上阵；三队翻页有边界', () => {
    const h = harness();
    h.ready();
    const RightItem = h.load('map/ui/RightArmyItemLogic').default;
    const item = new RightItem();
    item._troop = { troopIdx: 1 };
    item.order = 1;
    let args;
    h.events.on(h.logic.openArmySetting, (...value) => args = value, h);
    item.onClickSetting();
    assert.deepEqual(args, [0, 1]);
    const settings = h.createSettings();
    assert.equal(settings._isUnlock, true);
    assert.ok(settings._gengeralLogics.every(slot => slot.args[7] === true));
    assert.equal(h.facilityRequests, 0);
    assert.equal(h.additionReads, 0, '不读取默认 armyCnt=0 导致上阵锁定');
    settings.onClickPrev();
    assert.equal(settings._order, 3);
    settings.onClickNext();
    assert.equal(settings._order, 1);
    assert.doesNotThrow(() => settings.onClickQuick());
});

test('初始列表回包刷新配置页；选将动态排除已编队武将，失败保留、发送成功关闭', () => {
    const h = harness();
    h.authenticate();
    const settings = h.createSettings();
    h.receive(h.server.s2c_req_troop, { troopList: [{ troopIdx: 1, pos2HeroMap: { 0: 1001 } }] });
    assert.equal(settings._gengeralLogics[0].args[2].hero_type, 1001);
    const List = h.load('map/ui/GeneralListLogic').default;
    const list = new List();
    let rendered = [];
    list.scrollView = { node: { getComponent: () => ({ setData: data => rendered = data }) } };
    list.onEnable();
    list.setData([1001, 1002], 1, 1);
    assert.deepEqual(Array.from(rendered, x => x.hero_type), [1002, 1003, 1004], '不沿用过期排除名单');
    h.receive(h.server.s2c_edit_troop, { troopInfo: { troopIdx: 2, pos2HeroMap: { 0: 1002 } } });
    assert.deepEqual(Array.from(rendered, x => x.hero_type), [1003, 1004]);
    h.events.emit(h.logic.chosedGeneral, null, h.heroes.get(1002), 1);
    assert.equal(list.node.active, true);
    h.events.emit(h.logic.chosedGeneral, null, h.heroes.get(1003), 1);
    assert.equal(list.node.active, false);
    assert.deepEqual(plain(h.sent.at(-1).data.troopInfo.pos2HeroMap), { 0: 1001, 1: 1003 });
    h.receive(h.server.s2c_edit_troop, h.sent.at(-1).data);
    assert.equal(settings.labelCost.string, '上阵 2/3');
});

console.log('Troop integration: ' + passed + ' checks passed.');
process.exit(0);
