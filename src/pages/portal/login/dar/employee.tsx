import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Badge, Button, Dropdown, Modal, Select, TextInput } from 'flowbite-react';
import {
  HiBell,
  HiBriefcase,
  HiCheckCircle,
  HiCog,
  HiCollection,
  HiDocumentText,
  HiHome,
  HiLogout,
  HiMenu,
  HiOutlineSearch,
  HiPlus,
  HiQuestionMarkCircle,
  HiRefresh,
} from 'react-icons/hi';
import { FaTasks } from 'react-icons/fa';
import { getToken, initTokenRefresh, removeToken } from '@/utils/headers/token';

type TaskStatus = 'PENDING' | 'IN PROGRESS' | 'COMPLETED';

type DarTask = {
  id: string;
  task: string;
  category: string;
  due: string;
  status: TaskStatus;
};

type Announcement = {
  title: string;
  tag: string;
  body: string;
};

type UserSession = Record<string, unknown> & {
  email?: string;
  name?: string;
  fullName?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  roleName?: string;
  roles?: unknown[];
  accountType?: string;
  avatar?: string;
  profileImage?: string;
};

type WorkflowProcess = {
  workflowId: string;
  workflowName?: string;
  createdBy?: string;
  createdByEmail?: string;
  accessType?: 'OWNER' | 'SHARED';
};

type SessionRecord = Record<string, unknown> & {
  id?: string;
  workflowId?: string;
  workflowName?: string;
  currentNodeId?: string;
  steps?: Record<string, { data?: Record<string, unknown> }>;
  lastUpdatedAt?: string;
  updatedAt?: string;
};

type WorkflowNode = {
  id: string;
  name: string;
  type: string;
  assignUserEmail?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  workflowId: string;
  currentNodeId?: string;
  lastUpdatedAt: string;
};

const DAR_GREEN = '#007a3d';

const initialTasks: DarTask[] = [
  { id: 'task-1', task: 'Review Land Claim Documents Batch 12', category: 'Documentation & Titles', due: '02/14/2024', status: 'IN PROGRESS' },
  { id: 'task-2', task: 'Validate Beneficiary Profile Updates', category: 'Beneficiary Development', due: '02/14/2024', status: 'COMPLETED' },
  { id: 'task-3', task: 'Prepare Hearing Memo for Agrarian Dispute', category: 'Agrarian Legal Assistance', due: '02/14/2024', status: 'PENDING' },
  { id: 'task-4', task: 'Update Service Report (Weekly)', category: 'Reports & Monitoring', due: '02/14/2024', status: 'COMPLETED' },
  { id: 'task-5', task: 'Coordinate with LGU for Field Validation', category: 'Partnerships & Linkages', due: '02/14/2024', status: 'COMPLETED' },
];

const announcements: Announcement[] = [
  {
    title: 'System Maintenance',
    tag: 'Weekly',
    body: 'LCMS services may be temporarily unavailable during scheduled maintenance windows. Please save case updates and task changes before the posted downtime.',
  },
  {
    title: 'Document Upload Policy',
    tag: 'March 2024',
    body: 'Upload clear, complete, and properly named supporting files for claims, hearings, beneficiary records, and title-related case actions.',
  },
  {
    title: 'New Service Tracking',
    tag: 'Update',
    body: 'Assigned processes now show case progress, pending actions, and employee task status to support faster monitoring and coordination.',
  },
];

const emptyTask: Omit<DarTask, 'id'> = {
  task: '',
  category: '',
  due: '',
  status: 'PENDING',
};

const normalizeArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    for (const key of ['apiData', 'data', 'sessions', 'content']) {
      if (objectValue[key] !== undefined && objectValue[key] !== null) {
        return normalizeArray(objectValue[key]);
      }
    }
  }
  return [];
};

const titleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});
const asString = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

const deriveDisplayName = (session: UserSession | null) => {
  if (!session) return 'DAR Employee';
  const fullName = asString(session.name) ?? asString(session.fullName);
  if (fullName) return fullName;
  const composed = [asString(session.first_name), asString(session.last_name)].filter(Boolean).join(' ');
  return composed || asString(session.email) || 'DAR Employee';
};

