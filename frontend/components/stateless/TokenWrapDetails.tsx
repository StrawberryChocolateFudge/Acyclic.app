import { Accordion, AccordionDetails, AccordionSummary, Paper, TableContainer, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from "@mui/material";
import { ArrowDownward } from "@mui/icons-material";
import * as React from "react";
import { WrapFeeDetails } from "./WrapInteractions";


export interface TokenWrapDetailsProps {
    tokenName: string;
    allowance: string;
    balance: string;
    wrapFeeDetails: WrapFeeDetails | undefined;
    tokenAddress: string;
}

export function TokenWrapDetails(props: TokenWrapDetailsProps) {

    function wrappedDetailsPlaceholder(data: any) {
        if (data === undefined || data === "") {
            return "Enter a mint amount"
        }
        return data;
    }

    return <Accordion>
        <AccordionSummary
            expandIcon={<ArrowDownward />}
            aria-controls="panel2-content"
            id="panel2-header"
        >
            <Typography>Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
            {props.tokenName === "" ? <CircularProgress></CircularProgress> :
                <TableContainer component={Paper}>
                    <Table aria-label="details table">
                        <TableHead>
                        </TableHead>
                        <TableBody>
                            <TableRow
                                key={"namerow1"}
                            >
                                <TableCell>Name:</TableCell>

                                <TableCell component="th" scope="row">
                                    {props.tokenName}
                                </TableCell>

                            </TableRow>
                            <TableRow
                                key={"addressrow1"}
                            >
                                <TableCell>Address:</TableCell>

                                <TableCell component="th" scope="row">
                                    {props.tokenAddress}
                                </TableCell>

                            </TableRow>
                            <TableRow
                                key={"balancerow1"}
                            >
                                <TableCell>My Balance:</TableCell>

                                <TableCell component="th" scope="row">
                                    {props.balance}
                                </TableCell>
                            </TableRow>
                            <TableRow
                                key={"allowancerow1"}

                            >
                                <TableCell>Allowance:</TableCell>

                                <TableCell component="th" scope="row">
                                    {props.allowance}
                                </TableCell>
                            </TableRow>
                            <TableRow
                                key={"WrapppedAmount"}

                            >
                                <TableCell>Wrap:</TableCell>

                                <TableCell component="th" scope="row">
                                    {wrappedDetailsPlaceholder(props.wrapFeeDetails?.wrappedAmount)}
                                </TableCell>
                            </TableRow>
                            <TableRow
                                key={"WrapAmountFee"}

                            >
                                <TableCell>Fee:</TableCell>

                                <TableCell component="th" scope="row">
                                    {wrappedDetailsPlaceholder(props.wrapFeeDetails?.depositFee)}
                                </TableCell>
                            </TableRow>

                        </TableBody>
                    </Table>
                </TableContainer>
            }
        </AccordionDetails>
    </Accordion>
}