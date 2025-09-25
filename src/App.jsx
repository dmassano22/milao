import { useState } from "react";

const vouchers = [
  {
    id: 1,
    text: "Vale uma massagem relaxante a dois 💆‍♀️💆‍♂️",
    revealed: false,
  },
  {
    id: 2,
    text: "Para os teus investimentos (INVESTE BEM!!!) 📈💸",
    revealed: false,
  },
  {
    id: 3,
    text: "Um dia sem dizer 'Não' a nada 🥶",
    extra: " (excepto crimes e levares-me à falência 😅)",
    revealed: false,
  },
  {
    id: 4,
    text: "Uma música especial 🎶",
    link: "https://www.youtube.com/watch?v=5U5kmBT_WtA",
    revealed: false,
  },
  {
    id: 5,
    text: "A tua cor favorita: Roxo 💜",
    revealed: false,
  },
  {
    id: 6,
    text: "Resposta: SIM ✅",
    revealed: false,
  },
];

export default function App() {
  const [items, setItems] = useState(vouchers);

  const revealVoucher = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, revealed: !item.revealed } : item
      )
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎁 Surpresa para a Carolina 🎁</h1>
      <div style={styles.grid}>
        {items.map((voucher) => (
          <div
            key={voucher.id}
            style={{
              ...styles.card,
              background: voucher.revealed ? "#fdfdfd" : "#d4a5ff",
            }}
            onClick={() => revealVoucher(voucher.id)}
          >
            {voucher.revealed ? (
              <div>
                <p style={styles.text}>{voucher.text}</p>
                {voucher.extra && (
                  <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    {voucher.extra}
                  </p>
                )}
                {voucher.link && (
                  <a
                    href={voucher.link}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    🎵 Ouvir Música
                  </a>
                )}
              </div>
            ) : (
              <p style={styles.hidden}>✨ Clica para revelar ✨</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


const styles = {
container: {
  textAlign: "center",
  padding: "2rem",
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
},

  title: {
    fontSize: "2.5rem",
    marginBottom: "2rem",
    color: "#4a004e",
    textShadow: "1px 1px 3px rgba(0,0,0,0.1)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "2rem",
    width: "100%",
    maxWidth: "1100px",
  },
  card: {
    padding: "2rem",
    borderRadius: "1.2rem",
    cursor: "pointer",
    boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
    transition: "transform 0.3s ease, background 0.3s ease",
    background: "#fff",
  },
  hidden: {
    fontSize: "1.1rem",
    color: "#666",
    fontWeight: "bold",
  },
  text: {
    fontSize: "1.3rem",
    fontWeight: "bold",
    color: "#4a004e",
    marginBottom: "0.5rem",
  },
  link: {
    display: "inline-block",
    marginTop: "1rem",
    padding: "0.6rem 1.2rem",
    background: "#4a004e",
    color: "#fff",
    borderRadius: "0.5rem",
    textDecoration: "none",
    fontWeight: "bold",
    transition: "background 0.3s ease",
  },



  
};
