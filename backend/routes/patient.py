from flask import Blueprint

patient_bp = Blueprint("patient", __name__)

@patient_bp.route("/test", methods=["GET"])
def patient_test():
    return {"message": "Patient blueprint working"}