const deriveSubtitle = (session: UserSession | null) => {
  if (!session) return 'Employee Workspace';
  const roleFromArray = Array.isArray(session.roles) ? session.roles.map((role) => asString(role)).find(Boolean) : undefined;
  return titleCase(asString(session.role) ?? asString(session.roleName) ?? roleFromArray ?? asString(session.accountType) ?? asString(session.email) ?? 'Employee Workspace');
};

const statusBadgeColor = (status: TaskStatus) => {
  if (status === 'COMPLETED') return 'success';
  if (status === 'IN PROGRESS') return 'warning';
  return 'failure';
};

const getWorkflowId = (item: Record<string, unknown>) => {
  const workflow = asRecord(item.workflow);
  return asString(item.workflowId) ?? asString(workflow.workflowId) ?? asString(workflow.id);
};

const getWorkflowName = (item: Record<string, unknown>, workflowId: string) => {
  const workflow = asRecord(item.workflow);
  return asString(item.workflowName) ?? asString(workflow.name) ?? workflowId;
};

const normalizeProcess = (item: unknown): WorkflowProcess | null => {
  const objectItem = asRecord(item);
  const workflowId = getWorkflowId(objectItem);
  if (!workflowId) return null;
  const accessType = asString(objectItem.accessType) === 'SHARED' ? 'SHARED' : 'OWNER';
  return {
    workflowId,
    workflowName: getWorkflowName(objectItem, workflowId),
    createdBy: asString(objectItem.createdBy),
    createdByEmail: asString(objectItem.createdByEmail),
    accessType,
  };
};

const parseWorkflowNodes = (workflow: unknown): Record<string, WorkflowNode> => {
  const workflowObject = asRecord(workflow);
  const payload = asRecord(workflowObject.apiData || workflowObject.data || workflowObject.workflow || workflowObject);
  const bpmnXml = asString(payload.bpmnXml) ?? asString(workflowObject.bpmnXml);
  const taskBindings = asRecord(payload.taskBindings || payload.taskBinding || workflowObject.taskBindings);
  const nodes: Record<string, WorkflowNode> = {};

  if (!bpmnXml || typeof window === 'undefined') return nodes;

  const documentXml = new DOMParser().parseFromString(bpmnXml, 'application/xml');
  const nodeSelectors = ['bpmn\\:startEvent', 'bpmn\\:endEvent', 'bpmn\\:userTask', 'bpmn\\:task', 'bpmn\\:serviceTask', 'bpmn\\:exclusiveGateway'];
  documentXml.querySelectorAll(nodeSelectors.join(',')).forEach((element) => {
    const id = element.getAttribute('id') || '';
    if (!id) return;
    const binding = asRecord(taskBindings[id]);
    nodes[id] = {
      id,
      name: element.getAttribute('name') || id,
      type: element.tagName,
      assignUserEmail: asString(binding.assignUserEmail) ?? element.getAttribute('assignUserEmail') ?? undefined,
    };
  });

  documentXml.querySelectorAll('bpmn\\:sequenceFlow').forEach((element) => {
    const id = element.getAttribute('id') || '';
    if (!id) return;
    nodes[id] = {
      id,
      name: element.getAttribute('name') || id,
      type: element.tagName,
    };
  });

  return nodes;
};

