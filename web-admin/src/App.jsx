import { useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Select,
  Spinner,
  Tab,
  TabList,
  Tooltip,
} from '@fluentui/react-components';
import {
  AddRegular,
  AlertRegular,
  ArrowClockwiseRegular,
  BoxRegular,
  CalendarLtrRegular,
  CheckmarkCircleRegular,
  ClipboardTaskListLtrRegular,
  DataBarVerticalRegular,
  DocumentBulletListRegular,
  HistoryRegular,
  HomeRegular,
  MegaphoneRegular,
  MoreHorizontalRegular,
  PeopleRegular,
  PersonRegular,
  SearchRegular,
  SettingsRegular,
  SignOutRegular,
  WrenchScrewdriverRegular,
} from '@fluentui/react-icons';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { approvals, equipment, maintenance, members, notifications, records, reservations, students, summary } from './mock-data.js';

const navItems = [
  { to: '/overview', label: '概览', icon: HomeRegular },
  { to: '/equipment', label: '器材', icon: BoxRegular },
  { to: '/records', label: '借还记录', icon: HistoryRegular },
  { to: '/approvals', label: '审批', icon: ClipboardTaskListLtrRegular, badge: 4 },
  { to: '/reservations', label: '预约', icon: CalendarLtrRegular, badge: 3 },
  { to: '/maintenance', label: '维保', icon: WrenchScrewdriverRegular },
  { to: '/members', label: '成员', icon: PeopleRegular },
  { to: '/notifications', label: '通知', icon: MegaphoneRegular },
  { to: '/system', label: '系统', icon: SettingsRegular, superadmin: true },
];

const pageMeta = {
  '/overview': ['概览', '查看今日待办、器材可用性和需要立即处理的事项。'],
  '/equipment': ['器材', '维护器材台账、位置、状态和照片。'],
  '/records': ['借还记录', '查看当前借出、逾期和历史记录。'],
  '/approvals': ['借用审批', '集中处理成员提交的借用申请。'],
  '/reservations': ['预约', '确认、取消和追踪器材预约。'],
  '/maintenance': ['维保', '登记维修、保养和处理进度。'],
  '/members': ['成员', '管理成员资料、学号、状态和权限。'],
  '/notifications': ['通知', '检查系统发出的业务提醒。'],
  '/system': ['系统', '查看后台审计、计数器和服务诊断。'],
};

const statusTone = {
  '可用': 'success',
  '借出中': 'warning',
  '维修中': 'danger',
  '已归还': 'success',
  '逾期': 'danger',
  '待审批': 'warning',
  '已通过': 'success',
  '已拒绝': 'danger',
  '待确认': 'warning',
  '已确认': 'success',
  '处理中': 'warning',
  '已完成': 'success',
  '启用': 'success',
  '停用': 'danger',
  '未读': 'warning',
  '已读': 'subtle',
};

const equipmentCategoryLabels = {
  camera: '相机', lens: '镜头', tripod: '脚架', lighting: '灯光', audio: '音频', accessory: '配件',
};

function Status({ value }) {
  return <Badge appearance="tint" color={statusTone[value] || 'brand'} size="small">{value}</Badge>;
}

function App() {
  const isMock = import.meta.env.VITE_ADMIN_AUTH_MODE === 'mock' || import.meta.env.DEV;
  const [role, setRole] = useState('superadmin');

  if (!isMock) return <LoginPending />;
  return <AdminShell role={role} setRole={setRole} />;
}

function LoginPending() {
  return (
    <main className="login-pending">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-mark"><BoxRegular fontSize={26} /></div>
        <p className="kicker">摄影器材管理</p>
        <h1 id="login-title">管理后台正在准备安全登录</h1>
        <p>微信开放平台网站应用和 HTTPS 回调域名配置完成后，可在这里扫码登录。</p>
        <div className="login-checklist">
          <span><CheckmarkCircleRegular /> 后台页面与权限边界已隔离</span>
          <span><AlertRegular /> 生产环境不会提供模拟管理员入口</span>
        </div>
      </section>
    </main>
  );
}

