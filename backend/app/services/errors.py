class NotFoundError(Exception):
    """Raised when a resource doesn't exist or isn't owned by the requesting user — always maps to HTTP 404."""


class ValidationError(Exception):
    """Raised when a business rule or validation fails — maps to HTTP 400."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message
