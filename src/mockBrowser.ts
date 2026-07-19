import * as c from "./constants";
import type { State } from "./interfaces";
import { setHslStrings } from "./utils";

export class MockBrowser {
    state: State
    storage: object
    runtime: object

    constructor() {
        this.state = c.DEFAULT_STATE;
        this.state.activeTabId = 1;
        this.storage = {
            onChanged: {
                addListener: (listener: any) => {
                    setInterval(() => listener(), 1000 / 60)
                }
            }
        }
        this.runtime = {
            sendMessage: (message: any) => {
                switch (message.message) {
                    case c.GET_STATE: {
                        return Promise.resolve(this.state)
                    }
                    case c.SAVE_STATE: break;
                    case c.CHANGE_COLORS: break;
                    case c.SET_ACTIVE_BUTTON: {
                        this.state.activeBtn = message.payload;
                    }; break;
                    case c.UPDATE_COLOR: {
                        switch (this.state.activeBtn) {
                            case c.FORE_BTN: {
                                this.state.fg.hue = message.payload.hue;
                                this.state.fg.saturation = message.payload.saturation;
                                this.state.fg.value = message.payload.value;
                                setHslStrings(this.state.fg);
                            } break;
                            case c.BACK_BTN: {
                                this.state.bg.hue = message.payload.hue;
                                this.state.bg.saturation = message.payload.saturation;
                                this.state.bg.value = message.payload.value;
                                setHslStrings(this.state.bg);
                            } break;
                            case c.LINK_BTN: {
                                this.state.li.hue = message.payload.hue;
                                this.state.li.saturation = message.payload.saturation;
                                this.state.li.value = message.payload.value;
                                setHslStrings(this.state.li);
                            } break;
                            default: break;
                        }
                    }; break;
                    case c.RESET: {
                        this.state = JSON.parse(JSON.stringify(c.DEFAULT_STATE)) as State;
                        this.state.activeTabId = 1;
                    }; break;
                    default: break;
                }
            }
        }
    }
}