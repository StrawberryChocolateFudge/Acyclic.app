import { Box, Button, Divider, Link, Paper, Stack, Typography } from "@mui/material";
import * as React from "react";
import { ChainIds, explorerAddressPath } from "../web3";

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