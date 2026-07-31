import os
import uvicorn

if __name__ == "__main__":
    # Configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    # Hot-reload only when explicitly requested via ENV=development.
    # Production must never hot-reload (default ENV is "production").
    reload = os.getenv("ENV", "production") == "development"
    print(
        f"Starting Clario backend on {host}:{port} "
        f"(ENV={os.getenv('ENV', 'production')}, reload={reload})"
    )
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)
