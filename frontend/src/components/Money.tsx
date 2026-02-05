export function Money({ cents, currency = "COP" }: { cents: number; currency?: string }) {
  const value = cents / 100;
  return (
    <span>
      {value.toLocaleString("es-CO", { style: "currency", currency })}
    </span>
  );
}
