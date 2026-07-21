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
            }
        }
    }
}