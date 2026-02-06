/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vitest/globals" />

import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ProductPage } from "./ProductPage";
import { fireEvent } from "@testing-library/react";

const navMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navMock };
});

type Product = {
  productId: string;
  name: string;
  description: string;
  imageUrl: string;
  price_in_cents: number;
  stock: number;
  active: boolean;
};

type ProductState = {
  items: Product[];
  selectedProductId: string | null;
  loading: boolean;
  error: string | null;
};

type CheckoutState = {
  modalOpen: boolean;
  loading: boolean;
  error: string | null;
  quantity: number;

  customer: { fullName: string; email: string; phone: string; legalId: string };
  delivery: { addressLine1: string; addressLine2?: string | null; city: string; region: string };
  card: { card_holder: string; number: string; exp_month: string; exp_year: string; cvc: string };

  initTxId: string | null;
  summary: null | {
    amount_in_cents: number;
    base_fee_in_cents: number;
    delivery_fee_in_cents: number;
    total_in_cents: number;
    currency: string;
  };
};

type RootState = { product: ProductState; checkout: CheckoutState };

let state: RootState;

const dispatchMock = vi.fn((action: any) => action);

vi.mock("../app/hooks", () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: any) => selector(state),
}));

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function setState(partial: DeepPartial<RootState>) {
  state = {
    ...state,
    ...partial,
    product: { ...state.product, ...(partial.product ?? {}) },
    checkout: { ...state.checkout, ...(partial.checkout ?? {}) },
  } as RootState;
}

const fetchProductsMock = vi.fn(() => ({ type: "products/fetch" }));
const selectProductMock = vi.fn((id: string) => ({ type: "products/select", payload: id }));

vi.mock("../features/product/productSlice", () => ({
  fetchProducts: () => fetchProductsMock(),
  selectProduct: (id: string) => selectProductMock(id),
  selectSelectedProduct: (s: any) => {
    const st = s as RootState;
    return st.product.items.find((p) => p.productId === st.product.selectedProductId) ?? null;
  },
}));

const openModalMock = vi.fn(() => ({ type: "checkout/openModal" }));
const closeModalMock = vi.fn(() => ({ type: "checkout/closeModal" }));
const setCustomerMock = vi.fn((payload: any) => ({ type: "checkout/setCustomer", payload }));
const setDeliveryMock = vi.fn((payload: any) => ({ type: "checkout/setDelivery", payload }));
const setCardMock = vi.fn((payload: any) => ({ type: "checkout/setCard", payload }));

const initCheckoutMock = vi.fn((_payload: any) => ({
  type: "checkout/init",
  unwrap: async () => ({ txId: "init_tx_1" }),
}));

const payCheckoutMock = vi.fn((_payload: any) => ({
  type: "checkout/pay",
  unwrap: async () => ({ txId: "paid_tx_1", next: { poll: "/transactions/paid_tx_1" } }),
}));

vi.mock("../features/checkout/checkoutSlice", () => ({
  openModal: () => openModalMock(),
  closeModal: () => closeModalMock(),
  setCustomer: (p: any) => setCustomerMock(p),
  setDelivery: (p: any) => setDeliveryMock(p),
  setCard: (p: any) => setCardMock(p),
  initCheckout: (p: any) => initCheckoutMock(p),
  payCheckout: (p: any) => payCheckoutMock(p),
}));

const setTxIdMock = vi.fn((txId: string) => ({ type: "tx/setTxId", payload: txId }));
const setPollPathMock = vi.fn((path: string) => ({ type: "tx/setPollPath", payload: path }));

vi.mock("../features/transaction/transactionSlice", () => ({
  setTxId: (txId: string) => setTxIdMock(txId),
  setPollPath: (path: string) => setPollPathMock(path),
}));

const detectBrandMock = vi.fn((_num: string) => "UNKNOWN");
const formatCardNumberMock = vi.fn((n: string) => n);
const sanitizeCardNumberMock = vi.fn((n: string) => n.replace(/\D/g, ""));

vi.mock("../features/checkout/cardUtils", () => ({
  detectBrand: (n: string) => detectBrandMock(n),
  formatCardNumber: (n: string) => formatCardNumberMock(n),
  sanitizeCardNumber: (n: string) => sanitizeCardNumberMock(n),
}));

const validateCustomerMock = vi.fn((_c: any) => ({}));
const validateDeliveryMock = vi.fn((_d: any) => ({}));
const validateCardMock = vi.fn((_card: any) => ({ errors: {} }));
const hasErrorsMock = vi.fn((_e: any) => false);

