import ActionButton from "../components/ActionButton";
import { settingsSections } from "../data/adminData";

const Settings = () => {
  return (
    <section className="admin-module-section">
      <div className="admin-page-head">
        <div>
          <h2>Settings</h2>
          <p>Store-wide configuration, payment preferences, and delivery defaults.</p>
        </div>
      </div>

      <div className="admin-settings-grid">
        {settingsSections.map((section) => (
          <article key={section.title} className="admin-settings-card">
            <div className="admin-page-head compact">
              <div>
                <h3>{section.title}</h3>
                <p>Editable configuration snapshot.</p>
              </div>
            </div>

            <div className="admin-field-grid">
              {section.fields.map((field) => (
                <label key={field.label}>
                  <span>{field.label}</span>
                  <input type="text" defaultValue={field.value} />
                </label>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="admin-page-actions">
        <ActionButton variant="primary">Save Changes</ActionButton>
      </div>
    </section>
  );
};

export default Settings;
