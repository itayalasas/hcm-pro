import { useEffect, useState } from 'react';
import { Network, Users, Briefcase, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';

interface Department {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  active: boolean;
}

interface Position {
  id: string;
  code: string;
  title: string;
  department_id: string | null;
  reports_to_position_id: string | null;
  active: boolean;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position_id: string | null;
}

interface OrgNode {
  id: string;
  name: string;
  type: 'department' | 'position';
  code: string;
  employees?: Employee[];
  children: OrgNode[];
  parentId: string | null;
}

export default function Organigram() {
  const { selectedCompanyId } = useCompany();
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'departments' | 'positions'>('departments');

  useEffect(() => {
    if (selectedCompanyId) {
      loadOrgData();
    }
  }, [selectedCompanyId]);

  const loadOrgData = async () => {
    if (!selectedCompanyId) return;

    try {
      const [deptResult, posResult, empResult] = await Promise.all([
        supabase
          .from('departments')
          .select('*')
          .eq('company_id', selectedCompanyId)
          .eq('active', true)
          .order('name', { ascending: true }),

        supabase
          .from('positions')
          .select('*')
          .eq('company_id', selectedCompanyId)
          .eq('active', true)
          .order('title', { ascending: true }),

        supabase
          .from('employees')
          .select('id, first_name, last_name, position_id')
          .eq('company_id', selectedCompanyId)
          .eq('status', 'active')
      ]);

      if (deptResult.error) throw deptResult.error;
      if (posResult.error) throw posResult.error;
      if (empResult.error) throw empResult.error;

      setDepartments(deptResult.data || []);
      setPositions(posResult.data || []);
      setEmployees(empResult.data || []);
    } catch (error) {
      console.error('Error loading org data:', error);
      toast.error('Error al cargar los datos del organigrama');
    } finally {
      setLoading(false);
    }
  };

  const buildDepartmentTree = (): OrgNode[] => {
    const nodeMap = new Map<string, OrgNode>();

    departments.forEach(dept => {
      nodeMap.set(dept.id, {
        id: dept.id,
        name: dept.name,
        type: 'department',
        code: dept.code,
        children: [],
        parentId: dept.parent_id,
      });
    });

    const rootNodes: OrgNode[] = [];
    nodeMap.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const buildPositionTree = (): OrgNode[] => {
    const nodeMap = new Map<string, OrgNode>();

    positions.forEach(pos => {
      const posEmployees = employees.filter(emp => emp.position_id === pos.id);
      nodeMap.set(pos.id, {
        id: pos.id,
        name: pos.title,
        type: 'position',
        code: pos.code,
        employees: posEmployees,
        children: [],
        parentId: pos.reports_to_position_id,
      });
    });

    const rootNodes: OrgNode[] = [];
    nodeMap.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: OrgNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        if (node.children.length > 0) {
          collectIds(node.children);
        }
      });
    };
    collectIds(viewMode === 'departments' ? buildDepartmentTree() : buildPositionTree());
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const renderNode = (node: OrgNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="mb-2">
        <div
          className={`flex items-center gap-3 p-4 bg-white rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${
            node.type === 'department'
              ? 'border-emerald-200 hover:border-emerald-400'
              : 'border-purple-200 hover:border-purple-400'
          }`}
          style={{ marginLeft: `${level * 40}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <button className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </button>
          )}

          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            node.type === 'department'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-500'
              : 'bg-gradient-to-br from-purple-600 to-pink-500'
          }`}>
            {node.type === 'department' ? (
              <Building2 className="w-5 h-5 text-white" />
            ) : (
              <Briefcase className="w-5 h-5 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{node.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500">{node.code}</span>
              {node.type === 'position' && node.employees && node.employees.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-600">
                  <Users className="w-3 h-3" />
                  {node.employees.length} empleado{node.employees.length !== 1 ? 's' : ''}
                </span>
              )}
              {hasChildren && (
                <span className="text-xs text-slate-500">
                  {node.children.length} sub{node.type === 'department' ? 'unidad' : 'puesto'}{node.children.length !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {node.type === 'position' && node.employees && node.employees.length > 0 && isExpanded && (
          <div className="mt-2" style={{ marginLeft: `${(level + 1) * 40}px` }}>
            {node.employees.map(emp => (
              <div
                key={emp.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-slate-700">
                  {emp.first_name} {emp.last_name}
                </span>
              </div>
            ))}
          </div>
        )}

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!selectedCompanyId) {
    return (
      <div className="text-center py-12">
        <Network className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-500">Seleccione una empresa para ver el organigrama</p>
      </div>
    );
  }

  const orgTree = viewMode === 'departments' ? buildDepartmentTree() : buildPositionTree();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Organigrama</h1>
        <p className="text-slate-600">
          Visualización jerárquica de la estructura organizacional
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('departments')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'departments'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Por Departamentos
          </button>
          <button
            onClick={() => setViewMode('positions')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'positions'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 inline mr-2" />
            Por Puestos
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            Expandir Todo
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            Contraer Todo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : orgTree.length > 0 ? (
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          {orgTree.map(node => renderNode(node))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Network className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">
            {viewMode === 'departments'
              ? 'No hay departamentos registrados en esta empresa'
              : 'No hay puestos registrados en esta empresa'}
          </p>
        </div>
      )}

      <toast.ToastContainer />
    </div>
  );
}