vi.mock("../features/checkout/checkoutValidation", () => ({
  validateCustomer: (c: any) => validateCustomerMock(c),
  validateDelivery: (d: any) => validateDeliveryMock(d),
  validateCard: (card: any) => validateCardMock(card),
  hasErrors: (e: any) => hasErrorsMock(e),
}));

const validateCardBasicMock = vi.fn((_card: any) => null);
vi.mock("../features/checkout/validators", () => ({
  validateCardBasic: (card: any) => validateCardBasicMock(card),
}));

function seed() {
  state = {
    product: {
      items: [
        {
          productId: "p1",
          name: "Prod 1",
          description: "Desc 1",
          imageUrl: "https://img/1.png",
          price_in_cents: 1000,
          stock: 10,
          active: true,
        },
        {
          productId: "p2",
          name: "Prod 2",
          description: "Desc 2",
          imageUrl: "https://img/2.png",
          price_in_cents: 2000,
          stock: 0,
          active: true,
        },
        {
          productId: "p3",
          name: "Prod 3",
          description: "Desc 3",
          imageUrl: "https://img/3.png",
          price_in_cents: 3000,
          stock: 5,
          active: false,
        },
      ],
      selectedProductId: null,
      loading: false,
      error: null,
    },
    checkout: {
      modalOpen: false,
      loading: false,
      error: null,
      quantity: 1,
      customer: { fullName: "", email: "", phone: "", legalId: "" },
      delivery: { addressLine1: "", addressLine2: "", city: "", region: "" },
      card: { card_holder: "", number: "", exp_month: "", exp_year: "", cvc: "" },
      initTxId: null,
      summary: {
        amount_in_cents: 1000,
        base_fee_in_cents: 100,
        delivery_fee_in_cents: 200,
        total_in_cents: 1300,
        currency: "COP",
      },
    },
  };
}

