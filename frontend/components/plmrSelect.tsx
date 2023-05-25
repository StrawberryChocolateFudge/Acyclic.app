import { FormControl, InputLabel, Menu, MenuItem, Select, SelectChangeEvent, useThemeProps } from "@mui/material";
import * as React from "react";

export interface SelectState {
    selected: string;
    handleSelect: (event: SelectChangeEvent) => void;
    options: Array<{ name: string, value: string, address: string }>
}

export function PLMRSelect(props: SelectState) {
    return <FormControl fullWidth>
        <Select
            value={props.selected}
            onChange={props.handleSelect}
        >
            <MenuItem value={"new"}>Create New</MenuItem>
            {props.options.map((o) => <MenuItem key={o.value} value={o.value}>{o.name}</MenuItem>)}
        </Select>
    </FormControl>
}