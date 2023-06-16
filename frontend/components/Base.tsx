import { Button, Divider, Paper, SelectChangeEvent, Stack, Typography } from "@mui/material";
import * as React from "react";
import { PLMRSelect } from "./plmrSelect";
import { PLMRActions } from "./PlmrActions";
import { AssetsActions } from "./AssetsActions";

enum CurrentPage {
    AssetsPage,
    DerivativesPage
}

export function Base() {
    const [showLoading, setShowLoading] = React.useState(false);
    const [selectedAction, setSelectedAction] = React.useState("new");
    const [currentPage, setCurrentPage] = React.useState(CurrentPage.DerivativesPage);


    const options = [
        { name: "WZETA", value: "WZETA", address: "" },
        { name: "PLMRX", value: "PLMRX", address: "" },
        { name: "PLMR1", value: "PLMR1", address: "" },
        { name: "PLMR2", value: "PLMR2", address: "" },
        { name: "PLMR3", value: "PLMR3", address: "" },

    ]

    const setPage = (to: CurrentPage) => () => setCurrentPage(to);

    if (showLoading) {
        return <div className="lds-ripple"><div></div><div></div></div>
    }

    if (currentPage === CurrentPage.DerivativesPage) {
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
                    <img src="/imgs/logo.png" width="50px" style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }} />
                    <Typography sx={{ marginBottom: "5px" }} variant="h6" component="div"> Polymer - Token Derivatives</Typography>
                </div>
                <Button variant="outlined" onClick={setPage(CurrentPage.AssetsPage)}>Assets</Button>
            </Stack>
            <PLMRSelect options={options} selected={selectedAction} handleSelect={(event: SelectChangeEvent) => { setSelectedAction(event.target.value) }}></PLMRSelect>
            <PLMRActions selected={selectedAction}></PLMRActions>
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
                    <img src="/imgs/logo.png" width="50px" style={{ boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px" }} />
                    <Typography sx={{ marginBottom: "5px" }} variant="h6" component="div"> Polymer - Assets</Typography>
                </div>
                <Button variant="outlined" onClick={setPage(CurrentPage.DerivativesPage)}>Derivatives</Button>
            </Stack>
            <AssetsActions options={options}></AssetsActions>
        </Paper >
    }
}