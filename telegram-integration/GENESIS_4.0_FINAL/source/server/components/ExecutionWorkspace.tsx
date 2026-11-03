'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Target, Flag, Scale, FlaskConical, RefreshCw } from 'lucide-react';

type Goal = { id: string; title: string; status: string };
type Milestone = { id: string; title: string; description: string; status: string; dueAt: string | null; sortOrder: number };
type Project = { id: string; goal?: Goal | null; title: string; description: string; status: string; priority: string; targetAt: string | null; milestones: Milestone[]; _count: { actions: number; decisions: number; artifacts: number } };
type Experiment = { id: string; title: string; hypothesis: string; method: string; result: string; status: string };
type Decision = { id: string; goal?: Goal | null; question: string; options: string[]; selectedOption: string | null; rationale: string; status: string; experiments: Experiment[]; project?: { id: string; title: string } | null };
type Artifact = { id: string; projectId: string | null; title: string; mediaType: string; version: number; source?: { id: string; title: string; trustStatus: string } | null; provenanceEvents?: { id: string; eventType: string; createdAt: string }[] };

async function request(url: string, method = 'GET', body?: unknown) {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Не удалось выполнить запрос');
  return data;
}

export default function ExecutionWorkspace({ mode }: { mode: 'projects' | 'decisions' }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [artifactDetail, setArtifactDetail] = useState<Artifact | null>(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', priority: 'normal', goalId: '' });
  const [milestoneForm, setMilestoneForm] = useState({ title: '', dueAt: '' });
  const [decisionForm, setDecisionForm] = useState({ question: '', options: '', rationale: '', projectId: '', goalId: '' });
  const [experimentForm, setExperimentForm] = useState({ title: '', hypothesis: '', method: '', decisionId: '' });
  const [artifactForm, setArtifactForm] = useState({ title: '', mediaType: 'document', sourceId: '' });

  async function load() {
    setBusy(true);
    try {
      if (mode === 'projects') {
        const [data, artifactData, sourceData, goalData] = await Promise.all([request('/api/projects'), request('/api/artifacts'), request('/api/sources'), request('/api/goals')]);
        setProjects(data.projects || []);
        setArtifacts(artifactData.artifacts || []);
        setSources(sourceData.sources || []);
        setGoals(goalData.goals || []);
        setSelectedProject((current: string) => current && data.projects?.some((project: Project) => project.id === current) ? current : data.projects?.[0]?.id || '');
      } else {
        const [data, projectData, goalData] = await Promise.all([request('/api/decisions'), request('/api/projects'), request('/api/goals')]);
        setDecisions(data.decisions || []);
        setProjects(projectData.projects || []);
        setGoals(goalData.goals || []);
      }
      setNotice('');
    } catch (error) { setNotice((error as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => { load(); }, [mode]);

  async function createProject(event: FormEvent) {
    event.preventDefault();
    try { await request('/api/projects', 'POST', { ...projectForm, goalId: projectForm.goalId || null }); setProjectForm({ title: '', description: '', priority: 'normal', goalId: '' }); await load(); setNotice('Проект создан'); }
    catch (error) { setNotice((error as Error).message); }
  }
  async function createArtifact(event: FormEvent) {
    event.preventDefault();
    if (!selectedProject) return;
    try { await request('/api/artifacts', 'POST', { ...artifactForm, projectId: selectedProject, sourceId: artifactForm.sourceId || null }); setArtifactForm({ title: '', mediaType: 'document', sourceId: '' }); await load(); setNotice('Метаданные материала сохранены'); }
    catch (error) { setNotice((error as Error).message); }
  }
  async function openArtifact(id: string) {
    try { const data = await request(`/api/artifacts?id=${encodeURIComponent(id)}`); setArtifactDetail(data.artifact); }
    catch (error) { setNotice((error as Error).message); }
  }
  async function archiveArtifact(artifact: Artifact) {
    try { await request('/api/artifacts', 'PATCH', { id: artifact.id, status: 'archived' }); setArtifactDetail(null); await load(); }
    catch (error) { setNotice((error as Error).message); }
  }
  async function createMilestone(event: FormEvent) {
    event.preventDefault();
    if (!selectedProject) return;
    try { await request('/api/milestones', 'POST', { projectId: selectedProject, title: milestoneForm.title, dueAt: milestoneForm.dueAt ? new Date(milestoneForm.dueAt).toISOString() : null }); setMilestoneForm({ title: '', dueAt: '' }); await load(); setNotice('Этап добавлен'); }
    catch (error) { setNotice((error as Error).message); }
  }
  async function setMilestoneStatus(milestone: Milestone, status: string) {
    try { await request('/api/milestones', 'PATCH', { id: milestone.id, status }); await load(); }
    catch (error) { setNotice((error as Error).message); }
  }
  async function createDecision(event: FormEvent) {
    event.preventDefault();
    try { await request('/api/decisions', 'POST', { question: decisionForm.question, goalId: decisionForm.goalId || null, options: decisionForm.options.split('\n').map(value => value.trim()).filter(Boolean), rationale: decisionForm.rationale, projectId: decisionForm.projectId || null }); setDecisionForm({ question: '', options: '', rationale: '', projectId: '', goalId: '' }); await load(); setNotice('Решение сохранено'); }
    catch (error) { setNotice((error as Error).message); }
  }
  async function chooseOption(decision: Decision, selectedOption: string) {
    try { await request('/api/decisions', 'PATCH', { id: decision.id, selectedOption, status: 'decided' }); await load(); setNotice('Выбор зафиксирован'); }
    catch (error) { setNotice((error as Error).message); }
  }
  async function createExperiment(event: FormEvent) {
    event.preventDefault();
    try { await request('/api/experiments', 'POST', { ...experimentForm, decisionId: experimentForm.decisionId || null }); setExperimentForm({ title: '', hypothesis: '', method: '', decisionId: '' }); await load(); setNotice('Эксперимент добавлен'); }
    catch (error) { setNotice((error as Error).message); }
  }
  async function updateExperiment(experiment: Experiment, status: string) {
    try { await request('/api/experiments', 'PATCH', { id: experiment.id, status }); await load(); }
    catch (error) { setNotice((error as Error).message); }
  }

  const currentProject = projects.find(project => project.id === selectedProject);
  return <section className="workspace execution-workspace">
    <div className="eyebrow">{mode === 'projects' ? 'EXECUTION ENGINE · PROJECTS & MILESTONES' : 'DECISION LAB · CHOICES & EXPERIMENTS'}</div>
    <h1>{mode === 'projects' ? <>Проекты <em>— от намерения к результату.</em></> : <>Decision Lab <em>— решения и проверка гипотез.</em></>}</h1>
    <p className="hero-copy">{mode === 'projects' ? 'Связывай цели, этапы и действия. Отмечай реальный прогресс, не превращая планирование в самоцель.' : 'Фиксируй вопрос, варианты и основания выбора. Проверяй предположения небольшими экспериментами.'}</p>
    <div className="execution-toolbar"><span className="eyebrow">{mode === 'projects' ? `${projects.length} PROJECTS` : `${decisions.length} DECISIONS`}</span><button className="text-btn" onClick={load} disabled={busy}><RefreshCw size={14}/> Обновить</button></div>
    {notice && <div className="execution-notice" role="status">{notice}</div>}
    {mode === 'projects' ? <>
      <form className="execution-form" onSubmit={createProject}><div><label>Новый проект</label><input required maxLength={180} placeholder="Название проекта" value={projectForm.title} onChange={event => setProjectForm({ ...projectForm, title: event.target.value })}/></div><div><label>Описание</label><input maxLength={8000} placeholder="Какой результат должен появиться?" value={projectForm.description} onChange={event => setProjectForm({ ...projectForm, description: event.target.value })}/></div><div><label>Связанная цель</label><select value={projectForm.goalId} onChange={event => setProjectForm({ ...projectForm, goalId: event.target.value })}><option value="">Без цели</option>{goals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></div><button className="primary-btn"><Plus size={14}/> Создать проект</button></form>
      <div className="execution-layout"><div className="execution-list">{projects.map(project => <button key={project.id} className={`execution-list-item ${selectedProject === project.id ? 'active' : ''}`} onClick={() => setSelectedProject(project.id)}><Target size={16}/><span><b>{project.title}</b><small>{project.status.toUpperCase()} · {project.milestones.length} ЭТАПОВ</small></span></button>)}{!projects.length && <div className="empty-state">Создай первый проект и разбей результат на этапы.</div>}</div>
      {currentProject ? <div className="execution-detail"><div className="execution-detail-head"><div><div className="eyebrow">PROJECT / {currentProject.priority.toUpperCase()}</div><h2>{currentProject.title}</h2><p>{currentProject.description || 'Описание пока не добавлено.'}</p>{currentProject.goal && <small className="execution-muted">GOAL · {currentProject.goal.title}</small>}</div><span className="execution-status">{currentProject.status}</span></div><div className="execution-stats"><span>{currentProject._count.actions} действий</span><span>{currentProject._count.decisions} решений</span><span>{currentProject._count.artifacts} материалов</span></div><div className="execution-subhead"><div><Flag size={15}/><b>Этапы проекта</b></div><small>{currentProject.milestones.filter(item => item.status === 'completed').length}/{currentProject.milestones.length} завершено</small></div><form className="inline-create" onSubmit={createMilestone}><input required maxLength={180} placeholder="Следующий этап" value={milestoneForm.title} onChange={event => setMilestoneForm({ ...milestoneForm, title: event.target.value })}/><input type="date" value={milestoneForm.dueAt} onChange={event => setMilestoneForm({ ...milestoneForm, dueAt: event.target.value })}/><button className="primary-btn"><Plus size={14}/></button></form>{currentProject.milestones.map(milestone => <div className="milestone-row" key={milestone.id}><div><b>{milestone.title}</b><small>{milestone.dueAt ? new Date(milestone.dueAt).toLocaleDateString('ru-RU') : 'Без срока'}</small></div><select value={milestone.status} onChange={event => setMilestoneStatus(milestone, event.target.value)}><option value="pending">Ожидает</option><option value="in_progress">В работе</option><option value="blocked">Заблокирован</option><option value="completed">Завершён</option></select></div>)}{!currentProject.milestones.length && <div className="empty-state">Добавь первый этап, чтобы сделать прогресс наблюдаемым.</div>}<div className="execution-subhead"><div><Flag size={15}/><b>Материалы проекта</b></div><small>{artifacts.filter(item => item.projectId === currentProject.id).length}</small></div><form className="inline-create artifact-create" onSubmit={createArtifact}><input required maxLength={240} placeholder="Название документа или материала" value={artifactForm.title} onChange={event => setArtifactForm({ ...artifactForm, title: event.target.value })}/><select value={artifactForm.mediaType} onChange={event => setArtifactForm({ ...artifactForm, mediaType: event.target.value })}><option value="document">Документ</option><option value="image">Изображение</option><option value="data">Данные</option><option value="other">Другое</option></select><button className="primary-btn"><Plus size={14}/></button><select value={artifactForm.sourceId} onChange={event => setArtifactForm({ ...artifactForm, sourceId: event.target.value })}><option value="">Без источника</option>{sources.map(source => <option key={source.id} value={source.id}>{source.title}</option>)}</select></form>{artifacts.filter(item => item.projectId === currentProject.id).map(artifact => <div className="artifact-row" key={artifact.id}><button className="text-btn" onClick={() => openArtifact(artifact.id)}>{artifact.title} · {artifact.mediaType} · v{artifact.version}</button><button className="delete-mini" onClick={() => archiveArtifact(artifact)}>Архивировать</button></div>)}{artifactDetail && <div className="artifact-history"><b>{artifactDetail.title}</b><small>{artifactDetail.source?.title || 'Источник не указан'} · {artifactDetail.source?.trustStatus || 'unverified'}</small>{artifactDetail.provenanceEvents?.map(event => <small key={event.id}>{event.eventType} · {new Date(event.createdAt).toLocaleString('ru-RU')}</small>)}<button className="text-btn" onClick={() => setArtifactDetail(null)}>Закрыть</button></div>}</div> : <div className="execution-detail empty-state">Выбери проект или создай новый.</div>}</div>
    </> : <>
      <form className="execution-form decision-create" onSubmit={createDecision}><div><label>Какой вопрос нужно решить?</label><input required maxLength={8000} placeholder="Сформулируй решение" value={decisionForm.question} onChange={event => setDecisionForm({ ...decisionForm, question: event.target.value })}/></div><div><label>Варианты · каждый с новой строки</label><textarea rows={3} placeholder={'Вариант A\nВариант B'} value={decisionForm.options} onChange={event => setDecisionForm({ ...decisionForm, options: event.target.value })}/></div><div><label>Основания и критерии</label><textarea rows={2} value={decisionForm.rationale} onChange={event => setDecisionForm({ ...decisionForm, rationale: event.target.value })}/></div><label>Цель<select value={decisionForm.goalId} onChange={event => setDecisionForm({ ...decisionForm, goalId: event.target.value })}><option value="">Без цели</option>{goals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label><label>Проект<select value={decisionForm.projectId} onChange={event => setDecisionForm({ ...decisionForm, projectId: event.target.value })}><option value="">Без проекта</option>{projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><button className="primary-btn"><Plus size={14}/> Зафиксировать вопрос</button></form>
      <div className="decision-grid">{decisions.map(decision => <article className="decision-card" key={decision.id}><div className="eyebrow">DECISION · {decision.status.toUpperCase()}</div><h2>{decision.question}</h2>{decision.goal && <small className="execution-muted">GOAL · {decision.goal.title}</small>}{decision.project && <small className="execution-muted">PROJECT · {decision.project.title}</small>}{decision.rationale && <p>{decision.rationale}</p>}{decision.options?.length > 0 && <div className="decision-options">{decision.options.map(option => <button key={option} className={decision.selectedOption === option ? 'selected' : ''} onClick={() => chooseOption(decision, option)}>{option}</button>)}</div>}{decision.selectedOption && <div className="execution-status">Выбрано: {decision.selectedOption}</div>}<div className="execution-subhead"><div><FlaskConical size={15}/><b>Эксперименты</b></div><small>{decision.experiments.length}</small></div>{decision.experiments.map(experiment => <div className="experiment-row" key={experiment.id}><div><b>{experiment.title}</b><small>{experiment.hypothesis}</small></div><select value={experiment.status} onChange={event => updateExperiment(experiment, event.target.value)}><option value="planned">Планируется</option><option value="running">Идёт</option><option value="completed">Завершён</option><option value="abandoned">Остановлен</option></select></div>)}<form className="experiment-create" onSubmit={createExperiment}><input required maxLength={180} placeholder="Название эксперимента" value={experimentForm.decisionId === decision.id ? experimentForm.title : ''} onChange={event => setExperimentForm({ ...experimentForm, decisionId: decision.id, title: event.target.value })}/><input placeholder="Гипотеза" value={experimentForm.decisionId === decision.id ? experimentForm.hypothesis : ''} onChange={event => setExperimentForm({ ...experimentForm, decisionId: decision.id, hypothesis: event.target.value })}/><button className="text-btn" type="submit"><Plus size={13}/> Добавить эксперимент</button></form></article>)}{!decisions.length && <div className="empty-state">Зафиксируй первый вопрос, варианты и критерии. Решение останется твоим.</div>}</div>
    </>}
  </section>;
}
