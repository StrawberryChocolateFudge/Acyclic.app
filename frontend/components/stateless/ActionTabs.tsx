import { Tooltip, Box, Stack, Tab, Tabs, Typography, IconButton } from "@mui/material";
import * as React from "react";
import AddCardIcon from '@mui/icons-material/AddCard';
import { TokenType } from "../../data";
import { AGPHStruct } from "../../../lib/traverseDAG";
import { ApprovalInfo, UnWrap, Wrap } from "../stateless/WrapInteractions";
import GraphDialog from "../stateful/GraphDialogState";
import { ConnectedWallet } from "../stateful/ActionState";
import { ConnectWallet } from "./ConnectWallet";
import { Item } from "./Item";
import { watchAsset } from "../../web3";


export interface ActionTabProps {
    connectedWallet: ConnectedWallet;
    selected: string;
    selectedbalance: string;
    agphList: AGPHStruct[];
    wrapUnwrapTab: number;
    setWrapUnwrapTab: (to: number) => void;
    token1: TokenType;
    token2: TokenType;
    tokenMintAmount: string;
    setTokenMintAmount: (to: string) => void;

    tokenUnwrapAmount: string;
    setTokenUnwrapAmount: (to: string) => void;
    connectWalletClick: () => Promise<void>;

    approvalInfo: ApprovalInfo;

    feeDivider: number;

    refetchApprovalInfo: () => Promise<void>

    refetchSelectedBalance: () => Promise<void>
}


export function ActionTabs(props: ActionTabProps) {

    async function addToWallet() {
        await watchAsset({
            address: props.approvalInfo.spenderAddress,
            symbol: props.selected,
            decimals: 18, // AGPH has 18 decimals always!
        }, console.error);
    }


    return <Box sx={{ width: '100%' }}>
        <Box>
            <GraphDialog symbol={props.selected} agpList={props.agphList}></GraphDialog>
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={props.wrapUnwrapTab} onChange={(event: React.SyntheticEvent, newValue: number) => {
                props.setWrapUnwrapTab(newValue);
            }} aria-label="wrap unwrap tabs">
                <Tab label="Wrap" />
                <Tab label="Unwrap" />

            </Tabs>
        </Box>
        {props.connectedWallet.isConnected ? <Item>
            <Stack flexDirection="column" justifyContent="center">
                <Typography variant="body1" component="div">Connected Wallet</Typography>
                <Typography variant="body1" component="div">{props.connectedWallet.address}</Typography>
                <Typography variant="body1" component="div">{props.selected} Balance: {props.selectedbalance} </Typography>
                <Stack flexDirection="row" justifyContent="center">
                    <Tooltip title="Add to wallet">
                        <IconButton sx={{ width: "50px", height: "50px" }} size="small" onClick={async () => await addToWallet()} ><AddCardIcon /></IconButton>
                    </Tooltip>
                </Stack>

            </Stack>
        </Item> : null}

        {props.connectedWallet.isConnected ?
            <TabPanel value={props.wrapUnwrapTab} index={0}>
                <Wrap
                    connectedWallet={props.connectedWallet}
                    selected={props.selected}
                    tokenMintAmount={props.tokenMintAmount}
                    setTokenMintAmount={(to: string) => props.setTokenMintAmount(to)}
                    approvalInfo={props.approvalInfo}
                    feeDivider={props.feeDivider}
                    refetchApprovalInfo={props.refetchApprovalInfo}
                ></Wrap>
            </TabPanel> : null}
        {props.connectedWallet.isConnected ?
            <TabPanel value={props.wrapUnwrapTab} index={1}>
                <UnWrap
                    connectedWallet={props.connectedWallet}
                    tokenUnwrapAmount={props.tokenUnwrapAmount}
                    setTokenUnwrapAmount={(to: string) => props.setTokenUnwrapAmount(to)}
                    selectedBalance={props.selectedbalance}
                    agphAddress={props.approvalInfo.spenderAddress}
                    refetchSelectedBalance={props.refetchSelectedBalance}
                ></UnWrap>
            </TabPanel>
            : <ConnectWallet connectWalletClick={props.connectWalletClick}></ConnectWallet>
        }
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

