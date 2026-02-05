export function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {label ? <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span> : null}
      <input
        {...props}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #ddd",
          outline: "none",
          width: "100%",
          ...(props.style ?? {}),
        }}
      />
    </label>
  );
}
