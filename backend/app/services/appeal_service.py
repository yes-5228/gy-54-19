from ..extensions import db
from ..models import Appeal, Grade


VALID_STATUSES = {"pending", "approved", "rejected"}


def create_appeal(payload):
    grade = Grade.query.get(payload["gradeId"])
    if not grade:
        return None, "成绩记录不存在"
    if grade.student.student_no != payload["studentNo"]:
        return None, "学号与成绩记录不匹配"

    appeal = Appeal(
        grade=grade,
        student_no=payload["studentNo"],
        reason=payload["reason"],
        evidence=payload.get("evidence", ""),
    )
    db.session.add(appeal)
    db.session.commit()
    return appeal, None


def update_appeal(appeal, payload):
    status = payload.get("status", appeal.status)
    if status not in VALID_STATUSES:
        return None, "申诉状态无效"
    appeal.status = status
    appeal.teacher_response = payload.get("teacherResponse", appeal.teacher_response)

    if status == "approved":
        new_score = payload.get("newScore")
        if new_score is None:
            return None, "申诉通过时必须填写更正后的成绩"
        try:
            new_score = float(new_score)
        except (TypeError, ValueError):
            return None, "更正成绩必须是数字"
        if new_score < 0 or new_score > 100:
            return None, "更正成绩必须在 0 到 100 之间"
        appeal.new_score = new_score
        appeal.grade.score = new_score

    db.session.commit()
    return appeal, None
