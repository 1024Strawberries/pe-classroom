from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/classes/{class_id}/attendance-sessions", tags=["attendance"])


@router.get("", response_model=list[schemas.AttendanceSessionOut])
def list_sessions(class_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.AttendanceSession)
        .filter_by(course_class_id=class_id)
        .order_by(models.AttendanceSession.date.desc(), models.AttendanceSession.id.desc())
        .all()
    )


@router.post("", response_model=schemas.AttendanceSessionOut)
def save_session(class_id: int, data: schemas.AttendanceSessionIn, db: Session = Depends(get_db)):
    if not db.get(models.CourseClass, class_id):
        raise HTTPException(status_code=404, detail="课程班级不存在")
    valid_ids = {
        row.id for row in db.query(models.Student.id).filter_by(course_class_id=class_id).all()
    }
    if any(record.student_id not in valid_ids for record in data.records):
        raise HTTPException(status_code=400, detail="考勤记录包含不属于本班级的学生")

    session = db.query(models.AttendanceSession).filter_by(course_class_id=class_id, date=data.date).first()
    if not session:
        session = models.AttendanceSession(course_class_id=class_id, date=data.date)
        db.add(session)
        db.flush()
    else:
        db.query(models.AttendanceRecord).filter_by(session_id=session.id).delete()
    for record in data.records:
        db.add(models.AttendanceRecord(session_id=session.id, student_id=record.student_id, status=record.status))
    db.commit()
    db.refresh(session)
    return session


@router.get("/by-date/{date}", response_model=schemas.AttendanceSessionOut)
def get_or_create_session(class_id: int, date: str, db: Session = Depends(get_db)):
    if not db.get(models.CourseClass, class_id):
        raise HTTPException(status_code=404, detail="课程班级不存在")
    session = db.query(models.AttendanceSession).filter_by(course_class_id=class_id, date=date).first()
    if not session:
        session = models.AttendanceSession(course_class_id=class_id, date=date)
        db.add(session)
        db.commit()
        db.refresh(session)
    return session


@router.post("/{session_id}/records", response_model=schemas.AttendanceRecordOut)
def upsert_record(
    class_id: int,
    session_id: int,
    data: schemas.AttendanceRecordIn,
    db: Session = Depends(get_db),
):
    session = db.get(models.AttendanceSession, session_id)
    student = db.get(models.Student, data.student_id)
    if not session or session.course_class_id != class_id:
        raise HTTPException(status_code=404, detail="考勤不存在")
    if not student or student.course_class_id != class_id:
        raise HTTPException(status_code=404, detail="学生不存在")
    row = db.query(models.AttendanceRecord).filter_by(session_id=session_id, student_id=data.student_id).first()
    if not row:
        row = models.AttendanceRecord(session_id=session_id, student_id=data.student_id, status=data.status)
        db.add(row)
    row.status = data.status
    db.commit()
    db.refresh(row)
    return row


@router.get("/{session_id}/records", response_model=list[schemas.AttendanceRecordOut])
def list_records(class_id: int, session_id: int, db: Session = Depends(get_db)):
    session = db.get(models.AttendanceSession, session_id)
    if not session or session.course_class_id != class_id:
        raise HTTPException(status_code=404, detail="考勤不存在")
    return db.query(models.AttendanceRecord).filter_by(session_id=session_id).all()
