function Hero() {
  return (
    <div className="w-3/4 mx-auto mt-10 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center p-16 rounded-3xl shadow-lg hover:shadow-2xl transition">
      <h1 className="text-5xl font-bold">Ghar Ka Swad</h1>
      <p className="mt-4 text-lg">
        Authentic, pure & traditionally crafted masalas for your kitchen.
      </p>
      <button className="mt-6 bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-purple-100 hover:scale-105 transition">
        Explore Products
      </button>
    </div>
  );
}

export default Hero;