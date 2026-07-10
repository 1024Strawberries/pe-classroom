from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class SemesterIn(BaseModel):
    name: str


class SemesterOut(SemesterIn):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CourseClassIn(BaseModel):
    semester_id: int
    name: str


class CourseClassUpdate(BaseModel):
    name: str


class CourseClassOut(CourseClassIn):
    id: int
    semester_name: str = ""
    student_count: int = 0
    model_config = ConfigDict(from_attributes=True)


class StudentIn(BaseModel):
    student_no: str
    name: str
    class_name: str = ""


class StudentOut(BaseModel):
    id: int
    course_class_id: int
    student_no: str
    name: str
    class_name: str = ""
    position: int = 0
    model_config = ConfigDict(from_attributes=True)


class AttendanceRecordIn(BaseModel):
    student_id: int
    status: str


class AttendanceSessionIn(BaseModel):
    date: str
    records: list[AttendanceRecordIn]


class AttendanceSessionOut(BaseModel):
    id: int
    course_class_id: int
    date: str
    model_config = ConfigDict(from_attributes=True)


class AttendanceRecordOut(BaseModel):
    id: int
    session_id: int
    student_id: int
    status: str
    model_config = ConfigDict(from_attributes=True)


class ExamProjectIn(BaseModel):
    name: str
    project_type: str
    unit: str = ""


class ExamProjectOut(ExamProjectIn):
    id: int
    course_class_id: int
    model_config = ConfigDict(from_attributes=True)


class ExamResultIn(BaseModel):
    student_id: int
    quantitative_value: str = ""
    skill_level: str = ""
    absent: int = 0


class ExamResultOut(ExamResultIn):
    id: int
    project_id: int
    model_config = ConfigDict(from_attributes=True)
