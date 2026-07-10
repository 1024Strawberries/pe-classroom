from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Semester(Base):
    __tablename__ = "semesters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)

    classes: Mapped[list["CourseClass"]] = relationship(back_populates="semester", cascade="all, delete-orphan")


class CourseClass(Base):
    __tablename__ = "course_classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    semester_id: Mapped[int] = mapped_column(ForeignKey("semesters.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100), index=True)

    semester: Mapped["Semester"] = relationship(back_populates="classes")
    students: Mapped[list["Student"]] = relationship(cascade="all, delete-orphan")
    projects: Mapped[list["ExamProject"]] = relationship(cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"
    __table_args__ = (UniqueConstraint("course_class_id", "student_no", name="uq_class_student_no"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_class_id: Mapped[int] = mapped_column(ForeignKey("course_classes.id", ondelete="CASCADE"), index=True)
    student_no: Mapped[str] = mapped_column(String(50), index=True)
    name: Mapped[str] = mapped_column(String(50))
    class_name: Mapped[str] = mapped_column(String(100), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    __table_args__ = (UniqueConstraint("course_class_id", "date", name="uq_attendance_class_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_class_id: Mapped[int] = mapped_column(ForeignKey("course_classes.id", ondelete="CASCADE"), index=True)
    date: Mapped[str] = mapped_column(String(20), index=True)

    records: Mapped[list["AttendanceRecord"]] = relationship(cascade="all, delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("session_id", "student_id", name="uq_attendance_student"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("attendance_sessions.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20))


class ExamProject(Base):
    __tablename__ = "exam_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_class_id: Mapped[int] = mapped_column(ForeignKey("course_classes.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    project_type: Mapped[str] = mapped_column(String(20))
    unit: Mapped[str] = mapped_column(String(20), default="")


class ExamResult(Base):
    __tablename__ = "exam_results"
    __table_args__ = (UniqueConstraint("student_id", "project_id", name="uq_exam_student_project"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("exam_projects.id", ondelete="CASCADE"), index=True)
    quantitative_value: Mapped[str] = mapped_column(String(50), default="")
    skill_level: Mapped[str] = mapped_column(String(10), default="")
    absent: Mapped[int] = mapped_column(Integer, default=0)
