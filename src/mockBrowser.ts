import * as c from "./constants";
import type { Message, LocalState, SyncState } from "./types";

export class MockBrowser {
    syncState: SyncState
    localState: LocalState
    storage: object
    runtime: object
    tabs: object
    contextMenus: object

    constructor() {
        this.syncState = JSON.parse(JSON.stringify(c.DEFAULT_SYNC_STATE)) as SyncState;
        this.localState = JSON.parse(JSON.stringify(c.DEFAULT_LOCAL_STATE)) as LocalState;
        this.localState.activeTabId = 1;

        this.storage = {
            sync: {
                get: (keys: string[]) => {
                    return Object.fromEntries(keys.map(key => [key, this.syncState[key as keyof SyncState]]));;
                },
                set: (items: { [key: string]: any; }) => {
                    this.syncState = { ...this.syncState, ...items }
                }
            },
            local: {
                get: (keys: string[]) => {
                    return Object.fromEntries(keys.map(key => [key, this.localState[key as keyof LocalState]]));;
                },
                set: (items: { [key: string]: any; }) => {
                    this.localState = { ...this.localState, ...items }
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