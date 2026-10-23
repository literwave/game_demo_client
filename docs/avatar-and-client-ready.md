# 头像与客户端加载完成

主界面左上角头像是更换入口。选择头像后点击“使用头像”，收到服务器确认才更新主界面和“使用中”标记。等待时禁止重复提交；发送失败、8 秒无响应或断线时恢复操作，保留已确认的头像。

## 配置

- `assets/resources/config/HeadIcon.json`：`Id` 是发给服务器的头像 ID，`HeroId` 用于查询武将名称，`Icon` 是图片路径，`Sort` 控制排序。ID、武将和图片文件名可以独立配置。
- `SystemOpen.json` 的 `Enum: HEAD_ICON` 对应更换头像功能；是否开放以服务器的系统开放列表为准。
- `Skill.json`：按技能 `Id` 找到对应行，再读取 `Icon`。技能列表和武将技能格子共用该映射，不根据 ID 或触发类型拼接图片名。
- `Icon` 推荐填写 `resources` 相对路径，例如 `ui/head_icon/avatar_1001`、`ui/skill/skill_1001`。同样支持带图片扩展名或 `/spriteFrame` 后缀的配置。
- 服务端头像为 `0` 时，默认展示头像表排序第一项；未知的非零 ID 不使用其它头像代替。

头像和技能 SpriteFrame 在进入地图的加载页中按最多 4 路并发准备。图片缺失会报告加载失败，不显示其它图片冒充。

## 协议与时机

| 方向 | 协议 | 内容 |
| --- | --- | --- |
| 客户端 → 服务端 | `User.c2s_change_head_icon`（48） | `headIcon: HeadIcon.Id` |
| 服务端 → 客户端 | `User.s2c_change_head_icon`（49） | 服务器确认的 `headIcon` |
| 客户端 → 服务端 | `User.c2s_client_load_ok`（50） | 空消息 |
| 服务端 → 客户端 | `User.s2c_client_load_ok`（51） | 空消息 |

加载通知在地图、主界面、必要图标就绪，加载页收起且界面事件注册完成后发送。每次连接只发送一次；重连保留地图时，等重新登录验证和玩家基础信息返回后再通知一次。回到登录页会清理此状态。

加载回包只确认就绪状态，不改变头像。玩家初始头像从 `s2c_user_base_info.headIcon` 读取。

## 验证

`tools/tests/avatar-config.test.cjs` 使用实际配置和 Protobuf 定义，在隔离的网络环境检查配置映射、加载门槛、重连、换头像确认、失败和缓存释放。传入 Creator 随附的 `typescript.js` 路径即可运行；没有独立 Node 时，可使用设置 `ELECTRON_RUN_AS_NODE=1` 的 Creator 可执行文件。

`tools/check-client-types.cjs` 以相同方式运行，比较当前脚本与 Git HEAD 的诊断，输出本次新增问题。

人工联调：点击左上角头像 → 选择另一头像 → 使用头像；确认服务器回包后 HUD 更新，重新登录后保留。小窗口验证头像列表可滚动，关闭按钮正常，拖动列表不触发地图操作。
