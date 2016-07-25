import {Injectable} from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import Settings from "../../settings/settings";

export {SettingKeys} from "../../settings/SettingKeys";

@Injectable()
export class SettingsService {
    private settings:Settings;

    constructor() {
        this.settings = IntoCpsApp.getInstance().getSettings();
    }

    get(key:string) {
        return this.settings.getSetting(key);
    }
}