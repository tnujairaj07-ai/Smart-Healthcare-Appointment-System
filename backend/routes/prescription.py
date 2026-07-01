from flask import Blueprint

prescription_bp = Blueprint("prescription", __name__)

@prescription_bp.route("/test", methods=["GET"])
def prescription_test():
    return {"message": "Prescription blueprint working"}