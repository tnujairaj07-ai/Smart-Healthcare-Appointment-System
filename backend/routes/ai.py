from flask import Blueprint

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/test", methods=["GET"])
def ai_test():
    return {"message": "AI blueprint working"}