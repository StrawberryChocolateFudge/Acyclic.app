import { Box, Divider, Link, Paper, Stack, Button, Typography } from "@mui/material";

import * as React from "react";
import { TokenType } from "../../data";
import { ChainIds, explorerAddressPath } from "../../web3";
import { ArrowBack } from "@mui/icons-material";
import { CurrentPage } from "../stateful/Base";
import { WeAreOnTestnet } from "../testnet/weAreOnTestnet";


export interface AssetsPageProps {
    supportedTokens: TokenType[],
    setCurrentPage: (to: CurrentPage) => void;
}

export function AssetsPage(props: AssetsPageProps) {
    return <Paper elevation={3} sx={{
        width: "500px",
        height: "800px",
        borderRadius: "25px",
        paddingTop: "30px",
        paddingLeft: "20px",
        paddingRight: "20px"
    }}>
        <WeAreOnTestnet></WeAreOnTestnet>
        <Stack direction="row" justifyContent="space-between">
            <div>
                <img alt="Acyclic" src="/imgs/Acycliclogo.webp" width="200px" style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }} />
                <Typography sx={{ marginBottom: "5px" }} variant="h6" component="div">Available Assets</Typography>
            </div>
            <Button
                startIcon={<ArrowBack />}
                sx={{ height: "70px" }}
                variant="contained"
                onClick={() => props.setCurrentPage(CurrentPage.DerivativesPage)}
            >Derivatives</Button>
        </Stack>
        <AssetsActions tokens={props.supportedTokens}></AssetsActions>
    </Paper >
}


export interface AssetsActionsProps {
    tokens: Array<{ name: string, logo: string, address: string }>
}

function getArbitrumLogo() {
    return <img alt="arbitrum network" src="/imgs/Primary_horizontal_RGB.webp" width="200px" />
}

export function AssetsActions(props: AssetsActionsProps) {
    return <Paper>
        <Stack direction="row" justifyContent={"flex-start"} sx={{ backgroundColor: "white" }}>
            {getArbitrumLogo()}
        </Stack>
        <Divider sx={{ marginBottom: "20px" }} />
        {props.tokens.map(option => <Box
            key={option.name}
            sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
            <TokenDisplay name={option.name} address={option.address}></TokenDisplay>
        </Box>)}</Paper>
}

export interface TokenDisplayProps {
    name: string,
    address: string
}

function TokenDisplay(props: TokenDisplayProps) {
    return <Box sx={{ marginLeft: "5px", marginBottom: "5px" }}>
        <Box sx={{ width: "25px" }}>{props.name}</Box>
        <Link target={"_blank"} sx={{ overflow: "scroll" }} href={explorerAddressPath[ChainIds.ARBITRUM_SEPOLINA_TESTNET] + props.address}>{props.address}</Link>
    </Box>
}