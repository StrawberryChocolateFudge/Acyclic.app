import * as React from "react";


export function RippleLoading() {
    return <div className="lds-ripple"><div></div><div></div></div>
}

export enum LoadingMessageType {
    FETCHINGGRAPHS,
    FETCHINGASSETS,
    ERROROCCURED,
}

export function getLoadingMessages(messageType: LoadingMessageType, errMessage: string) {
    switch (messageType) {
        case LoadingMessageType.FETCHINGGRAPHS:
            return "Fetching Acyclic DiGraphs";
        case LoadingMessageType.FETCHINGASSETS:
            return "Fetching Assets";
        case LoadingMessageType.ERROROCCURED:
            return "An error occured " + errMessage
        default:
            return "LOADING"
    }

}