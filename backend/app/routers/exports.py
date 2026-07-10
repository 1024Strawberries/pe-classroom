from io import BytesIO
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db

router = APIRouter(prefix="/api/classes/{class_id}", tags=["export"])


@router.get("/export.xlsx")
def export_excel(class_id: int, db: Session = Depends(get_db)):
    course_class = db.get(models.CourseClass, class_id)
    if not course_class:
        raise HTTPException(status_code=404, detail="课程班级不存在")

    students = (
        db.query(models.Student)
        .filter_by(course_class_id=class_id)
        .order_by(models.Student.position, models.Student.id)
        .all()
    )
    sessions = (
        db.query(models.AttendanceSession)
        .filter_by(course_class_id=class_id)
        .order_by(models.AttendanceSession.date, models.AttendanceSession.id)
        .all()
    )
    projects = (
        db.query(models.ExamProject)
        .filter_by(course_class_id=class_id)
        .order_by(models.ExamProject.id)
        .all()
    )
    attendance = {
        (record.student_id, record.session_id): record.status
        for record in db.query(models.AttendanceRecord)
        .join(models.AttendanceSession, models.AttendanceSession.id == models.AttendanceRecord.session_id)
        .filter(models.AttendanceSession.course_class_id == class_id)
        .all()
    }
    results = {
        (row.student_id, row.project_id): row
        for row in db.query(models.ExamResult)
        .join(models.ExamProject, models.ExamProject.id == models.ExamResult.project_id)
        .filter(models.ExamProject.course_class_id == class_id)
        .all()
    }

    wb = Workbook()
    ws = wb.active
    ws.title = "导出结果"
    headers = ["学号", "姓名", "班级"]
    headers.extend([f"{session.date}考勤" for session in sessions])
    for project in projects:
        label = "用时" if project.project_type == "计时类" else "次数" if project.project_type == "计数类" else "距离"
        headers.extend([f"{project.name}{label}", f"{project.name}单位", f"{project.name}技能等级"])
    ws.append(headers)

    for student in students:
        row = [student.student_no, student.name, student.class_name]
        row.extend(attendance.get((student.id, session.id), "") for session in sessions)
        for project in projects:
            result = results.get((student.id, project.id))
            value = "缺考" if result and result.absent else result.quantitative_value if result else ""
            row.extend([value, project.unit, result.skill_level if result else ""])
        ws.append(row)

    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)
    filename = quote(f"{course_class.name}_体育记录.xlsx")
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )
