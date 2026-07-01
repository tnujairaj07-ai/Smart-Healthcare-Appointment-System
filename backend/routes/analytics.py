from flask import Blueprint

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/test", methods=["GET"])
def analytics_test():
    return {"message": "Analytics blueprint working"}