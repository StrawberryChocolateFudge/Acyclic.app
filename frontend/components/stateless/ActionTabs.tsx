import { Box, Tab, Tabs } from "@mui/material";
import * as React from "react";
import { supportedAssetsPlaceHolder, TokenType } from "../../data";
import { AGPHStruct } from "../../../lib/traverseDAG";
import { UnWrap, Wrap } from "../stateless/WrapInteractions";
import { DeployNewPair } from "../stateless/DeployNewPair";
import GraphDialog from "../stateful/GraphDialogState";


export interface ActionTabProps {
    selected: string;
    agphList: AGPHStruct[];
    wrapUnwrapTab: number;
    setWrapUnwrapTab: (to: number) => void;
    token1: TokenType;
    token2: TokenType;
    tokenMintAmount: string;
    setTokenMintAmount: (to: string) => void;
    tokenDepositCost: TokenDepositCost;

    tokenUnwrapAmount: string;
    setTokenUnwrapAmount: (to: string) => void;
}

export type TokenDepositCost = {
    wrappedAmount: string; depositFee: string;
    totalDeposit: string;
}


export function ActionTabs(props: ActionTabProps) {
    return <Box sx={{ width: '100%' }}>
        <Box>
            <GraphDialog symbol={props.selected} agpList={props.agphList}></GraphDialog>
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={props.wrapUnwrapTab} onChange={(event: React.SyntheticEvent, newValue: number) => {
                props.setWrapUnwrapTab(newValue);
            }} aria-label="basic tabs example">
                <Tab label="Wrap" />
                <Tab label="Unwrap" />

            </Tabs>
        </Box>
        <TabPanel value={props.wrapUnwrapTab} index={0}>
            <Wrap
                token1={props.token1}
                token2={props.token2}
                tokenMintAmount={props.tokenMintAmount}
                setTokenMintAmount={(to: string) => props.setTokenMintAmount(to)}
                tokenDepositCost={props.tokenDepositCost}
            ></Wrap>
        </TabPanel>
        <TabPanel value={props.wrapUnwrapTab} index={1}>
            <UnWrap
                token1={props.token1}
                token2={props.token2}
                tokenUnwrapAmount={props.tokenUnwrapAmount}
                setTokenUnwrapAmount={(to: string) => props.setTokenUnwrapAmount(to)}
            ></UnWrap>
        </TabPanel>
    </Box >
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}
