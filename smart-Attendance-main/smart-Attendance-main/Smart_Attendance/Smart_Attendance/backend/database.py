"""
database.py — MySQL data layer with a MongoDB-compatible API.

The application code (app.py, attendance_plus.py, face_engine.py) keeps
using PyMongo-style calls (find_one, insert_one, update_one, cursors,
count_documents, aggregate, ...) exactly as before, while all data is
stored in MySQL. Behavior is identical to the previous MongoDB version.
"""

import json
import hashlib
from datetime import datetime
from decimal import Decimal

import mysql.connector
from mysql.connector import pooling

from config import MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB


# ─────────────────────────────────────────────────────────────
#  Connection pool + schema bootstrap
# ─────────────────────────────────────────────────────────────

_server_cfg = {
    "host": MYSQL_HOST, "port": MYSQL_PORT,
    "user": MYSQL_USER, "password": MYSQL_PASSWORD,
    "charset": "utf8mb4", "autocommit": True,
    # never block forever on a dead/stale connection
    "connection_timeout": 10,
}

# 1. Make sure the database exists
_boot = mysql.connector.connect(**_server_cfg)
_bc = _boot.cursor()
_bc.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
_bc.close()
_boot.close()

# 2. Pooled connections for the app (Flask threads + HRMS sync workers)
_pool = pooling.MySQLConnectionPool(
    pool_name="smart_attendance_pool", pool_size=10,
    database=MYSQL_DB, **_server_cfg
)


def _conn():
    """Get a pooled connection, validating it first — MySQL silently drops
    idle connections (wait_timeout) and reusing a dead one hangs the app."""
    try:
        c = _pool.get_connection()
    except mysql.connector.errors.PoolError:
        # pool exhausted (leaked connections) — fall back to a direct one
        return mysql.connector.connect(database=MYSQL_DB, **_server_cfg)
    try:
        c.ping(reconnect=True, attempts=2, delay=1)
        return c
    except mysql.connector.Error:
        try:
            c.close()
        except Exception:
            pass
        return mysql.connector.connect(database=MYSQL_DB, **_server_cfg)


