import { Autocomplete, Box, FormControl, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import * as React from "react";
import { supportedAssetsPlaceHolder, TokenType } from "../../data";
import TokenIcon from '@mui/icons-material/Token';

export interface SelectState {
    selected: string;
    handleSelect: (event: SelectChangeEvent) => void;
    options: Array<{ name: string, value: string, address: string }>
}

export function AGPHSelect(props: SelectState) {
    return <FormControl fullWidth>
        <Select
            value={props.selected}
            onChange={props.handleSelect}
        >

            {props.options.map((o) => <MenuItem key={o.value} value={o.value}>{o.name}</MenuItem>)}
            <MenuItem value={"new"}>Deploy New Pair</MenuItem>
        </Select>
    </FormControl>
}

function GetTokenLogo(props: { logo: string }) {
    if (props.logo === "") {
        return <TokenIcon sx={{ marginRight: "5px" }} />
    } else {
        return <img
            loading="lazy"
            width="20"
            src={props.logo}
        />
    }
}

export interface TokenSelectorAutocompleteProps {
    tokens: TokenType[];
    selectedValue: TokenType,
    setSelectedValue: (to: TokenType) => void;
}

export function TokenSelectorAutocomplete(props: TokenSelectorAutocompleteProps) {
    return (
        <Autocomplete
            disablePortal
            options={props.tokens}
            sx={{ width: "100%", marginTop: "10px" }}
            value={props.selectedValue}
            onChange={(event: React.SyntheticEvent, value: TokenType | null) => {
                if (value === null) {
                    props.setSelectedValue(supportedAssetsPlaceHolder[0])
                } else {
                    props.setSelectedValue(value);
                }
            }}
            renderInput={(params) => <TextField label="Address" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} {...params} />}
            getOptionLabel={option => option.address}
            renderOption={(props, option) => (<Box component="li" sx={{ '& > img': { flexShrink: 0 } }} {...props}>
                <GetTokenLogo logo={option.logo}></GetTokenLogo>
                {option.name} {option.address}
            </Box>)}
        />
    );
}

