import * as c from "./constants";
import type { Color, State } from "./types";
import { setHslStrings } from "./utils";

export class MockBrowser {
    state: State
    storage: object
    runtime: object

    constructor() {
        this.state = JSON.parse(JSON.stringify(c.DEFAULT_STATE)) as State;
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
                        let color = this.state[this.state.activeBtn as keyof State] as Color;
                        color.hsv.h = message.payload.hue;
                        color.hsv.s = message.payload.saturation;
                        color.hsv.v = message.payload.value;
                        setHslStrings(color);
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