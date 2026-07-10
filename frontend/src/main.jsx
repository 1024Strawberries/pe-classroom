import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClipboardCheck, Download, Dumbbell, FileUp, Home, Plus, Save, School, TimerReset } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
const ATTENDANCE = ['正常', '迟到', '旷课', '早退'];
const SKILLS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'];

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '请求失败');
  }
  return res.json();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const [view, setView] = useState('classes');
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(() => Number(localStorage.getItem('activeClassId') || 0));
  const [students, setStudents] = useState([]);
  const activeClass = classes.find(item => item.id === activeClassId);

  async function loadBasics() {
    const [semesterRows, classRows] = await Promise.all([request('/api/semesters'), request('/api/classes')]);
    setSemesters(semesterRows);
    setClasses(classRows);
    if (!activeClassId && classRows[0]) setActiveClassId(classRows[0].id);
  }

  async function loadStudents(classId = activeClassId) {
    if (!classId) {
      setStudents([]);
      return;
    }
    setStudents(await request(`/api/classes/${classId}/students`));
  }

  useEffect(() => { loadBasics(); }, []);
  useEffect(() => {
    localStorage.setItem('activeClassId', String(activeClassId || ''));
    loadStudents(activeClassId);
  }, [activeClassId]);

  const nav = [
    ['classes', '课程班级', School],
    ['import', '导入学生', FileUp],
    ['attendance', '考勤', ClipboardCheck],
    ['exam', '考试', Dumbbell],
    ['export', '导出', Download],
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p>体育课现场记录</p>
          <h1>{activeClass ? activeClass.name : '请先创建课程班级'}</h1>
          {activeClass && <span>{activeClass.semester_name} · {students.length} 人</span>}
        </div>
        <select value={activeClassId || ''} onChange={e => setActiveClassId(Number(e.target.value))}>
          <option value="">选择班级</option>
          {classes.map(item => <option key={item.id} value={item.id}>{item.semester_name} / {item.name}</option>)}
        </select>
      </header>

      <main>
        {view === 'classes' && <Classes semesters={semesters} classes={classes} onChanged={loadBasics} onPick={setActiveClassId} />}
        {view === 'import' && <RequireClass activeClass={activeClass}><ImportStudents activeClass={activeClass} students={students} onImported={loadStudents} /></RequireClass>}
        {view === 'attendance' && <RequireClass activeClass={activeClass}><Attendance activeClass={activeClass} students={students} /></RequireClass>}
        {view === 'exam' && <RequireClass activeClass={activeClass}><Exam activeClass={activeClass} students={students} /></RequireClass>}
        {view === 'export' && <RequireClass activeClass={activeClass}><Export activeClass={activeClass} students={students} /></RequireClass>}
      </main>

      <nav className="bottom-nav">
        {nav.map(([key, label, Icon]) => (
          <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function RequireClass({ activeClass, children }) {
  if (!activeClass) {
    return <section className="empty-state"><Home size={34} /><strong>请先创建并选择课程班级</strong></section>;
  }
  return children;
}

function Classes({ semesters, classes, onChanged, onPick }) {
  const [semesterName, setSemesterName] = useState('');
  const [classForm, setClassForm] = useState({ semester_id: '', name: '' });
  const [message, setMessage] = useState('');

  async function createSemester(e) {
    e.preventDefault();
    const row = await request('/api/semesters', { method: 'POST', body: JSON.stringify({ name: semesterName }) });
    setSemesterName('');
    setClassForm(form => ({ ...form, semester_id: row.id }));
    setMessage('学期已保存');
    await onChanged();
  }

  async function createClass(e) {
    e.preventDefault();
    const row = await request('/api/classes', { method: 'POST', body: JSON.stringify({ ...classForm, semester_id: Number(classForm.semester_id) }) });
    setClassForm(form => ({ ...form, name: '' }));
    setMessage('课程班级已保存');
    await onChanged();
    onPick(row.id);
  }

  return (
    <section className="stack">
      <form className="panel form-panel" onSubmit={createSemester}>
        <h2>创建学期</h2>
        <input placeholder="例如 2026-2027 第一学期" value={semesterName} onChange={e => setSemesterName(e.target.value)} required />
        <button className="primary"><Plus size={18} />保存学期</button>
      </form>

      <form className="panel form-panel" onSubmit={createClass}>
        <h2>创建课程班级</h2>
        <select value={classForm.semester_id} onChange={e => setClassForm({ ...classForm, semester_id: e.target.value })} required>
          <option value="">选择学期</option>
          {semesters.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <input placeholder="例如 2026级篮球1班" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} required />
        <button className="primary"><Plus size={18} />保存班级</button>
        {message && <p className="message">{message}</p>}
      </form>

      <section className="panel">
        <h2>已有课程班级</h2>
        <div className="list">
          {classes.map(item => (
            <button className="list-row" key={item.id} onClick={() => onPick(item.id)}>
              <strong>{item.name}</strong>
              <span>{item.semester_name}</span>
            </button>
          ))}
          {!classes.length && <p className="muted">暂无课程班级</p>}
        </div>
      </section>
    </section>
  );
}

function ImportStudents({ activeClass, students, onImported }) {
  const [message, setMessage] = useState('');

  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    const data = await request(`/api/classes/${activeClass.id}/students/import`, { method: 'POST', body });
    setMessage(`已导入 ${data.imported} 名学生`);
    await onImported(activeClass.id);
    e.target.value = '';
  }

  return (
    <section className="stack">
      <div className="panel">
        <h2>导入学生</h2>
        <p className="muted">Excel 第一行需要包含：学号、姓名、班级。</p>
        <label className="upload-btn">
          <FileUp size={22} />
          <span>选择 Excel 文件</span>
          <input type="file" accept=".xlsx,.xls" onChange={upload} />
        </label>
        {message && <p className="message">{message}</p>}
      </div>
      <StudentList students={students} />
    </section>
  );
}

function Attendance({ activeClass, students }) {
  const [date, setDate] = useState(today());
  const [index, setIndex] = useState(0);
  const [statuses, setStatuses] = useState({});
  const [message, setMessage] = useState('');
  const student = students[index];

  function choose(status) {
    if (!student) return;
    setStatuses({ ...statuses, [student.id]: status });
    setIndex(Math.min(index + 1, students.length - 1));
  }

  async function save() {
    const records = students.map(s => ({ student_id: s.id, status: statuses[s.id] || '正常' }));
    await request(`/api/classes/${activeClass.id}/attendance-sessions`, {
      method: 'POST',
      body: JSON.stringify({ date, records }),
    });
    setMessage('本次考勤已保存');
  }

  return (
    <section className="stack">
      <div className="session-bar">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <span>{students.length ? `${index + 1}/${students.length}` : '0/0'}</span>
      </div>
      <StudentCard student={student} footer={student && <span>{statuses[student.id] || '未记录'}</span>} />
      <div className="status-grid">
        {ATTENDANCE.map(status => <button key={status} onClick={() => choose(status)}>{status}</button>)}
      </div>
      <Pager index={index} total={students.length} onPrev={() => setIndex(Math.max(0, index - 1))} onNext={() => setIndex(Math.min(students.length - 1, index + 1))} />
      <button className="primary big" disabled={!students.length} onClick={save}><Save size={20} />保存本次考勤</button>
      {message && <p className="message">{message}</p>}
    </section>
  );
}

function Exam({ activeClass, students }) {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [projectForm, setProjectForm] = useState({ name: '', project_type: '计时类' });

  async function loadProjects() {
    const rows = await request(`/api/classes/${activeClass.id}/exam-projects`);
    setProjects(rows);
    if (!projectId && rows[0]) setProjectId(String(rows[0].id));
  }

  useEffect(() => { loadProjects(); }, [activeClass.id]);

  async function createProject(e) {
    e.preventDefault();
    const row = await request(`/api/classes/${activeClass.id}/exam-projects`, { method: 'POST', body: JSON.stringify(projectForm) });
    setProjectForm({ ...projectForm, name: '' });
    setProjectId(String(row.id));
    await loadProjects();
  }

  const project = projects.find(item => item.id === Number(projectId));

  return (
    <section className="stack">
      <form className="panel form-panel" onSubmit={createProject}>
        <h2>考试项目</h2>
        <input placeholder="项目名称，例如 50米" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} required />
        <select value={projectForm.project_type} onChange={e => setProjectForm({ ...projectForm, project_type: e.target.value })}>
          <option>计时类</option>
          <option>计数类</option>
          <option>距离类</option>
        </select>
        <button className="primary"><Plus size={18} />创建项目</button>
      </form>
      <div className="panel form-panel">
        <h2>进入考试</h2>
        <select value={projectId} onChange={e => setProjectId(e.target.value)}>
          <option value="">选择项目</option>
          {projects.map(item => <option key={item.id} value={item.id}>{item.name} / {item.project_type}</option>)}
        </select>
      </div>
      {project ? <ExamRunner activeClass={activeClass} project={project} students={students} /> : <p className="muted center">请先创建或选择考试项目</p>}
    </section>
  );
}

function ExamRunner({ activeClass, project, students }) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState({});
  const [value, setValue] = useState('');
  const [skill, setSkill] = useState('A');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);
  const student = students[index];

  useEffect(() => {
    request(`/api/classes/${activeClass.id}/exam-projects/${project.id}/results`).then(rows => {
      const map = Object.fromEntries(rows.map(row => [row.student_id, row]));
      setResults(map);
    });
    setIndex(0);
  }, [project.id]);

  useEffect(() => {
    const current = student ? results[student.id] : null;
    setValue(current?.quantitative_value || '');
    setSkill(current?.skill_level || 'A');
    setElapsed(0);
    setRunning(false);
  }, [student?.id, results]);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 100);
    return () => window.clearInterval(id);
  }, [running]);

  function startTimer() {
    startedAt.current = Date.now() - elapsed;
    setRunning(true);
  }

  function pauseTimer() {
    setRunning(false);
  }

  function finishTimer() {
    setRunning(false);
    const seconds = ((Date.now() - startedAt.current) / 1000).toFixed(2);
    setElapsed(Date.now() - startedAt.current);
    setValue(seconds);
  }

  async function saveAndNext() {
    if (!student) return;
    const row = await request(`/api/classes/${activeClass.id}/exam-projects/${project.id}/results`, {
      method: 'POST',
      body: JSON.stringify({ student_id: student.id, quantitative_value: value, skill_level: skill }),
    });
    setResults({ ...results, [student.id]: row });
    setIndex(Math.min(index + 1, students.length - 1));
  }

  const label = project.project_type === '计时类' ? '最终用时（秒）' : project.project_type === '计数类' ? '数量' : '距离';

  return (
    <section className="stack">
      <div className="session-bar"><strong>{project.name}</strong><span>{students.length ? `${index + 1}/${students.length}` : '0/0'}</span></div>
      <StudentCard student={student} footer={student && <span>{results[student.id] ? '已保存' : '未保存'}</span>} />
      {project.project_type === '计时类' && (
        <div className="timer-panel">
          <div className="time">{(elapsed / 1000).toFixed(2)}s</div>
          <div className="timer-actions">
            <button onClick={startTimer}><TimerReset size={18} />{elapsed ? '继续' : '开始'}</button>
            <button onClick={pauseTimer}>暂停</button>
            <button onClick={finishTimer}>结束</button>
          </div>
        </div>
      )}
      <label className="field-label">{label}<input value={value} onChange={e => setValue(e.target.value)} inputMode="decimal" /></label>
      <div className="skill-grid">
        {SKILLS.map(item => <button key={item} className={skill === item ? 'active' : ''} onClick={() => setSkill(item)}>{item}</button>)}
      </div>
      <button className="primary big" disabled={!student} onClick={saveAndNext}><Save size={20} />保存并下一个</button>
      <Pager index={index} total={students.length} onPrev={() => setIndex(Math.max(0, index - 1))} onNext={() => setIndex(Math.min(students.length - 1, index + 1))} />
    </section>
  );
}

