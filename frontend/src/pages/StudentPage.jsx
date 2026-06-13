import { FilePlus2, Search, FileText } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import GradeTable from "../components/GradeTable";
import Notice from "../components/Notice";

const statusLabel = {
  pending: "待处理",
  approved: "已通过",
  rejected: "已驳回",
};

export default function StudentPage() {
  const [studentNo, setStudentNo] = useState("20240001");
  const [transcript, setTranscript] = useState(null);
  const [appealForm, setAppealForm] = useState({ gradeId: "", reason: "", evidence: "" });
  const [notice, setNotice] = useState(null);
  const [myAppeals, setMyAppeals] = useState([]);

  const loadMyAppeals = async () => {
    setMyAppeals(await api.listAppeals(studentNo));
  };

  const search = async (event) => {
    event.preventDefault();
    try {
      setTranscript(await api.getTranscript(studentNo));
      await loadMyAppeals();
      setNotice(null);
    } catch (error) {
      setTranscript(null);
      setMyAppeals([]);
      setNotice({ type: "error", message: error.message });
    }
  };

  const submitAppeal = async (event) => {
    event.preventDefault();
    try {
      await api.createAppeal({ ...appealForm, gradeId: Number(appealForm.gradeId), studentNo });
      setNotice({ type: "success", message: "申诉已提交" });
      setAppealForm({ gradeId: "", reason: "", evidence: "" });
      setTranscript(await api.getTranscript(studentNo));
      await loadMyAppeals();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>学生自助查询</h1>
          <p>按学号查看成绩、总学分、平均成绩和 GPA。</p>
        </div>
        <form className="search-bar" onSubmit={search}>
          <input value={studentNo} onChange={(event) => setStudentNo(event.target.value)} placeholder="输入学号" />
          <button type="submit">
            <Search size={18} />
            查询
          </button>
        </form>
      </header>

      <Notice notice={notice} />

      {transcript && (
        <>
          <div className="metric-grid">
            <div className="metric">
              <span>学生</span>
              <strong>{transcript.student.name}</strong>
            </div>
            <div className="metric">
              <span>课程数</span>
              <strong>{transcript.summary.courseCount}</strong>
            </div>
            <div className="metric">
              <span>已获学分</span>
              <strong>{transcript.summary.passedCredit}</strong>
            </div>
            <div className="metric">
              <span>GPA</span>
              <strong>{transcript.summary.gpa}</strong>
            </div>
            <div className="metric">
              <span>平均分</span>
              <strong>{transcript.summary.averageScore}</strong>
            </div>
          </div>

          <div className="split-grid narrow">
            <div className="panel">
              <div className="panel-head">
                <h2>成绩单</h2>
              </div>
              <GradeTable compact grades={transcript.grades} />
            </div>
            <form className="panel appeal-form" onSubmit={submitAppeal}>
              <div className="panel-head">
                <h2>成绩申诉</h2>
              </div>
              <label>
                课程
                <select value={appealForm.gradeId} onChange={(event) => setAppealForm((current) => ({ ...current, gradeId: event.target.value }))} required>
                  <option value="">选择课程</option>
                  {transcript.grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.courseName} - {grade.score} 分
                    </option>
                  ))}
                </select>
              </label>
              <label>
                申诉理由
                <textarea value={appealForm.reason} onChange={(event) => setAppealForm((current) => ({ ...current, reason: event.target.value }))} required rows="4" placeholder="请简要说明申诉的问题" />
              </label>
              <label>
                凭证说明
                <textarea value={appealForm.evidence} onChange={(event) => setAppealForm((current) => ({ ...current, evidence: event.target.value }))} required rows="5" placeholder="请填写申诉依据，如：对照参考答案、作业照片、考试答卷截图等说明" />
              </label>
              <button className="primary-action" type="submit">
                <FilePlus2 size={18} />
                提交申诉
              </button>
            </form>
          </div>

          {myAppeals.length > 0 && (
            <div className="panel">
              <div className="panel-head">
                <h2><FileText size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />我的申诉记录</h2>
              </div>
              <div className="appeal-list">
                {myAppeals.map((appeal) => (
                  <article className="appeal-card" key={appeal.id}>
                    <div style={{ width: "100%" }}>
                      <div className="appeal-title">
                        <strong>{appeal.courseName}</strong>
                        <span className={`status ${appeal.status}`}>{statusLabel[appeal.status]}</span>
                      </div>
                      <p>
                        原成绩：<strong>{appeal.originalScore}</strong> 分
                        {appeal.status === "approved" && appeal.newScore != null && (
                          <span style={{ marginLeft: 12 }}>
                            → 更正后：<strong style={{ color: "#15803d" }}>{appeal.newScore}</strong> 分
                          </span>
                        )}
                      </p>
                      <div className="appeal-detail">
                        <div className="appeal-detail-label">申诉原因</div>
                        <blockquote>{appeal.reason}</blockquote>
                      </div>
                      {appeal.evidence && (
                        <div className="appeal-detail">
                          <div className="appeal-detail-label">凭证说明</div>
                          <blockquote className="evidence">{appeal.evidence}</blockquote>
                        </div>
                      )}
                      {appeal.teacherResponse && (
                        <div className="appeal-detail">
                          <div className="appeal-detail-label">教师处理意见</div>
                          <p className="response">{appeal.teacherResponse}</p>
                        </div>
                      )}
                      <p style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>
                        提交时间：{new Date(appeal.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
