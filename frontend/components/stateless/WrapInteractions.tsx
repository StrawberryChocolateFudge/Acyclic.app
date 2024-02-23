import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import * as React from "react";
import { approveAllowance, calculateApproveAmount, doDepositAction, doWithdrawAction } from "../../data";
import { ConnectedWallet } from "../stateful/ActionState";
import { Item } from "./Item";
import { TokenWrapDetails } from "./TokenWrapDetails";


export type ApprovalInfo = {
    token1Allowance: string;
    token1Balance: string;
    token1Symbol: string;
    token1Rate: number;
    token1DecimalShift: number;
    token1Address: string;

    token1ERC20Decimals: number;

    token2Allowance: string;
    token2Balance: string;
    token2Symbol: string;
    token2Rate: number;
    token2DecimalShift: number;
    token2Address: string;

    token2ERC20Decimals: number;



    spenderAddress: string;
}

export const APPROVALINFOPLACEHOLDER = {

    token1Allowance: "",
    token1Balance: "",
    token1Symbol: "",
    token1Rate: 0,
    token1DecimalShift: 0,
    token1Address: "",
    token2Allowance: "",
    token2Balance: "",
    token2Symbol: "",
    token2Rate: 0,
    token2DecimalShift: 0,
    token2Address: "",
    spenderAddress: "",

    token1ERC20Decimals: 18,
    token2ERC20Decimals: 18

}

interface WrapProps {
    connectedWallet: ConnectedWallet;
    selected: string
    tokenMintAmount: string;
    setTokenMintAmount: (to: string) => void;
    approvalInfo: ApprovalInfo;
    feeDivider: number
    refetchApprovalInfo: () => Promise<void>

}

export type WrapFeeDetails = {
    totalApprovalAmount: string,
    depositFee: string
    wrappedAmount: string
}

