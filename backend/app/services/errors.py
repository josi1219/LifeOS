class NotFoundError(Exception):
    """Raised when a resource doesn't exist or isn't owned by the requesting user — always maps to HTTP 404."""
