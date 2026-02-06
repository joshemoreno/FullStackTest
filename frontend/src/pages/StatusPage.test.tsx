/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vitest/globals" />

import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { StatusPage } from "./StatusPage";

const navMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navMock,
  };
});

type TxStatus = "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | null;

type TxDetail = {
  status: "PENDING" | "APPROVED" | "DECLINED" | "ERROR";
  amount_in_cents: number;
  base_fee_in_cents: number;
  delivery_fee_in_cents: number;
  total_in_cents: number;
  currency: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    legalIdType: string;
    legalId: string;
  };
  delivery: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    region: string;
    country: string;
    notes?: string | null;
  };
  apipay?: {
    statusMessage?: string | null;
    lastError?: string | null;
  } | null;
  stockDiscounted?: boolean;
};

type TxState = {
  txId: string | null;
  status: TxStatus;
  detail: TxDetail | null;
  loading: boolean;
  error: string | null;
};

let currentTxState: TxState;

const dispatchMock = vi.fn(async (_action: any) => _action);

vi.mock("../app/hooks", () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: any) => selector({ transaction: currentTxState }),
}));

const fetchTransactionMock = vi.fn((txId: string) => ({ type: "tx/fetch", payload: txId }));
const resetTransactionMock = vi.fn(() => ({ type: "tx/reset" }));
const fetchProductsMock = vi.fn(() => ({ type: "products/fetch" }));

vi.mock("../features/transaction/transactionSlice", () => ({
  fetchTransaction: (txId: string) => fetchTransactionMock(txId),
  resetTransaction: () => resetTransactionMock(),
}));

vi.mock("../features/product/productSlice", () => ({
  fetchProducts: () => fetchProductsMock(),
}));

function mockClipboard(writeImpl?: (text: string) => Promise<void>) {
  const writeText = vi.fn(writeImpl ?? (async () => {}));

  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    writable: true,
    configurable: true,
  });

  return writeText;
}


function setState(partial: Partial<TxState>) {
  currentTxState = { ...currentTxState, ...partial };
}

