import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#161412" }}
    >
      <p className="text-[10px] uppercase tracking-[0.35em] mb-4" style={{ color: "rgba(58,46,42,0.30)" }}>
        404
      </p>
      <h1
        className="text-5xl font-bold text-foreground mb-3"
        style={{ letterSpacing: "-0.5px" }}
      >
        page not found
      </h1>
      <p className="text-sm mb-8" style={{ color: "rgba(58,46,42,0.38)" }}>
        The page you're looking for doesn't exist.
      </p>
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="px-6 py-3 rounded-2xl text-foreground font-semibold text-sm transition-opacity hover:opacity-80"
        style={{ backgroundColor: "rgba(58,46,42,0.08)", border: "1px solid rgba(58,46,42,0.12)" }}
      >
        back to dashboard
      </button>
    </div>
  );
};

export default NotFound;