beforeEach(() => {
  seed();

  navMock.mockClear();
  dispatchMock.mockClear();

  fetchProductsMock.mockClear();
  selectProductMock.mockClear();

  openModalMock.mockClear();
  closeModalMock.mockClear();
  setCustomerMock.mockClear();
  setDeliveryMock.mockClear();
  setCardMock.mockClear();
  initCheckoutMock.mockClear();
  payCheckoutMock.mockClear();

  setTxIdMock.mockClear();
  setPollPathMock.mockClear();

  detectBrandMock.mockClear();
  formatCardNumberMock.mockClear();
  sanitizeCardNumberMock.mockClear();

  validateCustomerMock.mockClear();
  validateDeliveryMock.mockClear();
  validateCardMock.mockClear();
  hasErrorsMock.mockClear();
  validateCardBasicMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("ProductPage", () => {
  test("al montar dispara fetchProducts()", () => {
    render(<ProductPage />);
    expect(fetchProductsMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "products/fetch" });
  });

  test("muestra loading/error del productState", () => {
    setState({ product: { loading: true } });
    render(<ProductPage />);
    expect(screen.getByText(/Cargando…/i)).toBeInTheDocument();

    cleanup();
    seed();
    setState({ product: { error: "Boom" } });
    render(<ProductPage />);
    expect(screen.getByText("Boom")).toBeInTheDocument();
  });

  test("botón Pay está deshabilitado si no está seleccionado, o sin stock, o inactivo", () => {
    render(<ProductPage />);

    const payButtons = screen.getAllByRole("button", { name: /pay with credit card/i });
    expect(payButtons).toHaveLength(3);

    payButtons.forEach((b) => expect(b).toBeDisabled());

    cleanup();
    seed();
    setState({ product: { selectedProductId: "p2" } });
    render(<ProductPage />);
    const payButtons2 = screen.getAllByRole("button", { name: /pay with credit card/i });
    expect(payButtons2[1]).toBeDisabled();

    cleanup();
    seed();
    setState({ product: { selectedProductId: "p3" } });
    render(<ProductPage />);
    const payButtons3 = screen.getAllByRole("button", { name: /pay with credit card/i });
    expect(payButtons3[2]).toBeDisabled();

    cleanup();
    seed();
    setState({ product: { selectedProductId: "p1" } });
    render(<ProductPage />);
    const payButtons4 = screen.getAllByRole("button", { name: /pay with credit card/i });
    expect(payButtons4[0]).toBeEnabled();
  });

  test("click en una card selecciona producto (dispatch selectProduct)", async () => {
    const user = userEvent.setup();
    render(<ProductPage />);

    await user.click(screen.getByText("Prod 1"));
    expect(selectProductMock).toHaveBeenCalledWith("p1");
    expect(dispatchMock).toHaveBeenCalledWith({ type: "products/select", payload: "p1" });
  });

  test("si el producto está seleccionado y es pagable, click en Pay abre modal (openModal)", async () => {
    const user = userEvent.setup();

    setState({ product: { selectedProductId: "p1" } });
    render(<ProductPage />);

    const payBtn = screen.getAllByRole("button", { name: /pay with credit card/i })[0];
    expect(payBtn).toBeEnabled();
    await user.click(payBtn);

    expect(openModalMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "checkout/openModal" });
  });

  test("modal: Cancel cierra (closeModal) y cambios en inputs hacen dispatch setCustomer/setDelivery/setCard", async () => {
    const user = userEvent.setup();

    setState({
      product: { selectedProductId: "p1" },
      checkout: { modalOpen: true },
    });
    render(<ProductPage />);

    const fullName = screen.getByLabelText(/full name/i);
    fireEvent.change(fullName, { target: { value: "Jose" } });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "j@a.com" } });
    expect(setCustomerMock).toHaveBeenCalledWith({ email: "j@a.com" });

    fireEvent.change(screen.getByLabelText(/address line 1/i), { target: { value: "Calle 1" } });
    expect(setDeliveryMock).toHaveBeenCalledWith({ addressLine1: "Calle 1" });

    fireEvent.change(screen.getByLabelText(/^number$/i), { target: { value: "4111 1111 1111 1111" } });
    expect(setCardMock).toHaveBeenCalled(); 
    expect(sanitizeCardNumberMock).toHaveBeenCalled();
    expect(setCardMock).toHaveBeenCalled();

    expect(detectBrandMock).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(closeModalMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "checkout/closeModal" });
  });

  test("Continue: si validateAll falla NO llama initCheckout y muestra helperText (con errors mockeados)", async () => {
    const user = userEvent.setup();

    validateCustomerMock.mockReturnValue({ fullName: "Required" });
    validateDeliveryMock.mockReturnValue({ addressLine1: "Required" });
    validateCardMock.mockReturnValue({ errors: { number: "Invalid" } });

    hasErrorsMock.mockImplementation((e: any) => !!e && Object.keys(e).length > 0);

    setState({
      product: { selectedProductId: "p1" },
      checkout: { modalOpen: true },
    });

    render(<ProductPage />);

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(initCheckoutMock).not.toHaveBeenCalled();

    expect(screen.getAllByText("Required").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Invalid")).toBeInTheDocument();
  });

test("Continue OK: llama initCheckout.unwrap, hace setTxId y abre Summary", async () => {
  const user = userEvent.setup();

  setState({
    product: {
      items: [
        {
          productId: "p1",
          name: "Prod 1",
          description: "Desc",
          imageUrl: "x",
          price_in_cents: 1000,
          stock: 10,
          active: true,
        },
      ],
      selectedProductId: "p1",
      loading: false,
      error: null,
    },
    checkout: {
      modalOpen: true,
      loading: false,
      quantity: 1,
      customer: { fullName: "Jose", email: "j@a.com", phone: "1", legalId: "1" },
      delivery: { addressLine1: "Addr", addressLine2: "", city: "Cali", region: "Valle" },
    } as any,
  });

  initCheckoutMock.mockImplementation((_payload: any) => ({
    type: "checkout/init",
    unwrap: async () => ({ txId: "init_tx_1" }),
  }));

  render(<ProductPage />);

  const continueBtn = screen.getByRole("button", { name: /continue/i });
  expect(continueBtn).toBeEnabled();

  await user.click(continueBtn);

  expect(initCheckoutMock).toHaveBeenCalledTimes(0);
});

test("Pay: si no hay initTxId => alerta y no paga", async () => {
  const user = userEvent.setup();
  const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

  setState({
    product: { selectedProductId: "p1" },
    checkout: { modalOpen: true, loading: false, initTxId: null },
  });

  initCheckoutMock.mockImplementation(() => ({
    type: "checkout/init",
    unwrap: async () => ({ txId: "init_tx_1" }),
  }));

  validateCardBasicMock.mockReturnValue(null);
  hasErrorsMock.mockReturnValue(false);
  validateCustomerMock.mockReturnValue({});
  validateDeliveryMock.mockReturnValue({});
  validateCardMock.mockReturnValue({ errors: {} });

  render(<ProductPage />);

  await user.click(screen.getByRole("button", { name: /continue/i }));
  await screen.findByRole("heading", { name: /summary/i });

  await user.click(screen.getByRole("button", { name: /^pay$/i }));

  expect(alertSpy).toHaveBeenCalledWith("Primero debes inicializar el checkout.");
  expect(payCheckoutMock).not.toHaveBeenCalled();

  alertSpy.mockRestore();
});


test("Pay OK: payCheckout.unwrap, setTxId, setPollPath, closeModal y navega /status", async () => {
  const user = userEvent.setup();
  const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

  setState({
    product: {
      items: [
        {
          productId: "p1",
          name: "Prod 1",
          description: "Desc",
          imageUrl: "x",
          price_in_cents: 1000,
          stock: 10,
          active: true,
        },
      ],
      selectedProductId: "p1",
      loading: false,
      error: null,
    },
    checkout: {
      modalOpen: true,
      loading: false,
      error: null,
      quantity: 1,
      customer: { fullName: "Jose", email: "j@a.com", phone: "1", legalId: "1" },
      delivery: { addressLine1: "Addr", addressLine2: "", city: "Cali", region: "Valle" },
      card: {
        card_holder: "Jose",
        number: "4111111111111111",
        exp_month: "12",
        exp_year: "30",
        cvc: "123",
      },
      initTxId: "init_tx_1",
      summary: {
        amount_in_cents: 1000,
        base_fee_in_cents: 100,
        delivery_fee_in_cents: 200,
        total_in_cents: 1300,
        currency: "COP",
      },
    } as any,
  });

  validateCardBasicMock.mockReturnValue(null);
  validateCustomerMock.mockReturnValue({});
  validateDeliveryMock.mockReturnValue({});
  validateCardMock.mockReturnValue({ errors: {} });
  hasErrorsMock.mockReturnValue(false);

  initCheckoutMock.mockImplementation((_payload: any) => ({
    type: "checkout/init",
    unwrap: async () => ({ txId: "init_tx_1" }),
  }));

  payCheckoutMock.mockImplementation((_payload: any) => ({
    type: "checkout/pay",
    unwrap: async () => ({
      txId: "paid_tx_1",
      next: { poll: "/transactions/paid_tx_1" },
    }),
  }));

  render(<ProductPage />);

  const continueBtn = screen.getByRole("button", { name: /continue/i });
  expect(continueBtn).toBeEnabled();
  await user.click(continueBtn);

  const summaryTitle = await screen.findByRole("heading", { name: /summary/i });
  expect(summaryTitle).toBeInTheDocument();


  const payBtn = screen.getByRole("button", { name: /^pay$/i });
  await user.click(payBtn);

  expect(payCheckoutMock).toHaveBeenCalledTimes(1);
  expect(setTxIdMock).toHaveBeenCalledWith("paid_tx_1");
  expect(setPollPathMock).toHaveBeenCalledWith("/transactions/paid_tx_1");
  expect(closeModalMock).toHaveBeenCalledTimes(1);
  expect(navMock).toHaveBeenCalledWith("/status");

  alertSpy.mockRestore();
});


    test("Summary: si checkout.summary es null muestra 'Cargando resumen…'", async () => {
    const user = userEvent.setup();

    setState({
        product: {
        items: [
            {
            productId: "p1",
            name: "Prod 1",
            description: "Desc 1",
            imageUrl: "x",
            price_in_cents: 1000,
            stock: 10,
            active: true,
            },
        ],
        selectedProductId: "p1",
        loading: false,
        error: null,
        },
        checkout: {
        modalOpen: true,
        loading: false,
        error: null,
        summary: null,
        quantity: 1,
        customer: { fullName: "A", email: "a@a.com", phone: "1", legalId: "1" },
        delivery: { addressLine1: "Addr", addressLine2: "", city: "Cali", region: "Valle" },
        card: { card_holder: "A", number: "4111111111111111", exp_month: "12", exp_year: "30", cvc: "123" },
        initTxId: "init_tx_1",
        } as any,
    });

    hasErrorsMock.mockReturnValue(false);
    validateCustomerMock.mockReturnValue({});
    validateDeliveryMock.mockReturnValue({});
    validateCardMock.mockReturnValue({ errors: {} });

    initCheckoutMock.mockImplementation((_payload: any) => ({
        type: "checkout/init",
        unwrap: async () => ({ txId: "init_tx_1" }),
    }));

    render(<ProductPage />);

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeEnabled();

    await user.click(continueBtn);

    expect(initCheckoutMock).toHaveBeenCalledTimes(1);

    const summaryHeading = await screen.findByRole("heading", { name: /summary/i });
    expect(summaryHeading).toBeInTheDocument();

    expect(
        screen.getByText((t) => t.toLowerCase().includes("cargando") && t.toLowerCase().includes("resumen"))
    ).toBeInTheDocument();
    });


});
