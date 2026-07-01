from flask import Blueprint

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/test", methods=["GET"])
def auth_test():
    return {"message": "Auth blueprint working"}