export default function DarEmployeeDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [tasks, setTasks] = useState<DarTask[]>(initialTasks);
  const [search, setSearch] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState<Omit<DarTask, 'id'>>(emptyTask);
  const [selectedTask, setSelectedTask] = useState<DarTask | null>(null);
  const [statusDraft, setStatusDraft] = useState<TaskStatus>('PENDING');
  const [processes, setProcesses] = useState<WorkflowProcess[]>([]);
  const [processLoading, setProcessLoading] = useState(true);
  const [processError, setProcessError] = useState('');
  const [showAllProcesses, setShowAllProcesses] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(true);

  useEffect(() => {
    initTokenRefresh();
    const rawSession = window.localStorage.getItem('userSession');
    if (rawSession) {
      try {
        setSession(JSON.parse(rawSession) as UserSession);
      } catch {
        setSession(null);
      }
    }
  }, []);

  const loggedInEmail = asString(session?.email);

  const authHeaders = useCallback((): HeadersInit => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    if (!loggedInEmail) return;
    const fetchProcesses = async () => {
      setProcessLoading(true);
      setProcessError('');
      try {
        const response = await fetch(`/api/studio/workflow-applications?email=${encodeURIComponent(loggedInEmail)}`, {
          headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Unable to fetch LCMS processes.');
        const data = await response.json();
        setProcesses(normalizeArray(data).map(normalizeProcess).filter((item): item is WorkflowProcess => Boolean(item)));
      } catch (error) {
        setProcessError(error instanceof Error ? error.message : 'Unable to fetch LCMS processes.');
      } finally {
        setProcessLoading(false);
      }
    };
    fetchProcesses();
  }, [authHeaders, loggedInEmail]);

  useEffect(() => {
    if (!loggedInEmail) return;
    const fetchNotifications = async () => {
      setNotificationLoading(true);
      try {
        const response = await fetch('/api/session/fetch-all-session-data', { headers: authHeaders() });
        if (!response.ok) throw new Error('Unable to fetch sessions.');
        const data = await response.json();
        const sessions = normalizeArray(data).map((item) => asRecord(item) as SessionRecord);
        const workflowIds = Array.from(new Set(sessions.map((item) => asString(item.workflowId)).filter((id): id is string => Boolean(id))));
        const workflowNodeMap: Record<string, Record<string, WorkflowNode>> = {};

        await Promise.all(
          workflowIds.map(async (workflowId) => {
            const workflowResponse = await fetch(`/api/workflow/fetch-workflow?id=${encodeURIComponent(workflowId)}`, {
              headers: authHeaders(),
            });
            if (!workflowResponse.ok) return;
            const workflowData = await workflowResponse.json();
            workflowNodeMap[workflowId] = parseWorkflowNodes(workflowData);
          }),
        );

        const nextNotifications = sessions
          .filter((item) => {
            const workflowId = asString(item.workflowId);
            const currentNodeId = asString(item.currentNodeId);
            if (!workflowId || !currentNodeId) return false;
            const stepAssignment = asString(item.steps?.[currentNodeId]?.data?.assignUserEmail);
            const workflowAssignment = workflowNodeMap[workflowId]?.[currentNodeId]?.assignUserEmail;
            return (stepAssignment ?? workflowAssignment)?.toLowerCase() === loggedInEmail.toLowerCase();
          })
          .map((item) => ({
            id: asString(item.id) ?? `${asString(item.workflowId)}-${asString(item.currentNodeId)}`,
            title: asString(item.workflowName) ?? 'Assigned workflow task',
            workflowId: asString(item.workflowId) ?? '',
            currentNodeId: asString(item.currentNodeId),
            lastUpdatedAt: asString(item.lastUpdatedAt) ?? asString(item.updatedAt) ?? new Date(0).toISOString(),
          }))
          .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())
          .slice(0, 8);
        setNotifications(nextNotifications);
      } catch {
        setNotifications([]);
      } finally {
        setNotificationLoading(false);
      }
    };
    fetchNotifications();
  }, [authHeaders, loggedInEmail]);

  const filteredTasks = useMemo(() => {
    const query = search.toLowerCase();
    return tasks.filter((item) => [item.task, item.category, item.status, item.due].some((value) => value.toLowerCase().includes(query)));
  }, [search, tasks]);

  const filteredProcesses = useMemo(() => {
    const query = search.toLowerCase();
    return processes.filter((item) => [item.workflowId, item.workflowName, item.createdBy, item.createdByEmail, item.accessType].some((value) => (value ?? '').toLowerCase().includes(query)));
  }, [processes, search]);

  const visibleProcesses = showAllProcesses ? filteredProcesses : filteredProcesses.slice(0, 5);

  const stats = useMemo(
    () => [
      { label: 'Total Assigned', value: tasks.length, icon: HiBriefcase },
      { label: 'Pending', value: tasks.filter((task) => task.status === 'PENDING').length, icon: HiDocumentText },
      { label: 'In Progress', value: tasks.filter((task) => task.status === 'IN PROGRESS').length, icon: FaTasks },
      { label: 'Completed', value: tasks.filter((task) => task.status === 'COMPLETED').length, icon: HiCheckCircle },
    ],
    [tasks],
  );

  const displayName = deriveDisplayName(session);
  const subtitle = deriveSubtitle(session);
  const avatar = asString(session?.avatar) ?? asString(session?.profileImage) ?? '/images/default-image.png';

  const handleSignOut = () => {
    removeToken();
    window.localStorage.removeItem('authExpiration');
    window.localStorage.removeItem('userSession');
    window.localStorage.removeItem('_rp');
    window.localStorage.removeItem('userPermission');
    router.push('/portal/login/dar');
  };

  const openStatusModal = (task: DarTask) => {
    setSelectedTask(task);
    setStatusDraft(task.status);
  };

  const saveStatus = () => {
    if (!selectedTask) return;
    setTasks((currentTasks) => currentTasks.map((task) => (task.id === selectedTask.id ? { ...task, status: statusDraft } : task)));
    setSelectedTask(null);
  };

  const createTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTask.task.trim() || !newTask.category.trim() || !newTask.due.trim()) return;
    setTasks((currentTasks) => [{ ...newTask, id: `task-${Date.now()}` }, ...currentTasks]);
    setNewTask(emptyTask);
    setShowNewTaskModal(false);
  };

  const sidebarItems = [
    { label: 'Dashboard', icon: HiHome },
    { label: 'Processes', icon: HiCollection },
    { label: 'My Tasks', icon: FaTasks },
    { label: 'Settings', icon: HiCog },
    { label: 'Help Guide', icon: HiQuestionMarkCircle },
  ];

  const Sidebar = (
    <nav className="space-y-1 p-3">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-[#007a3d]"
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <main className="min-h-screen bg-gray-100 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <button type="button" className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileSidebarOpen((open) => !open)}>
            <HiMenu className="h-6 w-6" />
          </button>
          <Link href="/portal/login/dar/employee" className="flex min-w-max items-center gap-3">
            <Image src="/images/dar/dar_logo.png" alt="DAR logo" width={38} height={38} className="rounded-full bg-emerald-50" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-[#007a3d]">DAR LCMS</p>
              <p className="text-[11px] text-slate-500">Employee Workspace</p>
            </div>
          </Link>

          <div className="relative ml-0 flex-1 lg:ml-4">
            <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks, categories, status, and processes"
              className="h-10 w-full rounded-md border-gray-300 bg-gray-50 pl-9 pr-3 text-sm focus:border-[#007a3d] focus:ring-[#007a3d]"
            />
          </div>

          <Dropdown
            arrowIcon={false}
            inline
            label={
              <span className="relative inline-flex rounded-md p-2 text-slate-600 hover:bg-gray-100">
                <HiBell className="h-5 w-5" />
                {notifications.length ? <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
              </span>
            }
          >
            <Dropdown.Header>
              <span className="block text-sm font-semibold">Notifications</span>
              <span className="block truncate text-xs text-slate-500">{notificationLoading ? 'Loading assignments...' : `${notifications.length} assigned item(s)`}</span>
            </Dropdown.Header>
            {notifications.length ? (
              notifications.map((item) => (
                <Dropdown.Item key={item.id} onClick={() => router.push('/workflow/bpmn/preview-workflow/internal')}>
                  <div className="max-w-xs text-left">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">Workflow {item.workflowId}</p>
                  </div>
                </Dropdown.Item>
              ))
            ) : (
              <Dropdown.Item disabled>{notificationLoading ? 'Loading...' : 'No assigned workflow notifications'}</Dropdown.Item>
            )}
          </Dropdown>

          <div className="hidden min-w-max items-center gap-3 md:flex">
            <Image src={avatar} alt="Employee avatar" width={36} height={36} className="rounded-full bg-slate-200" />
            <div className="max-w-44">
              <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
              <p className="truncate text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50">
            <HiLogout className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
        {mobileSidebarOpen ? <div className="border-t border-gray-200 bg-white lg:hidden">{Sidebar}</div> : null}
      </header>

      <div className="flex">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-60 border-r border-gray-200 bg-white lg:block">{Sidebar}</aside>

        <section className="flex-1 p-4 lg:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="rounded-lg bg-gradient-to-r from-[#007a3d] to-emerald-700 p-5 text-white shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Welcome to DAR Legal Case Monitoring System</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50">
                      Track assigned legal case work, beneficiary and landholding records, pending actions, and DAR service updates in one compact employee workspace.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button className="bg-white text-[#007a3d] hover:bg-emerald-50" onClick={() => setShowNewTaskModal(true)}>
                      <HiPlus className="mr-2 h-4 w-4" /> New Task
                    </Button>
                    <Button color="light" onClick={() => setTasks(initialTasks)}>
                      <HiRefresh className="mr-2 h-4 w-4" /> Reset Demo Data
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                        <Icon className="h-5 w-5 text-[#007a3d]" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h2 className="text-sm font-bold text-slate-900">Work Queue</h2>
                  <p className="text-xs text-slate-500">Manage status updates for assigned DAR LCMS tasks.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Task</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Due</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-slate-800">{task.task}</td>
                          <td className="px-4 py-3 text-slate-600">{task.category}</td>
                          <td className="px-4 py-3 text-slate-600">{task.due}</td>
                          <td className="px-4 py-3"><Badge color={statusBadgeColor(task.status)}>{task.status}</Badge></td>
                          <td className="px-4 py-3 text-right">
                            <Button size="xs" color="light" onClick={() => openStatusModal(task)}>Change status</Button>
                          </td>
                        </tr>
                      ))}
                      {!filteredTasks.length ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No work queue items match your search.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">LCMS Processes</h2>
                    <p className="text-xs text-slate-500">Assigned workflow applications</p>
                  </div>
                  {filteredProcesses.length > 5 ? (
                    <button type="button" className="text-xs font-bold text-[#007a3d]" onClick={() => setShowAllProcesses((value) => !value)}>
                      {showAllProcesses ? 'Show Less' : 'See All'}
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 space-y-2">
                  {processLoading ? <p className="rounded-md bg-gray-50 p-3 text-sm text-slate-500">Loading LCMS processes...</p> : null}
                  {processError ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{processError}</p> : null}
                  {!processLoading && !processError && !visibleProcesses.length ? <p className="rounded-md bg-gray-50 p-3 text-sm text-slate-500">No LCMS processes found.</p> : null}
                  {visibleProcesses.map((process) => (
                    <Link key={process.workflowId} href={`/workflow/bpmn/preview-workflow/${process.workflowId}`} className="block rounded-md border border-gray-200 p-3 hover:border-[#007a3d] hover:bg-emerald-50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{process.workflowName}</p>
                          <p className="mt-1 text-xs text-slate-500">{process.createdByEmail ?? process.createdBy ?? 'Workflow owner'}</p>
                        </div>
                        <Badge color={process.accessType === 'SHARED' ? 'info' : 'success'}>{process.accessType === 'SHARED' ? 'Shared' : 'Owner'}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900">Announcements</h2>
                <div className="mt-3 space-y-3">
                  {announcements.map((announcement) => (
                    <article key={announcement.title} className="rounded-md border border-gray-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-800">{announcement.title}</h3>
                        <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-[#007a3d]">{announcement.tag}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-600">{announcement.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>

      <Modal show={showNewTaskModal} onClose={() => setShowNewTaskModal(false)} size="md">
        <Modal.Header>New Task</Modal.Header>
        <Modal.Body>
          <form id="newTaskForm" className="space-y-4" onSubmit={createTask}>
            <TextInput placeholder="Task" value={newTask.task} onChange={(event) => setNewTask((current) => ({ ...current, task: event.target.value }))} required />
            <TextInput placeholder="Category" value={newTask.category} onChange={(event) => setNewTask((current) => ({ ...current, category: event.target.value }))} required />
            <TextInput type="date" value={newTask.due} onChange={(event) => setNewTask((current) => ({ ...current, due: event.target.value }))} required />
            <Select value={newTask.status} onChange={(event) => setNewTask((current) => ({ ...current, status: event.target.value as TaskStatus }))}>
              <option value="PENDING">PENDING</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </Select>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" form="newTaskForm" style={{ backgroundColor: DAR_GREEN }}>Create</Button>
          <Button color="light" onClick={() => setShowNewTaskModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} size="md">
        <Modal.Header>Change Status</Modal.Header>
        <Modal.Body>
          {selectedTask ? (
            <div className="space-y-4">
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-sm font-semibold text-slate-800">{selectedTask.task}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedTask.category} · Due {selectedTask.due}</p>
              </div>
              <Select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value as TaskStatus)}>
                <option value="PENDING">PENDING</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </Select>
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={saveStatus} style={{ backgroundColor: DAR_GREEN }}>Save</Button>
          <Button color="light" onClick={() => setSelectedTask(null)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}
