import { Stack, Typography } from "@mui/material";
import * as React from "react";
import { AssetsPage } from "../stateless/AssetsPage";
import { AgphSelectOptions, DEFAULT_AGPH_SELECT_OPTIONS, fetchAllGraphs, fetchAllSupportedAssets, supportedAssetsPlaceHolder } from "../../data";
import { getLoadingMessages, LoadingMessageType, LoadingPage, RippleLoading } from "../stateless/LoadingIndicators";
import { AGPHStruct } from "../../../lib/traverseDAG";
import { DerivativesPage } from "../stateless/DerivativesPage";

export enum CurrentPage {
    AssetsPage,
    DerivativesPage
}



export function Base() {
    //BASE COMPONENT APPLICATION STATE
    const [showLoading, setShowLoading] = React.useState(true);
    const [loadingText, setLoadingText] = React.useState("");

    const [agphOptions, setAgphOptions] = React.useState<AgphSelectOptions>(DEFAULT_AGPH_SELECT_OPTIONS);
    const [agphList, setAgphList] = React.useState<AGPHStruct[]>([]);

    const [selectedAction, setSelectedAction] = React.useState("");
    const [currentPage, setCurrentPage] = React.useState(CurrentPage.DerivativesPage);

    const [supportedTokens, setSupportedTokens] = React.useState(supportedAssetsPlaceHolder);


    React.useEffect(() => {
        //This runs on page load only once!
        const loadGraphs = async () => {
            try {
                setLoadingText(getLoadingMessages(LoadingMessageType.FETCHINGASSETS, ""));

                const supportedAssets = await fetchAllSupportedAssets();
                setSupportedTokens(supportedAssets)
                setLoadingText(getLoadingMessages(LoadingMessageType.FETCHINGGRAPHS, ""));
                const graphs = await fetchAllGraphs();
                setAgphOptions(graphs.selectOptions);
                setAgphList(graphs.agphList);

                setSelectedAction(graphs.selectOptions[0].value);
                setShowLoading(false);
            } catch (err: any) {
                setLoadingText(getLoadingMessages(LoadingMessageType.ERROROCCURED, err.message));
            }
        }

        loadGraphs();
    }, []);


    const setPage = (to: CurrentPage) => () => setCurrentPage(to);

    if (showLoading) {
        return <LoadingPage
            loadingText={loadingText}
        ></LoadingPage>
    }

    if (currentPage === CurrentPage.DerivativesPage) {
        return <DerivativesPage
            supportedTokens={supportedTokens}
            setCurrentPage={setPage}
            agphOptions={agphOptions}
            selectedAction={selectedAction}
            setSelectedAction={setSelectedAction}
            agphList={agphList}
        ></DerivativesPage>
    } else {
        return <AssetsPage
            supportedTokens={supportedTokens}
            setCurrentPage={setPage}
        ></AssetsPage>
    }
}