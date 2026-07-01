from flask import Blueprint

doctor_bp = Blueprint("doctor", __name__)

@doctor_bp.route("/test", methods=["GET"])
def doctor_test():
    return {"message": "Doctor blueprint working"}