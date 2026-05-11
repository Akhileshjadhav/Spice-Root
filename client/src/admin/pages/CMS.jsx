import ActionButton from "../components/ActionButton";
import StatusBadge from "../components/StatusBadge";
import { cmsBanners } from "../data/adminData";

const CMS = () => {
  return (
    <section className="admin-module-section">
      <div className="admin-page-head">
        <div>
          <h2>Website CMS - Banners</h2>
          <p>Update homepage, category, and promo assets shown on the live website.</p>
        </div>
        <div className="admin-page-actions">
          <ActionButton variant="primary">+ Add Banner</ActionButton>
        </div>
      </div>

      <div className="admin-banner-list">
        {cmsBanners.map((item) => (
          <article key={item.title} className="admin-banner-card">
            <img src={item.image} alt={item.title} />
            <div className="admin-banner-copy">
              <strong>{item.title}</strong>
              <span>{item.location}</span>
            </div>
            <StatusBadge status={item.status} />
          </article>
        ))}
      </div>
    </section>
  );
};

export default CMS;