function AdminShell({ role, setRole }) {
  const location = useLocation();
  const [notice, setNotice] = useState('');
  const currentMeta = pageMeta[location.pathname] || pageMeta['/overview'];
  const visibleNav = navItems.filter((item) => !item.superadmin || role === 'superadmin');

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <Link className="brand" to="/overview">
          <span className="brand-mark"><BoxRegular fontSize={21} /></span>
          <span><strong>摄影器材管理</strong><small>管理后台</small></span>
        </Link>
        <nav className="nav-list">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link className={`nav-link ${active ? 'is-active' : ''}`} to={item.to} key={item.to}>
                <Icon fontSize={20} />
                <span>{item.label}</span>
                {item.badge ? <Badge className="nav-badge" appearance="filled" color="brand" size="small">{item.badge}</Badge> : null}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="mock-mode">本地模拟模式</div>
          <div className="account-row">
            <Avatar name="成员乙" size={32} color="brand" />
            <div><strong>成员乙</strong><span>{role === 'superadmin' ? '超级管理员' : '管理员'}</span></div>
          </div>
          <Select aria-label="切换模拟角色" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="admin">模拟管理员</option>
            <option value="superadmin">模拟超级管理员</option>
          </Select>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="breadcrumb">管理后台 / {currentMeta[0]}</p>
            <h1>{currentMeta[0]}</h1>
          </div>
          <div className="topbar-actions">
            <div className="global-search"><SearchRegular fontSize={18} /><Input aria-label="全局搜索" placeholder="搜索器材、成员或编号" /></div>
            <Tooltip content="模拟模式下不会真正退出" relationship="label">
              <Button appearance="subtle" icon={<SignOutRegular />} aria-label="退出模拟登录" onClick={() => setNotice('正式版本将在此清除网站会话。')} />
            </Tooltip>
          </div>
        </header>
        <section className="page-content">
          {notice ? <MessageBar intent="info" className="page-notice" onDismiss={() => setNotice('')}><MessageBarBody><MessageBarTitle>提示</MessageBarTitle>{notice}</MessageBarBody></MessageBar> : null}
          <Routes>
            <Route path="/overview" element={<Overview onNotice={setNotice} />} />
            <Route path="/equipment" element={<EquipmentPage onNotice={setNotice} />} />
            <Route path="/records" element={<RecordsPage onNotice={setNotice} />} />
            <Route path="/approvals" element={<ApprovalsPage onNotice={setNotice} />} />
            <Route path="/reservations" element={<ReservationsPage onNotice={setNotice} />} />
            <Route path="/maintenance" element={<MaintenancePage onNotice={setNotice} />} />
            <Route path="/members" element={<MembersPage role={role} onNotice={setNotice} />} />
            <Route path="/notifications" element={<NotificationsPage onNotice={setNotice} />} />
            <Route path="/system" element={role === 'superadmin' ? <SystemPage onNotice={setNotice} /> : <Navigate to="/overview" replace />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

function Overview({ onNotice }) {
  return (
    <div className="page-stack">
      <section className="summary-strip" aria-label="器材概况">
        <Metric label="器材总数" value={summary.equipmentTotal} />
        <Metric label="当前可用" value={summary.available} tone="success" />
        <Metric label="借出中" value={summary.checkedOut} tone="warning" />
        <Metric label="维修中" value={summary.maintenance} tone="danger" />
      </section>
      <section className="two-column-layout">
        <div className="work-surface attention-surface">
          <div className="section-heading"><div><h2>需要处理</h2><p>按业务风险排序，不让待办淹没在指标里。</p></div><Button appearance="secondary" icon={<ArrowClockwiseRegular />} onClick={() => onNotice('模拟数据已刷新。')}>刷新</Button></div>
          <div className="attention-list">
            <Attention icon={<AlertRegular />} tone="danger" title="2 条借还记录已逾期" description="优先联系成员确认归还时间。" action="查看记录" />
            <Attention icon={<ClipboardTaskListLtrRegular />} tone="warning" title="4 个借用申请等待审批" description="最早的申请已等待 3 小时。" action="处理审批" />
            <Attention icon={<CalendarLtrRegular />} tone="warning" title="3 个预约等待确认" description="其中 1 个预约将在今天下午开始。" action="查看预约" />
          </div>
        </div>
        <div className="work-surface">
          <div className="section-heading"><div><h2>今日借还</h2><p>按设备流转看当天变化。</p></div><Button appearance="subtle" icon={<MoreHorizontalRegular />} aria-label="查看更多今日借还" /></div>
          <div className="activity-list">
            <Activity icon={<BoxRegular />} title="相机 2 已借出" description="成员甲 · 13:40" />
            <Activity icon={<CheckmarkCircleRegular />} title="镜头 2 已归还" description="成员丁 · 11:18" />
            <Activity icon={<WrenchScrewdriverRegular />} title="补光灯 1 进入维修" description="器材组 · 10:25" />
          </div>
        </div>
      </section>
      <section className="work-surface">
        <div className="section-heading"><div><h2>当前借出</h2><p>优先展示需要跟进的借用，不使用无意义的卡片矩阵。</p></div><Link className="quiet-link" to="/records">全部借还记录</Link></div>
        <DataTable columns={['器材', '借用成员', '借出时间', '预计归还', '用途', '状态']}>
          {records.slice(0, 2).map((record) => <tr key={record.id}><td><strong>{record.equipment}</strong></td><td>{record.member}</td><td>{record.checkoutAt}</td><td>{record.expectedReturnAt}</td><td className="truncate-cell">{record.purpose}</td><td><Status value={record.status} /></td></tr>)}
        </DataTable>
      </section>
    </div>
  );
}

function EquipmentPage({ onNotice }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState(equipment);
  const [editor, setEditor] = useState(null);
  const visible = useMemo(() => items.filter((item) => `${item.name}${item.code}${item.sn}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const saveMockEquipment = (draft) => {
    if (editor && editor.id) {
      setItems((current) => current.map((item) => item.id === editor.id ? { ...item, ...draft, updatedAt: '刚刚' } : item));
      setSelected((current) => current && current.id === editor.id ? { ...current, ...draft, updatedAt: '刚刚' } : current);
      onNotice('模拟器材已更新；真实保存将在网站登录启用后调用受保护 API。');
    } else {
      setItems((current) => [{ id: `mock-${Date.now()}`, ...draft, code: '保存后自动生成', status: '可用', holder: '-', updatedAt: '刚刚' }, ...current]);
      onNotice('模拟器材已加入列表；真实保存后由服务端生成二维码编号。');
    }
    setEditor(null);
  };
  return <div className="page-stack">
    <Toolbar placeholder="搜索器材名称、编号或 SN" value={query} onChange={setQuery} primary="新增器材" onPrimary={() => setEditor({})} filters={['全部状态', '全部分类']} />
    <div className="work-surface table-surface">
      <DataTable columns={['器材', '编号', 'SN', '位置', '借用人', '状态', '更新时间', '操作']}>
        {visible.map((item) => <tr key={item.id} onClick={() => setSelected(item)} className="clickable-row"><td><strong>{item.name}</strong><span className="table-subtext">{equipmentCategoryLabels[item.category] || item.category}</span></td><td>{item.code}</td><td className="mono-cell">{item.sn}</td><td>{item.location}</td><td>{item.holder}</td><td><Status value={item.status} /></td><td>{item.updatedAt}</td><td><Button size="small" appearance="subtle" onClick={(event) => { event.stopPropagation(); setEditor(item); }}>编辑</Button></td></tr>)}
      </DataTable>
      {visible.length === 0 ? <EmptyState title="没有匹配的器材" description="换一个名称、编号或 SN 再试。" /> : null}
    </div>
    <DetailDialog item={selected} onClose={() => setSelected(null)} title="器材详情" fields={selected ? [['器材编号', selected.code], ['状态', selected.status], ['位置', selected.location], ['SN', selected.sn], ['当前借用人', selected.holder]] : []} />
    <EquipmentEditorDialog key={editor && editor.id || 'new-equipment'} item={editor} onClose={() => setEditor(null)} onSave={saveMockEquipment} />
  </div>;
}

function RecordsPage({ onNotice }) {
  const [items, setItems] = useState(records);
  const [action, setAction] = useState(null);
  const confirm = () => {
    setItems((current) => current.map((item) => item.id === action.id ? { ...item, status: '已归还' } : item));
    setAction(null);
    onNotice('模拟归还已完成；真实网站会调用受控归还事务并更新预约完成状态。');
  };
  return <div className="page-stack"><Toolbar placeholder="搜索器材或成员" primary="登记出库" onPrimary={() => onNotice('选择成员出库表单将在 OAuth 会话可用后提交受控出库接口。')} filters={['全部状态', '全部时间']} />
    <div className="work-surface table-surface"><DataTable columns={['器材', '借用成员', '借出时间', '预计归还', '用途', '状态', '操作']}>
      {items.map((record) => <tr key={record.id}><td><strong>{record.equipment}</strong></td><td>{record.member}</td><td>{record.checkoutAt}</td><td>{record.expectedReturnAt}</td><td className="truncate-cell">{record.purpose}</td><td><Status value={record.status} /></td><td>{record.status === '借出中' || record.status === '逾期' ? <Button size="small" appearance="secondary" onClick={() => setAction(record)}>归还</Button> : '-'}</td></tr>)}
    </DataTable></div><WorkflowConfirmDialog action={action ? { title: '确认归还器材', description: `将「${action.equipment}」标记为已归还。`, confirmLabel: '确认归还' } : null} onClose={() => setAction(null)} onConfirm={confirm} /></div>;
}

function ApprovalsPage({ onNotice }) {
  const [items, setItems] = useState(approvals);
  const [action, setAction] = useState(null);
  const confirm = () => {
    setItems((current) => current.map((item) => item.id === action.item.id ? { ...item, status: action.type === 'approve' ? '已通过' : '已拒绝' } : item));
    onNotice(`模拟审批已${action.type === 'approve' ? '通过' : '拒绝'}；真实网站会执行审批事务和通知。`);
    setAction(null);
  };
  return <WorkflowPage tabLabels={['全部', '待审批', '已通过', '已拒绝']} toolbar={<Toolbar placeholder="搜索器材或申请成员" filters={['全部状态']} />}>
    <DataTable columns={['器材', '申请成员', '用途', '申请时间', '预计归还', '状态', '操作']}>
      {items.map((item) => <tr key={item.id}><td><strong>{item.equipment}</strong></td><td>{item.member}</td><td className="truncate-cell">{item.purpose}</td><td>{item.createdAt}</td><td>{item.returnAt}</td><td><Status value={item.status} /></td><td>{item.status === '待审批' ? <div className="table-actions"><Button size="small" appearance="primary" onClick={() => setAction({ item, type: 'approve' })}>通过</Button><Button size="small" appearance="subtle" onClick={() => setAction({ item, type: 'reject' })}>拒绝</Button></div> : '-'}</td></tr>)}
    </DataTable>
    <WorkflowConfirmDialog action={action ? { title: action.type === 'approve' ? '确认通过申请' : '确认拒绝申请', description: `将处理 ${action.item.member} 对「${action.item.equipment}」的借用申请。`, confirmLabel: action.type === 'approve' ? '确认通过' : '确认拒绝' } : null} onClose={() => setAction(null)} onConfirm={confirm} />
  </WorkflowPage>;
}

function ReservationsPage({ onNotice }) {
  const [items, setItems] = useState(reservations);
  const [action, setAction] = useState(null);
  const confirm = () => {
    setItems((current) => current.map((item) => item.id === action.item.id ? { ...item, status: action.type === 'confirm' ? '已确认' : '已取消' } : item));
    onNotice(`模拟预约已${action.type === 'confirm' ? '确认' : '取消'}；真实网站会执行预约状态校验和通知。`);
    setAction(null);
  };
  return <WorkflowPage tabLabels={['全部', '待确认', '已确认', '已取消']} toolbar={<Toolbar placeholder="搜索器材或预约成员" filters={['全部状态']} />}>
    <DataTable columns={['器材', '预约成员', '时间窗口', '用途', '状态', '操作']}>
      {items.map((item) => <tr key={item.id}><td><strong>{item.equipment}</strong></td><td>{item.member}</td><td>{item.window}</td><td className="truncate-cell">{item.purpose}</td><td><Status value={item.status} /></td><td>{item.status === '待确认' ? <div className="table-actions"><Button size="small" appearance="primary" onClick={() => setAction({ item, type: 'confirm' })}>确认</Button><Button size="small" appearance="subtle" onClick={() => setAction({ item, type: 'cancel' })}>取消</Button></div> : item.status === '已确认' ? <Button size="small" appearance="subtle" onClick={() => setAction({ item, type: 'cancel' })}>取消</Button> : '-'}</td></tr>)}
    </DataTable>
    <WorkflowConfirmDialog action={action ? { title: action.type === 'confirm' ? '确认预约' : '取消预约', description: `将处理 ${action.item.member} 对「${action.item.equipment}」的预约。`, confirmLabel: action.type === 'confirm' ? '确认预约' : '确认取消' } : null} onClose={() => setAction(null)} onConfirm={confirm} />
  </WorkflowPage>;
}

function MaintenancePage({ onNotice }) {
  const [items, setItems] = useState(maintenance);
  const [editorOpen, setEditorOpen] = useState(false);
  const addMaintenance = (draft) => {
    setItems((current) => [{ id: `mock-maintenance-${Date.now()}`, equipment: draft.equipment, type: draft.type, description: draft.description, person: draft.technician || '当前管理员', createdAt: '刚刚', status: '处理中' }, ...current]);
    setEditorOpen(false);
    onNotice('模拟维保记录已创建；真实网站会写入 maintenanceLogs 并记录审计摘要。');
  };
  return <div className="page-stack"><Toolbar placeholder="搜索器材或维保内容" primary="新增维保" onPrimary={() => setEditorOpen(true)} filters={['全部状态']} />
    <div className="work-surface table-surface"><DataTable columns={['器材', '类型', '说明', '登记人', '登记时间', '进度']}>
      {items.map((item) => <tr key={item.id}><td><strong>{item.equipment}</strong></td><td>{item.type}</td><td className="truncate-cell">{item.description}</td><td>{item.person}</td><td>{item.createdAt}</td><td><Status value={item.status} /></td></tr>)}
    </DataTable></div><MaintenanceEditorDialog open={editorOpen} onClose={() => setEditorOpen(false)} onSave={addMaintenance} /></div>;
}

function MembersPage({ role, onNotice }) {
  const [view, setView] = useState('members');
  const [studentItems, setStudentItems] = useState(students);
  const [studentEditor, setStudentEditor] = useState(false);
  const addStudent = (draft) => {
    setStudentItems((current) => [{ id: `mock-student-${Date.now()}`, ...draft, photo: '未上传', createdAt: '刚刚' }, ...current]);
    setStudentEditor(false);
    onNotice('模拟学生已加入名册；真实保存会校验12位学号并写入 students 集合。');
  };
  return <div className="page-stack"><Toolbar placeholder={view === 'members' ? '搜索姓名或学号' : '搜索学生姓名或学号'} primary={view === 'members' ? '新增学生' : '录入学生'} onPrimary={() => setStudentEditor(true)} filters={view === 'members' ? ['全部状态', '全部角色'] : []} />
    <div className="work-surface table-surface"><TabList selectedValue={view} onTabSelect={(_, data) => setView(data.value)} aria-label="成员数据视图"><Tab value="members">成员账号</Tab><Tab value="students">学生名册</Tab></TabList><div className="table-with-tabs">{view === 'members' ? <DataTable columns={['成员', '学号', '角色', '状态', '当前借用', '更新时间', '操作']}>
      {members.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td className="mono-cell">{item.studentId}</td><td>{item.role}</td><td><Status value={item.active} /></td><td>{item.records}</td><td>{item.updatedAt}</td><td>{role === 'superadmin' ? <Button size="small" appearance="subtle" onClick={() => onNotice('真实角色与启停操作会在网站登录后按管理员权限提交。')}>管理</Button> : '-'}</td></tr>)}
    </DataTable> : <DataTable columns={['学生', '学号', '照片', '录入时间']}>
      {studentItems.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td className="mono-cell">{item.studentId}</td><td>{item.photo}</td><td>{item.createdAt}</td></tr>)}
    </DataTable>}</div></div><StudentEditorDialog open={studentEditor} onClose={() => setStudentEditor(false)} onSave={addStudent} /></div>;
}

function NotificationsPage({ onNotice }) {
  return <div className="page-stack"><Toolbar placeholder="搜索通知标题或成员" filters={['全部类型', '全部状态']} />
    <div className="work-surface table-surface"><DataTable columns={['通知', '接收成员', '类型', '发送时间', '状态', '操作']}>
      {notifications.map((item) => <tr key={item.id}><td><strong>{item.title}</strong></td><td>{item.target}</td><td>{item.type}</td><td>{item.createdAt}</td><td><Status value={item.read} /></td><td><Button size="small" appearance="subtle" onClick={() => onNotice('通知详情将在 Block 4 接入真实数据。')}>查看</Button></td></tr>)}
    </DataTable></div></div>;
}

function SystemPage({ onNotice }) {
  return <div className="page-stack"><section className="two-column-layout"><div className="work-surface"><div className="section-heading"><div><h2>服务状态</h2><p>仅超级管理员可查看的运行诊断。</p></div><Button appearance="secondary" icon={<ArrowClockwiseRegular />} onClick={() => onNotice('模拟诊断已刷新；真实站点会读取受保护的系统诊断接口。')}>检查</Button></div><div className="diagnostic-list"><Diagnostic name="CloudBase 环境" value="模拟就绪" /><Diagnostic name="admin-web 网关" value="等待部署" /><Diagnostic name="网站会话集合" value="等待 OAuth" /><Diagnostic name="器材编号 counters" value="模拟可用" /></div></div><div className="work-surface"><div className="section-heading"><div><h2>后台审计</h2><p>每次受控写操作将保留操作者和摘要。</p></div></div><div className="audit-preview"><div><strong>等待网站 OAuth 配置</strong><span>部署后，器材、成员和业务工作台的真实操作将显示在这里。</span></div></div></div></section></div>;
}

function WorkflowPage({ tabLabels, toolbar, children }) {
  return <div className="page-stack">{toolbar}<div className="work-surface table-surface"><TabList defaultSelectedValue="0" aria-label="状态筛选">{tabLabels.map((label, index) => <Tab key={label} value={String(index)}>{label}</Tab>)}</TabList><div className="table-with-tabs">{children}</div></div></div>;
}

function Toolbar({ placeholder, value = '', onChange, primary, onPrimary, filters = [] }) {
  return <div className="toolbar"><div className="toolbar-search"><SearchRegular fontSize={18} /><Input aria-label={placeholder} placeholder={placeholder} value={value} onChange={(event) => onChange && onChange(event.target.value)} /></div><div className="toolbar-filters">{filters.map((filter) => <Select key={filter} aria-label={filter} defaultValue={filter}><option>{filter}</option></Select>)}</div>{primary ? <Button appearance="primary" icon={<AddRegular />} onClick={onPrimary}>{primary}</Button> : null}</div>;
}

function DataTable({ columns, children }) { return <div className="data-table-wrap"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function Metric({ label, value, tone }) { return <div className={`metric ${tone ? `metric-${tone}` : ''}`}><span>{label}</span><strong>{value}</strong></div>; }
function Attention({ icon, tone, title, description, action }) { return <div className={`attention-row attention-${tone}`}><span className="attention-icon">{icon}</span><div><strong>{title}</strong><p>{description}</p></div><Button appearance="subtle">{action}</Button></div>; }
function Activity({ icon, title, description }) { return <div className="activity-row"><span>{icon}</span><div><strong>{title}</strong><p>{description}</p></div></div>; }
function Diagnostic({ name, value }) { return <div className="diagnostic-row"><span>{name}</span><Badge appearance="tint" color="informative">{value}</Badge></div>; }
function EmptyState({ title, description }) { return <div className="empty-state"><DocumentBulletListLtrRegular fontSize={26} /><strong>{title}</strong><p>{description}</p></div>; }

function DetailDialog({ item, onClose, title, fields }) {
  return <Dialog open={!!item} onOpenChange={(_, data) => !data.open && onClose()}><DialogSurface><DialogBody><DialogTitle>{title}</DialogTitle><DialogContent>{item ? <div className="detail-grid"><h3>{item.name}</h3>{fields.map(([label, value]) => <div key={label}><span>{label}</span><strong>{label === '状态' ? <Status value={value} /> : value}</strong></div>)}</div> : <Spinner />}</DialogContent><DialogActions><Button appearance="primary" onClick={onClose}>关闭</Button></DialogActions></DialogBody></DialogSurface></Dialog>;
}

function EquipmentEditorDialog({ item, onClose, onSave }) {
  const [draft, setDraft] = useState({ name: item && item.name || '', category: item && item.category || 'camera', brand: item && item.brand || '', model: item && item.model || '', sn: item && item.sn || '', location: item && item.location || '', description: item && item.description || '' });
  const open = item !== null;
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const save = () => {
    if (!draft.name.trim() || !draft.model.trim() || !draft.sn.trim()) return;
    onSave({ ...draft, name: draft.name.trim(), model: draft.model.trim(), sn: draft.sn.trim(), location: draft.location.trim(), description: draft.description.trim() });
  };
  return <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}><DialogSurface><DialogBody><DialogTitle>{item && item.id ? '编辑器材' : '新增器材'}</DialogTitle><DialogContent><div className="editor-form"><Field label="器材名称" required><Input value={draft.name} onChange={(event) => update('name', event.target.value)} /></Field><Field label="分类" required><Select value={draft.category} onChange={(event) => update('category', event.target.value)}><option value="camera">相机</option><option value="lens">镜头</option><option value="tripod">脚架</option><option value="lighting">灯光</option><option value="audio">音频</option><option value="accessory">配件</option></Select></Field><Field label="品牌"><Input value={draft.brand} onChange={(event) => update('brand', event.target.value)} /></Field><Field label="型号" required><Input value={draft.model} onChange={(event) => update('model', event.target.value)} /></Field><Field label="SN 码" required><Input value={draft.sn} onChange={(event) => update('sn', event.target.value)} /></Field><Field label="存放位置"><Input value={draft.location} onChange={(event) => update('location', event.target.value)} /></Field><Field className="editor-wide" label="说明"><Input value={draft.description} onChange={(event) => update('description', event.target.value)} /></Field></div></DialogContent><DialogActions><Button appearance="secondary" onClick={onClose}>取消</Button><Button appearance="primary" disabled={!draft.name.trim() || !draft.model.trim() || !draft.sn.trim()} onClick={save}>保存</Button></DialogActions></DialogBody></DialogSurface></Dialog>;
}

function StudentEditorDialog({ open, onClose, onSave }) {
  const [draft, setDraft] = useState({ name: '', studentId: '' });
  const valid = draft.name.trim() && /^\d{12}$/.test(draft.studentId);
  const save = () => { if (valid) { onSave({ name: draft.name.trim(), studentId: draft.studentId }); setDraft({ name: '', studentId: '' }); } };
  return <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}><DialogSurface><DialogBody><DialogTitle>录入学生</DialogTitle><DialogContent><div className="editor-form"><Field label="姓名" required><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></Field><Field label="12 位学号" required validationMessage={draft.studentId && !/^\d{12}$/.test(draft.studentId) ? '请输入12位数字学号' : ''}><Input value={draft.studentId} inputMode="numeric" onChange={(event) => setDraft((current) => ({ ...current, studentId: event.target.value.replace(/\D/g, '').slice(0, 12) }))} /></Field></div></DialogContent><DialogActions><Button appearance="secondary" onClick={onClose}>取消</Button><Button appearance="primary" disabled={!valid} onClick={save}>录入</Button></DialogActions></DialogBody></DialogSurface></Dialog>;
}

function MaintenanceEditorDialog({ open, onClose, onSave }) {
  const [draft, setDraft] = useState({ equipment: equipment[0].name, type: '故障维修', description: '', technician: '', cost: '' });
  const valid = draft.equipment && draft.description.trim();
  const save = () => { if (valid) { onSave({ ...draft, description: draft.description.trim() }); setDraft({ equipment: equipment[0].name, type: '故障维修', description: '', technician: '', cost: '' }); } };
  return <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}><DialogSurface><DialogBody><DialogTitle>新增维保记录</DialogTitle><DialogContent><div className="editor-form"><Field label="器材" required><Select value={draft.equipment} onChange={(event) => setDraft((current) => ({ ...current, equipment: event.target.value }))}>{equipment.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</Select></Field><Field label="类型"><Select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}><option>故障维修</option><option>定期保养</option><option>清洁检查</option></Select></Field><Field className="editor-wide" label="说明" required><Input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></Field><Field label="维修人员"><Input value={draft.technician} onChange={(event) => setDraft((current) => ({ ...current, technician: event.target.value }))} /></Field><Field label="费用"><Input value={draft.cost} inputMode="decimal" onChange={(event) => setDraft((current) => ({ ...current, cost: event.target.value }))} /></Field></div></DialogContent><DialogActions><Button appearance="secondary" onClick={onClose}>取消</Button><Button appearance="primary" disabled={!valid} onClick={save}>登记</Button></DialogActions></DialogBody></DialogSurface></Dialog>;
}

function WorkflowConfirmDialog({ action, onClose, onConfirm }) {
  return <Dialog open={!!action} onOpenChange={(_, data) => !data.open && onClose()}><DialogSurface><DialogBody><DialogTitle>{action && action.title}</DialogTitle><DialogContent>{action && action.description}</DialogContent><DialogActions><Button appearance="secondary" onClick={onClose}>取消</Button><Button appearance="primary" onClick={onConfirm}>{action && action.confirmLabel}</Button></DialogActions></DialogBody></DialogSurface></Dialog>;
}

export default App;
