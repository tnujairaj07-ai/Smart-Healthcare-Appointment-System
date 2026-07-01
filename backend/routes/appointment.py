from flask import Blueprint

appointment_bp = Blueprint("appointment", __name__)

@appointment_bp.route("/test", methods=["GET"])
def appointment_test():
    return {"message": "Appointment blueprint working"}