beforeEach(() => {
  navMock.mockClear();
  dispatchMock.mockClear();

  fetchTransactionMock.mockClear();
  resetTransactionMock.mockClear();
  fetchProductsMock.mockClear();

  currentTxState = {
    txId: null,
    status: null,
    detail: null,
    loading: false,
    error: null,
  };
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("StatusPage", () => {
  test("si no hay txId muestra alerta de 'No active transaction'", () => {
    render(<StatusPage />);
    expect(
      screen.getByText(/No active transaction\. Go back to the product page/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument();
  });

  test("con txId renderiza card, chip y muestra el txId", () => {
    setState({ txId: "tx_123", status: "PENDING" });

    render(<StatusPage />);

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Processing payment")).toBeInTheDocument();
    expect(screen.getByText(/Please wait while we confirm/i)).toBeInTheDocument();

    expect(screen.getByText("PENDING")).toBeInTheDocument();

    expect(screen.getByText("tx_123")).toBeInTheDocument();
  });

  test("muestra LinearProgress cuando está PENDING o loading", () => {
    setState({ txId: "tx_1", status: "PENDING", loading: false });
    const { rerender } = render(<StatusPage />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    setState({ status: "APPROVED", loading: false });
    rerender(<StatusPage />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    setState({ status: "APPROVED", loading: true });
    rerender(<StatusPage />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("botón Refresh status aparece solo cuando NO es final", async () => {
    const user = userEvent.setup();

    setState({ txId: "tx_9", status: "PENDING" });
    const { rerender } = render(<StatusPage />);

    const refreshBtn = screen.getByRole("button", { name: /refresh status/i });
    expect(refreshBtn).toBeInTheDocument();

    await user.click(refreshBtn);
    expect(fetchTransactionMock).toHaveBeenCalledWith("tx_9");
    expect(dispatchMock).toHaveBeenCalled();

    setState({ status: "APPROVED" });
    rerender(<StatusPage />);
    expect(screen.queryByRole("button", { name: /refresh status/i })).not.toBeInTheDocument();
  });

  test("Back to product: dispatch(fetchProducts), dispatch(resetTransaction) y navega '/'", async () => {
    const user = userEvent.setup();

    setState({ txId: "tx_7", status: "APPROVED" });
    render(<StatusPage />);

    const backBtn = screen.getByRole("button", { name: /back to product/i });
    await user.click(backBtn);

    expect(fetchProductsMock).toHaveBeenCalledTimes(1);
    expect(resetTransactionMock).toHaveBeenCalledTimes(1);

    expect(dispatchMock).toHaveBeenCalledWith({ type: "products/fetch" });
    expect(dispatchMock).toHaveBeenCalledWith({ type: "tx/reset" });

    expect(navMock).toHaveBeenCalledWith("/");
  });

  test("Copy: copia txId al clipboard (y si falla no revienta)", async () => {
    const user = userEvent.setup();
    const writeText = mockClipboard(async () => {});

    setState({ txId: "tx_copy", status: "PENDING" });
    const { rerender } = render(<StatusPage />);

    await user.click(screen.getByRole("button", { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith("tx_copy");

    const writeTextFail = mockClipboard(async () => {
      throw new Error("no permission");
    });

    rerender(<StatusPage />);
    await user.click(screen.getByRole("button", { name: /copy/i }));
    expect(writeTextFail).toHaveBeenCalledWith("tx_copy");
  });

  test("muestra error Alert cuando error existe", () => {
    setState({ txId: "tx_err", status: "PENDING", error: "Something went wrong" });
    render(<StatusPage />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  test("renderiza details: Summary, Customer, Delivery, apipay message, stock actualizado", () => {
    setState({
      txId: "tx_d",
      status: "APPROVED",
      detail: {
        status: "APPROVED",
        amount_in_cents: 10000,
        base_fee_in_cents: 500,
        delivery_fee_in_cents: 700,
        total_in_cents: 11200,
        currency: "COP",
        customer: {
          fullName: "Jose Moreno",
          email: "jose@test.com",
          phone: "3000000000",
          legalIdType: "CC",
          legalId: "123456",
        },
        delivery: {
          addressLine1: "Calle 1",
          addressLine2: "Apto 2",
          city: "Cali",
          region: "Valle",
          country: "CO",
          notes: "Dejar en portería",
        },
        apipay: { statusMessage: "OK", lastError: null },
        stockDiscounted: true,
      },
    });

    render(<StatusPage />);

    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Delivery")).toBeInTheDocument();

    expect(screen.getByText("Jose Moreno")).toBeInTheDocument();
    expect(screen.getByText(/jose@test\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/CC:\s*123456/i)).toBeInTheDocument();

    expect(screen.getByText("Calle 1")).toBeInTheDocument();
    expect(screen.getByText("Apto 2")).toBeInTheDocument();
    expect(screen.getByText(/Cali,\s*Valle/i)).toBeInTheDocument();
    expect(screen.getByText(/Notes:\s*Dejar en portería/i)).toBeInTheDocument();

    expect(screen.getByText("OK")).toBeInTheDocument();

    expect(screen.getByText(/Stock actualizado/i)).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
  });

  test("delivery addressLine2 y notes son opcionales (cuando no existen no se muestran)", () => {
    setState({
      txId: "tx_opt",
      status: "APPROVED",
      detail: {
        status: "APPROVED",
        amount_in_cents: 1,
        base_fee_in_cents: 1,
        delivery_fee_in_cents: 1,
        total_in_cents: 3,
        currency: "COP",
        customer: {
          fullName: "A",
          email: "a@a.com",
          phone: "1",
          legalIdType: "CC",
          legalId: "1",
        },
        delivery: {
          addressLine1: "Addr 1",
          addressLine2: null,
          city: "X",
          region: "Y",
          country: "Z",
          notes: null,
        },
        apipay: null,
        stockDiscounted: false,
      },
    });

    render(<StatusPage />);

    expect(screen.getByText("Addr 1")).toBeInTheDocument();
    expect(screen.queryByText(/Addr 2/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Notes:/i)).not.toBeInTheDocument();
  });

  test("si apipay.lastError existe, se muestra el Alert con ese texto", () => {
    setState({
      txId: "tx_apierr",
      status: "ERROR",
      detail: {
        status: "ERROR",
        amount_in_cents: 1,
        base_fee_in_cents: 1,
        delivery_fee_in_cents: 1,
        total_in_cents: 3,
        currency: "COP",
        customer: {
          fullName: "A",
          email: "a@a.com",
          phone: "1",
          legalIdType: "CC",
          legalId: "1",
        },
        delivery: {
          addressLine1: "Addr 1",
          city: "X",
          region: "Y",
          country: "Z",
        },
        apipay: { statusMessage: "OK", lastError: "Gateway timeout" },
      },
    });

    render(<StatusPage />);
    expect(screen.getByText("Gateway timeout")).toBeInTheDocument();
  });

  test("polling: llama fetchTransaction inmediatamente y luego cada 2s; se detiene al llegar a 30", async () => {
    vi.useFakeTimers();

    setState({ txId: "tx_poll", status: "PENDING" });
    render(<StatusPage />);

    expect(fetchTransactionMock).toHaveBeenCalledWith("tx_poll");

    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchTransactionMock.mock.calls.length).toBeGreaterThanOrEqual(2);

    await vi.advanceTimersByTimeAsync(29 * 2000);

    expect(fetchTransactionMock.mock.calls.length).toBeGreaterThanOrEqual(30);

    const before = fetchTransactionMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(6000);
    const after = fetchTransactionMock.mock.calls.length;

    expect(after).toBe(before);
  });

  test("polling: se detiene cuando status pasa a final (APPROVED/DECLINED/ERROR)", async () => {
    vi.useFakeTimers();

    setState({ txId: "tx_stop", status: "PENDING" });
    const { rerender } = render(<StatusPage />);

    const before = fetchTransactionMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchTransactionMock.mock.calls.length).toBeGreaterThan(before);

    setState({ status: "APPROVED" });
    rerender(<StatusPage />);

    const callsBeforeStop = fetchTransactionMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(6000);
    expect(fetchTransactionMock.mock.calls.length).toBe(callsBeforeStop);
  });
});
