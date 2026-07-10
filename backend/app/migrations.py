from sqlalchemy import text


def _columns(conn, table: str) -> set[str]:
    rows = conn.execute(text(f"PRAGMA table_info({table})")).mappings().all()
    return {row["name"] for row in rows}


def run_migrations(engine):
    with engine.begin() as conn:
        exam_project_cols = _columns(conn, "exam_projects")
        if exam_project_cols and "unit" not in exam_project_cols:
            conn.execute(text("ALTER TABLE exam_projects ADD COLUMN unit VARCHAR(20) DEFAULT ''"))

        exam_result_cols = _columns(conn, "exam_results")
        if exam_result_cols and "absent" not in exam_result_cols:
            conn.execute(text("ALTER TABLE exam_results ADD COLUMN absent INTEGER DEFAULT 0"))

        duplicates = conn.execute(
            text(
                "SELECT course_class_id, date, MIN(id) AS keep_id "
                "FROM attendance_sessions GROUP BY course_class_id, date HAVING COUNT(*) > 1"
            )
        ).mappings().all()
        for item in duplicates:
            duplicate_ids = [
                row["id"]
                for row in conn.execute(
                    text(
                        "SELECT id FROM attendance_sessions "
                        "WHERE course_class_id = :class_id AND date = :date AND id != :keep_id"
                    ),
                    {"class_id": item["course_class_id"], "date": item["date"], "keep_id": item["keep_id"]},
                ).mappings()
            ]
            for duplicate_id in duplicate_ids:
                conn.execute(
                    text(
                        "UPDATE OR IGNORE attendance_records SET session_id = :keep_id "
                        "WHERE session_id = :duplicate_id"
                    ),
                    {"keep_id": item["keep_id"], "duplicate_id": duplicate_id},
                )
                conn.execute(
                    text("DELETE FROM attendance_records WHERE session_id = :duplicate_id"),
                    {"duplicate_id": duplicate_id},
                )
                conn.execute(
                    text("DELETE FROM attendance_sessions WHERE id = :duplicate_id"),
                    {"duplicate_id": duplicate_id},
                )

        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS "
                "ix_attendance_class_date ON attendance_sessions(course_class_id, date)"
            )
        )
