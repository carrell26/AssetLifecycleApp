import argparse
import os
from pathlib import Path

from sqlalchemy import URL, create_engine, func, inspect, select, text


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "instance" / "database-dev.db"
BATCH_SIZE = 500


def project_ref_from_url(url):
    if url.host and url.host.endswith(".supabase.co"):
        return url.host.removesuffix(".supabase.co")
    if url.username and url.username.startswith("postgres."):
        return url.username.removeprefix("postgres.")
    return None


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Copy rows from the development SQLite database to an empty "
            "Supabase PostgreSQL database."
        )
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=DEFAULT_SOURCE,
        help=f"SQLite source database (default: {DEFAULT_SOURCE})",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Perform the copy. Without this flag, only inspect row counts.",
    )
    parser.add_argument(
        "--expected-project-ref",
        help="Supabase project ref required for an actual copy.",
    )
    args = parser.parse_args()

    source_path = args.source.resolve()
    if not source_path.is_file():
        parser.error(f"SQLite source file does not exist: {source_path}")

    target_database_url = os.environ.get("DATABASE_URL")
    if not target_database_url:
        parser.error("Set DATABASE_URL to the Supabase development connection URI.")

    from sqlalchemy.engine import make_url

    target_url = make_url(target_database_url)
    if target_url.get_backend_name() != "postgresql":
        parser.error("DATABASE_URL must point to a PostgreSQL database.")
    if not target_url.host or not (
        target_url.host.endswith(".supabase.co")
        or target_url.host.endswith(".pooler.supabase.com")
    ):
        parser.error("DATABASE_URL host does not look like a Supabase endpoint.")

    project_ref = project_ref_from_url(target_url)
    if args.apply:
        if not args.expected_project_ref:
            parser.error("--expected-project-ref is required together with --apply.")
        if project_ref != args.expected_project_ref:
            parser.error(
                "The project ref inferred from DATABASE_URL does not match "
                "--expected-project-ref."
            )

    from app import create_app
    from app.extensions import db

    app = create_app(test_config={"SQLALCHEMY_DATABASE_URI": target_database_url})
    app_context = app.app_context()
    app_context.push()

    source_engine = create_engine(
        URL.create("sqlite", database=str(source_path)),
        connect_args={"check_same_thread": False},
    )

    try:
        tables = db.metadata.sorted_tables
        with source_engine.connect() as source, db.engine.connect() as target:
            source_counts = {}
            target_counts = {}
            source_inspector = inspect(source)
            target_inspector = inspect(target)
            schema_differences = []
            for table in tables:
                model_columns = {column.name for column in table.columns}
                source_columns = {
                    column["name"]
                    for column in source_inspector.get_columns(table.name)
                }
                target_columns = {
                    column["name"]
                    for column in target_inspector.get_columns(
                        table.name, schema="public"
                    )
                }
                missing_from_source = model_columns - source_columns
                missing_from_target = model_columns - target_columns
                if missing_from_source or missing_from_target:
                    schema_differences.append(
                        (
                            table.name,
                            sorted(missing_from_source),
                            sorted(missing_from_target),
                        )
                    )

                source_counts[table.name] = source.execute(
                    select(func.count()).select_from(table)
                ).scalar_one()
                target_counts[table.name] = target.execute(
                    select(func.count()).select_from(table)
                ).scalar_one()

            print(f"SQLite source: {source_path}")
            print(f"Supabase host: {target_url.host}")
            print(f"Project ref: {project_ref or 'could not infer'}")
            print("Table counts (source -> Supabase):")
            for table in tables:
                print(
                    f"  {table.name}: "
                    f"{source_counts[table.name]} -> {target_counts[table.name]}"
                )

            if schema_differences:
                print("Schema mismatch (table: missing from SQLite / Supabase):")
                for table_name, source_missing, target_missing in schema_differences:
                    print(
                        f"  {table_name}: "
                        f"{source_missing or '-'} / {target_missing or '-'}"
                    )
                parser.error(
                    "Database schema does not match the application models. "
                    "Apply pending Flask-Migrate migrations before copying data."
                )

            if not args.apply:
                print("Dry run only. No data was changed.")
                return

            nonempty = [
                name for name, count in target_counts.items() if count != 0
            ]
            if nonempty:
                parser.error(
                    "Refusing to copy because destination tables are not empty: "
                    + ", ".join(nonempty)
                )

        with source_engine.connect() as source, db.engine.begin() as target:
            for table in tables:
                result = source.execution_options(stream_results=True).execute(
                    select(table)
                )
                while rows := result.fetchmany(BATCH_SIZE):
                    target.execute(table.insert(), [dict(row._mapping) for row in rows])

            preparer = db.engine.dialect.identifier_preparer
            for table in tables:
                for column in table.primary_key.columns:
                    if not column.autoincrement:
                        continue

                    qualified_table = (
                        f"{preparer.quote_schema('public')}."
                        f"{preparer.quote(table.name)}"
                    )
                    quoted_column = preparer.quote(column.name)
                    sequence = target.execute(
                        text(
                            "SELECT pg_get_serial_sequence(:table_name, :column_name)"
                        ),
                        {
                            "table_name": f"public.{table.name}",
                            "column_name": column.name,
                        },
                    ).scalar_one()
                    if sequence:
                        target.execute(
                            text(
                                f"SELECT setval(CAST(:sequence AS regclass), "
                                f"COALESCE(MAX({quoted_column}), 1), "
                                f"MAX({quoted_column}) IS NOT NULL) "
                                f"FROM {qualified_table}"
                            ),
                            {"sequence": sequence},
                        )

            for table in tables:
                copied_count = target.execute(
                    select(func.count()).select_from(table)
                ).scalar_one()
                if copied_count != source_counts[table.name]:
                    raise RuntimeError(
                        f"Row count mismatch for {table.name}: "
                        f"source={source_counts[table.name]}, "
                        f"destination={copied_count}"
                    )

        print("Copy completed and row counts verified.")
    finally:
        source_engine.dispose()
        db.session.remove()
        db.engine.dispose()
        app_context.pop()


if __name__ == "__main__":
    main()
