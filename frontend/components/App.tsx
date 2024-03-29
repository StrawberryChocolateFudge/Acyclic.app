import * as React from "react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Base } from "./stateful/Base";
import { Stack } from "@mui/material";

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Stack sx={{ marginTop: "30px", marginBottom: "30px" }} direction="column" justifyContent="center">
                <Stack direction="row" justifyContent={"center"}>
                    <Base></Base>
                </Stack>
            </Stack>
        </ThemeProvider>
    );
}

export default App;