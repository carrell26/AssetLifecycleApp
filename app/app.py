from flask import Flask
from .extensions import db, migrate


def create_app(test_config=None):
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "ganti-dengan-secret-key-yang-aman"

    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    migrate.init_app(app, db)

    from . import models  # noqa: F401
    with app.app_context():
        db.create_all()

    from flask_login import LoginManager

    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        from .models import User
        return User.query.get(int(user_id))

    # ==========================================
    # REGISTER BLUEPRINTS
    # ==========================================

    from .modules.auth import auth_bp
    from .modules.device import device_bp
    from .modules.data_import import data_import_bp
    from .modules.module_request import module_request_bp
    from .modules.audit import audit_bp
    from .modules.export import export_bp
    from .modules.ar import ar_bp
    from .modules.api import api_bp
    from .modules.warehouse import warehouse_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(device_bp)
    app.register_blueprint(data_import_bp)
    app.register_blueprint(module_request_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(export_bp)
    app.register_blueprint(ar_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(warehouse_bp)

    # ==========================================
    # CLI: CREATE ADMIN
    # ==========================================

    @app.cli.command("create-admin")
    def create_admin():
        import getpass
        from .models import User

        name = input("Nama Admin: ").strip()
        email = input("Email Admin: ").strip()
        password = getpass.getpass("Password Admin: ")

        if User.query.filter_by(email=email).first():
            print("Email sudah terdaftar.")
            return

        admin = User(
            name=name,
            email=email,
            role="admin",
            status="aktif",
        )

        admin.set_password(password)

        db.session.add(admin)
        db.session.commit()

        print(f"Admin '{name}' berhasil dibuat.")

    # ==========================================
    # CLI: FIX MISSING DISTRICT
    # ==========================================

    @app.cli.command("fix-missing-district")
    def fix_missing_district():
        """Memperbaiki district lokasi yang masih kosong."""
        from .models import Location

        locations = Location.query.filter(
            (Location.district == None) | (Location.district == "")  # noqa: E711
        ).all()

        for loc in locations:
            loc.district = loc.nama_lokasi

        db.session.commit()

        print(
            f"{len(locations)} lokasi berhasil diperbaiki "
            "(district diisi sesuai nama_lokasi)."
        )

    # ==========================================
    # DASHBOARD
    # ==========================================

    @app.route("/")
    def index():
        from flask import render_template, redirect, url_for
        from flask_login import current_user
        from sqlalchemy import func
        from datetime import datetime, timedelta

        from .models import (
            Device,
            DeviceType,
            Module,
            ModulePosition,
            ModuleRequest,
            ModuleMovement,
        )

        # Redirect ke login jika belum authenticated
        if not current_user.is_authenticated:
            return redirect(url_for("auth.login"))

        import os
        react_template_path = os.path.join(app.root_path, "templates", "react_index.html")
        if os.path.exists(react_template_path):
            return render_template("react_index.html", current_user=current_user)

        # ==========================================
        # KPI METRICS
        # ==========================================

        total_devices = Device.query.count()

        total_modules = Module.query.count()

        modul_terpasang_result = db.session.query(
            func.count(func.distinct(ModulePosition.module_id))
        ).filter(
            ModulePosition.status == "aktif"
        ).scalar()

        modul_terpasang = modul_terpasang_result or 0

        pending_approval = ModuleRequest.query.filter_by(
            status="PENDING"
        ).count()

        # ==========================================
        # DISTRIBUSI PERANGKAT
        # ==========================================

        device_distribution_raw = db.session.query(
            DeviceType.nama_tipe,
            func.count(Device.device_id).label("count"),
        ).join(
            Device,
            Device.device_type_id == DeviceType.device_type_id,
        ).group_by(
            DeviceType.nama_tipe
        ).all()

        device_distribution = [
            {"name": name, "count": count}
            for name, count in device_distribution_raw
        ]

        # ==========================================
        # KONDISI MODUL
        # ==========================================

        module_conditions_raw = db.session.query(
            Module.kondisi,
            func.count(Module.modul_id).label("count"),
        ).group_by(
            Module.kondisi
        ).all()

        module_conditions = [
            {"kondisi": kondisi, "count": count}
            for kondisi, count in module_conditions_raw
        ]

        # ==========================================
        # TREN PERPINDAHAN MODUL 30 HARI
        # ==========================================

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        movement_trend_raw = db.session.query(
            func.date(ModuleMovement.tanggal).label("tanggal"),
            func.count(ModuleMovement.movement_id).label("jumlah"),
        ).filter(
            ModuleMovement.tanggal >= thirty_days_ago
        ).group_by(
            func.date(ModuleMovement.tanggal)
        ).order_by(
            func.date(ModuleMovement.tanggal)
        ).all()

        movement_trend = [
            {
                "date": str(tanggal),
                "count": jumlah,
            }
            for tanggal, jumlah in movement_trend_raw
            if tanggal is not None
        ]

        # ==========================================
        # AKTIVITAS TERBARU
        # ==========================================

        recent_activities = ModuleMovement.query.order_by(
            ModuleMovement.tanggal.desc()
        ).limit(10).all()

        # ==========================================
        # RENDER DASHBOARD
        # ==========================================

        return render_template(
            "index.html",
            total_devices=total_devices,
            total_modules=total_modules,
            modul_terpasang=modul_terpasang,
            pending_approval=pending_approval,
            device_distribution=device_distribution,
            module_conditions=module_conditions,
            movement_trend=movement_trend,
            recent_activities=recent_activities,
            current_user=current_user,
        )

    return app