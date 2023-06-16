import { Box } from "@mui/material";
import * as React from "react";

export interface AssetsActionsProps {
    options: Array<{ name: string, value: string, address: string }>
}

export function AssetsActions(props: AssetsActionsProps) {
    return props.options.map(option => <Box key={option.name} component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
        {/* <img
                    loading="lazy"
                    width="20"
                    src={option.logo}
                /> */}
        {option.name} {option.address}
    </Box>)
}