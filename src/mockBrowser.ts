import * as c from "./constants";
import type { Message, State } from "./types";

export class MockBrowser {
    state: State
    storage: object
    runtime: object
    tabs: object
    contextMenus: object

    constructor() {
        this.state = JSON.parse(JSON.stringify(c.DEFAULT_STATE)) as State;
        this.state.activeTabId = 1;

        this.storage = {
            sync: {
                get: (keys: string[]) => {
                    return Object.fromEntries(keys.map(key => [key, this.state[key as keyof State]]));;
                },
                set: (items: { [key: string]: any; }) => {
                    this.state = { ...this.state, ...items }
                }
            },
            onChanged: {
                addListener: (listener: any) => {
                    setInterval(() => listener(), 1000 / 60)
                }
            },
        }

        this.runtime = {
            sendMessage: (message: any) => {
            }
        }

        this.tabs = {
            sendMessage: (message: Message) => {
            }
        }

        this.contextMenus = {
            update: (id: string | number, updateProperties: browser.contextMenus._UpdateUpdateProperties) => { }
        }
    }
}