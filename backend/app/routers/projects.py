from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/classes/{class_id}/exam-projects", tags=["exam"])

PROJECT_TYPES = {"计时类", "计数类", "距离类"}
SKILL_LEVELS = {"A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-"}


@router.get("", response_model=list[schemas.ExamProjectOut])
def list_projects(class_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.ExamProject)
        .filter_by(course_class_id=class_id)
        .order_by(models.ExamProject.id.desc())
        .all()
    )


@router.post("", response_model=schemas.ExamProjectOut)
def create_project(class_id: int, data: schemas.ExamProjectIn, db: Session = Depends(get_db)):
    if not db.get(models.CourseClass, class_id):
        raise HTTPException(status_code=404, detail="课程班级不存在")
    if data.project_type not in PROJECT_TYPES:
        raise HTTPException(status_code=400, detail="项目类型只能是计时类、计数类、距离类")
    row = models.ExamProject(
        course_class_id=class_id,
        name=data.name.strip(),
        project_type=data.project_type,
        unit=data.unit.strip(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{project_id}/results", response_model=list[schemas.ExamResultOut])
def list_results(class_id: int, project_id: int, db: Session = Depends(get_db)):
    project = db.get(models.ExamProject, project_id)
    if not project or project.course_class_id != class_id:
        raise HTTPException(status_code=404, detail="考试项目不存在")
    return db.query(models.ExamResult).filter_by(project_id=project_id).all()


@router.post("/{project_id}/results", response_model=schemas.ExamResultOut)
def upsert_result(
    class_id: int,
    project_id: int,
    data: schemas.ExamResultIn,
    db: Session = Depends(get_db),
):
    project = db.get(models.ExamProject, project_id)
    student = db.get(models.Student, data.student_id)
    if not project or project.course_class_id != class_id:
        raise HTTPException(status_code=404, detail="考试项目不存在")
    if not student or student.course_class_id != class_id:
        raise HTTPException(status_code=404, detail="学生不存在")
    if data.skill_level and data.skill_level not in SKILL_LEVELS:
        raise HTTPException(status_code=400, detail="技能等级不合法")

    row = db.query(models.ExamResult).filter_by(student_id=data.student_id, project_id=project_id).first()
    if not row:
        row = models.ExamResult(student_id=data.student_id, project_id=project_id)
        db.add(row)
    row.quantitative_value = data.quantitative_value
    row.skill_level = data.skill_level
    row.absent = data.absent
    db.commit()
    db.refresh(row)
    return row
