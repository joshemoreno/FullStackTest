export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <strong>{title}</strong>
          <button onClick={onClose} style={styles.x}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  card: { width: "100%", maxWidth: 520, background: "#fff", borderRadius: 12, padding: 16 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  x: { border: "none", background: "transparent", fontSize: 18, cursor: "pointer" },
};
