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
  const [approvingId, setApprovingId] = useState(null);

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

  const startApprove = (appeal) => {
    const teacherResponse = responses[appeal.id] || "";
    if (!teacherResponse.trim()) {
      setNotice({ type: "error", message: "请填写处理意见" });
      return;
    }
    setApprovingId(appeal.id);
  };

  const cancelApprove = () => {
    setApprovingId(null);
  };

  const confirmApprove = async (appeal) => {
    const score = newScores[appeal.id];
    if (!score || isNaN(Number(score))) {
      setNotice({ type: "error", message: "请填写更正后的成绩" });
      return;
    }
    try {
      await api.updateAppeal(appeal.id, {
        status: "approved",
        teacherResponse: (responses[appeal.id] || "").trim(),
        newScore: Number(score),
      });
      setNotice({ type: "success", message: "申诉已通过，成绩已更正" });
      setResponses((current) => { const next = { ...current }; delete next[appeal.id]; return next; });
      setNewScores((current) => { const next = { ...current }; delete next[appeal.id]; return next; });
      setApprovingId(null);
      await loadAppeals();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  const reject = async (appeal) => {
    const teacherResponse = responses[appeal.id] || "";
    if (!teacherResponse.trim()) {
      setNotice({ type: "error", message: "请填写处理意见" });
      return;
    }
    try {
      await api.updateAppeal(appeal.id, { status: "rejected", teacherResponse: teacherResponse.trim() });
      setNotice({ type: "success", message: "申诉已驳回" });
      setResponses((current) => { const next = { ...current }; delete next[appeal.id]; return next; });
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
                {appeal.studentName}（{appeal.studentNo}）
                原成绩：<strong>{appeal.originalScore}</strong> 分
                {appeal.status === "approved" && appeal.newScore != null && (
                  <span style={{ marginLeft: 10 }}>
                    → 已更正：<strong style={{ color: "#15803d" }}>{appeal.newScore}</strong> 分
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
                  <div className="appeal-detail-label">处理意见</div>
                  <p className="response">{appeal.teacherResponse}</p>
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
              {approvingId === appeal.id && (
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
                    placeholder="填写更正后的成绩"
                  />
                </div>
              )}
            </div>
            <div className="appeal-actions">
              {appeal.status === "pending" && approvingId !== appeal.id && (
                <>
                  <button onClick={() => startApprove(appeal)} type="button">
                    <CheckCircle2 size={18} />
                    通过
                  </button>
                  <button onClick={() => reject(appeal)} type="button">
                    <XCircle size={18} />
                    驳回
                  </button>
                </>
              )}
              {approvingId === appeal.id && (
                <>
                  <button onClick={() => confirmApprove(appeal)} type="button">
                    <CheckCircle2 size={18} />
                    确认通过
                  </button>
                  <button onClick={cancelApprove} type="button">
                    取消
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
        {!appeals.length && <div className="empty">暂无申诉记录</div>}
      </div>
    </section>
  );
}
