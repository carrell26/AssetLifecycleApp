"""
Import semua model di sini supaya:
1. Flask-Migrate/Alembic bisa mendeteksi seluruh tabel saat generate migration.
2. Bagian lain cukup `from app.models import User, Device, ...` tanpa
   perlu tahu file spesifiknya.
"""
from .user import User
from .device_type import DeviceType
from .slot_definition import SlotDefinition
from .location import Location
from .device import Device
from .module_type import ModuleType
from .module import Module
from .module_position import ModulePosition
from .module_request import ModuleRequest
from .request_approval import RequestApproval
from .module_movement import ModuleMovement
from .audit_log import AuditLog
from .data_import import DataImport
from ..modules.warehouse.models import (
    DimDate,
    DimDevice,
    DimModule,
    DimLocation,
    DimUser,
    FactModuleMovement,
    FactRequestFulfillment,
    DwhEtlLog
)

__all__ = [
    "User",
    "DeviceType",
    "SlotDefinition",
    "Location",
    "Device",
    "ModuleType",
    "Module",
    "ModulePosition",
    "ModuleRequest",
    "RequestApproval",
    "ModuleMovement",
    "AuditLog",
    "DataImport",
    "DimDate",
    "DimDevice",
    "DimModule",
    "DimLocation",
    "DimUser",
    "FactModuleMovement",
    "FactRequestFulfillment",
    "DwhEtlLog",
]