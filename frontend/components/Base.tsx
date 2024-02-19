import { Button, Divider, Paper, SelectChangeEvent, Stack, Typography } from "@mui/material";
import { ArrowForward, ArrowBack } from "@mui/icons-material";
import * as React from "react";
import { AGPHSelect } from "./SelectMenus";
import { AGPHActions } from "./ActionUi";
import { AssetsActions } from "./AssetsActions";
import { fetchAllGraphs, fetchAllSupportedAssets, supportedAssetsPlaceHolder } from "../data";
import { getLoadingMessages, LoadingMessageType, RippleLoading } from "./LoadingIndicators";
import { AGPHStruct } from "../../lib/traverseDAG";

enum CurrentPage {
    AssetsPage,
    DerivativesPage
}



export function Base() {

    const [showLoading, setShowLoading] = React.useState(true);
    const [loadingText, setLoadingText] = React.useState("");


    const [agphOptions, setAgphOptions] = React.useState([{ value: "", name: "", address: "", logo: "", valueInDollars: "" }]);
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
        return <Stack flexDirection="column" alignContent={"center"} width={"100%"} height={"100%"}>
            <Stack flexDirection={"row"} justifyContent="center" width={"100%"} height={"100%"}>
                <RippleLoading></RippleLoading>
            </Stack>
            <Stack flexDirection={"row"} justifyContent="center" width={"100%"} height={"100%"}>
                <Typography variant="h5" component="h5">{loadingText}</Typography>
            </Stack>
        </Stack >
    }

    if (currentPage === CurrentPage.DerivativesPage) {
        return <Paper elevation={3} sx={{
            width: "500px",
            borderRadius: "25px",
            paddingTop: "30px",
            paddingLeft: "20px",
            paddingRight: "20px"
        }}>
            <Stack direction="row" justifyContent="space-between">
                <div>
                    <img alt="Acyclic" src="/imgs/Acycliclogo.webp" width="200px" style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }} />
                    <Typography sx={{ marginBottom: "5px" }} variant="h6" component="div"> Token Derivatives</Typography>
                </div>
                <Button sx={{
                    height: "70px"
                }} variant="contained" onClick={setPage(CurrentPage.AssetsPage)} endIcon={<ArrowForward />}>Assets</Button>

            </Stack>
            <AGPHSelect options={agphOptions} selected={selectedAction} handleSelect={(event: SelectChangeEvent) => { setSelectedAction(event.target.value) }}></AGPHSelect>
            <AGPHActions agphList={agphList} agphTokens={agphOptions} valuetokens={supportedTokens} selected={selectedAction}></AGPHActions>
        </Paper>
    } else {
        return <Paper elevation={3} sx={{
            width: "500px",
            height: "800px",
            borderRadius: "25px",
            paddingTop: "30px",
            paddingLeft: "20px",
            paddingRight: "20px"
        }}>
            <Stack direction="row" justifyContent="space-between">
                <div>
                    <img alt="Acyclic" src="/imgs/Acycliclogo.webp" width="200px" style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }} />
                    <Typography sx={{ marginBottom: "5px" }} variant="h6" component="div">Available Assets</Typography>
                </div>
                <Button startIcon={<ArrowBack />} sx={{ height: "70px" }} variant="contained" onClick={setPage(CurrentPage.DerivativesPage)}>Derivatives</Button>
            </Stack>

            <AssetsActions tokens={supportedTokens}></AssetsActions>
        </Paper >
    }
}