function Export({ activeClass, students }) {
  return (
    <section className="stack">
      <div className="panel">
        <h2>导出 Excel</h2>
        <p className="muted">当前班级：{activeClass.name}，共 {students.length} 名学生。</p>
        <a className="primary big link" href={`${API}/api/classes/${activeClass.id}/export.xlsx`}>
          <Download size={22} />下载班级记录
        </a>
      </div>
      <StudentList students={students} />
    </section>
  );
}

function StudentCard({ student, footer }) {
  if (!student) {
    return <section className="student-card empty-card"><strong>暂无学生</strong><span>请先导入学生名单</span></section>;
  }
  return (
    <section className="student-card">
      <div className="card-top">{footer}</div>
      <span className="student-no">{student.student_no}</span>
      <strong>{student.name}</strong>
      <p>{student.class_name || '未填写班级'}</p>
    </section>
  );
}

function Pager({ index, total, onPrev, onNext }) {
  return (
    <div className="pager">
      <button disabled={index <= 0} onClick={onPrev}>上一个</button>
      <button disabled={!total || index >= total - 1} onClick={onNext}>下一个</button>
    </div>
  );
}

function StudentList({ students }) {
  return (
    <section className="panel">
      <h2>学生名单</h2>
      <div className="student-list">
        {students.map(item => (
          <div key={item.id} className="mini-row">
            <strong>{item.student_no}</strong>
            <span>{item.name}</span>
            <em>{item.class_name}</em>
          </div>
        ))}
        {!students.length && <p className="muted">暂无学生</p>}
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
