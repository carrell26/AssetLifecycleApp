from datetime import datetime
from ..extensions import db


class Location(db.Model):
    __tablename__ = "locations"

    location_id = db.Column(db.Integer, primary_key=True)
    kode_site = db.Column(db.String(20), nullable=True)
    nama_lokasi = db.Column(db.String(150))  # 'Palu 1', 'Palu 2', 'Donggala'
    alamat = db.Column(db.Text)
    district = db.Column(db.String(100))
    area = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    import_id = db.Column(db.Integer, db.ForeignKey("data_imports.import_id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    devices = db.relationship("Device", backref="location")
    data_import = db.relationship("DataImport", back_populates="locations")
