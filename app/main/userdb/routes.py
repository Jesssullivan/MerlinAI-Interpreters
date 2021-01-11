from flask import Blueprint
from .models import User
from ..auth.auth import token_required


user_blueprint = Blueprint("user", __name__)


@user_blueprint.route("/", methods=["GET"])
def get():
    return User().get()


@user_blueprint.route("/auth/", methods=["GET"])
def get_auth():
    return User().get_auth()


@user_blueprint.route("/login/", methods=["POST"])
def login():
    return User().login()


@user_blueprint.route("/logout/", methods=["GET"])
def logout():
    return User().logout()


@user_blueprint.route("/", methods=["POST"])
def add():
    return User().add()
