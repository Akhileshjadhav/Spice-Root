import TiltCard from "./TiltCard";

function Products() {
  return (
    <div className="text-center mt-14">
      <h2 className="text-3xl font-bold">Popular Products</h2>

      <div className="flex justify-center gap-8 mt-8">
        
        <TiltCard>
          <img src="https://via.placeholder.com/150" className="mx-auto" />
          <h4 className="mt-2 font-semibold">Mirchi Powder</h4>
          <p className="text-gray-600">From ₹550</p>
          <button className="mt-2 bg-purple-600 text-white px-4 py-1 rounded-full">
            View Details
          </button>
        </TiltCard>

        <TiltCard>
          <img src="https://via.placeholder.com/150" className="mx-auto" />
          <h4 className="mt-2 font-semibold">Haldi Powder</h4>
          <p className="text-gray-600">From ₹300</p>
          <button className="mt-2 bg-purple-600 text-white px-4 py-1 rounded-full">
            View Details
          </button>
        </TiltCard>

        <TiltCard>
          <img src="https://via.placeholder.com/150" className="mx-auto" />
          <h4 className="mt-2 font-semibold">Lahsun Mirchi Masala</h4>
          <p className="text-gray-600">From ₹600</p>
          <button className="mt-2 bg-purple-600 text-white px-4 py-1 rounded-full">
            View Details
          </button>
        </TiltCard>

      </div>
    </div>
  );
}

export default Products;