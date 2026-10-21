/** protobuf int64 / int32 在脚本里用数字。Long 对象转成 number。 */
export function toProtoInt(value: any): number {
    if (value == null || value === "") {
        return 0;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === "object" && typeof value.toNumber === "function") {
        return value.toNumber();
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

export class Role {
    userId: number = 0;
    name: string = "";
    sex: number = 0;
    serverId: number = 0;
    balance: number = 0;
    headIcon: number = 0;
    birthTime: number = 0;
}



export default class LoginProxy {
    //登录数据
    private _loginData: any = null;
    public serverId: number = 0;


    //角色数据
    private _roleData: Role = null;

    //角色资源
    private _roleResData: any = null;

    private _token: string = null;

    public clear() {
        console.log("clear");
        this._loginData = null;
        this._roleData = null;
        this._roleResData = null;
        this._token = ""
    }


    public saveEnterData(data: any): void {
        this.setRoleData(data);
    }

    public setRoleResData(data: any): void {
        this._roleResData = data;
    }


    public setRoleData(data: any): void {
        if (!this._roleData) {
            this._roleData = new Role();
        }
        this._roleData.userId = toProtoInt(this._loginData.userId);
        this._roleData.name = data.name;
        this._roleData.sex = data.sex;
        this._roleData.serverId = toProtoInt(this._loginData.serverId);
        this._roleData.headIcon = this._loginData.headIcon;
        this._roleData.birthTime = this._loginData.birthTime;
    }


    public getRoleData(): Role {
        return this._roleData;
    }


    public getRoleResData(): any {
        return this._roleResData;
    }


    public saveLoginData(data: any): void {
        this._loginData = data;
        if (this._loginData) {
            this._loginData.userId = toProtoInt(this._loginData.userId);
            this._loginData.serverId = toProtoInt(this._loginData.serverId);
        }
    }

    public getLoginData(): any {
        return this._loginData;
    }

    public getToken(): string {
        return this._token;
    }

    public getSession(): string {
        return this._loginData.session;
    }

    public setLoginDataUserAndServerId(data): void {
        this._loginData.userId = toProtoInt(data.userId);
        this._loginData.serverId = toProtoInt(data.serverId);
        this.serverId = this._loginData.serverId;
    }
}
