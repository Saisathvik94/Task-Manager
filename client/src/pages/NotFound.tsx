import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-[#0a0a0a] px-4 transition-colors duration-200">
      <h1 className="text-6xl font-bold text-neutral-300 dark:text-neutral-850">404</h1>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mt-4">Page not found</h2>
      <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-center max-w-md">
        We couldn't find the page you are looking for. It might have been moved or deleted.
      </p>
      <Link
        to="/"
        className="mt-6 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-brand dark:hover:bg-brand-hover text-white rounded-lg text-sm font-medium transition-colors"
      >
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
