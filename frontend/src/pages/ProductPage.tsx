import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  fetchProducts,
  selectProduct,
  selectSelectedProduct,
} from "../features/product/productSlice";
import {
  openModal,
  closeModal,
  setCustomer,
  setDelivery,
  setCard,
  initCheckout,
  payCheckout,
} from "../features/checkout/checkoutSlice";
import { setTxId, setPollPath } from "../features/transaction/transactionSlice";
import type { InitCheckoutRequest } from "../features/checkout/types";
import { detectBrand, formatCardNumber, sanitizeCardNumber } from "../features/checkout/cardUtils";
import { validateCustomer, validateDelivery, validateCard, hasErrors } from "../features/checkout/checkoutValidation";
import { withLoading } from "../features/ui/withLoading";

import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
  Grid
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";

import { Money } from "../components/Money";
import { validateCardBasic } from "../features/checkout/validators";

export function ProductPage() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  const productState = useAppSelector((s) => s.product);
  const products = useAppSelector((s) => s.product.items);
  const selectedProductId = useAppSelector((s) => s.product.selectedProductId);
  const selectedProduct = useAppSelector(selectSelectedProduct);

  const checkout = useAppSelector((s) => s.checkout);

  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const initPayload: InitCheckoutRequest | null = useMemo(() => {
    if (!selectedProduct) return null;
    return {
      productId: selectedProduct.productId,
      quantity: checkout.quantity,
      customer: checkout.customer,
      delivery: checkout.delivery,
    };
  }, [selectedProduct, checkout.quantity, checkout.customer, checkout.delivery]);

  const canPay =
    !!selectedProduct && selectedProduct.active && selectedProduct.stock > 0;

  async function handleContinueToSummary() {
    const ok = validateAll();
      if (!ok) return;

    if (!initPayload) return;
    const res = await withLoading(dispatch, () => dispatch(initCheckout(initPayload)).unwrap());
    dispatch(setTxId(res.txId));
    setSummaryOpen(true);
  }

  async function handlePay() {
    const err = validateCardBasic(checkout.card);
    if (err) {
      alert(err);
      return;
    }
    if (!checkout.initTxId) {
      alert("Primero debes inicializar el checkout.");
      return;
    }

    const resp = await withLoading(dispatch, () =>
      dispatch(payCheckout({ txId: checkout.initTxId!, ...checkout.card })).unwrap()
    );

    dispatch(setTxId(resp.txId));
    dispatch(setPollPath(resp.next?.poll ?? `/transactions/${resp.txId}`));

    setSummaryOpen(false);
    dispatch(closeModal());
    nav("/status");
  }

  const [custErr, setCustErr] = useState<Record<string, string>>({});
  const [delErr, setDelErr] = useState<Record<string, string>>({});
  const [cardErr, setCardErr] = useState<Record<string, string>>({});

  const brand = useMemo(() => detectBrand(checkout.card.number), [checkout.card.number]);

  function validateAll() {
    const cE = validateCustomer(checkout.customer);
    const dE = validateDelivery(checkout.delivery);
    const { errors: cardE } = validateCard(checkout.card);

    setCustErr(cE);
    setDelErr(dE);
    setCardErr(cardE);

    return !(hasErrors(cE) || hasErrors(dE) || hasErrors(cardE));
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            Products
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecciona un producto y paga con tarjeta.
          </Typography>
        </Stack>

        {productState.loading && <Alert severity="info">Cargando…</Alert>}
        {productState.error && <Alert severity="error">{productState.error}</Alert>}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {products.map((p) => {
            const selected = p.productId === selectedProductId;

            return (
              <Grid size={{xs:12, sm:6, md:4 }} key={p.productId}>
                <Card
                  elevation={selected ? 6 : 1}
                  sx={{
                    height: "100%",
                    border: selected ? "2px solid" : "1px solid",
                    borderColor: selected ? "grey.400" : "divider",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <CardActionArea onClick={() => dispatch(selectProduct(p.productId))}>
                    <Box
                      sx={{
                        bgcolor: "white",
                        height: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={p.imageUrl}
                        alt={p.name}
                        sx={{
                          height: "100%",
                          width: "100%",
                          objectFit: "contain",
                          maxWidth: 320,
                        }}
                      />
                    </Box>

                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" gap={2}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="h6" fontWeight={700} noWrap>
                            {p.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {p.description}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="subtitle1" fontWeight={800}>
                            <Money cents={p.price_in_cents} />
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Stock: <b>{p.stock}</b>
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                        {!p.active && <Chip size="small" label="Inactivo" />}
                        {p.stock <= 0 && (
                          <Chip size="small" color="warning" label="Sin stock" />
                        )}
                        {selected && (
                          <Chip
                            size="small"
                            color="success"
                            icon={<CheckCircleIcon />}
                            label="Seleccionado"
                          />
                        )}
                      </Stack>
                    </CardContent>
                  </CardActionArea>

                  {/* CTA fijo abajo */}
                  <Box sx={{ p: 2, pt: 4 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<CreditCardIcon />}
                      disabled={!selected || !p.active || p.stock <= 0}
                      onClick={() => dispatch(openModal())}
                      sx={{ borderRadius: 2, py: 1.2 }}
                    >
                      Pay with credit card
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* FORM DIALOG */}
        <Dialog
          open={checkout.modalOpen}
          onClose={() => dispatch(closeModal())}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Checkout</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" />
                <Typography fontWeight={700}>Customer</Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{xs:12}}>
                  <TextField
                    label="Full name"
                    fullWidth
                    value={checkout.customer.fullName}
                    onChange={(e) => dispatch(setCustomer({ fullName: e.target.value }))}
                    error={!!custErr.fullName}
                    helperText={custErr.fullName ?? " "}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6 }}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={checkout.customer.email}
                    error={!!custErr.email}
                    helperText={custErr.email ?? " "}
                    onChange={(e) => dispatch(setCustomer({ email: e.target.value }))}
                    autoComplete="email"
                  />
                </Grid>
                <Grid size={{xs:12, sm:6 }}>
                  <TextField
                    label="Phone"
                    fullWidth
                    value={checkout.customer.phone}
                    onChange={(e) => dispatch(setCustomer({ phone: e.target.value }))}
                    error={!!custErr.phone}
                    helperText={custErr.phone ?? " "}
                  />
                </Grid>
                <Grid size={{xs:12 }}>
                  <TextField
                    label="Legal ID"
                    fullWidth
                    value={checkout.customer.legalId}
                    onChange={(e) => dispatch(setCustomer({ legalId: e.target.value }))}
                    error={!!custErr.legalId}
                    helperText={custErr.legalId ?? " "}
                  />
                </Grid>
              </Grid>

              <Divider />

              <Stack direction="row" spacing={1} alignItems="center">
                <LocalShippingIcon fontSize="small" />
                <Typography fontWeight={700}>Delivery</Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{xs:12}}>
                  <TextField
                    label="Address line 1"
                    fullWidth
                    value={checkout.delivery.addressLine1}
                    onChange={(e) =>
                      dispatch(setDelivery({ addressLine1: e.target.value }))
                    }
                    error={!!delErr.addressLine1}
                    helperText={delErr.addressLine1 ?? " "}
                  />
                </Grid>
                <Grid size={{xs:12 }}>
                  <TextField
                    label="Address line 2"
                    fullWidth
                    value={checkout.delivery.addressLine2 ?? ""}
                    onChange={(e) =>
                      dispatch(setDelivery({ addressLine2: e.target.value }))
                    }
                  />
                </Grid>
                <Grid size={{xs:12, sm:6 }} >
                  <TextField
                    label="City"
                    fullWidth
                    value={checkout.delivery.city}
                    onChange={(e) => dispatch(setDelivery({ city: e.target.value }))}
                    error={!!delErr.city}
                    helperText={delErr.city ?? " "}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6 }} >
                  <TextField
                    label="Region"
                    fullWidth
                    value={checkout.delivery.region}
                    onChange={(e) => dispatch(setDelivery({ region: e.target.value }))}
                    error={!!delErr.region}
                    helperText={delErr.region ?? " "}
                  />
                </Grid>
              </Grid>

              <Divider />

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <CreditCardIcon fontSize="small" />
                  <Typography fontWeight={700}>Card</Typography>
                </Stack>

                <Chip
                  size="small"
                  label={brand === "UNKNOWN" ? "VISA / MasterCard" : brand}
                  color={brand === "VISA" ? "primary" : brand === "MASTERCARD" ? "error" : "default"}
                  variant={brand === "UNKNOWN" ? "outlined" : "filled"}
                />
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{xs:12 }}>
                  <TextField
                    label="Card holder"
                    fullWidth
                    value={checkout.card.card_holder}
                    onChange={(e) => dispatch(setCard({ card_holder: e.target.value }))}
                    error={!!cardErr.card_holder}
                    helperText={cardErr.card_holder ?? " "}
                    autoComplete="cc-name"
                  />
                </Grid>
                <Grid size={{xs:12 }}>
                  <TextField
                    label="Number"
                    fullWidth
                    value={formatCardNumber(checkout.card.number)}
                    onChange={(e) => dispatch(setCard({ number: sanitizeCardNumber(e.target.value) }))}
                    inputProps={{ inputMode: "numeric", maxLength: 23 }}
                    autoComplete="cc-number"
                    error={!!cardErr.number}
                    helperText={cardErr.number ?? " "}
                  />
                </Grid>
                <Grid size={{xs:4 }}>
                  <TextField
                    label="MM"
                    fullWidth
                    value={checkout.card.exp_month}
                    onChange={(e) =>
                      dispatch(setCard({ exp_month: sanitizeCardNumber(e.target.value).slice(0, 2) }))
                    }
                    error={!!cardErr.exp}
                    helperText={cardErr.exp ? " " : " "}
                    inputProps={{ inputMode: "numeric", maxLength: 2 }}
                  />
                </Grid>
                <Grid size={{xs:4 }}>
                  <TextField
                    label="YY"
                    fullWidth
                    value={checkout.card.exp_year}
                    onChange={(e) =>
                      dispatch(setCard({ exp_year: sanitizeCardNumber(e.target.value).slice(0, 2) }))
                    }
                    error={!!cardErr.exp}
                    helperText={cardErr.exp ?? " "}
                    inputProps={{ inputMode: "numeric", maxLength: 2 }}
                  />
                </Grid>
                  <TextField
                    label="CVC"
                    fullWidth
                    value={checkout.card.cvc}
                    onChange={(e) =>
                      dispatch(setCard({ cvc: sanitizeCardNumber(e.target.value).slice(0, 4) }))
                    }
                    error={!!cardErr.cvc}
                    helperText={cardErr.cvc ?? " "}
                    inputProps={{ inputMode: "numeric", maxLength: 4 }}
                    autoComplete="cc-csc"
                  />
                </Grid>
              {checkout.error && <Alert severity="error">{checkout.error}</Alert>}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => dispatch(closeModal())} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!selectedProduct || checkout.loading || !canPay}
              onClick={handleContinueToSummary}
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>

        {/* SUMMARY DIALOG */}
        <Dialog open={summaryOpen} onClose={() => setSummaryOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>Summary</DialogTitle>
          <DialogContent dividers>
            {checkout.summary ? (
              <Stack spacing={1.5}>
                <Row label="Amount" value={<Money cents={checkout.summary.amount_in_cents} currency={checkout.summary.currency} />} />
                <Row label="Base fee" value={<Money cents={checkout.summary.base_fee_in_cents} currency={checkout.summary.currency} />} />
                <Row label="Delivery fee" value={<Money cents={checkout.summary.delivery_fee_in_cents} currency={checkout.summary.currency} />} />
                <Divider />
                <Row
                  label={<Typography fontWeight={800}>Total</Typography>}
                  value={
                    <Typography fontWeight={800}>
                      <Money cents={checkout.summary.total_in_cents} currency={checkout.summary.currency} />
                    </Typography>
                  }
                />
              </Stack>
            ) : (
              <Alert severity="info">Cargando resumen…</Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSummaryOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button variant="contained" onClick={handlePay} disabled={checkout.loading}>
              Pay
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary" component="div">
        {label}
      </Typography>
      <Box>{value}</Box>
    </Stack>
  );
}
