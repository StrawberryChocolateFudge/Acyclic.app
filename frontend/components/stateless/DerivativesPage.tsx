import { Button, Paper, SelectChangeEvent, Stack, Typography } from "@mui/material";
import { ArrowForward, } from "@mui/icons-material";
import * as React from "react";
import { AGPHSelect } from "../stateless/SelectMenus";
import { AGPHActionState } from "../stateful/ActionState";
import { CurrentPage } from "../stateful/Base";
import { AgphSelectOptions, TokenType } from "../../data";
import { AGPHStruct } from "../../../lib/traverseDAG";
import { WeAreOnTestnet } from "../testnet/weAreOnTestnet";

export interface DerivativesPageProps {
    setCurrentPage: (to: CurrentPage) => void;
    supportedTokens: TokenType[],
    agphOptions: AgphSelectOptions;
    selectedAction: string;
    setSelectedAction: (to: string) => void;
    agphList: AGPHStruct[]
}

export function DerivativesPage(props: DerivativesPageProps) {
    return <Paper elevation={3} sx={{
        width: "500px",
        borderRadius: "25px",
        paddingTop: "30px",
        paddingLeft: "20px",
        paddingRight: "20px"
    }}>
        <WeAreOnTestnet></WeAreOnTestnet>

        <Stack direction="row" justifyContent="space-between">

            <div>
                <img alt="Acyclic" src="/imgs/Acycliclogo.webp" width="200px" style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }} />
                <Typography sx={{ marginBottom: "5px" }} variant="h6" component="div"> Token Derivatives</Typography>
            </div>
            <Button sx={{
                height: "70px"
            }} variant="contained" onClick={() => {
                console.log("assets page nav pressed")
                props.setCurrentPage(CurrentPage.AssetsPage)
            }} endIcon={<ArrowForward />}>Assets</Button>

        </Stack>
        <AGPHSelect
            options={props.agphOptions}
            selected={props.selectedAction}
            handleSelect={(event: SelectChangeEvent) => { props.setSelectedAction(event.target.value) }}></AGPHSelect>
        <AGPHActionState agphList={props.agphList} agphTokens={props.agphOptions} valuetokens={props.supportedTokens} selected={props.selectedAction}></AGPHActionState>
    </Paper>;
}