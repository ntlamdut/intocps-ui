import {Injectable} from "@angular/core";

@Injectable()
export class NavigationService {
    openComponent:any;

    registerComponent(component: any) {
        this.openComponent = component;
    }

    canNavigate() {
        if (!this.openComponent)
            return true;

        if (this.openComponent.onNavigate()) {
            this.openComponent = null;
            return true;
        } else {
            return false;
        }
    }
}