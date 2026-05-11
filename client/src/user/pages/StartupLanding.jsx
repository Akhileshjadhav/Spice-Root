import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";
import Navbar from "../components/Navbar";
import Reveal from "../components/Reveal";
import TiltCard from "../components/TiltCard";
import "../../styles/startup-premium.css";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "products", label: "Products" },
  { id: "features", label: "Features" },
  { id: "about", label: "About Us" },
  { id: "testimonials", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

const spotlightProduct = {
  id: "mirchi-powder",
  label: "Fresh Pick",
  name: "Mirchi Powder",
  image: "/images/mirchi.png",
  description:
    "Made from carefully selected sun-dried chillies, this powder delivers natural color, strong aroma, and the right level of heat-without any artificial enhancement. What you see is what you get.",
  trustLine: "No added color. No preservatives. 100% real spice.",
};

const bestSellerProducts = [
  {
    id: "mirchi-powder",
    name: "Mirchi Powder",
    image: "/images/mirchi.png",
    points: ["Deep natural color", "Strong, clean heat", "No artificial coloring"],
    microcopy: "Perfect for daily cooking with consistent taste.",
  },
  {
    id: "turmeric-aromatic",
    name: "Turmeric Powder",
    image: "/images/haldi.png",
    points: ["Bright natural color", "Earthy, rich flavor", "High curcumin quality"],
    microcopy: "Pure haldi that actually smells and tastes like real turmeric.",
  },
];

const reasons = [
  {
    title: "100% Natural",
    copy: "No chemicals, no artificial color, no hidden mixing. Only pure spices-just like they should be.",
  },
  {
    title: "Farm Sourced",
    copy: "We source directly from farmers, not middlemen. That means fresher spices and better quality in your kitchen.",
  },
  {
    title: "Zero Adulteration",
    copy: "What's written on the pack is exactly what's inside. Nothing extra. Nothing fake.",
  },
  {
    title: "Real Aroma & Taste",
    copy: "Open the pack-you'll smell the difference instantly. That's the freshness most brands lose.",
  },
];

const trustPoints = [
  "Clean sourcing",
  "Small batch processing",
  "Fresh packing",
  "No chemical treatment",
];

const baseTestimonials = [
  {
    quote:
      "The aroma is the first thing you notice. Even a simple dal tastes richer and more complete with these spices.",
    name: "Aditi Mehra",
    title: "Home Cook",
  },
  {
    quote:
      "The biggest difference is the freshness. The spices are easy to use and give consistent results every time.",
    name: "Chef Rohan Patil",
    title: "Cafe Menu Consultant",
  },
  {
    quote:
      "We started using these in our kitchen and customers noticed the change instantly. Pure, strong, and reliable.",
    name: "Neha Kulkarni",
    title: "Cloud Kitchen Founder",
  },
];

const shopProducts = [
  {
    id: "turmeric-aromatic",
    name: "Turmeric Powder (Colour + Aromatic)",
    image: "/images/haldi.png",
    description:
      "Balanced turmeric with rich natural color and deep aroma. Perfect for adding warmth, color, and health to everyday meals.",
  },
  {
    id: "garam-masala",
    name: "Garam Masala",
    image: "/images/garam.png",
    description:
      "A carefully blended mix of whole spices that brings depth, warmth, and authentic flavor to your cooking.",
  },
];

function SectionTitle({ kicker, title, body, align = "center" }) {
  return (
    <Reveal className={`ember-section-title${align === "left" ? " left" : ""}`}>
      {kicker ? <span>{kicker}</span> : null}
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </Reveal>
  );
}

function StartupLanding() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("home");

  const scrollToSection = (sectionId, behavior = "auto") => {
    const target = document.getElementById(sectionId);

    if (!target) {
      return;
    }

    const navOffset = 104;
    const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top: Math.max(0, top), behavior });
    window.history.replaceState(null, "", sectionId === "home" ? "/" : `/#${sectionId}`);
  };

  const testimonialCards = baseTestimonials.slice(0, 3);

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -45% 0px", threshold: 0.18 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const targetId = location.hash ? location.hash.slice(1) : "home";

    const timer = window.setTimeout(() => {
      if (targetId === "home") {
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }

      scrollToSection(targetId, "auto");
    }, 20);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const goToSection = (sectionId) => {
    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.replaceState(null, "", "/");
      return;
    }

    scrollToSection(sectionId, "smooth");
  };

  const handleLogout = async () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="ember-home-shell">
      <div className="ember-noise" aria-hidden="true" />
      <Navbar activeSection={activeSection} onNavigate={goToSection} onLogout={handleLogout} />
      <div className="ember-navbar-spacer" />

      <main className="ember-page">
        <section id="home" className="ember-hero ember-reveal is-visible">
          <div className="ember-hero-frame">
            <div className="ember-hero-media" aria-hidden="true">
              <video
                className="ember-hero-video"
                autoPlay
                muted
                playsInline
                preload="auto"
              >
                <source src="/videos/hero-masala.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="ember-divider" />
            <div className="ember-hero-copy">
              <h1>Ghar Ka Swad, Asli Masalon Ke Saath.</h1>
              <p>
                No chemicals. No mixing. No shortcuts. Just fresh, farm-sourced spices that bring real
                aroma, real color, and real flavor to your everyday cooking.
              </p>
              <div className="ember-hero-actions">
                <Link to="/products" className="ember-button ember-button-ghost">
                  Shop Fresh Spices
                </Link>
                <Link to="/register" className="ember-button ember-button-primary">
                  Get Started
                </Link>
              </div>
              <p className="ember-hero-trust">
                Trusted by home kitchens that care about what goes into their food.
              </p>
            </div>

            <TiltCard className="ember-hero-product-card ember-card-glass" maxTilt={8}>
              <div className="ember-card-content ember-spotlight-stage">
                <div className="ember-product-copy ember-spotlight-copy">
                  <span className="ember-mini-kicker">{spotlightProduct.label}</span>
                  <h3>{spotlightProduct.name}</h3>
                  <p>{spotlightProduct.description}</p>
                  <span className="ember-product-trust">{spotlightProduct.trustLine}</span>
                  <strong>&#8377;550</strong>
                </div>
                <div className="ember-product-visual ember-spotlight-visual">
                  <img
                    src={spotlightProduct.image}
                    alt={spotlightProduct.name}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        <section id="products" className="ember-section ember-products-section">
          <SectionTitle
            title="Spices People Come Back For"
            body="Once you cook with real spices, you don't go back. These are our most trusted and most loved essentials."
          />

          <div className="ember-product-grid ember-product-grid-featured">
            {bestSellerProducts.map((product, index) => (
              <Reveal key={product.id} delay={index * 0.05}>
                <TiltCard className="ember-product-card ember-card-glass">
                  <div className="ember-card-content">
                    <div className="ember-product-image-shell">
                      <img src={product.image} alt={product.name} loading="lazy" decoding="async" fetchPriority="low" />
                    </div>
                    <div className="ember-product-card-copy">
                      <h3>{product.name}</h3>
                      <ul className="ember-product-points">
                        {product.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                      <p>{product.microcopy}</p>
                    </div>
                    <Link className="ember-button ember-button-secondary ember-small-button" to={`/products/${product.id}`}>
                      View Details
                    </Link>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="features" className="ember-section">
          <SectionTitle title="Because What You Eat Should Be Clean and Honest" />

          <div className="ember-reason-grid">
            {reasons.map((reason, index) => (
              <Reveal key={reason.title} delay={index * 0.05}>
                <TiltCard className="ember-reason-card ember-card-glass" maxTilt={12}>
                  <div className="ember-card-content">
                    <span className="ember-reason-icon">0{index + 1}</span>
                    <h3>{reason.title}</h3>
                    <p>{reason.copy}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="ember-section">
          <SectionTitle
            title="No Marketing Tricks. Just Real Quality."
            body="We don't rely on heavy branding or fake promises. Our spices speak for themselves-from the moment you open the pack to the taste in your food."
          />

          <div className="ember-reason-grid">
            {trustPoints.map((point, index) => (
              <Reveal key={point} delay={index * 0.05}>
                <TiltCard className="ember-reason-card ember-card-glass" maxTilt={10}>
                  <div className="ember-card-content ember-trust-point-card">
                    <h3>{point}</h3>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="ember-section ember-emotional-section">
          <Reveal>
            <TiltCard className="ember-newsletter-card ember-card-glass" maxTilt={8}>
              <div className="ember-card-content">
                <h3>Taste That Feels Like Home</h3>
                <p>
                  The kind of aroma that fills your kitchen. The kind of flavor that reminds you of real
                  homemade food. That's what we aim to deliver-every single time.
                </p>
              </div>
            </TiltCard>
          </Reveal>
        </section>

        <section id="about" className="ember-section ember-story-section">
          <SectionTitle title="From Farms to Your Kitchen" />

          <div className="ember-story-layout">
            <Reveal className="ember-story-media-wrap">
              <TiltCard className="ember-story-media ember-card-glass" maxTilt={8}>
                <div className="ember-card-content ember-story-media-content">
                  <img src={spotlightProduct.image} alt={spotlightProduct.name} loading="lazy" decoding="async" fetchPriority="low" />
                  <div>
                    <h3>From Farms to Your Kitchen</h3>
                    <p>
                      At Spice Root, everything starts at the source. We work closely with farmers to
                      bring you spices that are grown naturally, harvested at the right time, and
                      processed with care. No shortcuts. No artificial enhancement. Just honest
                      ingredients that keep their real aroma, color, and taste. Because good food begins
                      with clean, trustworthy spices.
                    </p>
                    <Link to="/products" className="ember-button ember-button-primary ember-small-button">
                      Shop Fresh Spices
                    </Link>
                  </div>
                </div>
              </TiltCard>
            </Reveal>

            <div className="ember-story-stack">
              {shopProducts.map((product, index) => (
                <Reveal key={product.id} delay={index * 0.06}>
                  <TiltCard className="ember-story-mini ember-card-glass" maxTilt={10}>
                    <div className="ember-card-content ember-story-mini-content">
                      <img src={product.image} alt={product.name} loading="lazy" decoding="async" fetchPriority="low" />
                      <div>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="ember-section">
          <SectionTitle title="What Our Customers Feel" />

          <div className="ember-testimonial-grid">
            {testimonialCards.map((item, index) => (
              <Reveal key={item.name} delay={index * 0.06}>
                <TiltCard className="ember-testimonial-card ember-card-glass" maxTilt={10}>
                  <div className="ember-card-content">
                    <span className="ember-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                    <p>{item.quote}</p>
                    <strong>{item.name}</strong>
                    <span>{item.title}</span>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="contact" className="ember-section ember-contact-section">
          <div className="ember-contact-grid">
            <Reveal>
              <TiltCard className="ember-contact-card ember-card-glass" maxTilt={8}>
                <div className="ember-card-content">
                  <h3>Contact Us</h3>
                  <p>
                    Have questions or want to partner with us? We're here to help you choose the right
                    spices for your home or business.
                  </p>
                  <Link to="/contact" className="ember-button ember-button-ghost ember-small-button">
                    Contact Us
                  </Link>
                </div>
              </TiltCard>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default StartupLanding;
