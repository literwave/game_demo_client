// /**服务器接口配置*/
import { _decorator } from 'cc';

const ServerConfig = {
    //新
    c2s_user_login: "Login.c2s_user_login",
    s2c_user_login: "Login.s2c_user_login",
    c2s_verify_login: "Login.c2s_verify_login",
    s2c_verify_login: "Login.s2c_verify_login",
    s2c_user_login_ok: "Login.s2c_user_login_ok",
    s2c_heart_beat: "Login.s2c_heart_beat",

    c2s_user_base_info: "User.c2s_user_base_info",
    s2c_user_base_info: "User.s2c_user_base_info",
    c2s_user_create: "User.c2s_user_create",
    s2c_user_create: "User.s2c_user_create",

    c2s_req_all_hero_base_info: "Hero.c2s_req_all_hero_base_info",
    s2c_req_all_hero_base_info: "Hero.s2c_req_all_hero_base_info",

    c2s_req_user_res: "User.c2s_req_user_res",
    s2c_req_user_res: "User.s2c_req_user_res",

    //旧
    account_login: "account.login",
    account_logout: "account.logout",
    account_reLogin: "account.reLogin",
    account_robLogin: "robLogin",

    role_create: "role.create",
    role_roleList: "role.roleList",
    role_myCity: "role.myCity",
    role_myRoleRes: "role.myRoleRes",
    role_myProperty: "role.myProperty",
    role_upPosition: "role.upPosition",
    role_posTagList: "role.posTagList",
    role_opPosTag: "role.opPosTag",

    nationMap_config: "nationMap.config",
    nationMap_scanBlock: "nationMap.scanBlock",
    nationMap_giveUp: "nationMap.giveUp",
    nationMap_build: "nationMap.build",
    nationMap_upBuild: "nationMap.upBuild",
    nationMap_delBuild: "nationMap.delBuild",

    city_facilities: "city.facilities",
    city_upFacility: "city.upFacility",


    general_myGenerals: "general.myGenerals",
    general_drawGeneral: "general.drawGeneral",
    general_composeGeneral: "general.composeGeneral",
    general_addPrGeneral: "general.addPrGeneral",
    general_convert: "general.convert",

    general_upSkill: "general.upSkill",
    general_downSkill: "general.downSkill",
    general_lvSkill: "general.lvSkill",

    army_myList: "army.myList",
    army_myOne: "army.myOne",
    army_dispose: "army.dispose",
    army_conscript: "army.conscript",
    army_assign: "army.assign",

    war_report: "war.report",
    war_read: "war.read",

    union_create: "union.create",
    union_join: "union.join",
    union_list: "union.list",
    union_member: "union.member",
    union_applyList: "union.applyList",
    union_dismiss: "union.dismiss",
    union_verify: "union.verify",
    union_exit: "union.exit",
    union_kick: "union.kick",
    union_appoint: "union.appoint",
    union_abdicate: "union.abdicate",
    union_modNotice: "union.modNotice",
    union_info: "union.info",
    union_log: "union.log",
    union_apply_push: "unionApply.push",

    interior_collect: "interior.collect",
    interior_openCollect: "interior.openCollect",
    interior_transform: "interior.transform",

    war_reportPush: "warReport.push",
    general_push: "general.push",
    army_push: "army.push",
    roleBuild_push: "roleBuild.push",
    roleCity_push: "roleCity.push",
    facility_push: "facility.push",
    roleRes_push: "roleRes.push",

    skill_list: "skill.list",
    skill_push: "skill.push",

    chat_login: "chat.login",
    chat_chat: "chat.chat",
    chat_history: "chat.history",
    chat_join: "chat.join",
    chat_exit: "chat.exit",
    chat_push: "chat.push",
}


export { ServerConfig };
