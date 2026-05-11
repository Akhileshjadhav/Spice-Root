import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div>
          <strong style={styles.brand}>Spice Root</strong>
          <p style={styles.copy}>
            Premium masalas, pantry essentials, and honest flavors for everyday kitchens.
          </p>
        </div>

        <nav style={styles.links} aria-label="Footer navigation">
          <Link to="/" style={styles.link}>Home</Link>
          <Link to="/products" style={styles.link}>Products</Link>
          <Link to="/contact" style={styles.link}>Contact Us</Link>
        </nav>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10, 8, 6, 0.92)",
    padding: "28px 20px 34px",
    marginTop: "40px",
  },
  inner: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  brand: {
    display: "block",
    color: "#fff2d0",
    fontSize: "1rem",
    marginBottom: "6px",
  },
  copy: {
    margin: 0,
    color: "rgba(245, 237, 224, 0.72)",
    lineHeight: 1.6,
    fontSize: "0.92rem",
    maxWidth: "540px",
  },
  links: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  link: {
    color: "#f7c56d",
    textDecoration: "none",
    fontWeight: 600,
  },
};

export default Footer;
