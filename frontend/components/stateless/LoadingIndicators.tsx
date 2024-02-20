import * as React from "react";
import { Stack, Typography } from "@mui/material";


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

export interface LoadingPageProps {
    loadingText: string
}

export function LoadingPage(props: LoadingPageProps) {
    return <Stack flexDirection="column" alignContent={"center"} width={"100%"} height={"100%"}>
        <Stack flexDirection={"row"} justifyContent="center" width={"100%"} height={"100%"}>
            <RippleLoading></RippleLoading>
        </Stack>
        <Stack flexDirection={"row"} justifyContent="center" width={"100%"} height={"100%"}>
            <Typography variant="h5" component="h5">{props.loadingText}</Typography>
        </Stack>
    </Stack >
}