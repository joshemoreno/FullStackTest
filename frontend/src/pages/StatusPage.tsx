import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchTransaction, resetTransaction } from "../features/transaction/transactionSlice";
import { fetchProducts } from "../features/product/productSlice";
import { Money } from "../components/Money";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ErrorIcon from "@mui/icons-material/Error";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export function StatusPage() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  const { txId, status, detail, loading, error } = useAppSelector((s) => s.transaction);

  const timerRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);

  // polling
  useEffect(() => {
    if (!txId) return;

    const stop = () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };

    const tick = async () => {
      attemptsRef.current += 1;
      await dispatch(fetchTransaction(txId));

      if (attemptsRef.current >= 30) stop();
    };

    tick();
    timerRef.current = window.setInterval(tick, 2000);

    return stop;
  }, [dispatch, txId]);

  // stop when final
  useEffect(() => {
    if (status && status !== "PENDING" && timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [status]);

  const ui = useMemo(() => {
    switch (status) {
      case "APPROVED":
        return {
          title: "Payment approved",
          subtitle: "Your transaction was completed successfully.",
          chipColor: "success" as const,
          icon: <CheckCircleIcon fontSize="large" />,
        };
      case "DECLINED":
        return {
          title: "Payment declined",
          subtitle: "Your bank or issuer declined the payment.",
          chipColor: "warning" as const,
          icon: <CancelIcon fontSize="large" />,
        };
      case "ERROR":
        return {
          title: "Payment error",
          subtitle: "We couldn’t process the payment. Please try again.",
          chipColor: "error" as const,
          icon: <ErrorIcon fontSize="large" />,
        };
      case "PENDING":
      default:
        return {
          title: "Processing payment",
          subtitle: "Please wait while we confirm the transaction.",
          chipColor: "default" as const,
          icon: <HourglassBottomIcon fontSize="large" />,
        };
    }
  }, [status]);

  async function backToProduct() {
    await dispatch(fetchProducts());
    dispatch(resetTransaction());
    nav("/");
  }

  async function copyTx() {
    if (!txId) return;
    try {
      await navigator.clipboard.writeText(txId);
    } catch {
      // ignore
    }
  }

  const isFinal = status && status !== "PENDING";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      <Container maxWidth="sm" sx={{ py: 5 }}>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="h4" fontWeight={800}>
              Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track the result of your payment and delivery info.
            </Typography>
          </Stack>

          {!txId && (
            <Alert severity="warning">
              No active transaction. Go back to the product page and try again.
            </Alert>
          )}

          {txId && (
            <Card
              elevation={2}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              {(!isFinal || loading) && <LinearProgress />}

              <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor:
                        status === "APPROVED"
                          ? "success.light"
                          : status === "DECLINED"
                          ? "warning.light"
                          : status === "ERROR"
                          ? "error.light"
                          : "grey.200",
                      color:
                        status === "APPROVED"
                          ? "success.dark"
                          : status === "DECLINED"
                          ? "warning.dark"
                          : status === "ERROR"
                          ? "error.dark"
                          : "text.secondary",
                    }}
                  >
                    {ui.icon}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                      <Typography variant="h6" fontWeight={800}>
                        {ui.title}
                      </Typography>
                      <Chip size="small" label={status ?? "PENDING"} color={ui.chipColor} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {ui.subtitle}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Tx */}
                <Stack spacing={1.25}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                    <Typography variant="body2" color="text.secondary">
                      Transaction ID
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<ContentCopyIcon />}
                      onClick={copyTx}
                      color="inherit"
                      sx={{ textTransform: "none" }}
                    >
                      Copy
                    </Button>
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      bgcolor: "grey.50",
                      border: "1px solid",
                      borderColor: "divider",
                      p: 1.25,
                      borderRadius: 2,
                      wordBreak: "break-all",
                    }}
                  >
                    {txId}
                  </Typography>

                  {error && <Alert severity="error">{error}</Alert>}
                </Stack>

                {/* Details */}
                {detail && (
                  <>
                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={2}>
                      {/* Amounts */}
                      <SectionTitle icon={<ReceiptLongIcon />} title="Summary" />
                      <Stack spacing={1}>
                        <Row
                          label="Amount"
                          value={<Money cents={detail.amount_in_cents} currency={detail.currency} />}
                        />
                        <Row
                          label="Base fee"
                          value={<Money cents={detail.base_fee_in_cents} currency={detail.currency} />}
                        />
                        <Row
                          label="Delivery fee"
                          value={<Money cents={detail.delivery_fee_in_cents} currency={detail.currency} />}
                        />
                        <Divider />
                        <Row
                          label={<Typography fontWeight={800}>Total</Typography>}
                          value={
                            <Typography fontWeight={900}>
                              <Money cents={detail.total_in_cents} currency={detail.currency} />
                            </Typography>
                          }
                        />
                      </Stack>

                      {/* Customer */}
                      <Divider />
                      <SectionTitle icon={<PersonIcon />} title="Customer" />
                      <Stack spacing={0.5}>
                        <Typography fontWeight={700}>{detail.customer.fullName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {detail.customer.email} • {detail.customer.phone}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {detail.customer.legalIdType}: {detail.customer.legalId}
                        </Typography>
                      </Stack>

                      {/* Delivery */}
                      <Divider />
                      <SectionTitle icon={<LocalShippingIcon />} title="Delivery" />
                      <Stack spacing={0.5}>
                        <Typography fontWeight={700}>{detail.delivery.addressLine1}</Typography>
                        {detail.delivery.addressLine2 ? (
                          <Typography variant="body2" color="text.secondary">
                            {detail.delivery.addressLine2}
                          </Typography>
                        ) : null}
                        <Typography variant="body2" color="text.secondary">
                          {detail.delivery.city}, {detail.delivery.region} • {detail.delivery.country}
                        </Typography>
                        {detail.delivery.notes ? (
                          <Typography variant="body2" color="text.secondary">
                            Notes: {detail.delivery.notes}
                          </Typography>
                        ) : null}
                      </Stack>

                      {/* ApiPay message (if any) */}
                      {(detail.apipay?.statusMessage || detail.apipay?.lastError) && (
                        <>
                          <Divider />
                          <Alert severity={detail.apipay?.lastError ? "error" : "info"}>
                            {detail.apipay?.lastError ?? detail.apipay?.statusMessage}
                          </Alert>
                        </>
                      )}

                      {/* Stock updated */}
                      {detail.status === "APPROVED" && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography color="success.main" fontWeight={700}>
                            Stock actualizado
                          </Typography>
                          {detail.stockDiscounted ? (
                            <Chip size="small" color="success" label="confirmed" />
                          ) : (
                            <Chip size="small" color="warning" label="pending" />
                          )}
                        </Stack>
                      )}
                    </Stack>
                  </>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Actions */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={backToProduct}
                    sx={{ borderRadius: 2, py: 1.2 }}
                  >
                    Back to product
                  </Button>

                  {!isFinal && (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => txId && dispatch(fetchTransaction(txId))}
                      sx={{ borderRadius: 2, py: 1.2 }}
                    >
                      Refresh status
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box>{value}</Box>
    </Stack>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color: "text.secondary" }}>{icon}</Box>
      <Typography fontWeight={900}>{title}</Typography>
    </Stack>
  );
}
