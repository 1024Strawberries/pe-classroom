from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api", tags=["classes"])


def class_out(row: models.CourseClass) -> schemas.CourseClassOut:
    return schemas.CourseClassOut(
        id=row.id,
        semester_id=row.semester_id,
        name=row.name,
        semester_name=row.semester.name if row.semester else "",
        student_count=len(row.students),
    )


@router.get("/semesters", response_model=list[schemas.SemesterOut])
def list_semesters(db: Session = Depends(get_db)):
    return db.query(models.Semester).order_by(models.Semester.id.desc()).all()


@router.post("/semesters", response_model=schemas.SemesterOut)
def create_semester(data: schemas.SemesterIn, db: Session = Depends(get_db)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="学期不能为空")
    row = db.query(models.Semester).filter_by(name=name).first()
    if row:
        return row
    row = models.Semester(name=name)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/classes", response_model=list[schemas.CourseClassOut])
def list_classes(db: Session = Depends(get_db)):
    rows = db.query(models.CourseClass).order_by(models.CourseClass.id.desc()).all()
    return [class_out(row) for row in rows]


@router.post("/classes", response_model=schemas.CourseClassOut)
def create_class(data: schemas.CourseClassIn, db: Session = Depends(get_db)):
    if not db.get(models.Semester, data.semester_id):
        raise HTTPException(status_code=404, detail="学期不存在")
    row = models.CourseClass(semester_id=data.semester_id, name=data.name.strip())
    db.add(row)
    db.commit()
    db.refresh(row)
    return class_out(row)


@router.get("/classes/{class_id}", response_model=schemas.CourseClassOut)
def get_class(class_id: int, db: Session = Depends(get_db)):
    row = db.get(models.CourseClass, class_id)
    if not row:
        raise HTTPException(status_code=404, detail="课程班级不存在")
    return class_out(row)


@router.put("/classes/{class_id}", response_model=schemas.CourseClassOut)
def update_class(class_id: int, data: schemas.CourseClassUpdate, db: Session = Depends(get_db)):
    row = db.get(models.CourseClass, class_id)
    if not row:
        raise HTTPException(status_code=404, detail="课程班级不存在")
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="班级名称不能为空")
    row.name = name
    db.commit()
    db.refresh(row)
    return class_out(row)


@router.delete("/classes/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db)):
    row = db.get(models.CourseClass, class_id)
    if not row:
        raise HTTPException(status_code=404, detail="课程班级不存在")
    db.delete(row)
    db.commit()
    return {"ok": True}
