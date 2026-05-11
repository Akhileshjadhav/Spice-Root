import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Products from "../components/PopularProducts";
import CTA from "../components/CTA";

function Home() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Hero />
      <Features />
      <Products />
      <CTA />
    </div>
  );
}

export default Home;