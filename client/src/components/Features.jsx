function Features() {
  return (
    <div className="flex justify-center gap-8 mt-10">
      
      <div className="bg-white p-6 rounded-xl shadow-md w-64 text-center hover:shadow-xl hover:-translate-y-2 transition duration-300 cursor-pointer">
        <h3 className="font-bold text-lg">🌿 Premium Quality</h3>
        <p className="text-gray-600 mt-2">
          Carefully sourced ingredients with traditional grinding methods.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md w-64 text-center hover:shadow-xl hover:-translate-y-2 transition duration-300 cursor-pointer">
        <h3 className="font-bold text-lg">🚚 Fast Delivery</h3>
        <p className="text-gray-600 mt-2">
          Quick doorstep delivery across cities.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md w-64 text-center hover:shadow-xl hover:-translate-y-2 transition duration-300 cursor-pointer">
        <h3 className="font-bold text-lg">🔒 Secure Payments</h3>
        <p className="text-gray-600 mt-2">
          100% safe and trusted payment options.
        </p>
      </div>

    </div>
  );
}

export default Features;