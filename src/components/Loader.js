// File: components/Loader.js
export default function Loader() {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      <span className="ml-2">Processing...</span>
    </div>
  );
}
