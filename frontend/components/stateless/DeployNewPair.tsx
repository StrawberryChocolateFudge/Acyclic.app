import { Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import * as React from "react";
import { TokenType } from "../../data";

import { Item } from "./Item";
import { TokenSelectorAutocomplete } from "./SelectMenus";


export interface NewPairProps {
    token1: TokenType;
    setToken1: (to: TokenType) => void;
    token1Amount: string;
    setToken1Amount: (to: string) => void;
    token2: TokenType;
    setToken2: (to: TokenType) => void;
    token2Amount: string;
    setToken2Amount: (to: string) => void;
    valuetokens: TokenType[];
    agphTokens: TokenType[];
    deploymentCost: string;
    loadingDeploymentCost: boolean;
    deployPair: () => Promise<void>;
}

export function ShowDeploymentCostLoader(props: {
    message: string,
    showLoader: boolean
}) {

    if (props.showLoader) {
        return <Item>
            <CircularProgress></CircularProgress>
        </Item>
    }
    return <Item>
        <Typography sx={{ marginTop: "10px", marginBottom: "10px" }} variant="body1" component="div" >{props.message}</Typography>
    </Item>

}

function getDeploymentConstMessage(cost: string) {
    if (cost === "") {
        return "Recreating existing pairs have incrementing costs."
    } else {
        return `Deployment cost: ${cost} ETH`
    }
}


export function DeployNewPair(props: NewPairProps) {
    function isAgphFromName(name: string): boolean {
        return name.slice(0, 4) === "AGPH";
    }

    function getTokensForSelector(popAddress: string, popIsAgph: boolean) {
        const list = props.valuetokens.concat(props.agphTokens);
        if (popAddress !== "") {
            const filteredList: TokenType[] = []
            for (let i = 0; i < list.length; i++) {
                if (list[i].address !== popAddress) {
                    // If the token we popping from the list is an AGPH
                    if (popIsAgph) {
                        // Then if the value I'm comparing it is nOT AGPH I push that
                        // THis filters out all AGPH fron the list, so 2 can't be selected
                        if (!isAgphFromName(list[i].name)) {
                            filteredList.push(list[i])
                        }
                    } else {
                        filteredList.push(list[i]);
                    }
                }
            }
            return filteredList;
        }
        return list;
    }


    function isDeployButtonDisabled() {
        if (
            props.token1.address !== "" &&
            props.token2.address !== "" &&
            !isNaN(parseFloat(props.token1Amount)) &&
            !isNaN(parseFloat(props.token2Amount)) &&
            parseFloat(props.token1Amount) !== 0 &&
            parseFloat(props.token2Amount) !== 0) {

            return false;
        }

        return true;
    }


    return <Stack direction="column" justifyContent="center">
        <Typography sx={{ margin: "0 auto", paddingBottom: "20px", paddingTop: "20px" }} variant="body1" component="div">
            You can combine tokens and derive new tokens from them! Create the ultimate portfolio while holding less tokens! <br /> The amount determines how much token needs to be wrapped to create a new token.</Typography>

        <Divider />
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">The first token</Typography>
            <TokenSelectorAutocomplete selectedValue={props.token1} setSelectedValue={(val: TokenType) => {

                // Can't select the same as token2
                if (props.token2.address === val.address) {
                    return;
                }
                props.setToken1(val)
            }}
                tokens={getTokensForSelector(props.token2.address, isAgphFromName(props.token2.name))} ></TokenSelectorAutocomplete>
            <TextField
                value={props.token1Amount}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    props.setToken1Amount(event.target.value);
                }}

                type={"number"} autoComplete="off" label="Amount per token" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
        </Paper>
        <Divider sx={{ marginTop: "20px" }} />
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Second token</Typography>
            <TokenSelectorAutocomplete selectedValue={props.token2} setSelectedValue={(val: TokenType) => {

                if (props.token1.address === val.address) {
                    return;
                }
                props.setToken2(val)

            }} tokens={
                getTokensForSelector(props.token1.address, isAgphFromName(props.token1.name))
            }></TokenSelectorAutocomplete>
            <TextField
                value={props.token2Amount}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    props.setToken2Amount(event.target.value);
                }}

                type={"number"} autoComplete="off" label="Amount per token" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
        </Paper>
        <Divider sx={{ marginBottom: "10px" }} />
        <ShowDeploymentCostLoader message={getDeploymentConstMessage(props.deploymentCost)} showLoader={props.loadingDeploymentCost}></ShowDeploymentCostLoader>
        <Button onClick={async () => {
            await props.deployPair()
        }} disabled={isDeployButtonDisabled()} variant="contained" sx={{ marginTop: "20px", marginBottom: "20px  " }}>Deploy new pair</Button>
    </Stack>
}

export interface PairDeploymentSuccessProps {
    newPairName: string;
    refreshTime: number
}

export function PairDeploymentSuccess(props: PairDeploymentSuccessProps) {
    return <Stack direction="column" justifyContent="center">

        <Paper sx={{ padding: "20px", marginBottom: "20px" }}>
            <Typography variant="h5" component="div">Token Deployment Success</Typography>
            <Typography variant="body1" component="div">You created {props.newPairName}</Typography>
            <Typography variant="body1" component="div">The page will refresh in {props.refreshTime} seconds!</Typography>
        </Paper>
    </Stack>
}