# 3. Tables
_SCHEMA = [
    """CREATE TABLE IF NOT EXISTS `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(120) NULL,
        `mobile` VARCHAR(20) NULL UNIQUE,
        `password` VARCHAR(64) NULL,
        `role` VARCHAR(20) NULL,
        `emp_id` VARCHAR(50) NULL,
        `created` VARCHAR(20) NULL,
        INDEX `idx_users_role` (`role`),
        INDEX `idx_users_emp` (`emp_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS `employees` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `emp_id` VARCHAR(50) NULL UNIQUE,
        `name` VARCHAR(120) NULL,
        `encoding` LONGTEXT NULL,
        `registered_at` VARCHAR(20) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS `attendance` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `emp_id` VARCHAR(50) NULL,
        `name` VARCHAR(120) NULL,
        `date` VARCHAR(10) NULL,
        `time` VARCHAR(8) NULL,
        `status` VARCHAR(20) NULL,
        `method` VARCHAR(20) NULL,
        `ip` VARCHAR(45) NULL,
        `approval` VARCHAR(20) NULL,
        `check_out` VARCHAR(8) NULL,
        `hours` DOUBLE NULL,
        `overtime` DOUBLE NULL,
        `lat` DOUBLE NULL,
        `lng` DOUBLE NULL,
        `hrms_sync` VARCHAR(20) NULL,
        `hrms_sync_error` VARCHAR(200) NULL,
        `hrms_sync_at` VARCHAR(20) NULL,
        `corrected` TINYINT(1) NULL,
        `corrected_by` VARCHAR(120) NULL,
        `corrected_at` VARCHAR(20) NULL,
        `correction_reason` TEXT NULL,
        `original` LONGTEXT NULL,
        `approved_by` VARCHAR(120) NULL,
        `approved_at` VARCHAR(20) NULL,
        INDEX `idx_att_emp_date` (`emp_id`, `date`),
        INDEX `idx_att_date` (`date`),
        INDEX `idx_att_approval` (`approval`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS `corrections` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `emp_id` VARCHAR(50) NULL,
        `name` VARCHAR(120) NULL,
        `date` VARCHAR(10) NULL,
        `check_in` VARCHAR(5) NULL,
        `check_out` VARCHAR(5) NULL,
        `reason` TEXT NULL,
        `state` VARCHAR(20) NULL,
        `requested_at` VARCHAR(20) NULL,
        `decided_by` VARCHAR(120) NULL,
        `decided_at` VARCHAR(20) NULL,
        INDEX `idx_cor_emp` (`emp_id`),
        INDEX `idx_cor_state` (`state`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS `settings` (
        `skey` VARCHAR(50) PRIMARY KEY,
        `data` LONGTEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
]

_c = _conn()
_cur = _c.cursor()
for _stmt in _SCHEMA:
    _cur.execute(_stmt)
_cur.close()
_c.close()


# ─────────────────────────────────────────────────────────────
#  Mongo-compatible helpers
# ─────────────────────────────────────────────────────────────

def ObjectId(value):
    """Drop-in replacement for bson.ObjectId — MySQL uses integer ids.
    Raises on invalid input, same as bson.ObjectId would."""
    return int(value)


_JSON_COLS = {
    "employees": {"encoding"},
    "attendance": {"original"},
}


def _to_sql_value(table, col, val):
    if col in _JSON_COLS.get(table, set()) and val is not None:
        return json.dumps(val)
    if isinstance(val, bool):
        return 1 if val else 0
    return val


def _from_sql(table, col, val):
    if val is None:
        return None
    if col in _JSON_COLS.get(table, set()):
        try:
            return json.loads(val)
        except (TypeError, ValueError):
            return val
    if isinstance(val, Decimal):
        return float(val)
    return val


def _clause(col, value):
    """One field of a Mongo filter -> SQL condition + params."""
    if isinstance(value, dict):
        if "$regex" in value:
            pat = str(value["$regex"])
            if pat.startswith("^"):
                return f"`{col}` LIKE %s", [pat[1:] + "%"]
            return f"`{col}` LIKE %s", ["%" + pat + "%"]
        if "$in" in value:
            vals = list(value["$in"])
            if not vals:
                return "1=0", []
            ph = ",".join(["%s"] * len(vals))
            return f"`{col}` IN ({ph})", vals
        if "$gte" in value or "$lte" in value:
            parts, params = [], []
            if "$gte" in value:
                parts.append(f"`{col}` >= %s"); params.append(value["$gte"])
            if "$lte" in value:
                parts.append(f"`{col}` <= %s"); params.append(value["$lte"])
            return " AND ".join(parts), params
    return f"`{col}` = %s", [value]


def _where(flt):
    """Mongo filter dict -> (where_sql, params)."""
    if not flt:
        return "1=1", []
    parts, params = [], []
    for k, v in flt.items():
        if k == "$or":
            subs = []
            for sub in v:
                s, p = _where(sub)
                subs.append("(" + s + ")")
                params.extend(p)
            parts.append("(" + " OR ".join(subs) + ")")
        else:
            col = "id" if k == "_id" else k
            s, p = _clause(col, v)
            parts.append(s)
            params.extend(p)
    return " AND ".join(parts), params


def _apply_projection(doc, projection):
    if not projection or doc is None:
        return doc
    include = [k for k, v in projection.items() if v]
    exclude = [k for k, v in projection.items() if not v]
    if include:
        keep = set(include) | {"_id"}
        if "_id" in exclude:
            keep.discard("_id")
        return {k: v for k, v in doc.items() if k in keep}
    return {k: v for k, v in doc.items() if k not in exclude}


class _InsertOneResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class _UpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count


class _DeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count


class _Cursor:
    """Chainable, lazily-executed cursor mimicking pymongo's."""

    def __init__(self, coll, flt, projection):
        self._coll = coll
        self._flt = flt or {}
        self._proj = projection
        self._sort = []
        self._limit = None

    def sort(self, key, direction=None):
        if isinstance(key, (list, tuple)) and key and isinstance(key[0], (list, tuple)):
            self._sort = list(key)
        else:
            self._sort = [(key, 1 if direction is None else direction)]
        return self

    def limit(self, n):
        self._limit = int(n)
        return self

    def _execute(self):
        where_sql, params = _where(self._flt)
        sql = f"SELECT * FROM `{self._coll.table}` WHERE {where_sql}"
        if self._sort:
            order = ", ".join(
                f"`{'id' if k == '_id' else k}` {'ASC' if d >= 0 else 'DESC'}"
                for k, d in self._sort
            )
            sql += f" ORDER BY {order}"
        if self._limit:
            sql += f" LIMIT {self._limit}"
        return [
            _apply_projection(doc, self._proj)
            for doc in self._coll._query(sql, params)
        ]

    def __iter__(self):
        return iter(self._execute())


class Collection:
    """MySQL-backed collection with a PyMongo-compatible surface."""

    def __init__(self, table):
        self.table = table

    # ── low level ──
    def _query(self, sql, params):
        c = _conn()
        try:
            cur = c.cursor()
            cur.execute(sql, params)
            cols = [d[0] for d in cur.description]
            rows = cur.fetchall()
            cur.close()
        finally:
            c.close()
        docs = []
        for row in rows:
            doc = {}
            for col, val in zip(cols, row):
                if val is None:
                    continue  # mimic Mongo: missing fields are absent
                key = "_id" if col == "id" else col
                doc[key] = _from_sql(self.table, col, val)
            docs.append(doc)
        return docs

    def _exec(self, sql, params):
        c = _conn()
        try:
            cur = c.cursor()
            cur.execute(sql, params)
            rowcount = cur.rowcount
            lastrowid = cur.lastrowid
            cur.close()
        finally:
            c.close()
        return rowcount, lastrowid

    def _columns(self):
        c = _conn()
        cur = c.cursor()
        cur.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s", (MYSQL_DB, self.table))
        cols = {r[0] for r in cur.fetchall()}
        cur.close()
        c.close()
        return cols

    def _doc_to_cols(self, doc):
        known = self._columns()
        out = {}
        for k, v in doc.items():
            col = "id" if k == "_id" else k
            if col in known:
                out[col] = _to_sql_value(self.table, col, v)
        return out

    # ── Mongo API ──
    def find_one(self, flt=None, projection=None):
        where_sql, params = _where(flt or {})
        docs = self._query(
            f"SELECT * FROM `{self.table}` WHERE {where_sql} LIMIT 1", params)
        if not docs:
            return None
        return _apply_projection(docs[0], projection)

    def find(self, flt=None, projection=None):
        return _Cursor(self, flt, projection)

    def count_documents(self, flt=None):
        where_sql, params = _where(flt or {})
        c = _conn()
        cur = c.cursor()
        cur.execute(f"SELECT COUNT(*) FROM `{self.table}` WHERE {where_sql}", params)
        n = cur.fetchone()[0]
        cur.close()
        c.close()
        return int(n)

    def insert_one(self, doc):
        cols = self._doc_to_cols(doc)
        names = ", ".join(f"`{k}`" for k in cols)
        ph = ", ".join(["%s"] * len(cols))
        _, lastrowid = self._exec(
            f"INSERT INTO `{self.table}` ({names}) VALUES ({ph})",
            list(cols.values()))
        return _InsertOneResult(lastrowid)

    def update_one(self, flt, update, upsert=False):
        return self._update(flt, update, upsert=upsert, many=False)

    def update_many(self, flt, update):
        return self._update(flt, update, upsert=False, many=True)

    def _update(self, flt, update, upsert, many):
        setter = update.get("$set", {})
        cols = self._doc_to_cols(setter)
        if not cols:
            return _UpdateResult(0)
        assigns = ", ".join(f"`{k}` = %s" for k in cols)
        where_sql, params = _where(flt or {})
        sql = f"UPDATE `{self.table}` SET {assigns} WHERE {where_sql}"
        if not many:
            sql += " LIMIT 1"
        rowcount, _ = self._exec(sql, list(cols.values()) + params)
        if rowcount == 0 and upsert:
            exists = self.find_one(flt)
            if not exists:
                merged = {k: v for k, v in (flt or {}).items()
                          if not k.startswith("$") and not isinstance(v, dict)}
                merged.update(setter)
                self.insert_one(merged)
                return _UpdateResult(0)
        return _UpdateResult(rowcount)

    def replace_one(self, flt, doc, upsert=False):
        existing = self.find_one(flt)
        if existing:
            cols = self._doc_to_cols(doc)
            # blank out all non-id columns first (true replace semantics)
            known = self._columns() - {"id"}
            full = {k: cols.get(k) for k in known}
            assigns = ", ".join(f"`{k}` = %s" for k in full)
            self._exec(
                f"UPDATE `{self.table}` SET {assigns} WHERE `id` = %s LIMIT 1",
                list(full.values()) + [existing["_id"]])
            return _UpdateResult(1)
        if upsert:
            self.insert_one(doc)
        return _UpdateResult(0)

    def delete_one(self, flt):
        where_sql, params = _where(flt or {})
        rowcount, _ = self._exec(
            f"DELETE FROM `{self.table}` WHERE {where_sql} LIMIT 1", params)
        return _DeleteResult(rowcount)

    def delete_many(self, flt):
        where_sql, params = _where(flt or {})
        rowcount, _ = self._exec(
            f"DELETE FROM `{self.table}` WHERE {where_sql}", params)
        return _DeleteResult(rowcount)

    def create_index(self, *args, **kwargs):
        return None  # indexes are created in the schema

    def distinct(self, field, flt=None):
        where_sql, params = _where(flt or {})
        col = "id" if field == "_id" else field
        c = _conn()
        cur = c.cursor()
        cur.execute(
            f"SELECT DISTINCT `{col}` FROM `{self.table}` WHERE {where_sql}", params)
        vals = [r[0] for r in cur.fetchall()]
        cur.close()
        c.close()
        return vals

    def aggregate(self, pipeline):
        """Supports $match / $group / $sort pipelines with $sum, $first,
        $cond-eq and $ifNull accumulators (as used by /api/summary)."""
        match, group, sort_spec = {}, None, None
        for stage in pipeline:
            if "$match" in stage:
                match = stage["$match"]
            elif "$group" in stage:
                group = stage["$group"]
            elif "$sort" in stage:
                sort_spec = stage["$sort"]
        if not group:
            return iter([])

        gid = str(group["_id"]).lstrip("$")
        select_parts = [f"`{gid}` AS `_id`"]
        for key, spec in group.items():
            if key == "_id":
                continue
            select_parts.append(self._agg_expr(key, spec))

        where_sql, params = _where(match)
        sql = (f"SELECT {', '.join(select_parts)} FROM `{self.table}` "
               f"WHERE {where_sql} GROUP BY `{gid}`")
        if sort_spec:
            k, d = list(sort_spec.items())[0]
            col = gid if k == "_id" else k
            sql += f" ORDER BY `{col}` {'ASC' if d >= 0 else 'DESC'}"

        c = _conn()
        cur = c.cursor()
        cur.execute(sql, params)
        cols = [dsc[0] for dsc in cur.description]
        rows = cur.fetchall()
        cur.close()
        c.close()
        out = []
        for row in rows:
            doc = {}
            for col, val in zip(cols, row):
                if isinstance(val, Decimal):
                    val = float(val)
                doc[col] = val
            out.append(doc)
        return iter(out)

    @staticmethod
    def _agg_expr(alias, spec):
        if "$first" in spec:
            f = str(spec["$first"]).lstrip("$")
            return f"MIN(`{f}`) AS `{alias}`"
        if "$sum" in spec:
            s = spec["$sum"]
            if s == 1:
                return f"COUNT(*) AS `{alias}`"
            if isinstance(s, dict) and "$cond" in s:
                cond = s["$cond"][0]
                field = str(cond["$eq"][0]).lstrip("$")
                value = cond["$eq"][1]
                return (f"COALESCE(SUM(CASE WHEN `{field}` = "
                        f"{json.dumps(value)} THEN 1 ELSE 0 END), 0) AS `{alias}`")
            if isinstance(s, dict) and "$ifNull" in s:
                field = str(s["$ifNull"][0]).lstrip("$")
                return f"COALESCE(SUM(COALESCE(`{field}`, 0)), 0) AS `{alias}`"
            field = str(s).lstrip("$")
            return f"COALESCE(SUM(`{field}`), 0) AS `{alias}`"
        raise ValueError(f"Unsupported aggregate accumulator for '{alias}'")


class SettingsCollection:
    """Key/value settings stored as JSON blobs (office, shift, hrms)."""

    def find_one(self, flt=None, projection=None):
        key = (flt or {}).get("_id")
        c = _conn()
        cur = c.cursor()
        cur.execute("SELECT `data` FROM `settings` WHERE `skey` = %s", (key,))
        row = cur.fetchone()
        cur.close()
        c.close()
        if not row:
            return None
        try:
            data = json.loads(row[0]) if row[0] else {}
        except (TypeError, ValueError):
            data = {}
        return {"_id": key, **data}

    def update_one(self, flt, update, upsert=False):
        key = (flt or {}).get("_id")
        current = self.find_one(flt) or {}
        current.pop("_id", None)
        current.update(update.get("$set", {}))
        self._save(key, current)
        return _UpdateResult(1)

    def replace_one(self, flt, doc, upsert=False):
        key = (flt or {}).get("_id")
        data = {k: v for k, v in doc.items() if k != "_id"}
        self._save(key, data)
        return _UpdateResult(1)

    @staticmethod
    def _save(key, data):
        c = _conn()
        cur = c.cursor()
        cur.execute(
            "INSERT INTO `settings` (`skey`, `data`) VALUES (%s, %s) "
            "ON DUPLICATE KEY UPDATE `data` = VALUES(`data`)",
            (key, json.dumps(data)))
        cur.close()
        c.close()


class Database:
    """Mimics pymongo's db["collection"] access."""

    _tables = {"employees", "attendance", "users", "corrections"}

    def __getitem__(self, name):
        if name == "settings":
            return settings_col
        if name in self._tables:
            return Collection(name)
        raise KeyError(f"Unknown collection: {name}")


# ─────────────────────────────────────────────────────────────
#  Public objects (same names as the old MongoDB module)
# ─────────────────────────────────────────────────────────────

db             = Database()
employees_col  = Collection("employees")   # face encodings + employee info
attendance_col = Collection("attendance")  # daily attendance records
users_col      = Collection("users")       # login accounts
settings_col   = SettingsCollection()      # runtime settings


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


# ── Seed default admin if not exists ─────────────
def seed_admin():
    if not users_col.find_one({"role": "admin"}):
        users_col.insert_one({
            "name":     "Admin",
            "mobile":   "9999999999",
            "password": hash_password("admin123"),
            "role":     "admin",
            "created":  datetime.now().strftime("%Y-%m-%d %H:%M")
        })

seed_admin()
