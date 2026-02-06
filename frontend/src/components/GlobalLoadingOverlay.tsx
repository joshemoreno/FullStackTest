import { Backdrop, CircularProgress, Stack, Typography } from "@mui/material";
import { useAppSelector } from "../app/hooks";
import { selectIsLoading } from "../features/ui/uiSlice";

export function GlobalLoadingOverlay() {
  const open = useAppSelector(selectIsLoading);

  return (
    <Backdrop
      open={open}
      sx={{
        color: "#fff",
        zIndex: (theme) => theme.zIndex.modal + 200,
        backdropFilter: "blur(2px)",
      }}
    >
      <Stack spacing={2} alignItems="center">
        <CircularProgress color="inherit" />
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Processing…
        </Typography>
      </Stack>
    </Backdrop>
  );
}