export function Wrap(props: WrapProps) {
    const token1WrapFeeDetails = calculateApproveAmount(props.tokenMintAmount, props.approvalInfo.token1Rate, props.approvalInfo.token1DecimalShift, props.feeDivider);
    const token2WrapFeeDetails = calculateApproveAmount(props.tokenMintAmount, props.approvalInfo.token2Rate, props.approvalInfo.token2DecimalShift, props.feeDivider);

    async function onApprove1() {

        if (!token1WrapFeeDetails?.totalApprovalAmount) {
            return;
        }
        await approveAllowance(props.approvalInfo.token1Address, props.approvalInfo.spenderAddress, token1WrapFeeDetails.totalApprovalAmount).then(async () => {
            await props.refetchApprovalInfo();
        });
    }

    async function onApprove2() {
        if (!token2WrapFeeDetails?.totalApprovalAmount) {
            return;
        }
        await approveAllowance(props.approvalInfo.token2Address, props.approvalInfo.spenderAddress, token2WrapFeeDetails.totalApprovalAmount).then(async () => {
            await props.refetchApprovalInfo();
        });
    }

    async function onDeposit() {
        await doDepositAction(props.approvalInfo.spenderAddress, props.tokenMintAmount).then(async () => {
            await props.refetchApprovalInfo();
        });
    }

    function isApproveDisabled() {
        if (props.tokenMintAmount === "") {
            return true;
        }

        if (parseFloat(props.tokenMintAmount) === 0) {
            return true;
        }
    }

    function hideZeroApprovals(totalApprovalAmount) {
        if (isNaN(parseFloat(totalApprovalAmount)) || parseFloat(totalApprovalAmount) === 0) {
            return "";
        }
        return totalApprovalAmount;

    }

    function depositDisabled() {
        if (!token1WrapFeeDetails) {
            return true;
        }

        if (!token2WrapFeeDetails) {
            return true;
        }

        if (!token1WrapFeeDetails.totalApprovalAmount) {
            return true;
        }

        if (!token2WrapFeeDetails.totalApprovalAmount) {
            return true;
        }

        if (!props.approvalInfo.token1Balance) {
            return true;
        }
        if (!props.approvalInfo.token2Balance) {
            return true;
        }

        if (parseFloat(token1WrapFeeDetails.totalApprovalAmount) > parseFloat(props.approvalInfo.token1Balance)) {
            return true;
        }
        if (parseFloat(token2WrapFeeDetails.totalApprovalAmount) > parseFloat(props.approvalInfo.token2Balance)) {
            return true;
        }

        if (parseFloat(token1WrapFeeDetails.totalApprovalAmount) > parseFloat(props.approvalInfo.token1Allowance)) {
            return true;
        }

        if (parseFloat(token2WrapFeeDetails.totalApprovalAmount) > parseFloat(props.approvalInfo.token2Allowance)) {
            return true;
        }

        // else I should be able to deposit, I got the balance and the approvals!

        return false;
    }

    return <Stack direction="column" justifyContent="center">
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Mint a new {props.selected} token by wrapping tokens.</Typography>
            <TextField value={props.tokenMintAmount} onChange={(event: React.ChangeEvent<HTMLInputElement>) => {

                if (isNaN(parseFloat(event.target.value)) && event.target.value !== "") {
                    return;
                }

                props.setTokenMintAmount(event.target.value);
            }} type="number" label="Mint Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }}></TextField>
            <Typography variant="subtitle1" component="div">To mint new tokens, first you need to deposit the backing. Approve spend for both then if you own the required balance click deposit.</Typography>

        </Paper>

        <Item sx={{ marginBottom: "10px", marginTop: "10px" }}>
            <Stack flexDirection={"row"} justifyContent="flex-start">

                <Button disabled={isApproveDisabled()} onClick={async () => await onApprove1()} variant="contained">Approve</Button>
                <Stack sx={{ margin: "0 auto" }} flexDirection="column" justifyContent="center">
                    <Typography variant="subtitle1" component="div">{hideZeroApprovals(token1WrapFeeDetails?.totalApprovalAmount)}</Typography>
                </Stack>


            </Stack>

            <TokenWrapDetails
                tokenName={props.approvalInfo.token1Symbol}
                allowance={props.approvalInfo.token1Allowance}
                balance={props.approvalInfo.token1Balance}
                wrapFeeDetails={token1WrapFeeDetails}
                tokenAddress={props.approvalInfo.token1Address}
                decimals={props.approvalInfo.token1ERC20Decimals}
            ></TokenWrapDetails>
        </Item>

        <Item sx={{ marginBottom: "10px" }}>
            <Stack flexDirection={"row"} justifyContent="flex-start">
                <Button disabled={isApproveDisabled()} onClick={async () => await onApprove2()} variant="contained">Approve</Button>
                <Stack sx={{ margin: "0 auto" }} flexDirection="column" justifyContent="center">
                    <Typography variant="subtitle1" component="div">{hideZeroApprovals(token2WrapFeeDetails?.totalApprovalAmount)}</Typography>
                </Stack>
            </Stack>
            <TokenWrapDetails
                tokenName={props.approvalInfo.token2Symbol}
                allowance={props.approvalInfo.token2Allowance}
                balance={props.approvalInfo.token2Balance}
                wrapFeeDetails={token2WrapFeeDetails}
                tokenAddress={props.approvalInfo.token2Address}
                decimals={props.approvalInfo.token2ERC20Decimals}
            ></TokenWrapDetails>
        </Item>
        <Button onClick={async () => await onDeposit()} disabled={depositDisabled()} variant="contained" sx={{ marginTop: "20px" }}>Deposit</Button>
    </Stack>
}

interface UnWrapProps {
    connectedWallet: ConnectedWallet;
    tokenUnwrapAmount: string;
    setTokenUnwrapAmount: (to: string) => void;
    selectedBalance: string;
    agphAddress: string;
    refetchSelectedBalance: () => Promise<void>

}

export function UnWrap(props: UnWrapProps) {
    function isUnwrapDisabled() {

        if (props.selectedBalance === "") {
            return true;
        }

        if (isNaN(parseFloat(props.selectedBalance))) {
            return true;
        }

        if (props.tokenUnwrapAmount === "") {
            return true;
        }

        if (isNaN(parseFloat(props.tokenUnwrapAmount))) {
            return true;
        }

        if (parseFloat(props.selectedBalance) < parseFloat(props.tokenUnwrapAmount)) {
            return true;
        }

        return false;
    }

    async function doUnwrap() {
        await doWithdrawAction(props.agphAddress, props.tokenUnwrapAmount).then(async () => {
            await props.refetchSelectedBalance();
        });
    }



    return <Stack direction="column" justifyContent="center">
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Unwrap a token. Burn it and recieve the assets backing it.</Typography>
            <TextField value={props.tokenUnwrapAmount} onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                if (isNaN(parseFloat(event.target.value)) && event.target.value !== "") {
                    return;
                }

                props.setTokenUnwrapAmount(event.target.value);
            }} required type="number" label="Unwrap Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
        </Paper>
        <Typography variant="subtitle1" component="div">After unwrapping you will have both tokens transferred to your account!</Typography>
        <Button onClick={async () => await doUnwrap()} disabled={isUnwrapDisabled()} variant="contained" sx={{ marginTop: "20px" }}>Unwrap</Button>
    </Stack>
}

