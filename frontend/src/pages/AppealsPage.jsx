import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import Notice from "../components/Notice";

const statusLabel = {
  pending: "待处理",
  approved: "已通过",
  rejected: "已驳回",
};

export default function AppealsPage() {
  const [appeals, setAppeals] = useState([]);
  const [notice, setNotice] = useState(null);
  const [responses, setResponses] = useState({});
  const [newScores, setNewScores] = useState({});

  const loadAppeals = async () => {
    setAppeals(await api.listAppeals());
  };

  useEffect(() => {
    loadAppeals().catch((error) => setNotice({ type: "error", message: error.message }));
  }, []);

  const updateResponse = (appealId, value) => {
    setResponses((current) => ({ ...current, [appealId]: value }));
  };

  const updateNewScore = (appealId, value) => {
    setNewScores((current) => ({ ...current, [appealId]: value }));
  };

  const decide = async (appeal, status) => {
    const teacherResponse = responses[appeal.id] || "";
    if (!teacherResponse.trim()) {
      setNotice({ type: "error", message: "请填写处理意见" });
      return;
    }
    const payload = { status, teacherResponse: teacherResponse.trim() };
    if (status === "approved") {
      const score = newScores[appeal.id];
      if (!score || isNaN(Number(score))) {
        setNotice({ type: "error", message: "申诉通过时必须填写更正后的成绩" });
        return;
      }
      payload.newScore = Number(score);
    }
    try {
      await api.updateAppeal(appeal.id, payload);
      setNotice({ type: "success", message: status === "approved" ? "申诉已通过，成绩已更正" : "申诉已驳回" });
      setResponses((current) => {
        const next = { ...current };
        delete next[appeal.id];
        return next;
      });
      setNewScores((current) => {
        const next = { ...current };
        delete next[appeal.id];
        return next;
      });
      await loadAppeals();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>成绩申诉处理</h1>
          <p>教师查看学生申诉，并给出处理结果。</p>
        </div>
      </header>
      <Notice notice={notice} />
      <div className="appeal-list">
        {appeals.map((appeal) => (
          <article className="appeal-card" key={appeal.id}>
            <div>
              <div className="appeal-title">
                <strong>{appeal.courseName}</strong>
                <span className={`status ${appeal.status}`}>{statusLabel[appeal.status]}</span>
              </div>
              <p>
                {appeal.studentName}（{appeal.studentNo}）当前成绩 {appeal.score} 分
                {appeal.newScore != null && appeal.status === "approved" && (
                  <span style={{ color: "#15803d", marginLeft: 8 }}>→ 更正为 {appeal.newScore} 分</span>
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
                  <div className="appeal-detail-label">处理意见</div>
                  <p className="response">{appeal.teacherResponse}</p>
                </div>
              )}
              {appeal.status === "pending" && (
                <div className="appeal-detail">
                  <div className="appeal-detail-label">更正成绩</div>
                  <input
                    className="new-score-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={newScores[appeal.id] || ""}
                    onChange={(event) => updateNewScore(appeal.id, event.target.value)}
                    placeholder="申诉通过后填入更正成绩"
                  />
                </div>
              )}
              {appeal.status === "pending" && (
                <div className="appeal-detail">
                  <div className="appeal-detail-label">填写处理意见</div>
                  <textarea
                    className="teacher-response-input"
                    value={responses[appeal.id] || ""}
                    onChange={(event) => updateResponse(appeal.id, event.target.value)}
                    placeholder="请输入具体的处理意见，说明复核结果及原因..."
                    rows="4"
                  />
                </div>
              )}
            </div>
            <div className="appeal-actions">
              <button disabled={appeal.status !== "pending"} onClick={() => decide(appeal, "approved")} type="button">
                <CheckCircle2 size={18} />
                通过
              </button>
              <button disabled={appeal.status !== "pending"} onClick={() => decide(appeal, "rejected")} type="button">
                <XCircle size={18} />
                驳回
              </button>
            </div>
          </article>
        ))}
        {!appeals.length && <div className="empty">暂无申诉记录</div>}
      </div>
    </section>
  );
}
