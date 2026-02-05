export function Backdrop({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        width: "100%", maxWidth: 520, background: "#fff",
        borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16,
      }}>
        {children}
      </div>
    </div>
  );
}
