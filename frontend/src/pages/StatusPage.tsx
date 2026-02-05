import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchTransaction } from "../features/transaction/transactionSlice";
import { Money } from "../components/Money";
import { fetchProducts } from "../features/product/productSlice";

export function StatusPage() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const { txId, status, detail, loading, error } = useAppSelector((s) => s.transaction);

  const timerRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!txId) return;

    const tick = async () => {
      attemptsRef.current += 1;
      await dispatch(fetchTransaction(txId));

      // timeout suave (ej 30 intentos ~ 60s si cada 2s)
      if (attemptsRef.current >= 30) stop();
    };

    const stop = () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };

    // primera consulta inmediata
    tick();
    timerRef.current = window.setInterval(tick, 2000);

    return stop;
  }, [dispatch, txId]);

  useEffect(() => {
    if (status && status !== "PENDING" && timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [status]);

  async function backToProduct() {
    await dispatch(fetchProducts()); // recarga stock
    nav("/");
  }

  const final = status && status !== "PENDING";

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h2>Status</h2>

      {!txId && (
        <>
          <p>No hay transacción activa.</p>
          <button onClick={() => nav("/")} style={btnPrimary}>Back to product</button>
        </>
      )}

      {txId && (
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <p><strong>Tx:</strong> {txId}</p>

          {loading && <p>Consultando estado...</p>}
          {error && <p style={{ color: "crimson" }}>{error}</p>}

          <p>
            <strong>Status:</strong>{" "}
            {status ?? "PENDING"}
          </p>

          {detail && (
            <>
              <p><strong>Total:</strong> <Money cents={detail.total_in_cents} currency={detail.currency} /></p>
              <p><strong>Customer:</strong> {detail.customer.fullName} — {detail.customer.email}</p>
              <p><strong>Delivery:</strong> {detail.delivery.addressLine1}, {detail.delivery.city}</p>

              {detail.apipay?.statusMessage && <p>{detail.apipay.statusMessage}</p>}
              {detail.apipay?.lastError && <p style={{ color: "crimson" }}>{detail.apipay.lastError}</p>}

              {detail.status === "APPROVED" && detail.stockDiscounted && (
                <p style={{ color: "green" }}>Stock actualizado ✅</p>
              )}
            </>
          )}

          {final ? (
            <button onClick={backToProduct} style={btnPrimary}>Back to product</button>
          ) : (
            <p>Procesando pago…</p>
          )}
        </div>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "none", background: "black", color: "white", cursor: "pointer", marginTop: 10
};
