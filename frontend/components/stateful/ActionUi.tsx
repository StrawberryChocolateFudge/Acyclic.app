import { Box, Tab, Tabs } from "@mui/material";
import * as React from "react";
import GraphDialog from "./GraphDialogState";
import { supportedAssetsPlaceHolder, TokenType } from "../../data";
import { AGPHStruct } from "../../../lib/traverseDAG";
import { UnWrap, Wrap } from "../stateless/WrapInteractions";
import { DeployNewPair } from "../stateless/DeployNewPair";
import { ActionTabs, TokenDepositCost } from "../stateless/ActionTabs";

export interface AGPRActionsProps {
    selected: string,
    valuetokens: TokenType[],
    agphTokens: TokenType[],
    agphList: AGPHStruct[]
}


export function AGPHActions(props: AGPRActionsProps) {

    const [wrapUnwrapTab, setWrapUnwrapTab] = React.useState(0);

    const [token1, setToken1] = React.useState(supportedAssetsPlaceHolder[0]);
    const [token1Amount, setToken1Amount] = React.useState("");
    const [token2, setToken2] = React.useState(supportedAssetsPlaceHolder[0]);
    const [token2Amount, setToken2Amount] = React.useState("");

    const [deploymentCost, setDeploymentCost] = React.useState("");

    const [tokenMintAmount, setTokenMintAmount] = React.useState("");

    const [tokenDepositCost, setTokenDepositCost] = React.useState<TokenDepositCost>({ wrappedAmount: "", depositFee: "", totalDeposit: "" })

    const [tokenUnwrapAmount, setTokenUnwrapAmount] = React.useState("");

    const [dag, setDag] = React.useState<AGPHStruct | undefined>(undefined);

    React.useEffect(() => {
        async function getDeploymentCost() {
            //TODO:
            const cost = "0"
            setDeploymentCost(`Deployment Cost: ${"0"} ETH`);
        }

        if (token1.address !== "" && token2.address !== "") {
            getDeploymentCost()
        } else {
            setDeploymentCost("Creating new pairs that already exist will have added fees.")
        }

    }, [token1, token2])

    React.useEffect(() => {
        console.log(props.selected)
        // if (props.selected !== "new") {
        //  const dagOption = generateDag(props.agphList,props.selected)
        // }


    }, [props.selected])


    if (props.selected === "new") {
        return <DeployNewPair
            token1={token1}
            setToken1={(to: TokenType) => { setToken1(to) }}
            token1Amount={token1Amount}
            setToken1Amount={(to: string) => { setToken1Amount(to) }}
            token2={token2}
            setToken2={(to: TokenType) => { setToken2(to) }}
            token2Amount={token2Amount}
            setToken2Amount={(to: string) => setToken2Amount(to)}
            valuetokens={props.valuetokens}
            agphTokens={props.agphTokens}
            deploymentCost={deploymentCost}

        ></DeployNewPair>
    }


    return <ActionTabs
        selected={props.selected}
        agphList={props.agphList}
        wrapUnwrapTab={wrapUnwrapTab}
        setWrapUnwrapTab={setWrapUnwrapTab}
        token1={token1}
        token2={token2}
        tokenMintAmount={tokenMintAmount}
        setTokenMintAmount={setTokenMintAmount}
        tokenDepositCost={tokenDepositCost}
    ></ActionTabs>
}

